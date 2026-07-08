import Link from "next/link";
import { getCurrentLoser, getOffLimitsPunishments, PUNISHMENTS } from "@/lib/fantasy";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/Card";
import { Ring } from "@/components/Ring";
import { PillButton } from "@/components/Button";
import { Field } from "@/components/Field";
import { markLoserCompletedAction, markLoserStartedAction, startNewLoserAction, pickPunishmentAction } from "@/app/actions/fantasy";

export default async function AdminFantasyLoserPage() {
  const current = await getCurrentLoser();
  const offLimits = current ? await getOffLimitsPunishments(current) : [];

  const now = Date.now();
  const determinedAt = current ? new Date(current.loser_determined_at).getTime() : now;
  const daysSince = (now - determinedAt) / (1000 * 60 * 60 * 24);
  const startDaysLeft = Math.max(0, Math.ceil(60 - daysSince));
  const finishDaysLeft = Math.max(0, Math.ceil(330 - daysSince));
  const startFraction = current?.started_at ? 1 : Math.min(1, daysSince / 60);
  const finishFraction = current?.completed_at ? 1 : Math.min(1, daysSince / 330);

  const punishmentLabel = current?.punishment
    ? PUNISHMENTS.find((p) => p.key === current.punishment)?.name
    : "Not yet picked";

  return (
    <>
      <Header title="MANAGE LEAGUE LOSER" backHref="/admin/fantasy" exitHref="/" />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-[18px] p-5">
          {!current && (
            <Card tone="dark" className="py-6 text-center text-xs text-muted-navy">
              Nobody&apos;s currently on the clock.
            </Card>
          )}

          {current && (
            <>
              <Card tone="dark" className="flex flex-col gap-1">
                <span className="text-[10px] font-extrabold tracking-[3px] text-muted-navy">ON THE CLOCK</span>
                <span className="font-display text-[30px] leading-tight text-cream">
                  {current.loser_name.toUpperCase()}
                </span>
                <span className="text-xs text-muted-navy">
                  Picked: <strong className="text-cream">{punishmentLabel}</strong>
                </span>
              </Card>

              <div className="flex gap-3.5">
                <div className="flex flex-1 flex-col items-center gap-2.5 rounded-[18px] border-[1.5px] border-navy/30 bg-card p-4">
                  <Ring
                    fraction={startFraction}
                    size={84}
                    thickness={8}
                    color="#FFC72C"
                    trackColor="rgba(4,30,66,0.12)"
                    innerBg="var(--color-card)"
                  >
                    {current.started_at ? (
                      <span className="font-display text-sm leading-none text-navy">STARTED</span>
                    ) : (
                      <>
                        <span className="font-display text-xl leading-none text-navy">{startDaysLeft}</span>
                        <span className="text-[7px] font-bold tracking-wide text-muted">DAYS LEFT</span>
                      </>
                    )}
                  </Ring>
                  <span className="text-center text-[10px] font-extrabold tracking-wide text-navy">
                    TO START
                    <br />
                    (60-DAY LIMIT)
                  </span>
                </div>
                <div className="flex flex-1 flex-col items-center gap-2.5 rounded-[18px] border-[1.5px] border-navy/30 bg-card p-4">
                  <Ring
                    fraction={finishFraction}
                    size={84}
                    thickness={8}
                    color="var(--color-navy)"
                    trackColor="rgba(4,30,66,0.12)"
                    innerBg="var(--color-card)"
                  >
                    {current.completed_at ? (
                      <span className="font-display text-sm leading-none text-navy">DONE</span>
                    ) : (
                      <>
                        <span className="font-display text-xl leading-none text-navy">{finishDaysLeft}</span>
                        <span className="text-[7px] font-bold tracking-wide text-muted">DAYS LEFT</span>
                      </>
                    )}
                  </Ring>
                  <span className="text-center text-[10px] font-extrabold tracking-wide text-navy">
                    TO FINISH
                    <br />
                    (330-DAY LIMIT)
                  </span>
                </div>
              </div>

              <div className="flex gap-2.5">
                <form action={markLoserStartedAction} className="flex-1">
                  <input type="hidden" name="id" value={current.id} />
                  <PillButton type="submit" variant="navy" disabled={!!current.started_at}>
                    {current.started_at ? "STARTED" : "MARK STARTED"}
                  </PillButton>
                </form>
                <form action={markLoserCompletedAction} className="flex-1">
                  <input type="hidden" name="id" value={current.id} />
                  <PillButton type="submit" variant="gold" disabled={!!current.completed_at}>
                    {current.completed_at ? "DONE" : "MARK COMPLETED"}
                  </PillButton>
                </form>
              </div>

              {!current.punishment && (
                <div className="flex flex-col gap-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-display text-[15px] tracking-wide text-navy">PICK THEIR PUNISHMENT</span>
                    <div className="h-0.5 flex-1 bg-navy" />
                  </div>
                  {PUNISHMENTS.map((p) => {
                    const off = offLimits.find((o) => o.key === p.key);
                    const card = (
                      <div
                        className="flex flex-col gap-1.5 rounded-2xl border-[1.5px] p-4"
                        style={{
                          background: off ? "#e9e3d3" : "#fffdf7",
                          borderColor: off ? "rgba(4,30,66,0.15)" : "rgba(4,30,66,0.3)",
                        }}
                      >
                        <div className="flex items-center justify-between gap-2.5">
                          <span className="font-display text-base" style={{ color: off ? "#9c8f6e" : "#041E42" }}>
                            {p.name}
                          </span>
                          <span
                            className="flex-shrink-0 whitespace-nowrap rounded-full border px-2 py-1 text-[8px] font-extrabold tracking-wide"
                            style={{
                              borderColor: off ? "#9c8f6e" : "rgba(4,30,66,0.25)",
                              color: off ? "#9c8f6e" : "#6b6353",
                            }}
                          >
                            {off ? "OFF LIMITS" : "AVAILABLE"}
                          </span>
                        </div>
                        <span className="text-xs leading-relaxed" style={{ color: off ? "#a89f89" : "#6b6353" }}>
                          {p.desc}
                        </span>
                        {off && <span className="text-[10px] italic text-[#a89f89]">{off.reason}</span>}
                      </div>
                    );

                    if (off) return <div key={p.key}>{card}</div>;

                    return (
                      <form key={p.key} action={pickPunishmentAction}>
                        <input type="hidden" name="id" value={current.id} />
                        <input type="hidden" name="punishment" value={p.key} />
                        <button type="submit" className="w-full text-left">
                          {card}
                        </button>
                      </form>
                    );
                  })}
                </div>
              )}
            </>
          )}

          <Link
            href="/fantasy/history"
            className="flex items-center gap-3.5 rounded-2xl border-[1.5px] border-navy/30 bg-card px-4 py-3.5"
          >
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="font-display text-sm text-navy">FULL PUNISHMENT HISTORY</span>
              <span className="text-[11px] text-muted">Every year, who, and whether they finished</span>
            </div>
            <span className="text-lg text-navy">›</span>
          </Link>

          {!current && (
            <form
              action={startNewLoserAction}
              className="flex flex-col gap-3 rounded-[20px] border-[1.5px] border-navy/30 bg-card p-[18px]"
            >
              <span className="text-[10px] font-extrabold tracking-[2px] text-muted">START A NEW LOSER</span>
              <Field label="YEAR" name="year" type="number" defaultValue={new Date().getUTCFullYear()} />
              <Field label="LOSER'S NAME" name="displayName" placeholder="Name" />
              <PillButton type="submit" variant="navy">
                SET CURRENT LOSER
              </PillButton>
            </form>
          )}
        </div>
      </main>
      <BottomNav
        items={[
          { label: "DASH", href: "/admin", active: false },
          { label: "GAMES", href: "/admin/games", active: false },
          { label: "GUESTS", href: "/admin/guests", active: false },
          { label: "MEMBERS", href: "/admin/members", active: false },
        ]}
      />
    </>
  );
}
