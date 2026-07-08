import { TierBadge } from "./TierBadge";

export function RosterRow({
  num,
  name,
  tier,
  sponsorName,
  right,
}: {
  num: number;
  name: string;
  tier: string;
  sponsorName?: string | null;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-navy/10 px-3.5 py-[11px] last:border-b-0">
      <span className="w-5 flex-shrink-0 font-display text-[15px] text-[#9c8f6e]">{num}</span>
      <span className="flex-1 truncate text-sm font-semibold text-navy">{name}</span>
      {sponsorName && (
        <span className="flex-shrink-0 whitespace-nowrap text-[10px] italic text-muted">
          guest of {sponsorName}
        </span>
      )}
      <TierBadge tier={tier} />
      {right}
    </div>
  );
}
