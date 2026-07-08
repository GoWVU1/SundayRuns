import Link from "next/link";
import { getLatestStandings, getCurrentLoser } from "@/lib/fantasy";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { StandingsAdminForm } from "@/components/fantasy/StandingsAdminForm";

const MEDAL_STYLE: Record<number, { bg: string; color: string; label: string }> = {
  1: { bg: "#FFC72C", color: "#041E42", label: "CHAMPION" },
  2: { bg: "#c7ccd6", color: "#041E42", label: "RUNNER-UP" },
  3: { bg: "#c98a4b", color: "#f4efe2", label: "THIRD PLACE" },
};

export default async function AdminFantasyPage() {
  const [{ year, standings }, currentLoser] = await Promise.all([getLatestStandings(), getCurrentLoser()]);

  return (
    <>
      <Header title="MANAGE FANTASY" backHref="/admin" exitHref="/" />
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
            return (
              <div
                key={s.place}
                className="flex items-center gap-3.5 rounded-2xl border-[1.5px] border-navy/30 bg-card px-4 py-3.5"
              >
                <div
                  className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-full"
                  style={{ background: medal?.bg }}
                >
                  <span className="font-display text-xl" style={{ color: medal?.color }}>
                    {s.place}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[15px] font-bold text-navy">{s.name}</span>
                  <span className="text-[10px] font-extrabold tracking-wide text-muted">{medal?.label}</span>
                </div>
                <span className="font-display text-[22px] text-navy">
                  ${Number(s.payout_usd).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
            );
          })}

          <StandingsAdminForm defaultYear={year ?? new Date().getUTCFullYear()} />

          <div className="mt-1 flex items-center gap-2.5">
            <span className="font-display text-[15px] tracking-wide text-navy">THE OTHER END</span>
            <div className="h-0.5 flex-1 bg-navy" />
          </div>

          <Link
            href="/admin/fantasy/loser"
            className="flex items-center gap-3.5 rounded-2xl border border-gold/30 bg-navy px-4 py-3.5 text-left"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gold">
              <span className="font-display text-base text-navy">L</span>
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="font-display text-[15px] text-cream">MANAGE LEAGUE LOSER</span>
              <span className="text-[11px] text-muted-navy">
                {currentLoser ? `${currentLoser.loser_name} is on the clock` : "Nobody's currently on the clock"}
              </span>
            </div>
            <span className="text-lg text-gold">›</span>
          </Link>

          <Link
            href="/admin/fantasy/contract"
            className="flex flex-col gap-2.5 rounded-[14px] border-[1.5px] border-navy/25 bg-card p-3.5"
          >
            <div className="h-1 w-[26px] rounded-full bg-gold" />
            <span className="font-display text-[13px] tracking-wide text-navy">EDIT THE CONTRACT</span>
            <span className="text-[10px] text-muted">Rules &amp; Regulations 2.0</span>
          </Link>
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
