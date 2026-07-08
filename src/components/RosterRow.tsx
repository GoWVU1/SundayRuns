import { TierBadge } from "./TierBadge";
import { StreakBadge } from "./StreakBadge";
import { CrownBadge } from "./CrownBadge";

export function RosterRow({
  num,
  name,
  tier,
  sponsorName,
  streak = 0,
  isChampion = false,
  right,
}: {
  num: number;
  name: string;
  tier: string;
  sponsorName?: string | null;
  streak?: number;
  isChampion?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-navy/10 px-3.5 py-[11px] last:border-b-0">
      <span className="w-5 flex-shrink-0 font-display text-[15px] text-[#9c8f6e]">{num}</span>
      <span className="flex min-w-0 flex-1 items-center gap-1.5">
        <span className="truncate text-sm font-semibold text-navy">{name}</span>
        {isChampion && <CrownBadge />}
      </span>
      {sponsorName && (
        <span className="flex-shrink-0 whitespace-nowrap text-[10px] italic text-muted">
          guest of {sponsorName}
        </span>
      )}
      <StreakBadge count={streak} />
      <TierBadge tier={tier} />
      {right}
    </div>
  );
}
