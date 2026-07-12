import "server-only";
import type { TransactionSql } from "postgres";
import { sql } from "@/lib/db";
import { TIER_ORDER, isRankedTier, type RankedTier } from "@/lib/tiers";
import type { Account } from "@/lib/accounts";
import { fixedLocalUnlockUtc, utcToLocalInput } from "@/lib/time";

export type TierUnlockSetting = { daysBefore: number; time: string };
export type TierUnlockSettings = Record<RankedTier, TierUnlockSetting>;
export type GameTierUnlocks = Record<RankedTier, Date>;

function normalizeTime(value: string): string {
  return value.slice(0, 5);
}

/** Fixed local day/time defaults — deliberately independent of kickoff hour. */
export async function getTierUnlockSettings(): Promise<TierUnlockSettings> {
  const rows = await sql<{ tier: RankedTier; days_before: number; unlock_time: string }[]>`
    select tier, days_before, unlock_time::text from tier_unlock_settings
  `;
  const byTier = Object.fromEntries(
    rows.map((r) => [r.tier, { daysBefore: r.days_before, time: normalizeTime(r.unlock_time) }])
  ) as Partial<TierUnlockSettings>;
  const fallbacks: TierUnlockSettings = {
    core: { daysBefore: 1, time: "17:00" },
    regular: { daysBefore: 0, time: "10:30" },
    extended: { daysBefore: 0, time: "13:00" },
  };
  return Object.fromEntries(TIER_ORDER.map((tier) => [tier, byTier[tier] ?? fallbacks[tier]])) as TierUnlockSettings;
}

export async function setTierUnlockSetting(
  tier: RankedTier,
  daysBefore: number,
  time: string
): Promise<void> {
  await sql`
    insert into tier_unlock_settings (tier, offset_minutes, days_before, unlock_time)
    values (${tier}, 0, ${daysBefore}, ${time}::time)
    on conflict (tier) do update set days_before = ${daysBefore}, unlock_time = ${time}::time
  `;
}

export function resolveTierUnlockInputs(
  gameStartsAt: Date | string,
  settings: TierUnlockSettings
): Record<RankedTier, string> {
  return Object.fromEntries(
    TIER_ORDER.map((tier) => {
      const setting = settings[tier];
      return [tier, utcToLocalInput(fixedLocalUnlockUtc(gameStartsAt, setting.daysBefore, setting.time))];
    })
  ) as Record<RankedTier, string>;
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

type VisibleGameRow = Game & {
  custom_opens_at: string | null;
  days_before: number | null;
  unlock_time: string | null;
};

/**
 * Fetches visibility, the tier default, and any game override in one database
 * round trip. The previous implementation needed four queries across two
 * sequential waves before it could decide whether one game was claimable.
 */
async function fetchVisibleGames(
  account: Account,
  options: { gameId?: string; limit?: number } = {}
): Promise<GameVisibilityInfo[]> {
  const rankedTier: RankedTier = isRankedTier(account.tier) ? account.tier : "extended";
  const rows = await sql<VisibleGameRow[]>`
    select
      g.id, g.starts_at, g.location, g.address, g.cap, g.is_open, g.visibility, g.created_by, g.created_at,
      gtu.opens_at as custom_opens_at,
      tus.days_before,
      tus.unlock_time::text
    from games g
    left join game_tier_unlocks gtu on gtu.game_id = g.id and gtu.tier = ${rankedTier}
    left join tier_unlock_settings tus on tus.tier = ${rankedTier}
    where g.starts_at > now() - interval '3 hours'
      ${options.gameId ? sql`and g.id = ${options.gameId}` : sql``}
      and (
        g.visibility = 'standard'
        or exists (
          select 1 from game_visible_tiers gvt
          where gvt.game_id = g.id and gvt.tier = ${account.tier}
        )
        or exists (
          select 1 from game_visible_accounts gva
          where gva.game_id = g.id and gva.account_id = ${account.id}
        )
      )
    order by g.starts_at asc
    ${options.limit ? sql`limit ${options.limit}` : sql``}
  `;

  const fallbacks: TierUnlockSettings = {
    core: { daysBefore: 1, time: "17:00" },
    regular: { daysBefore: 0, time: "10:30" },
    extended: { daysBefore: 0, time: "13:00" },
  };
  return rows.map((row) => {
    const { custom_opens_at, days_before, unlock_time, ...game } = row;
    if (game.visibility === "restricted") {
      return { game, windowOpensAt: null, isClaimable: game.is_open };
    }
    const fallback = fallbacks[rankedTier];
    const windowOpensAt = custom_opens_at
      ? new Date(custom_opens_at)
      : fixedLocalUnlockUtc(game.starts_at, days_before ?? fallback.daysBefore, unlock_time ?? fallback.time);
    return { game, windowOpensAt, isClaimable: game.is_open && new Date() >= windowOpensAt };
  });
}

/**
 * Every upcoming game visible to this account, soonest first, with window state.
 * Restricted games are either fully visible (on the allow-list, no window gating)
 * or fully invisible — never "visible but not yet claimable" the way standard
 * games can be.
 */
export async function getVisibleUpcomingGames(account: Account): Promise<GameVisibilityInfo[]> {
  return fetchVisibleGames(account);
}

export async function getNextVisibleGame(account: Account): Promise<GameVisibilityInfo | null> {
  const games = await fetchVisibleGames(account, { limit: 1 });
  return games[0] ?? null;
}

/**
 * Server Actions must call this before touching rsvps — never trust a client-supplied
 * gameId blindly. Returns isClaimable too: visible and open-for-claiming are different
 * things (a standard game can be visible before its tier window opens).
 */
export async function assertGameVisible(account: Account, gameId: string): Promise<GameVisibilityInfo> {
  const [match] = await fetchVisibleGames(account, { gameId, limit: 1 });
  if (!match) throw new Error("Game not visible to this account");
  return match;
}

/** All games worth managing from the admin list, regardless of visibility mode. */
export async function listUpcomingGames(): Promise<Game[]> {
  return fetchCandidateGames();
}

export async function getNextAdminGameSummary(): Promise<{
  game: Game | null;
  confirmedCount: number;
}> {
  const [row] = await sql<(Game & { confirmed_count: number })[]>`
    select
      g.id, g.starts_at, g.location, g.address, g.cap, g.is_open, g.visibility, g.created_by, g.created_at,
      (select count(*)::int from rsvps r where r.game_id = g.id and r.status = 'confirmed') as confirmed_count
    from games g
    where g.starts_at > now() - interval '3 hours'
    order by g.starts_at asc
    limit 1
  `;
  if (!row) return { game: null, confirmedCount: 0 };
  const { confirmed_count: confirmedCount, ...game } = row;
  return { game, confirmedCount };
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

export async function getGameTierUnlocks(gameId: string): Promise<GameTierUnlocks | null> {
  const rows = await sql<{ tier: RankedTier; opens_at: string }[]>`
    select tier, opens_at from game_tier_unlocks where game_id = ${gameId}
  `;
  if (rows.length !== TIER_ORDER.length) return null;
  const byTier = Object.fromEntries(rows.map((row) => [row.tier, new Date(row.opens_at)]));
  return byTier as GameTierUnlocks;
}

/**
 * The admin game-editor screen's game/allowlist/tier-unlocks in one round trip
 * instead of four (getGameById + the 2 allowlist queries + getGameTierUnlocks).
 * That page already fires several other concurrent queries (members, global
 * tier defaults, roster) — cutting this cluster to one query keeps the total
 * comfortably inside the connection pool instead of forcing queries to queue,
 * which is what left orphaned "active, ClientRead" sessions behind when the
 * request occasionally ran long enough to hit the function timeout mid-flight.
 */
export async function getGameEditData(id: string): Promise<{
  game: Game | null;
  allowlist: { tiers: RankedTier[]; accountIds: string[] };
  tierUnlocks: GameTierUnlocks | null;
}> {
  const [row] = await sql<
    (Game & {
      visible_tiers: RankedTier[];
      visible_account_ids: string[];
      tier_unlocks: Record<RankedTier, string> | null;
    })[]
  >`
    select
      g.id, g.starts_at, g.location, g.address, g.cap, g.is_open, g.visibility, g.created_by, g.created_at,
      coalesce(
        (select jsonb_agg(tier) from game_visible_tiers where game_id = g.id), '[]'::jsonb
      ) as visible_tiers,
      coalesce(
        (select jsonb_agg(account_id) from game_visible_accounts where game_id = g.id), '[]'::jsonb
      ) as visible_account_ids,
      (select jsonb_object_agg(tier, opens_at) from game_tier_unlocks where game_id = g.id) as tier_unlocks
    from games g
    where g.id = ${id}
  `;
  if (!row) return { game: null, allowlist: { tiers: [], accountIds: [] }, tierUnlocks: null };

  const { visible_tiers, visible_account_ids, tier_unlocks, ...game } = row;
  const tierUnlocks =
    tier_unlocks && Object.keys(tier_unlocks).length === TIER_ORDER.length
      ? (Object.fromEntries(
          Object.entries(tier_unlocks).map(([tier, opensAt]) => [tier, new Date(opensAt)])
        ) as GameTierUnlocks)
      : null;

  return { game, allowlist: { tiers: visible_tiers, accountIds: visible_account_ids }, tierUnlocks };
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
  tierUnlocks?: GameTierUnlocks | null;
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

async function writeTierUnlocks(tx: TransactionSql, gameId: string, fields: GameFormFields) {
  await tx`delete from game_tier_unlocks where game_id = ${gameId}`;
  if (fields.visibility !== "standard" || !fields.tierUnlocks) return;
  const rows = TIER_ORDER.map((tier) => ({
    game_id: gameId,
    tier,
    opens_at: fields.tierUnlocks?.[tier].toISOString(),
  }));
  await tx`insert into game_tier_unlocks ${tx(rows, "game_id", "tier", "opens_at")}`;
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
    await writeTierUnlocks(tx, game.id, fields);
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
    await writeTierUnlocks(tx, id, fields);
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
  tier_unlocks: TierUnlockSettings | null;
};

/** The two admin-editable quick-create presets for the "new one-off game" form. */
export async function getGameTemplates(): Promise<GameTemplate[]> {
  const [templates, unlockRows] = await Promise.all([
    sql<Omit<GameTemplate, "tier_unlocks">[]>`
    select slot, name, location, address, cap, visibility, visible_tiers from game_templates order by slot asc
    `,
    sql<{ template_slot: 1 | 2; tier: RankedTier; days_before: number; unlock_time: string }[]>`
      select template_slot, tier, days_before, unlock_time::text from game_template_tier_unlocks
      order by template_slot, tier
    `,
  ]);
  return templates.map((template) => {
    const rows = unlockRows.filter((row) => row.template_slot === template.slot);
    const tier_unlocks = rows.length === TIER_ORDER.length
      ? Object.fromEntries(rows.map((row) => [
          row.tier,
          { daysBefore: row.days_before, time: normalizeTime(row.unlock_time) },
        ])) as TierUnlockSettings
      : null;
    return { ...template, tier_unlocks };
  });
}

export async function getGameTemplate(slot: 1 | 2): Promise<GameTemplate | null> {
  const templates = await getGameTemplates();
  return templates.find((template) => template.slot === slot) ?? null;
}

export async function updateGameTemplate(fields: {
  slot: 1 | 2;
  name: string;
  location: string;
  address: string;
  cap: number;
  visibility: GameVisibility;
  visibleTiers: RankedTier[];
  tierUnlocks: TierUnlockSettings | null;
}): Promise<void> {
  await sql.begin(async (tx) => {
    await tx`
      update game_templates set
        name = ${fields.name}, location = ${fields.location}, address = ${fields.address}, cap = ${fields.cap},
        visibility = ${fields.visibility}, visible_tiers = ${tx.array(fields.visibleTiers)}
      where slot = ${fields.slot}
    `;
    await tx`delete from game_template_tier_unlocks where template_slot = ${fields.slot}`;
    if (fields.visibility !== "standard" || !fields.tierUnlocks) return;
    const rows = TIER_ORDER.map((tier) => ({
      template_slot: fields.slot,
      tier,
      days_before: fields.tierUnlocks?.[tier].daysBefore,
      unlock_time: fields.tierUnlocks?.[tier].time,
    }));
    await tx`
      insert into game_template_tier_unlocks
        ${tx(rows, "template_slot", "tier", "days_before", "unlock_time")}
    `;
  });
}
