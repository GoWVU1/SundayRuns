export type RankedTier = "core" | "regular" | "extended";
export type Tier = RankedTier | "guest";

// Per-tier signup-window unlock offsets are admin-configurable — see
// getTierUnlockOffsets()/setTierUnlockOffset() in src/lib/games.ts, backed by
// the tier_unlock_settings table.

export const TIER_ORDER: RankedTier[] = ["core", "regular", "extended"];

// Display names only — "core"/"regular"/"extended" stay as the internal DB/priority-window
// keys (unlock offsets, etc. are still keyed on these). Guest-sponsor eligibility is no
// longer tied to specific tiers — see canSponsorGuest() in src/lib/guests.ts, which is
// admin-configurable per tier via tier_guest_settings.
export const TIER_LABELS: Record<Tier, string> = {
  core: "HALL OF FAME",
  regular: "VETERANS",
  extended: "ROOKIES",
  guest: "GUEST",
};

export function isRankedTier(tier: string): tier is RankedTier {
  return tier === "core" || tier === "regular" || tier === "extended";
}
