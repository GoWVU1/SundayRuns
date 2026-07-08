import { getGameTemplates } from "@/lib/games";
import { TIER_ORDER, TIER_LABELS } from "@/lib/tiers";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Field } from "@/components/Field";
import { PillButton } from "@/components/Button";
import { updateGameTemplateAction } from "@/app/actions/games";

export default async function GameTemplatesPage() {
  const templates = await getGameTemplates();

  return (
    <>
      <Header title="QUICK-CREATE TEMPLATES" backHref="/admin/games" exitHref="/" />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-5">
          <span className="-mt-1 text-[11px] text-muted">
            These pre-fill the &quot;new game&quot; form — location, address, cap, and visibility only. Date/time is
            always set when you create the game.
          </span>
          {templates.map((t) => (
            <form
              key={t.slot}
              action={updateGameTemplateAction}
              className="flex flex-col gap-3 rounded-2xl border-[1.5px] border-navy/30 bg-card p-4"
            >
              <input type="hidden" name="slot" value={t.slot} />
              <Field label="TEMPLATE NAME" name="name" defaultValue={t.name} />
              <Field
                label="GYM / LOCATION NAME"
                name="location"
                defaultValue={t.location}
                placeholder="Lincoln Park · Court #2"
              />
              <Field
                label="ADDRESS"
                name="address"
                defaultValue={t.address}
                placeholder="123 Main St, Anytown, ST 12345"
              />
              <Field label="CAP" name="cap" type="number" min={1} max={50} defaultValue={t.cap} required />

              <div className="group flex flex-col gap-3">
                <label className="text-[10px] font-extrabold tracking-[2px] text-muted">VISIBILITY</label>
                <div className="flex gap-2.5">
                  <label className="flex-1 cursor-pointer rounded-[14px] border-[1.5px] border-navy/25 bg-cream p-3 text-center has-[:checked]:border-navy has-[:checked]:bg-navy has-[:checked]:text-cream">
                    <input
                      type="radio"
                      name="visibility"
                      value="standard"
                      defaultChecked={t.visibility !== "restricted"}
                      className="sr-only"
                    />
                    <span className="text-xs font-extrabold tracking-wide">STANDARD</span>
                  </label>
                  <label className="flex-1 cursor-pointer rounded-[14px] border-[1.5px] border-navy/25 bg-cream p-3 text-center has-[:checked]:border-navy has-[:checked]:bg-navy has-[:checked]:text-cream">
                    <input
                      type="radio"
                      name="visibility"
                      value="restricted"
                      defaultChecked={t.visibility === "restricted"}
                      className="sr-only"
                    />
                    <span className="text-xs font-extrabold tracking-wide">RESTRICTED</span>
                  </label>
                </div>

                <div className="hidden flex-col gap-2 group-has-[input[value=restricted]:checked]:flex">
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
                          defaultChecked={t.visible_tiers.includes(tier)}
                          className="sr-only"
                        />
                        <span className="text-[11px] font-extrabold tracking-wide">{TIER_LABELS[tier]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <PillButton type="submit" variant="navy" className="mt-1">
                SAVE TEMPLATE {t.slot}
              </PillButton>
            </form>
          ))}
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
