import { TierBadge } from "./TierBadge";

export type SelectableAccount = { id: string; name: string; tier: string };

export function AccountMultiSelect({
  members,
  defaultSelectedIds,
}: {
  members: SelectableAccount[];
  defaultSelectedIds: string[];
}) {
  return (
    <div className="max-h-[220px] overflow-y-auto rounded-2xl border-[1.5px] border-navy/25 bg-card">
      {members.length === 0 && (
        <div className="px-3.5 py-3 text-center text-xs text-muted">No members yet.</div>
      )}
      {members.map((m) => (
        <label
          key={m.id}
          className="flex cursor-pointer items-center gap-3 border-b border-navy/10 px-3.5 py-2.5 last:border-b-0 has-[:checked]:bg-cream"
        >
          <input
            type="checkbox"
            name="visibleAccountIds"
            value={m.id}
            defaultChecked={defaultSelectedIds.includes(m.id)}
            className="h-4 w-4 accent-navy"
          />
          <span className="flex-1 truncate text-sm font-semibold text-navy">{m.name}</span>
          <TierBadge tier={m.tier} />
        </label>
      ))}
    </div>
  );
}
