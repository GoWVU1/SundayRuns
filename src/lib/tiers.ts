export type RankedTier = "core" | "regular" | "extended";
export type Tier = RankedTier | "guest";

// Per-tier signup clock times are admin-configurable in tier_unlock_settings.
// Individual standard games can override them in game_tier_unlocks.

export const TIER_ORDER: RankedTier[] = ["core", "regular", "extended"];

// Display names only — "core"/"regular"/"extended" stay as the internal DB/priority-window
// keys (unlock offsets, etc. are still keyed on these). Guest-sponsor eligibility is no
// longer tied to specific tiers — see canSponsorGuest() in src/lib/guests.ts, which is
// admin-configurable per tier via tier_guest_settings.
export const TIER_LABELS: Record<Tier, string> = {
  core: "HALL OF FAME",
  regular: "VETERAN",
  extended: "ROOKIE",
  guest: "GUEST",
};

/** Convert stable database tier keys into the names shown throughout the app. */
export function getTierLabel(tier: string): string {
  return TIER_LABELS[tier as Tier] ?? tier.toUpperCase();
}

export function isRankedTier(tier: string): tier is RankedTier {
  return tier === "core" || tier === "regular" || tier === "extended";
}

/** Higher number = higher tier. Derived from TIER_ORDER (highest-first) so there's one source of truth. */
export const TIER_RANK: Record<RankedTier, number> = Object.fromEntries(
  TIER_ORDER.map((tier, i) => [tier, TIER_ORDER.length - 1 - i])
) as Record<RankedTier, number>;

export function nextTierUp(tier: RankedTier): RankedTier | null {
  const i = TIER_ORDER.indexOf(tier);
  return i > 0 ? TIER_ORDER[i - 1] : null;
}

export function nextTierDown(tier: RankedTier): RankedTier | null {
  const i = TIER_ORDER.indexOf(tier);
  return i < TIER_ORDER.length - 1 ? TIER_ORDER[i + 1] : null;
}

/**
 * Consecutive qualifying weeks needed to promote from this tier, counted
 * since the account's last tier change (not all-time attendance) — each rung
 * requires its own fresh run rather than stacking on a lifetime total.
 */
export const PROMOTION_THRESHOLD: Partial<Record<RankedTier, number>> = {
  extended: 5, // → regular
  regular: 12, // → core
};

/** Consecutive missed weeks needed to demote from this tier, same counting rule as above. */
export const DEMOTION_THRESHOLD: Partial<Record<RankedTier, number>> = {
  core: 5, // → regular
  regular: 10, // → extended
};
