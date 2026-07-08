import "server-only";
import { sql } from "@/lib/db";

export const PUNISHMENTS = [
  {
    key: "act_exam",
    name: "ACT Exam",
    desc: "Retake the exam cold, no studying, and post the score to the group chat.",
  },
  {
    key: "pacer_test",
    name: "FitnessGram PACER Test",
    desc: "Run the beep test to failure, on camera, at the park.",
  },
  {
    key: "waffle_house_24",
    name: "24 Hours in a Waffle House",
    desc: "One full day, no leaving early, meals optional.",
  },
  {
    key: "hot_ones",
    name: "Hot Ones Challenge",
    desc: "Full lineup, last sauce standing or bust.",
  },
  {
    key: "bodybuilding_comp",
    name: "Bodybuilding Competition",
    desc: "Enter a real local show and hit the stage.",
  },
] as const;

export type PunishmentKey = (typeof PUNISHMENTS)[number]["key"];

export function isPunishmentKey(value: string): value is PunishmentKey {
  return PUNISHMENTS.some((p) => p.key === value);
}

export type StandingEntry = { place: number; name: string; payout_usd: string };

async function getLatestStandingsYear(): Promise<number | null> {
  const [row] = await sql<{ year: number | null }[]>`select max(year) as year from fantasy_standings`;
  return row?.year ?? null;
}

export async function getLatestStandings(): Promise<{ year: number | null; standings: StandingEntry[] }> {
  const year = await getLatestStandingsYear();
  if (!year) return { year: null, standings: [] };
  const standings = await sql<StandingEntry[]>`
    select fs.place, coalesce(a.name, fs.display_name) as name, fs.payout_usd::text
    from fantasy_standings fs
    left join accounts a on a.id = fs.account_id
    where fs.year = ${year}
    order by fs.place asc
  `;
  return { year, standings };
}

export async function setStanding(fields: {
  year: number;
  place: 1 | 2 | 3;
  displayName: string;
  payoutUsd: number;
}): Promise<void> {
  await sql`
    insert into fantasy_standings (year, place, display_name, payout_usd)
    values (${fields.year}, ${fields.place}, ${fields.displayName}, ${fields.payoutUsd})
    on conflict (year, place) do update set display_name = ${fields.displayName}, payout_usd = ${fields.payoutUsd}
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
