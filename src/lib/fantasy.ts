import "server-only";
import { cache } from "react";
import { sql } from "@/lib/db";

/** Fixed payout schedule — Article III, Section 3.1 of the league contract. Not admin-editable per-entry. */
export const PAYOUT_BY_PLACE: Record<1 | 2 | 3, number> = {
  1: 140,
  2: 35,
  3: 25,
};

export const PUNISHMENTS = [
  {
    key: "act_exam",
    name: "ACT Exam",
    desc: "Official paper ACT, cold — needs a 21+ composite (or a qualifying follow-up). Score reports go to the league.",
  },
  {
    key: "pacer_test",
    name: "FitnessGram PACER Test",
    desc: "The beep test at a public park, cadence blasting on a speaker, until 75 laps — every attempt on video.",
  },
  {
    key: "waffle_house_24",
    name: "24 Hours in a Waffle House",
    desc: "24 straight hours in a Waffle House, livestreamed on Twitch — every waffle eaten knocks an hour off.",
  },
  {
    key: "hot_ones",
    name: "Hot Ones Challenge",
    desc: "10 rounds of real Hot Ones sauces, each followed by league-submitted questions — full video required.",
  },
  {
    key: "bodybuilding_comp",
    name: "Bodybuilding Competition",
    desc: "Register and compete in a real OCB/IFBB show — complete, unedited video of the competition required.",
  },
] as const;

export type PunishmentKey = (typeof PUNISHMENTS)[number]["key"];

export function isPunishmentKey(value: string): value is PunishmentKey {
  return PUNISHMENTS.some((p) => p.key === value);
}

export type StandingEntry = { place: number; name: string; payout_usd: string; account_id: string | null };

async function getLatestStandingsYear(): Promise<number | null> {
  const [row] = await sql<{ year: number | null }[]>`select max(year) as year from fantasy_standings`;
  return row?.year ?? null;
}

/**
 * The reigning champion's account_id, if the latest season's #1 finisher is linked
 * to a real account. Deliberately unrelated to fantasy_member — everyone on the
 * basketball roster sees the crown, not just other fantasy participants.
 * Wrapped in cache() since Header and pages that render it both fetch this independently.
 */
export const getLatestChampionAccountId = cache(async (): Promise<string | null> => {
  const [row] = await sql<{ account_id: string | null }[]>`
    select account_id
    from fantasy_standings
    where place = 1
    order by year desc
    limit 1
  `;
  return row?.account_id ?? null;
});

const PLACE_LABEL: Record<number, string> = { 1: "Champion", 2: "Runner-Up", 3: "Third Place" };

export type SeasonRecap = {
  year: number;
  place: number;
  name: string;
  accountId: string | null;
  payoutUsd: string;
  record: string | null;
  finalStanding: string | null;
  clinched: string | null;
  mvp: string | null;
  note: string | null;
};

/** The account's placement in the most recent standings year, if any — drives the champion recap hero card. */
export async function getLatestSeasonRecap(accountId: string): Promise<SeasonRecap | null> {
  const year = await getLatestStandingsYear();
  if (!year) return null;
  const [row] = await sql<
    {
      place: number;
      name: string;
      account_id: string | null;
      payout_usd: string;
      record: string | null;
      final_standing: string | null;
      clinched: string | null;
      mvp: string | null;
      note: string | null;
    }[]
  >`
    select fs.place, coalesce(a.name, fs.display_name) as name, fs.account_id, fs.payout_usd::text,
      fs.record, fs.final_standing, fs.clinched, fs.mvp, fs.note
    from fantasy_standings fs
    left join accounts a on a.id = fs.account_id
    where fs.year = ${year} and fs.account_id = ${accountId}
  `;
  if (!row) return null;
  return {
    year,
    place: row.place,
    name: row.name,
    accountId: row.account_id,
    payoutUsd: row.payout_usd,
    record: row.record,
    finalStanding: row.final_standing,
    clinched: row.clinched,
    mvp: row.mvp,
    note: row.note,
  };
}

export type LifetimeLedgerEntry = { year: number; placeLabel: string; amount: string };

/** All-time total + year-by-year breakdown of everything an account has won, across every season. */
export async function getLifetimeWinnings(
  accountId: string
): Promise<{ total: string; ledger: LifetimeLedgerEntry[] }> {
  const rows = await sql<{ year: number; place: number; payout_usd: string }[]>`
    select year, place, payout_usd::text from fantasy_standings
    where account_id = ${accountId}
    order by year desc
  `;
  const total = rows.reduce((sum, r) => sum + Number(r.payout_usd), 0);
  return {
    total: total.toFixed(2),
    ledger: rows.map((r) => ({ year: r.year, placeLabel: PLACE_LABEL[r.place] ?? `#${r.place}`, amount: r.payout_usd })),
  };
}

export async function getStandingByPlace(year: number, place: 1 | 2 | 3): Promise<SeasonRecap | null> {
  const [row] = await sql<
    {
      name: string | null;
      account_id: string | null;
      payout_usd: string;
      record: string | null;
      final_standing: string | null;
      clinched: string | null;
      mvp: string | null;
      note: string | null;
    }[]
  >`
    select coalesce(a.name, fs.display_name) as name, fs.account_id, fs.payout_usd::text,
      fs.record, fs.final_standing, fs.clinched, fs.mvp, fs.note
    from fantasy_standings fs
    left join accounts a on a.id = fs.account_id
    where fs.year = ${year} and fs.place = ${place}
  `;
  if (!row || !row.name) return null;
  return {
    year,
    place,
    name: row.name,
    accountId: row.account_id,
    payoutUsd: row.payout_usd,
    record: row.record,
    finalStanding: row.final_standing,
    clinched: row.clinched,
    mvp: row.mvp,
    note: row.note,
  };
}

export async function updateStandingNarrative(fields: {
  year: number;
  place: 1 | 2 | 3;
  record: string;
  finalStanding: string;
  clinched: string;
  mvp: string;
  note: string;
}): Promise<void> {
  await sql`
    update fantasy_standings set
      record = ${fields.record || null}, final_standing = ${fields.finalStanding || null},
      clinched = ${fields.clinched || null}, mvp = ${fields.mvp || null}, note = ${fields.note || null}
    where year = ${fields.year} and place = ${fields.place}
  `;
}

export type BuyInEntry = { accountId: string; name: string; paid: boolean };

/** Public dues status for every fantasy member this year — kept visible so everyone can see who's squared up before the draft. */
export async function getBuyInStatus(year: number): Promise<BuyInEntry[]> {
  return sql<BuyInEntry[]>`
    select a.id as "accountId", a.name, coalesce(d.paid, false) as paid
    from accounts a
    left join fantasy_dues d on d.account_id = a.id and d.year = ${year}
    where a.fantasy_member = true
    order by a.name asc
  `;
}

export async function setDuesPaid(year: number, accountId: string, paid: boolean): Promise<void> {
  await sql`
    insert into fantasy_dues (year, account_id, paid, paid_at)
    values (${year}, ${accountId}, ${paid}, ${paid ? sql`now()` : null})
    on conflict (year, account_id) do update set paid = ${paid}, paid_at = ${paid ? sql`now()` : null}
  `;
}

export async function getLatestStandings(): Promise<{ year: number | null; standings: StandingEntry[] }> {
  const year = await getLatestStandingsYear();
  if (!year) return { year: null, standings: [] };
  const standings = await sql<StandingEntry[]>`
    select fs.place, coalesce(a.name, fs.display_name) as name, fs.payout_usd::text, fs.account_id
    from fantasy_standings fs
    left join accounts a on a.id = fs.account_id
    where fs.year = ${year}
    order by fs.place asc
  `;
  return { year, standings };
}

/** Everyone currently in the fantasy league — the pool the standings picker chooses from. */
export async function listFantasyMembers(): Promise<{ id: string; name: string }[]> {
  return sql<{ id: string; name: string }[]>`
    select id, name from accounts where fantasy_member = true order by name asc
  `;
}

/** Payout is always PAYOUT_BY_PLACE, not admin-entered — see Article III, Section 3.1. */
export async function setStanding(fields: { year: number; place: 1 | 2 | 3; accountId: string }): Promise<void> {
  const payoutUsd = PAYOUT_BY_PLACE[fields.place];
  await sql`
    insert into fantasy_standings (year, place, account_id, payout_usd, display_name)
    values (${fields.year}, ${fields.place}, ${fields.accountId}, ${payoutUsd}, null)
    on conflict (year, place) do update set account_id = ${fields.accountId}, payout_usd = ${payoutUsd}, display_name = null
  `;
}

export type CurrentLoser = {
  id: string;
  year: number;
  loser_account_id: string | null;
  loser_display_name: string | null;
  loser_name: string;
  punishment: PunishmentKey | null;
  loser_determined_at: string;
  started_at: string | null;
  completed_at: string | null;
};

export async function getCurrentLoser(): Promise<CurrentLoser | null> {
  const rows = await sql<CurrentLoser[]>`
    select ph.id, ph.year, ph.loser_account_id, ph.loser_display_name,
      coalesce(a.name, ph.loser_display_name) as loser_name,
      ph.punishment, ph.loser_determined_at, ph.started_at, ph.completed_at
    from punishment_history ph
    left join accounts a on a.id = ph.loser_account_id
    where ph.completed_at is null
    order by ph.loser_determined_at desc
    limit 1
  `;
  return rows[0] ?? null;
}

export type OffLimitEntry = { key: PunishmentKey; reason: string };

/** Section 4.4: off-limits if it's the loser's own past pick, OR the immediately-prior year's pick. */
export async function getOffLimitsPunishments(current: CurrentLoser): Promise<OffLimitEntry[]> {
  const offLimits: OffLimitEntry[] = [];

  const ownPastRows = await sql<{ punishment: PunishmentKey }[]>`
    select punishment from punishment_history
    where year != ${current.year} and punishment is not null
      and (
        (${current.loser_account_id}::uuid is not null and loser_account_id = ${current.loser_account_id})
        or (${current.loser_account_id}::uuid is null and loser_display_name = ${current.loser_display_name})
      )
  `;
  for (const row of ownPastRows) offLimits.push({ key: row.punishment, reason: "Picked this before" });

  const priorYearRows = await sql<{ punishment: PunishmentKey }[]>`
    select punishment from punishment_history where year = ${current.year - 1} and punishment is not null
  `;
  for (const row of priorYearRows) {
    if (!offLimits.some((o) => o.key === row.punishment)) {
      offLimits.push({ key: row.punishment, reason: "Last year's pick" });
    }
  }

  return offLimits;
}

export async function startNewLoser(fields: { year: number; displayName: string }): Promise<void> {
  await sql`
    insert into punishment_history (year, loser_display_name, loser_determined_at)
    values (${fields.year}, ${fields.displayName}, now())
    on conflict (year) do update set loser_display_name = ${fields.displayName}, loser_determined_at = now()
  `;
}

export async function pickPunishment(id: string, punishment: PunishmentKey): Promise<void> {
  await sql`update punishment_history set punishment = ${punishment} where id = ${id}`;
}

export async function markLoserStarted(id: string): Promise<void> {
  await sql`update punishment_history set started_at = now() where id = ${id}`;
}

export async function markLoserCompleted(id: string): Promise<void> {
  await sql`update punishment_history set completed_at = now() where id = ${id}`;
}

export type PunishmentHistoryEntry = {
  year: number;
  loser_name: string;
  punishment: PunishmentKey | null;
  status: "COMPLETED" | "IN PROGRESS" | "TBD";
};

export async function getPunishmentHistory(): Promise<PunishmentHistoryEntry[]> {
  const rows = await sql<
    { year: number; loser_name: string; punishment: PunishmentKey | null; completed_at: string | null }[]
  >`
    select ph.year, coalesce(a.name, ph.loser_display_name) as loser_name, ph.punishment, ph.completed_at
    from punishment_history ph
    left join accounts a on a.id = ph.loser_account_id
    order by ph.year desc
  `;
  return rows.map((r) => ({
    year: r.year,
    loser_name: r.loser_name,
    punishment: r.punishment,
    status: r.completed_at ? "COMPLETED" : r.punishment ? "IN PROGRESS" : "TBD",
  }));
}

export type ContractArticle = { article_number: number; title: string; body: string };

export async function getContractArticles(): Promise<ContractArticle[]> {
  return sql<ContractArticle[]>`
    select article_number, title, body from fantasy_contract_articles order by article_number asc
  `;
}

export async function updateContractArticle(articleNumber: number, body: string): Promise<void> {
  await sql`
    update fantasy_contract_articles set body = ${body}, updated_at = now() where article_number = ${articleNumber}
  `;
}
