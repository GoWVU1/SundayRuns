export type RankedTier = "core" | "regular" | "extended";
export type Tier = RankedTier | "guest";

/** Minutes before a standard game's start time that each tier's signup window opens. */
export const TIER_UNLOCK_OFFSET_MINUTES: Record<RankedTier, number> = {
  core: 25 * 60, // Saturday 5:00 PM for a Sunday 6:00 PM game
  regular: 7 * 60 + 30, // Sunday 10:30 AM
  extended: 3 * 60 + 30, // Sunday 2:30 PM
};

export const TIER_ORDER: RankedTier[] = ["core", "regular", "extended"];

// Display names only — "core"/"regular"/"extended" stay as the internal DB/priority-window
// keys (unlock offsets, guest-sponsor eligibility, etc. are all still keyed on these).
export const TIER_LABELS: Record<Tier, string> = {
  core: "HALL OF FAME",
  regular: "VETERANS",
  extended: "ROOKIES",
  guest: "GUEST",
};

export function canSponsorGuest(tier: string): boolean {
  return tier === "core" || tier === "regular";
}

export function isRankedTier(tier: string): tier is RankedTier {
  return tier === "core" || tier === "regular" || tier === "extended";
}
