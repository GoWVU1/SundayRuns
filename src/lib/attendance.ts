import "server-only";
import { sql } from "@/lib/db";

export type AttendanceStatus = "present" | "no_show";

export type AttendanceEntry = {
  account_id: string;
  name: string;
  tier: string;
  status: AttendanceStatus | null;
};

/** Confirmed roster for a game, each row's attendance status (or null if unmarked yet). */
export async function getAttendanceForGame(gameId: string): Promise<AttendanceEntry[]> {
  return sql<AttendanceEntry[]>`
    select r.account_id, a.name, a.tier, att.status
    from rsvps r
    join accounts a on a.id = r.account_id
    left join attendance att on att.game_id = r.game_id and att.account_id = r.account_id
    where r.game_id = ${gameId} and r.status = 'confirmed'
    order by r.created_at asc
  `;
}

export async function markAttendance(
  gameId: string,
  accountId: string,
  status: AttendanceStatus,
  markedBy: string
): Promise<void> {
  await sql`
    insert into attendance (game_id, account_id, status, marked_by)
    values (${gameId}, ${accountId}, ${status}, ${markedBy})
    on conflict (game_id, account_id) do update set status = ${status}, marked_by = ${markedBy}, marked_at = now()
  `;
}

export async function getNoShowCount(accountId: string): Promise<number> {
  const [{ count }] = await sql<{ count: string }[]>`
    select count(*)::text from attendance where account_id = ${accountId} and status = 'no_show'
  `;
  return Number(count);
}

/**
 * For each account: how many of the most recent (marked) standard games in a row
 * they were marked 'present' for, counting back from the most recent and stopping
 * at the first 'no_show'. Unmarked games are simply absent from the data, not a break.
 */
export async function getAttendanceStreaks(accountIds: string[]): Promise<Map<string, number>> {
  const streaks = new Map<string, number>();
  if (accountIds.length === 0) return streaks;

  const rows = await sql<{ account_id: string; status: AttendanceStatus }[]>`
    select att.account_id, att.status
    from attendance att
    join games g on g.id = att.game_id
    where att.account_id in ${sql(accountIds)} and g.visibility = 'standard'
    order by att.account_id, g.starts_at desc
  `;

  let currentAccount: string | null = null;
  let broken = false;
  for (const row of rows) {
    if (row.account_id !== currentAccount) {
      currentAccount = row.account_id;
      broken = false;
      streaks.set(currentAccount, 0);
    }
    if (broken) continue;
    if (row.status === "present") {
      streaks.set(currentAccount, (streaks.get(currentAccount) ?? 0) + 1);
    } else {
      broken = true;
    }
  }
  return streaks;
}

/** Past games (already started) with at least one confirmed RSVP still unmarked — surfaced to admin. */
export async function getGamesNeedingAttendance(): Promise<
  { id: string; starts_at: string; location: string; unmarkedCount: string }[]
> {
  return sql`
    select g.id, g.starts_at, g.location, count(r.id)::text as "unmarkedCount"
    from games g
    join rsvps r on r.game_id = g.id and r.status = 'confirmed'
    left join attendance att on att.game_id = g.id and att.account_id = r.account_id
    where g.starts_at < now() and att.id is null
    group by g.id, g.starts_at, g.location
    order by g.starts_at desc
  `;
}
