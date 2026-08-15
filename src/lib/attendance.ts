import "server-only";
import { sql } from "@/lib/db";
import type { RankedTier } from "@/lib/tiers";
import { PROMOTION_THRESHOLD, DEMOTION_THRESHOLD, TIER_RANK, nextTierUp, nextTierDown } from "@/lib/tiers";
import { setAccountTier } from "@/lib/accounts";

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

export type AccountAttendanceMetrics = {
  /** Consecutive PAST standard games (most recent first) marked present, breaking at the
   * first one that isn't — whether that's an explicit no-show or simply never being
   * confirmed for it. This is the number shown everywhere ("current streak"). */
  streak: number;
  /** Same idea, but only counting games since this account's last tier change — used to
   * check promotion eligibility (each rung needs its own fresh run, not a lifetime total). */
  presentSinceTierChange: number;
  /** Consecutive NOT-present games since the last tier change — used to check demotion. */
  absentSinceTierChange: number;
};

/**
 * One query, every account's attendance streaks (guests included — this is a
 * general-purpose streak lookup used for display in several places; callers
 * that need to exclude guests, like the tier-promotion sweep, filter their
 * own account list instead). A game a player never even confirmed for counts
 * the same as an explicit no-show — skipping a week isn't free, matching how
 * "current streak" should actually work.
 *
 * Bounded to the most recent RECENT_GAMES_WINDOW standard games — comfortably
 * above the largest promotion/demotion threshold, so it never affects a real
 * streak calculation, while keeping the query from growing unbounded with the
 * club's full history.
 */
const RECENT_GAMES_WINDOW = 60;

export async function getAttendanceMetrics(): Promise<Map<string, AccountAttendanceMetrics>> {
  const rows = await sql<
    { account_id: string; streak: number; present_since_change: number; absent_since_change: number }[]
  >`
    with target_games as (
      select id, starts_at from games
      where visibility = 'standard' and starts_at < now()
      order by starts_at desc
      limit ${RECENT_GAMES_WINDOW}
    ),
    resolved as (
      select
        acc.id as account_id,
        acc.tier_changed_at,
        g.starts_at,
        coalesce(att.status = 'present', false) as was_present,
        row_number() over (partition by acc.id order by g.starts_at desc) as rn
      from accounts acc
      cross join target_games g
      left join attendance att on att.account_id = acc.id and att.game_id = g.id
    ),
    all_time_break as (
      select account_id, min(rn) as break_rn from resolved where not was_present group by account_id
    ),
    present_bounded_break as (
      select account_id, min(rn) as break_rn from resolved
      where not was_present or starts_at < tier_changed_at
      group by account_id
    ),
    absent_bounded_break as (
      select account_id, min(rn) as break_rn from resolved
      where was_present or starts_at < tier_changed_at
      group by account_id
    )
    select
      r.account_id,
      count(*) filter (where r.was_present and (atb.break_rn is null or r.rn < atb.break_rn))::int as streak,
      count(*) filter (
        where r.was_present and (pbb.break_rn is null or r.rn < pbb.break_rn)
      )::int as present_since_change,
      count(*) filter (
        where not r.was_present and (abb.break_rn is null or r.rn < abb.break_rn)
      )::int as absent_since_change
    from resolved r
    left join all_time_break atb on atb.account_id = r.account_id
    left join present_bounded_break pbb on pbb.account_id = r.account_id
    left join absent_bounded_break abb on abb.account_id = r.account_id
    group by r.account_id
  `;
  return new Map(
    rows.map((r) => [
      r.account_id,
      {
        streak: r.streak,
        presentSinceTierChange: r.present_since_change,
        absentSinceTierChange: r.absent_since_change,
      },
    ])
  );
}

export type AccountAttendanceSummary = {
  currentStreak: number;
  gamesPlayed: number;
  noShows: number;
  recentWeeks: boolean[];
};

/** Account-page attendance metrics. recentWeeks covers the most recent PAST standard games
 * regardless of whether this account even played them, so a skipped week shows up empty. */
export async function getAccountAttendanceSummary(
  accountId: string,
  recentLimit = 8
): Promise<AccountAttendanceSummary> {
  const [metrics, totals, recentRows] = await Promise.all([
    getAttendanceMetrics(),
    sql<{ games_played: string; no_shows: string }[]>`
      select
        count(*) filter (where status = 'present')::text as games_played,
        count(*) filter (where status = 'no_show')::text as no_shows
      from attendance
      where account_id = ${accountId}
    `,
    sql<{ was_present: boolean }[]>`
      select coalesce(att.status = 'present', false) as was_present
      from games g
      join accounts a on a.id = ${accountId}
      left join attendance att on att.game_id = g.id and att.account_id = ${accountId}
      where g.visibility = 'standard' and g.starts_at < now() and g.starts_at >= a.created_at
      order by g.starts_at desc
      limit ${recentLimit}
    `,
  ]);
  return {
    currentStreak: metrics.get(accountId)?.streak ?? 0,
    gamesPlayed: Number(totals[0]?.games_played ?? 0),
    noShows: Number(totals[0]?.no_shows ?? 0),
    recentWeeks: recentRows.map((r) => r.was_present).reverse(),
  };
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

/**
 * Whether every confirmed player for this game has been marked. Used to gate
 * the tier-promotion sweep — running it mid-roster would treat teammates the
 * admin hasn't clicked yet as absent for this game, which could wrongly
 * demote someone moments before they'd have been marked present.
 */
export async function isGameFullyMarked(gameId: string): Promise<boolean> {
  const [row] = await sql<{ unmarked: string }[]>`
    select count(*)::text as unmarked
    from rsvps r
    left join attendance att on att.game_id = r.game_id and att.account_id = r.account_id
    where r.game_id = ${gameId} and r.status = 'confirmed' and att.id is null
  `;
  return Number(row?.unmarked ?? 0) === 0;
}

export type AdminAttendanceStat = {
  accountId: string;
  name: string;
  tier: string;
  gamesPlayed: number;
  /** Own no-shows plus no-shows from guests they sponsored — bringing a flaky guest counts against you. */
  missedCount: number;
  currentStreak: number;
  missedGames: { gameId: string; startsAt: string; location: string }[];
};

/** One commissioner-facing attendance snapshot per member, including sponsored guest no-shows. */
export async function getAdminAttendanceStats(): Promise<AdminAttendanceStat[]> {
  const [accounts, metrics, guestNoShowRows, historyRows] = await Promise.all([
    sql<{ id: string; name: string; tier: string }[]>`
      select id, name, tier from accounts where tier != 'guest' order by name asc
    `,
    getAttendanceMetrics(),
    sql<{ sponsor_account_id: string; count: string }[]>`
      select r.sponsor_account_id, count(*)::text as count
      from rsvps r
      join attendance att on att.game_id = r.game_id and att.account_id = r.account_id
      where r.sponsor_account_id is not null and att.status = 'no_show'
      group by r.sponsor_account_id
    `,
    sql<{ account_id: string; status: AttendanceStatus; game_id: string; starts_at: string; location: string }[]>`
      select att.account_id, att.status, g.id as game_id, g.starts_at, g.location
      from attendance att
      join games g on g.id = att.game_id
      order by g.starts_at desc
    `,
  ]);

  const guestNoShows = new Map(guestNoShowRows.map((r) => [r.sponsor_account_id, Number(r.count)]));
  type HistoryRow = { account_id: string; status: AttendanceStatus; game_id: string; starts_at: string; location: string };
  const byAccount = new Map<string, HistoryRow[]>();
  for (const row of historyRows) {
    const list = byAccount.get(row.account_id) ?? [];
    list.push(row);
    byAccount.set(row.account_id, list);
  }

  return accounts.map((a) => {
    const history = byAccount.get(a.id) ?? [];
    const ownMissed = history.filter((h) => h.status === "no_show");
    return {
      accountId: a.id,
      name: a.name,
      tier: a.tier,
      gamesPlayed: history.filter((h) => h.status === "present").length,
      missedCount: ownMissed.length + (guestNoShows.get(a.id) ?? 0),
      currentStreak: metrics.get(a.id)?.streak ?? 0,
      missedGames: ownMissed.map((h) => ({ gameId: h.game_id, startsAt: h.starts_at, location: h.location })),
    };
  });
}

/**
 * Auto-promotes/demotes every non-guest account based on qualifying weeks
 * since their last tier change. Runs after every attendance mark rather than
 * on a schedule — this app has no cron infrastructure, and marking happens
 * roughly weekly anyway. Demotion clamps at tier_floor if the admin set one.
 */
export async function applyAutoTierChanges(): Promise<void> {
  const [accounts, metrics] = await Promise.all([
    sql<{ id: string; tier: RankedTier; tier_floor: "core" | "regular" | null }[]>`
      select id, tier, tier_floor from accounts where tier != 'guest'
    `,
    getAttendanceMetrics(),
  ]);

  for (const account of accounts) {
    const metric = metrics.get(account.id);
    if (!metric) continue;

    const promotionThreshold = PROMOTION_THRESHOLD[account.tier];
    const demotionThreshold = DEMOTION_THRESHOLD[account.tier];

    let newTier: RankedTier | null = null;
    if (promotionThreshold !== undefined && metric.presentSinceTierChange >= promotionThreshold) {
      newTier = nextTierUp(account.tier);
    } else if (demotionThreshold !== undefined && metric.absentSinceTierChange >= demotionThreshold) {
      const demoted = nextTierDown(account.tier);
      if (demoted) {
        // A floor only protects once you've actually reached it — one set above
        // your current tier (e.g. in anticipation of a future promotion) doesn't
        // apply yet, so it must never clamp a demotion UP past where you started.
        const floorApplies = account.tier_floor && TIER_RANK[account.tier_floor] <= TIER_RANK[account.tier];
        newTier =
          floorApplies && TIER_RANK[demoted] < TIER_RANK[account.tier_floor!] ? account.tier_floor! : demoted;
      }
    }

    if (newTier && newTier !== account.tier) {
      await setAccountTier(account.id, newTier);
    }
  }
}
