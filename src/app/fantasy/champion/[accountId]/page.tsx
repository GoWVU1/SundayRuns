import { notFound } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { findAccountById } from "@/lib/accounts";
import { getLatestSeasonRecap, getLifetimeWinnings } from "@/lib/fantasy";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { memberNavItems } from "@/lib/nav";

const HERO_STYLE: Record<number, { label: string; medalBg: string; medalColor: string }> = {
  1: { label: "LEAGUE CHAMPION", medalBg: "#FFC72C", medalColor: "#041E42" },
  2: { label: "RUNNER-UP", medalBg: "#c7ccd6", medalColor: "#041E42" },
  3: { label: "THIRD PLACE", medalBg: "#c98a4b", medalColor: "#f4efe2" },
};

export default async function ChampionRecapPage({ params }: { params: Promise<{ accountId: string }> }) {
  const account = await requireAccount();
  const { accountId } = await params;

  const profile = await findAccountById(accountId);
  if (!profile) notFound();

  const [recap, lifetime] = await Promise.all([getLatestSeasonRecap(accountId), getLifetimeWinnings(accountId)]);
  const hero = recap ? HERO_STYLE[recap.place] : null;
  const isMe = accountId === account.id;

  return (
    <>
      <Header title={hero ? `${recap!.year} ${hero.label}` : "SEASON RECAP"} backHref="/fantasy" />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-[18px] p-5">
          {recap && hero ? (
            <>
              <div className="flex flex-col items-center gap-2.5 rounded-2xl bg-navy px-5 py-8 text-center">
                <div
                  className="flex h-24 w-24 items-center justify-center rounded-full"
                  style={{ background: hero.medalBg }}
                >
                  <div className="flex h-[78px] w-[78px] items-center justify-center rounded-full bg-navy">
                    <span className="font-display text-[34px]" style={{ color: hero.medalBg }}>
                      {recap.place}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold tracking-[3px] text-muted-navy">
                  {recap.year} SEASON
                </span>
                <span className="font-display text-[34px] leading-none tracking-wide text-cream">{hero.label}</span>
                <span className="text-[15px] font-bold text-gold">{recap.name}</span>
              </div>

              <div className="flex gap-2.5">
                <div className="flex-1 rounded-[14px] border-[1.5px] border-navy/20 bg-card p-3.5 text-center">
                  <span className="block font-display text-2xl text-navy">${recap.payoutUsd}</span>
                  <span className="text-[9px] font-bold tracking-wide text-muted">PAYOUT WON</span>
                </div>
                <div className="flex-1 rounded-[14px] border-[1.5px] border-navy/20 bg-card p-3.5 text-center">
                  <span className="block font-display text-2xl text-navy">{recap.record || "—"}</span>
                  <span className="text-[9px] font-bold tracking-wide text-muted">SEASON RECORD</span>
                </div>
                <div className="flex-1 rounded-[14px] border-[1.5px] border-navy/20 bg-card p-3.5 text-center">
                  <span className="block font-display text-2xl text-navy">${lifetime.total}</span>
                  <span className="text-[9px] font-bold tracking-wide text-muted">LIFETIME WINNINGS</span>
                </div>
              </div>

              {(recap.finalStanding || recap.clinched || recap.mvp) && (
                <>
                  <div className="flex items-center gap-2.5">
                    <span className="font-display text-[15px] tracking-wide text-navy">HOW THE SEASON WENT</span>
                    <div className="h-0.5 flex-1 bg-navy" />
                  </div>
                  <div className="overflow-hidden rounded-2xl border-[1.5px] border-navy/30 bg-card">
                    {recap.finalStanding && (
                      <div className="flex items-center gap-3 border-b border-navy/10 px-4 py-[13px]">
                        <span className="w-[100px] text-[10px] font-extrabold tracking-wide text-muted">
                          FINAL STANDING
                        </span>
                        <span className="flex-1 text-sm font-semibold text-navy">{recap.finalStanding}</span>
                      </div>
                    )}
                    {recap.clinched && (
                      <div className="flex items-center gap-3 border-b border-navy/10 px-4 py-[13px]">
                        <span className="w-[100px] text-[10px] font-extrabold tracking-wide text-muted">
                          CLINCHED
                        </span>
                        <span className="flex-1 text-sm font-semibold text-navy">{recap.clinched}</span>
                      </div>
                    )}
                    {recap.mvp && (
                      <div className="flex items-center gap-3 px-4 py-[13px]">
                        <span className="w-[100px] text-[10px] font-extrabold tracking-wide text-muted">MVP</span>
                        <span className="flex-1 text-sm font-semibold text-navy">{recap.mvp}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {recap.note && (
                <div className="flex items-center gap-3 rounded-2xl border-[1.5px] border-navy/25 px-[15px] py-[13px]">
                  <span className="font-display text-2xl text-[#8a6a00]">!</span>
                  <span className="text-xs leading-relaxed text-muted">{recap.note}</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-navy px-5 py-8 text-center">
              <span className="font-display text-2xl tracking-wide text-cream">{profile.name}</span>
              <span className="text-xs text-muted-navy">
                {isMe ? "You didn't" : "Didn't"} finish in the top 3 this season
              </span>
            </div>
          )}

          <div className="flex items-center gap-2.5">
            <span className="font-display text-[15px] tracking-wide text-navy">LIFETIME WINNINGS</span>
            <div className="h-0.5 flex-1 bg-navy" />
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-navy p-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-extrabold tracking-[2px] text-muted-navy">ALL-TIME TOTAL</span>
              <span className="text-[11px] text-muted-navy">Across every Sunday Runs fantasy season</span>
            </div>
            <span className="font-display text-[30px] text-gold">${lifetime.total}</span>
          </div>
          {lifetime.ledger.length === 0 ? (
            <div className="py-4 text-center text-xs text-muted">No winnings on record yet.</div>
          ) : (
            <div className="overflow-hidden rounded-2xl border-[1.5px] border-navy/30 bg-card">
              {lifetime.ledger.map((l) => (
                <div
                  key={l.year}
                  className="flex items-center gap-3 border-b border-navy/10 px-4 py-3 last:border-b-0"
                >
                  <span className="w-11 font-display text-base text-muted">{l.year}</span>
                  <span className="flex-1 text-[13px] font-semibold text-navy">{l.placeLabel}</span>
                  <span className="font-display text-lg text-navy">${l.amount}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav items={await memberNavItems(account, "FANTASY")} />
    </>
  );
}
