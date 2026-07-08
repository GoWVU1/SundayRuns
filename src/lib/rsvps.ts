import "server-only";
import { sql } from "@/lib/db";

export type RsvpStatus = "confirmed" | "waitlisted";

export type RosterEntry = {
  id: string;
  account_id: string;
  name: string;
  status: RsvpStatus;
  created_at: string;
};

/** Ordered by created_at, oldest first — callers derive spot numbers / waitlist position from index. */
export async function getRoster(gameId: string) {
  return sql<RosterEntry[]>`
    select r.id, r.account_id, a.name, r.status, r.created_at
    from rsvps r
    join accounts a on a.id = r.account_id
    where r.game_id = ${gameId}
    order by r.created_at asc
  `;
}

export type ClaimResult = { status: RsvpStatus };

export async function claimSpot(gameId: string, accountId: string): Promise<ClaimResult> {
  return sql.begin(async (tx) => {
    // Lock the game row so concurrent claims serialize against the cap check below.
    const [game] = await tx<{ cap: number }[]>`
      select cap from games where id = ${gameId} for update
    `;
    if (!game) throw new Error("Game not found");

    const [existing] = await tx<{ status: RsvpStatus }[]>`
      select status from rsvps where game_id = ${gameId} and account_id = ${accountId}
    `;
    if (existing) return { status: existing.status };

    const [{ count }] = await tx<{ count: string }[]>`
      select count(*)::text from rsvps where game_id = ${gameId} and status = 'confirmed'
    `;
    const status: RsvpStatus = Number(count) < game.cap ? "confirmed" : "waitlisted";

    await tx`
      insert into rsvps (game_id, account_id, status)
      values (${gameId}, ${accountId}, ${status})
    `;
    return { status };
  });
}

export async function cancelRsvp(gameId: string, accountId: string) {
  return sql.begin(async (tx) => {
    await tx`select id from games where id = ${gameId} for update`;

    const [mine] = await tx<{ status: RsvpStatus }[]>`
      select status from rsvps where game_id = ${gameId} and account_id = ${accountId}
    `;
    if (!mine) return;

    await tx`delete from rsvps where game_id = ${gameId} and account_id = ${accountId}`;

    if (mine.status === "confirmed") {
      // FIFO promotion — Phase 1 stand-in for the "notify the waitlist" feature.
      const [next] = await tx<{ id: string }[]>`
        select id from rsvps
        where game_id = ${gameId} and status = 'waitlisted'
        order by created_at asc
        limit 1
      `;
      if (next) {
        await tx`update rsvps set status = 'confirmed' where id = ${next.id}`;
      }
    }
  });
}
