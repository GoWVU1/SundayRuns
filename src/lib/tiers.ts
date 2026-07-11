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
