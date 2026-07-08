import Link from "next/link";
import { requireAccount } from "@/lib/auth";
import { getCurrentLoser, PUNISHMENTS } from "@/lib/fantasy";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/Card";
import { Ring } from "@/components/Ring";
import { memberNavItems } from "@/lib/nav";

export default async function FantasyLoserPage() {
  const account = await requireAccount();
  const current = await getCurrentLoser();

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
      <Header title="LEAGUE LOSER TRACKER" backHref="/fantasy" />
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

              <div className="flex items-center gap-3 rounded-2xl border-[1.5px] border-navy/25 px-[15px] py-[13px]">
                <span className="font-display text-2xl text-[#8a6a00]">!</span>
                <span className="text-xs leading-relaxed text-muted">
                  Per Section 4.2, the clock keeps running even if nobody&apos;s watching. Per 4.4, next year&apos;s
                  Loser can&apos;t repeat this pick or their own past one.
                </span>
              </div>
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
        </div>
      </main>
      <BottomNav items={await memberNavItems(account, "FANTASY")} />
    </>
  );
}
