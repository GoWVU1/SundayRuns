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
  const [existing] = await tx<{ status: RsvpStatus }[]>`
    select status from rsvps where game_id = ${gameId} and account_id = ${accountId}
  `;
  if (existing) return { status: existing.status };

  const [game] = await tx<{ cap: number }[]>`select cap from games where id = ${gameId}`;
  const [{ count }] = await tx<{ count: string }[]>`
    select count(*)::text from rsvps where game_id = ${gameId} and status = 'confirmed'
  `;
  const status: RsvpStatus = Number(count) < game.cap ? "confirmed" : "waitlisted";

  await tx`
    insert into rsvps (game_id, account_id, status, sponsor_account_id)
    values (${gameId}, ${accountId}, ${status}, ${sponsorAccountId})
  `;
  return { status };
}

export async function claimSpot(gameId: string, accountId: string): Promise<ClaimResult> {
  return sql.begin(async (tx) => {
    // Lock the game row so concurrent claims serialize against the cap check.
    await tx`select id from games where id = ${gameId} for update`;
    return insertRsvpRespectingCap(tx, gameId, accountId, null);
  });
}

export type CancelResult = { promotedAccountId: string | null };

export async function cancelRsvp(gameId: string, accountId: string): Promise<CancelResult> {
  return sql.begin(async (tx) => {
    await tx`select id from games where id = ${gameId} for update`;

    const [mine] = await tx<{ status: RsvpStatus }[]>`
      select status from rsvps where game_id = ${gameId} and account_id = ${accountId}
    `;
    if (!mine) return { promotedAccountId: null };

    await tx`delete from rsvps where game_id = ${gameId} and account_id = ${accountId}`;

    if (mine.status !== "confirmed") return { promotedAccountId: null };

    // FIFO promotion — the confirmed spot always goes to whoever's waited longest.
    const [next] = await tx<{ id: string; account_id: string }[]>`
      select id, account_id from rsvps
      where game_id = ${gameId} and status = 'waitlisted'
      order by created_at asc
      limit 1
    `;
    if (!next) return { promotedAccountId: null };

    await tx`update rsvps set status = 'confirmed' where id = ${next.id}`;
    return { promotedAccountId: next.account_id };
  });
}
