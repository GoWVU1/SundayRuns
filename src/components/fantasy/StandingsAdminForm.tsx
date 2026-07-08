import { setStandingAction } from "@/app/actions/fantasy";
import { Field } from "@/components/Field";

const PLACES = [1, 2, 3] as const;

export function StandingsAdminForm({ defaultYear }: { defaultYear: number }) {
  return (
    <div className="flex flex-col gap-3 rounded-[20px] border-[1.5px] border-navy/30 bg-card p-[18px]">
      <span className="text-[10px] font-extrabold tracking-[2px] text-muted">EDIT STANDINGS (ADMIN)</span>
      {PLACES.map((place) => (
        <form key={place} action={setStandingAction} className="flex items-end gap-2">
          <input type="hidden" name="place" value={place} />
          <input type="hidden" name="year" value={defaultYear} />
          <Field label={`#${place} NAME`} name="displayName" placeholder="Name" className="flex-1" />
          <Field label="PAYOUT $" name="payoutUsd" type="number" step="0.01" placeholder="0" className="w-20" />
          <button
            type="submit"
            className="flex-shrink-0 rounded-[10px] bg-navy px-3 py-3 text-xs font-extrabold tracking-wide text-cream"
          >
            SAVE
          </button>
        </form>
      ))}
    </div>
  );
}
