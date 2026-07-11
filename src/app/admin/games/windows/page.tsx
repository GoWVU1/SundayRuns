import { getTierUnlockSettings } from "@/lib/games";
import { TIER_ORDER, TIER_LABELS } from "@/lib/tiers";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Field } from "@/components/Field";
import { PillSubmitButton } from "@/components/SubmitButton";
import { setTierUnlockSettingAction } from "@/app/actions/games";

export default async function TierWindowsPage() {
  const settings = await getTierUnlockSettings();

  return (
    <>
      <Header title="SIGNUP WINDOWS" backHref="/admin/games" exitHref="/" />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3.5 p-5">
          <span className="-mt-1 text-[11px] text-muted">
            These are fixed Eastern times. Changing a game&apos;s kickoff time will not shift when a tier opens.
            You can override all three times while creating or editing a specific game.
          </span>
          {TIER_ORDER.map((tier) => {
            const { daysBefore, time } = settings[tier];
            return (
              <form
                key={tier}
                action={setTierUnlockSettingAction}
                className="flex flex-col gap-3 rounded-2xl border-[1.5px] border-navy/30 bg-card p-4"
              >
                <input type="hidden" name="tier" value={tier} />
                <span className="text-xs font-extrabold tracking-wide text-navy">{TIER_LABELS[tier]}</span>
                <Field
                  label="DAYS BEFORE GAME"
                  name="daysBefore"
                  id={`daysBefore-${tier}`}
                  type="number"
                  min={0}
                  max={14}
                  defaultValue={daysBefore}
                  required
                />
                <Field
                  label="TIME"
                  name="time"
                  id={`time-${tier}`}
                  type="time"
                  defaultValue={time}
                  required
                />
                <PillSubmitButton pendingLabel="SAVING…" variant="navy" className="mt-1">
                  SAVE {TIER_LABELS[tier]}
                </PillSubmitButton>
              </form>
            );
          })}
        </div>
      </main>
      <BottomNav
        items={[
          { label: "DASH", href: "/admin", active: false },
          { label: "GAMES", href: "/admin/games", active: true },
          { label: "GUESTS", href: "/admin/guests", active: false },
          { label: "MEMBERS", href: "/admin/members", active: false },
        ]}
      />
    </>
  );
}
