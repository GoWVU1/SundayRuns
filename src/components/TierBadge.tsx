import { getTierLabel } from "@/lib/tiers";

const TIER_CHIP_STYLES: Record<string, string> = {
  core: "border-navy text-cream bg-navy",
  regular: "border-navy text-navy bg-transparent",
  extended: "border-[#9aa7bd] text-[#5c6b85] bg-transparent",
  guest: "border-[#8a6a00] text-[#8a6a00] bg-transparent",
};

const GOAT_STYLE = "border-gold bg-gold text-navy";

/**
 * isGoat is resolved by the caller (it depends on the viewer, not just the
 * badge's subject — see canViewGoatTags in lib/goat.ts) and, when true,
 * fully overrides the real tier so it can't leak through the label or style.
 */
export function TierBadge({
  tier,
  isGoat = false,
  className = "",
}: {
  tier: string;
  isGoat?: boolean;
  className?: string;
}) {
  const style = isGoat ? GOAT_STYLE : (TIER_CHIP_STYLES[tier] ?? TIER_CHIP_STYLES.extended);
  const label = isGoat ? "GOAT" : getTierLabel(tier);
  return (
    <span
      className={`whitespace-nowrap rounded-full border px-2.5 py-[3px] text-[9px] font-extrabold tracking-wide ${style} ${className}`}
    >
      {label}
    </span>
  );
}
