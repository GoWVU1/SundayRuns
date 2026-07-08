import Link from "next/link";
import { requireAccount } from "@/lib/auth";
import { getLatestStandings, getCurrentLoser, getLatestChampionAccountId, getBuyInStatus } from "@/lib/fantasy";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { CrownBadge } from "@/components/CrownBadge";
import { memberNavItems } from "@/lib/nav";

const MEDAL_STYLE: Record<number, { bg: string; color: string; label: string }> = {
  1: { bg: "#FFC72C", color: "#041E42", label: "CHAMPION" },
  2: { bg: "#c7ccd6", color: "#041E42", label: "RUNNER-UP" },
  3: { bg: "#c98a4b", color: "#f4efe2", label: "THIRD PLACE" },
};

export default async function FantasyHubPage() {
  const account = await requireAccount();
  const currentYear = new Date().getUTCFullYear();
  const [{ year, standings }, currentLoser, championAccountId, buyIn] = await Promise.all([
    getLatestStandings(),
    getCurrentLoser(),
    getLatestChampionAccountId(),
    getBuyInStatus(currentYear),
  ]);
  const buyInPaidCount = buyIn.filter((b) => b.paid).length;

  return (
    <>
      <Header title="SUNDAY RUNS" subtitle="SUNDAY RUNS FANTASY LEAGUE" tag="FANTASY" />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-[18px] p-5">
          <div className="flex items-center gap-2.5">
            <span className="font-display text-[15px] tracking-wide text-navy">
              {year ? `${year} SEASON STANDINGS` : "SEASON STANDINGS"}
            </span>
            <div className="h-0.5 flex-1 bg-navy" />
          </div>

          {standings.length === 0 && (
            <div className="py-4 text-center text-xs text-muted">No standings recorded yet.</div>
          )}
          {standings.map((s) => {
            const medal = MEDAL_STYLE[s.place];
            const row = (
              <>
                <div
                  className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-full"
                  style={{ background: medal?.bg }}
                >
                  <span className="font-display text-xl" style={{ color: medal?.color }}>
                    {s.place}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="flex items-center gap-1.5 text-[15px] font-bold text-navy">
                    {s.name}
                    {s.account_id === championAccountId && <CrownBadge />}
                  </span>
                  <span className="text-[10px] font-extrabold tracking-wide text-muted">{medal?.label}</span>
                </div>
                <span className="font-display text-[22px] text-navy">
                  ${Number(s.payout_usd).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                {s.account_id && <span className="text-lg text-navy">›</span>}
              </>
            );
            const rowClass =
              "flex items-center gap-3.5 rounded-2xl border-[1.5px] border-navy/30 bg-card px-4 py-3.5";
            return s.account_id ? (
              <Link key={s.place} href={`/fantasy/champion/${s.account_id}`} className={rowClass}>
                {row}
              </Link>
            ) : (
              <div key={s.place} className={rowClass}>
                {row}
              </div>
            );
          })}
          {standings.some((s) => s.account_id) && (
            <span className="-mt-2 text-center text-[11px] text-muted">
              Tap any row to see that finisher&apos;s season recap
            </span>
          )}
          <span className="text-center text-[11px] text-muted">
            Payout tiers per Article III of the league contract
          </span>

          <div className="mt-1 flex items-center gap-2.5">
            <span className="font-display text-[15px] tracking-wide text-navy">{currentYear} BUY-IN STATUS</span>
            <div className="h-0.5 flex-1 bg-navy" />
            <span className="text-[11px] font-extrabold text-muted">
              {buyInPaidCount}/{buyIn.length}
            </span>
          </div>
          <span className="-mt-2 text-[11px] text-muted">
            Kept public so everyone can see who&apos;s squared up before the draft.
          </span>
          <div className="overflow-hidden rounded-2xl border-[1.5px] border-navy/30 bg-card">
            {buyIn.length === 0 && (
              <div className="px-3.5 py-4 text-center text-xs text-muted">No fantasy members yet.</div>
            )}
            {buyIn.map((b) => (
              <div
                key={b.accountId}
                className="flex items-center gap-3 border-b border-navy/10 px-4 py-[11px] last:border-b-0"
              >
                <span className="flex flex-1 items-center gap-1.5 text-sm font-semibold text-navy">
                  {b.name}
                  {b.accountId === championAccountId && <CrownBadge />}
                </span>
                <span
                  className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[9px] font-extrabold tracking-wide ${
                    b.paid ? "border-success text-success" : "border-danger text-danger"
                  }`}
                >
                  {b.paid ? "PAID" : "UNPAID"}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-1 flex items-center gap-2.5">
            <span className="font-display text-[15px] tracking-wide text-navy">MY FANTASY</span>
            <div className="h-0.5 flex-1 bg-navy" />
          </div>
          <Link
            href={`/fantasy/champion/${account.id}`}
            className="flex items-center gap-3.5 rounded-2xl border-[1.5px] border-navy/30 bg-card px-4 py-3.5"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-navy">
              <span className="font-display text-[15px] text-gold">$</span>
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="font-display text-sm text-navy">MY LIFETIME WINNINGS</span>
              <span className="text-[11px] text-muted">
                Every member can see their own all-time total · not just this year&apos;s top 3
              </span>
            </div>
            <span className="text-lg text-navy">›</span>
          </Link>

          <div className="mt-1 flex items-center gap-2.5">
            <span className="font-display text-[15px] tracking-wide text-navy">THE OTHER END</span>
            <div className="h-0.5 flex-1 bg-navy" />
          </div>

          <Link
            href="/fantasy/loser"
            className="flex items-center gap-3.5 rounded-2xl border border-gold/30 bg-navy px-4 py-3.5 text-left"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gold">
              <span className="font-display text-base text-navy">L</span>
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="font-display text-[15px] text-cream">CURRENT LEAGUE LOSER</span>
              <span className="text-[11px] text-muted-navy">
                {currentLoser ? `${currentLoser.loser_name} is on the clock` : "Nobody's currently on the clock"}
              </span>
            </div>
            <span className="text-lg text-gold">›</span>
          </Link>

          <div className="flex gap-2.5">
            <Link
              href="/fantasy/punishments"
              className="flex flex-1 flex-col gap-2.5 rounded-[14px] border-[1.5px] border-navy/25 bg-card p-3.5"
            >
              <div className="h-1 w-[26px] rounded-full bg-navy" />
              <span className="font-display text-[13px] tracking-wide text-navy">PUNISHMENTS</span>
              <span className="text-[10px] text-muted">5 options, some off-limits</span>
            </Link>
            <Link
              href="/fantasy/contract"
              className="flex flex-1 flex-col gap-2.5 rounded-[14px] border-[1.5px] border-navy/25 bg-card p-3.5"
            >
              <div className="h-1 w-[26px] rounded-full bg-gold" />
              <span className="font-display text-[13px] tracking-wide text-navy">THE CONTRACT</span>
              <span className="text-[10px] text-muted">Rules &amp; Regulations 2.0</span>
            </Link>
          </div>
        </div>
      </main>
      <BottomNav items={await memberNavItems(account, "FANTASY")} />
    </>
  );
}
