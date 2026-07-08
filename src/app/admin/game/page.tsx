import { getCurrentGame } from "@/lib/games";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Field } from "@/components/Field";
import { PillButton } from "@/components/Button";
import { capDownAction, capUpAction, toggleGameAction, updateGameAction } from "@/app/actions/admin";

export default async function AdminGamePage() {
  const game = await getCurrentGame();
  const isOpen = game?.is_open ?? false;
  const cap = game?.cap ?? 16;

  return (
    <>
      <Header title="THIS WEEK'S GAME" backHref="/admin" exitHref="/" />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-[18px] p-5">
          <div className="flex items-center justify-between rounded-2xl border border-gold/30 bg-navy-light p-[18px]">
            <div className="flex flex-col gap-0.5">
              <span className="font-display text-[17px] text-cream">GAME STATUS</span>
              <span className="text-[11px] text-muted-navy">
                {isOpen ? "Currently on · RSVPs open" : "Currently off · RSVPs closed"}
              </span>
            </div>
            <form action={toggleGameAction}>
              <button
                type="submit"
                aria-label="Toggle game on or off"
                className={`relative h-[30px] w-[54px] flex-shrink-0 rounded-full border border-gold/40 ${
                  isOpen ? "bg-gold/35" : "bg-white/15"
                }`}
              >
                <div
                  className="absolute top-0.5 h-6 w-6 rounded-full bg-cream transition-all"
                  style={{ left: isOpen ? 26 : 2 }}
                />
              </button>
            </form>
          </div>

          <form
            action={updateGameAction}
            className="flex flex-col gap-3.5 rounded-[20px] border-[1.5px] border-navy/30 bg-card p-[18px]"
          >
            <div className="flex gap-2.5">
              <Field
                label="DATE"
                name="gameDate"
                defaultValue={game?.game_date}
                placeholder="Sat, Jul 11"
                className="flex-1"
              />
              <Field
                label="TIME"
                name="gameTime"
                defaultValue={game?.game_time}
                placeholder="8:00 AM"
                className="flex-1"
              />
            </div>
            <Field
              label="LOCATION"
              name="location"
              defaultValue={game?.location}
              placeholder="Lincoln Park · Court #2"
            />
            <PillButton type="submit" variant="navy" className="mt-1">
              SAVE DETAILS
            </PillButton>
          </form>

          <div className="flex flex-col gap-2 rounded-[20px] border-[1.5px] border-navy/30 bg-card p-[18px]">
            <label className="text-[10px] font-extrabold tracking-[2px] text-muted">CAP</label>
            <div className="flex items-center justify-center gap-[22px] rounded-[14px] border border-navy/20 bg-cream p-2.5">
              <form action={capDownAction}>
                <button
                  type="submit"
                  disabled={cap <= 14}
                  className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-navy font-display text-xl text-cream disabled:opacity-40"
                >
                  −
                </button>
              </form>
              <span className="font-display text-[32px] text-navy">{cap}</span>
              <form action={capUpAction}>
                <button
                  type="submit"
                  disabled={cap >= 17}
                  className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-navy font-display text-xl text-cream disabled:opacity-40"
                >
                  +
                </button>
              </form>
            </div>
            <span className="text-center text-[11px] text-muted">Adjustable 14–17</span>
          </div>
        </div>
      </main>
      <BottomNav
        items={[
          { label: "DASH", href: "/admin", active: false },
          { label: "GAME", href: "/admin/game", active: true },
          { label: "MEMBERS", href: "/admin/members", active: false },
        ]}
      />
    </>
  );
}
