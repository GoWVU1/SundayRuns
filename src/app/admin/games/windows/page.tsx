import { getTierUnlockOffsets, unlockOffsetToWindow } from "@/lib/games";
import { TIER_ORDER, TIER_LABELS } from "@/lib/tiers";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Field } from "@/components/Field";
import { PillButton } from "@/components/Button";
import { setTierUnlockOffsetAction } from "@/app/actions/games";

function minutesToTimeInput(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default async function TierWindowsPage() {
  const offsets = await getTierUnlockOffsets();

  return (
    <>
      <Header title="SIGNUP WINDOWS" backHref="/admin/games" exitHref="/" />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3.5 p-5">
          <span className="-mt-1 text-[11px] text-muted">
            When each tier&apos;s window opens, relative to a normal 6:00 PM kickoff. Games at other times
            still open this many hours before their own start.
          </span>
          {TIER_ORDER.map((tier) => {
            const { daysBefore, timeMinutes } = unlockOffsetToWindow(offsets[tier]);
            return (
              <form
                key={tier}
                action={setTierUnlockOffsetAction}
                className="flex flex-col gap-3 rounded-2xl border-[1.5px] border-navy/30 bg-card p-4"
              >
                <input type="hidden" name="tier" value={tier} />
                <span className="text-xs font-extrabold tracking-wide text-navy">{TIER_LABELS[tier]}</span>
                <div className="flex gap-2.5">
                  <label className="flex-1 cursor-pointer rounded-[14px] border-[1.5px] border-navy/25 bg-cream p-3 text-center has-[:checked]:border-navy has-[:checked]:bg-navy has-[:checked]:text-cream">
                    <input
                      type="radio"
                      name="daysBefore"
                      value="0"
                      defaultChecked={daysBefore === 0}
                      className="sr-only"
                    />
                    <span className="text-xs font-extrabold tracking-wide">DAY OF</span>
                  </label>
                  <label className="flex-1 cursor-pointer rounded-[14px] border-[1.5px] border-navy/25 bg-cream p-3 text-center has-[:checked]:border-navy has-[:checked]:bg-navy has-[:checked]:text-cream">
                    <input
                      type="radio"
                      name="daysBefore"
                      value="1"
                      defaultChecked={daysBefore >= 1}
                      className="sr-only"
                    />
                    <span className="text-xs font-extrabold tracking-wide">DAY BEFORE</span>
                  </label>
                </div>
                <Field
                  label="TIME"
                  name="time"
                  type="time"
                  defaultValue={minutesToTimeInput(timeMinutes)}
                  required
                />
                <PillButton type="submit" variant="navy" className="mt-1">
                  SAVE {TIER_LABELS[tier]}
                </PillButton>
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
