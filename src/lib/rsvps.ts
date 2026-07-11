import "server-only";
import type { TransactionSql } from "postgres";
import { sql } from "@/lib/db";

export type RsvpStatus = "confirmed" | "waitlisted";

export type RosterEntry = {
  id: string;
  account_id: string;
  name: string;
  tier: string;
  status: RsvpStatus;
  sponsor_name: string | null;
  created_at: string;
};

/** Ordered by created_at, oldest first — callers derive spot numbers / waitlist position from index. */
export async function getRoster(gameId: string) {
  return sql<RosterEntry[]>`
    select r.id, r.account_id, a.name, a.tier, r.status, s.name as sponsor_name, r.created_at
    from rsvps r
    join accounts a on a.id = r.account_id
    left join accounts s on s.id = r.sponsor_account_id
    where r.game_id = ${gameId}
    order by r.created_at asc
  `;
}

/** Home-screen roster and every confirmed player's streak in one round trip. */
export async function getRosterWithStreaks(gameId: string): Promise<{
  roster: RosterEntry[];
  streaks: Map<string, number>;
}> {
  const rows = await sql<(RosterEntry & { streak: number })[]>`
    with roster as (
      select r.id, r.account_id, a.name, a.tier, r.status, s.name as sponsor_name, r.created_at
      from rsvps r
      join accounts a on a.id = r.account_id
      left join accounts s on s.id = r.sponsor_account_id
      where r.game_id = ${gameId}
    ),
    history_ranked as (
      select
        att.account_id,
        att.status,
        row_number() over (partition by att.account_id order by g.starts_at desc) as sequence_number
      from attendance att
      join games g on g.id = att.game_id
      where att.account_id in (select account_id from roster where status = 'confirmed')
        and g.visibility = 'standard'
    ),
    history_with_break as (
      select
        account_id,
        status,
        sequence_number,
        min(sequence_number) filter (where status = 'no_show') over (partition by account_id) as first_no_show
      from history_ranked
    ),
    streaks as (
      select account_id, count(*)::int as streak
      from history_with_break
      where status = 'present' and (first_no_show is null or sequence_number < first_no_show)
      group by account_id
    )
    select roster.*, coalesce(streaks.streak, 0)::int as streak
    from roster
    left join streaks on streaks.account_id = roster.account_id
    order by roster.created_at asc
  `;
  return {
    roster: rows.map(({ streak: _streak, ...entry }) => entry),
    streaks: new Map(rows.map((row) => [row.account_id, row.streak])),
  };
}

export type ClaimResult = { status: RsvpStatus };

/**
 * Shared by self-serve claims and guest-request approval (Stage B) so cap
 * enforcement is one code path. Caller must already hold the game row lock
 * (`select ... for update`) within the same transaction.
 */
export async function insertRsvpRespectingCap(
  tx: TransactionSql,
  gameId: string,
  accountId: string,
  sponsorAccountId: string | null
): Promise<ClaimResult> {
  const [inserted] = await tx<{ status: RsvpStatus }[]>`
    insert into rsvps (game_id, account_id, status, sponsor_account_id)
    select
      g.id,
      ${accountId},
      case
        when (select count(*) from rsvps where game_id = g.id and status = 'confirmed') < g.cap
          then 'confirmed'
        else 'waitlisted'
      end,
      ${sponsorAccountId}
    from games g
    where g.id = ${gameId}
    on conflict (game_id, account_id) do nothing
    returning status
  `;
  if (inserted) return { status: inserted.status };

  const [existing] = await tx<{ status: RsvpStatus }[]>`
    select status from rsvps where game_id = ${gameId} and account_id = ${accountId}
  `;
  if (!existing) throw new Error("Game or RSVP could not be found");
  return { status: existing.status };
}

export async function claimSpot(gameId: string, accountId: string): Promise<ClaimResult> {
  return sql.begin(async (tx) => {
    // Lock the game row so concurrent claims serialize against the cap check.
    await tx`select id from games where id = ${gameId} for update`;
    return insertRsvpRespectingCap(tx, gameId, accountId, null);
  });
}

/**
 * Commissioner recovery path. The requested status is intentional: choosing
 * confirmed may exceed the normal cap so an admin can repair a bad roster.
 */
export async function adminEnrollRsvp(
  gameId: string,
  accountId: string,
  status: RsvpStatus
): Promise<void> {
  await sql.begin(async (tx) => {
    await tx`select id from games where id = ${gameId} for update`;
    await tx`
      insert into rsvps (game_id, account_id, status, sponsor_account_id)
      values (${gameId}, ${accountId}, ${status}, null)
      on conflict (game_id, account_id) do update set status = ${status}
    `;
  });
}

export type CancelResult = { promotedAccountId: string | null };

export async function cancelRsvp(gameId: string, accountId: string): Promise<CancelResult> {
  return sql.begin(async (tx) => {
    await tx`select id from games where id = ${gameId} for update`;

    const [mine] = await tx<{ status: RsvpStatus }[]>`
      delete from rsvps
      where game_id = ${gameId} and account_id = ${accountId}
      returning status
    `;
    if (!mine) return { promotedAccountId: null };

    if (mine.status !== "confirmed") return { promotedAccountId: null };

    // FIFO promotion in one statement — no select/update round-trip pair.
    const [promoted] = await tx<{ account_id: string }[]>`
      update rsvps
      set status = 'confirmed'
      where id = (
        select id from rsvps
        where game_id = ${gameId} and status = 'waitlisted'
        order by created_at asc
        limit 1
      )
      returning account_id
    `;
    return { promotedAccountId: promoted?.account_id ?? null };
  });
}
