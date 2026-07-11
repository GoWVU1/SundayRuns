import { getTierLabel } from "@/lib/tiers";

const TIER_CHIP_STYLES: Record<string, string> = {
  core: "border-navy text-cream bg-navy",
  regular: "border-navy text-navy bg-transparent",
  extended: "border-[#9aa7bd] text-[#5c6b85] bg-transparent",
  guest: "border-[#8a6a00] text-[#8a6a00] bg-transparent",
};

export function TierBadge({ tier, className = "" }: { tier: string; className?: string }) {
  const style = TIER_CHIP_STYLES[tier] ?? TIER_CHIP_STYLES.extended;
  const label = getTierLabel(tier);
  return (
    <span
      className={`whitespace-nowrap rounded-full border px-2.5 py-[3px] text-[9px] font-extrabold tracking-wide ${style} ${className}`}
    >
      {label}
    </span>
  );
}
