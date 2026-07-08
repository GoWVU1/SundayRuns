import "server-only";
import type { TransactionSql } from "postgres";
import { sql } from "@/lib/db";
import { nextSunday6pmUtc } from "@/lib/time";
import { TIER_ORDER, isRankedTier, type RankedTier } from "@/lib/tiers";
import type { Account } from "@/lib/accounts";

/** 6:00 PM — the "normal Sunday game" every tier's signup window is calibrated against. */
const REFERENCE_KICKOFF_MINUTE = 18 * 60;

/** Per-tier minutes-before-kickoff a signup window opens — admin-editable via tier_unlock_settings. */
export async function getTierUnlockOffsets(): Promise<Record<RankedTier, number>> {
  const rows = await sql<{ tier: RankedTier; offset_minutes: number }[]>`
    select tier, offset_minutes from tier_unlock_settings
  `;
  const byTier = Object.fromEntries(rows.map((r) => [r.tier, r.offset_minutes]));
  return Object.fromEntries(TIER_ORDER.map((t) => [t, byTier[t] ?? 0])) as Record<RankedTier, number>;
}

export async function setTierUnlockOffset(tier: RankedTier, offsetMinutes: number): Promise<void> {
  await sql`
    insert into tier_unlock_settings (tier, offset_minutes)
    values (${tier}, ${offsetMinutes})
    on conflict (tier) do update set offset_minutes = ${offsetMinutes}
  `;
}

/** A stored offset as "N days before kickoff, at HH:MM" — for prefilling the admin settings form. */
export function unlockOffsetToWindow(offsetMinutes: number): { daysBefore: number; timeMinutes: number } {
  let timeMinutes = REFERENCE_KICKOFF_MINUTE - offsetMinutes;
  let daysBefore = 0;
  while (timeMinutes < 0) {
    timeMinutes += 24 * 60;
    daysBefore += 1;
  }
  return { daysBefore, timeMinutes };
}

/** Inverse of unlockOffsetToWindow — what the admin settings form submits. */
export function windowToUnlockOffset(daysBefore: number, timeMinutes: number): number {
  return daysBefore * 24 * 60 + (REFERENCE_KICKOFF_MINUTE - timeMinutes);
}

export type GameVisibility = "standard" | "restricted";

export type Game = {
  id: string;
  starts_at: string;
  location: string;
  address: string;
  cap: number;
  is_open: boolean;
  visibility: GameVisibility;
  created_by: string | null;
  created_at: string;
};

const GAME_FIELDS = "id, starts_at, location, address, cap, is_open, visibility, created_by, created_at";

export type GameVisibilityInfo = {
  game: Game;
  /** Null for restricted games — they have no tier-window concept, see assertGameVisible/getVisibleUpcomingGames. */
  windowOpensAt: Date | null;
  isClaimable: boolean;
};

/** Games worth showing at all — anything starting up to 3h ago (mid-game) or later. */
async function fetchCandidateGames(): Promise<Game[]> {
  return sql<Game[]>`
    select ${sql.unsafe(GAME_FIELDS)} from games
    where starts_at > now() - interval '3 hours'
    order by starts_at asc
  `;
}

async function fetchAllowlists(gameIds: string[]) {
  const map = new Map<string, { tiers: Set<string>; accountIds: Set<string> }>();
  if (gameIds.length === 0) return map;
  for (const id of gameIds) map.set(id, { tiers: new Set(), accountIds: new Set() });

  const [tierRows, accountRows] = await Promise.all([
    sql<{ game_id: string; tier: string }[]>`
      select game_id, tier from game_visible_tiers where game_id in ${sql(gameIds)}
    `,
    sql<{ game_id: string; account_id: string }[]>`
      select game_id, account_id from game_visible_accounts where game_id in ${sql(gameIds)}
    `,
  ]);
  for (const row of tierRows) map.get(row.game_id)?.tiers.add(row.tier);
  for (const row of accountRows) map.get(row.game_id)?.accountIds.add(row.account_id);
  return map;
}

/**
 * Every upcoming game visible to this account, soonest first, with window state.
 * Restricted games are either fully visible (on the allow-list, no window gating)
 * or fully invisible — never "visible but not yet claimable" the way standard
 * games can be.
 */
export async function getVisibleUpcomingGames(account: Account): Promise<GameVisibilityInfo[]> {
  const [games, unlockOffsets] = await Promise.all([fetchCandidateGames(), getTierUnlockOffsets()]);
  const restrictedIds = games.filter((g) => g.visibility === "restricted").map((g) => g.id);
  const allow = await fetchAllowlists(restrictedIds);

  const rankedTier: RankedTier = isRankedTier(account.tier) ? account.tier : "extended";
  const out: GameVisibilityInfo[] = [];

  for (const game of games) {
    if (game.visibility === "restricted") {
      const list = allow.get(game.id);
      const visible = !!list && (list.tiers.has(account.tier) || list.accountIds.has(account.id));
      if (!visible) continue;
      out.push({ game, windowOpensAt: null, isClaimable: game.is_open });
    } else {
      const offsetMinutes = unlockOffsets[rankedTier];
      const windowOpensAt = new Date(new Date(game.starts_at).getTime() - offsetMinutes * 60_000);
      out.push({ game, windowOpensAt, isClaimable: game.is_open && new Date() >= windowOpensAt });
    }
  }
  return out;
}

export async function getNextVisibleGame(account: Account): Promise<GameVisibilityInfo | null> {
  const games = await getVisibleUpcomingGames(account);
  return games[0] ?? null;
}

/**
 * Server Actions must call this before touching rsvps — never trust a client-supplied
 * gameId blindly. Returns isClaimable too: visible and open-for-claiming are different
 * things (a standard game can be visible before its tier window opens).
 */
export async function assertGameVisible(account: Account, gameId: string): Promise<GameVisibilityInfo> {
  const games = await getVisibleUpcomingGames(account);
  const match = games.find((g) => g.game.id === gameId);
  if (!match) throw new Error("Game not visible to this account");
  return match;
}

/** "The" standard game admins manage from the single-editor screen — soonest upcoming standard game. */
export async function getStandardGame(): Promise<Game | null> {
  const rows = await sql<Game[]>`
    select ${sql.unsafe(GAME_FIELDS)} from games
    where visibility = 'standard' and starts_at > now()
    order by starts_at asc
    limit 1
  `;
  return rows[0] ?? null;
}

export async function ensureStandardGame(): Promise<Game> {
  const existing = await getStandardGame();
  if (existing) return existing;
  const rows = await sql<Game[]>`
    insert into games (starts_at, location, cap, visibility)
    values (${nextSunday6pmUtc().toISOString()}, '', 16, 'standard')
    returning ${sql.unsafe(GAME_FIELDS)}
  `;
  return rows[0];
}

export async function updateStandardGame(fields: {
  startsAt: Date;
  location: string;
  address: string;
}): Promise<Game> {
  const current = await ensureStandardGame();
  const rows = await sql<Game[]>`
    update games set starts_at = ${fields.startsAt.toISOString()}, location = ${fields.location}, address = ${fields.address}
    where id = ${current.id}
    returning ${sql.unsafe(GAME_FIELDS)}
  `;
  return rows[0];
}

export async function adjustStandardGameCap(delta: number): Promise<Game> {
  const current = await ensureStandardGame();
  const nextCap = Math.max(14, Math.min(17, current.cap + delta));
  const rows = await sql<Game[]>`
    update games set cap = ${nextCap} where id = ${current.id}
    returning ${sql.unsafe(GAME_FIELDS)}
  `;
  return rows[0];
}

/** All games worth managing from the admin list, regardless of visibility mode. */
export async function listUpcomingGames(): Promise<Game[]> {
  return fetchCandidateGames();
}

export async function getGameById(id: string): Promise<Game | null> {
  const rows = await sql<Game[]>`select ${sql.unsafe(GAME_FIELDS)} from games where id = ${id}`;
  return rows[0] ?? null;
}

export async function getGameAllowlist(gameId: string): Promise<{ tiers: RankedTier[]; accountIds: string[] }> {
  const [tierRows, accountRows] = await Promise.all([
    sql<{ tier: RankedTier }[]>`select tier from game_visible_tiers where game_id = ${gameId}`,
    sql<{ account_id: string }[]>`select account_id from game_visible_accounts where game_id = ${gameId}`,
  ]);
  return { tiers: tierRows.map((r) => r.tier), accountIds: accountRows.map((r) => r.account_id) };
}

type GameFormFields = {
  startsAt: Date;
  location: string;
  address: string;
  cap: number;
  isOpen: boolean;
  visibility: GameVisibility;
  visibleTiers?: RankedTier[];
  visibleAccountIds?: string[];
};

async function writeAllowlist(tx: TransactionSql, gameId: string, fields: GameFormFields) {
  await tx`delete from game_visible_tiers where game_id = ${gameId}`;
  await tx`delete from game_visible_accounts where game_id = ${gameId}`;
  if (fields.visibility !== "restricted") return;

  const tiers = fields.visibleTiers ?? [];
  const accountIds = fields.visibleAccountIds ?? [];

  if (tiers.length > 0) {
    const rows = tiers.map((tier) => ({ game_id: gameId, tier }));
    await tx`insert into game_visible_tiers ${tx(rows, "game_id", "tier")}`;
  }
  if (accountIds.length > 0) {
    const rows = accountIds.map((account_id) => ({ game_id: gameId, account_id }));
    await tx`insert into game_visible_accounts ${tx(rows, "game_id", "account_id")}`;
  }
}

/** Creates a one-off game (standard or restricted) — the admin "new game" flow. */
export async function createGame(fields: GameFormFields & { createdBy: string }): Promise<Game> {
  return sql.begin(async (tx) => {
    const rows = await tx<Game[]>`
      insert into games (starts_at, location, address, cap, is_open, visibility, created_by)
      values (${fields.startsAt.toISOString()}, ${fields.location}, ${fields.address}, ${fields.cap}, ${fields.isOpen}, ${fields.visibility}, ${fields.createdBy})
      returning ${sql.unsafe(GAME_FIELDS)}
    `;
    const game = rows[0];
    await writeAllowlist(tx, game.id, fields);
    return game;
  });
}

/** Full edit of any game (date/time, location, cap, visibility + allow-lists) — the admin edit screen. */
export async function updateGame(id: string, fields: GameFormFields): Promise<Game> {
  return sql.begin(async (tx) => {
    const rows = await tx<Game[]>`
      update games set
        starts_at = ${fields.startsAt.toISOString()},
        location = ${fields.location},
        address = ${fields.address},
        cap = ${fields.cap},
        is_open = ${fields.isOpen},
        visibility = ${fields.visibility}
      where id = ${id}
      returning ${sql.unsafe(GAME_FIELDS)}
    `;
    const game = rows[0];
    await writeAllowlist(tx, id, fields);
    return game;
  });
}

export async function toggleGameOpen(id: string): Promise<Game> {
  const rows = await sql<Game[]>`
    update games set is_open = not is_open where id = ${id}
    returning ${sql.unsafe(GAME_FIELDS)}
  `;
  return rows[0];
}

export async function deleteGame(id: string): Promise<void> {
  await sql`delete from games where id = ${id}`;
}

export type GameTemplate = {
  slot: 1 | 2;
  name: string;
  location: string;
  address: string;
  cap: number;
  visibility: GameVisibility;
  visible_tiers: RankedTier[];
};

/** The two admin-editable quick-create presets for the "new one-off game" form. */
export async function getGameTemplates(): Promise<GameTemplate[]> {
  return sql<GameTemplate[]>`
    select slot, name, location, address, cap, visibility, visible_tiers from game_templates order by slot asc
  `;
}

export async function getGameTemplate(slot: 1 | 2): Promise<GameTemplate | null> {
  const [row] = await sql<GameTemplate[]>`
    select slot, name, location, address, cap, visibility, visible_tiers from game_templates where slot = ${slot}
  `;
  return row ?? null;
}

export async function updateGameTemplate(fields: {
  slot: 1 | 2;
  name: string;
  location: string;
  address: string;
  cap: number;
  visibility: GameVisibility;
  visibleTiers: RankedTier[];
}): Promise<void> {
  await sql`
    update game_templates set
      name = ${fields.name}, location = ${fields.location}, address = ${fields.address}, cap = ${fields.cap},
      visibility = ${fields.visibility}, visible_tiers = ${sql.array(fields.visibleTiers)}
    where slot = ${fields.slot}
  `;
}
