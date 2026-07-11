import { Field } from "@/components/Field";
import { AccountMultiSelect, type SelectableAccount } from "@/components/AccountMultiSelect";
import { TIER_ORDER, TIER_LABELS, type RankedTier } from "@/lib/tiers";

export function GameFormFields({
  defaultStartsAt,
  defaultLocation,
  defaultAddress,
  defaultCap,
  defaultIsOpen,
  defaultVisibility,
  defaultVisibleTiers,
  defaultVisibleAccountIds,
  defaultUseCustomUnlocks,
  defaultTierUnlockInputs,
  members,
}: {
  defaultStartsAt: string;
  defaultLocation: string;
  defaultAddress: string;
  defaultCap: number;
  defaultIsOpen: boolean;
  defaultVisibility: "standard" | "restricted";
  defaultVisibleTiers: RankedTier[];
  defaultVisibleAccountIds: string[];
  defaultUseCustomUnlocks: boolean;
  defaultTierUnlockInputs: Record<RankedTier, string>;
  members: SelectableAccount[];
}) {
  return (
    <>
      <Field label="DATE & TIME" name="startsAt" type="datetime-local" defaultValue={defaultStartsAt} required />
      <Field
        label="GYM / LOCATION NAME"
        name="location"
        defaultValue={defaultLocation}
        placeholder="Lincoln Park · Court #2"
      />
      <Field
        label="ADDRESS"
        name="address"
        defaultValue={defaultAddress}
        placeholder="123 Main St, Anytown, ST 12345"
      />
      <Field label="CAP" name="cap" type="number" min={1} max={50} defaultValue={defaultCap} required />

      <label className="flex cursor-pointer items-center justify-between rounded-2xl border-[1.5px] border-navy/25 bg-cream p-3.5 has-[:checked]:border-navy has-[:checked]:bg-navy has-[:checked]:text-cream">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-extrabold tracking-wide">OPEN FOR RSVPS</span>
          <span className="mt-0.5 block text-[10px] font-normal opacity-70">
            Members can claim spots as soon as you save
          </span>
        </div>
        <input
          type="checkbox"
          name="isOpen"
          value="true"
          defaultChecked={defaultIsOpen}
          className="h-5 w-5 accent-gold"
        />
      </label>

      <div className="group flex flex-col gap-3">
        <label className="text-[10px] font-extrabold tracking-[2px] text-muted">VISIBILITY</label>
        <div className="flex gap-2.5">
          <label className="flex-1 cursor-pointer rounded-[14px] border-[1.5px] border-navy/25 bg-cream p-3 text-center has-[:checked]:border-navy has-[:checked]:bg-navy has-[:checked]:text-cream">
            <input
              type="radio"
              name="visibility"
              value="standard"
              id="visibility-standard"
              defaultChecked={defaultVisibility !== "restricted"}
              className="sr-only"
            />
            <span className="text-xs font-extrabold tracking-wide">STANDARD</span>
            <span className="mt-0.5 block text-[10px] font-normal opacity-70">Everyone, per priority windows</span>
          </label>
          <label className="flex-1 cursor-pointer rounded-[14px] border-[1.5px] border-navy/25 bg-cream p-3 text-center has-[:checked]:border-navy has-[:checked]:bg-navy has-[:checked]:text-cream">
            <input
              type="radio"
              name="visibility"
              value="restricted"
              id="visibility-restricted"
              defaultChecked={defaultVisibility === "restricted"}
              className="sr-only"
            />
            <span className="text-xs font-extrabold tracking-wide">RESTRICTED</span>
            <span className="mt-0.5 block text-[10px] font-normal opacity-70">Only who you pick below</span>
          </label>
        </div>

        <div className="hidden flex-col gap-3 rounded-[14px] border border-navy/15 bg-card p-3 group-has-[#visibility-standard:checked]:flex">
          <label className="flex cursor-pointer items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-extrabold tracking-wide text-navy">CUSTOM TIMES FOR THIS GAME</span>
              <span className="text-[10px] font-normal text-muted">
                Otherwise this game uses the fixed signup-window defaults
              </span>
            </div>
            <input
              type="checkbox"
              name="useCustomUnlocks"
              value="true"
              defaultChecked={defaultUseCustomUnlocks}
              className="h-5 w-5 flex-shrink-0 accent-navy"
            />
          </label>
          <div className="grid gap-2.5">
            {TIER_ORDER.map((tier) => (
              <Field
                key={tier}
                label={`${TIER_LABELS[tier]} OPENS`}
                name={`unlock-${tier}`}
                type="datetime-local"
                defaultValue={defaultTierUnlockInputs[tier]}
                required
              />
            ))}
          </div>
          <span className="text-[10px] text-muted">
            These are exact Eastern date/times for this game and do not move with kickoff.
          </span>
        </div>

        <div className="hidden flex-col gap-3 group-has-[#visibility-restricted:checked]:flex">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-extrabold tracking-[2px] text-muted">VISIBLE TO TIERS</label>
            <div className="flex flex-wrap gap-2">
              {TIER_ORDER.map((tier) => (
                <label
                  key={tier}
                  className="cursor-pointer rounded-full border-[1.5px] border-navy/25 bg-cream px-3 py-1.5 has-[:checked]:border-navy has-[:checked]:bg-navy has-[:checked]:text-cream"
                >
                  <input
                    type="checkbox"
                    name="visibleTiers"
                    value={tier}
                    defaultChecked={defaultVisibleTiers.includes(tier)}
                    className="sr-only"
                  />
                  <span className="text-[11px] font-extrabold tracking-wide">{TIER_LABELS[tier]}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-extrabold tracking-[2px] text-muted">
              PLUS THESE SPECIFIC PEOPLE
            </label>
            <AccountMultiSelect members={members} defaultSelectedIds={defaultVisibleAccountIds} />
          </div>
        </div>
      </div>
    </>
  );
}
