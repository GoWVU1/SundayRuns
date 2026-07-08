import Link from "next/link";
import { getCurrentGame } from "@/lib/games";
import { getRoster } from "@/lib/rsvps";
import { countAccounts } from "@/lib/accounts";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";

export default async function AdminDashboardPage() {
  const [game, memberCount] = await Promise.all([getCurrentGame(), countAccounts()]);
  const confirmedCount = game ? (await getRoster(game.id)).filter((r) => r.status === "confirmed").length : 0;
  const cap = game?.cap ?? 16;
  const gameStatusHeadline = game?.is_open ? "GAME IS LIVE" : "GAME ISN'T TOGGLED ON";

  return (
    <>
      <Header title="SUNDAY RUNS" subtitle="COMMISSIONER VIEW" tag="ADMIN" exitHref="/" />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-[18px] p-5">
          <Link
            href="/admin/game"
            className="flex items-center gap-3.5 rounded-2xl border border-gold/30 bg-navy-light px-4 py-3.5"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-navy">
              <div
                className={`relative h-[13px] w-6 rounded-full border ${
                  game?.is_open ? "border-gold bg-gold/25" : "border-gold bg-white/15"
                }`}
              >
                <div
                  className="absolute top-[1px] h-[9px] w-[9px] rounded-full bg-gold transition-all"
                  style={{ left: game?.is_open ? 13 : 1 }}
                />
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="font-display text-[15px] text-cream">{gameStatusHeadline}</span>
              <span className="text-[11px] text-muted-navy">Adjust date, time, cap, or flip it on/off</span>
            </div>
            <span className="text-lg text-gold">›</span>
          </Link>

          <div className="flex gap-2.5">
            <div className="flex-1 rounded-[14px] border-[1.5px] border-navy/20 bg-card p-3 text-center">
              <span className="block font-display text-2xl text-navy">{memberCount}</span>
              <span className="text-[9px] font-bold tracking-wide text-muted">MEMBERS</span>
            </div>
            <div className="flex-1 rounded-[14px] border-[1.5px] border-navy/20 bg-card p-3 text-center">
              <span className="block font-display text-2xl text-navy">
                {confirmedCount}/{cap}
              </span>
              <span className="text-[9px] font-bold tracking-wide text-muted">THIS WEEK</span>
            </div>
          </div>

          <div className="mt-1 flex items-center gap-2.5">
            <span className="font-display text-[15px] tracking-wide text-navy">EVERYTHING ELSE</span>
            <div className="h-0.5 flex-1 bg-navy" />
          </div>

          <Link
            href="/admin/members"
            className="flex flex-col gap-2.5 rounded-[14px] border-[1.5px] border-navy/25 bg-card p-3.5"
          >
            <div className="relative h-5 w-7">
              <div className="absolute left-0 top-0.5 h-4 w-4 rounded-full bg-navy" />
              <div className="absolute left-[11px] top-0.5 h-4 w-4 rounded-full bg-gold" />
            </div>
            <span className="font-display text-[13px] tracking-wide text-navy">MANAGE MEMBERS</span>
            <span className="text-[10px] text-muted">{memberCount} people</span>
          </Link>
        </div>
      </main>
      <BottomNav
        items={[
          { label: "DASH", href: "/admin", active: true },
          { label: "GAME", href: "/admin/game", active: false },
          { label: "MEMBERS", href: "/admin/members", active: false },
        ]}
      />
    </>
  );
}
