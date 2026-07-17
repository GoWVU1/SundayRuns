import Link from "next/link";
import { requireAccount } from "@/lib/auth";
import { getNextAdminGameSummary } from "@/lib/games";
import { countAccounts } from "@/lib/accounts";
import { listPendingGuestRequests } from "@/lib/guests";
import { getGamesNeedingAttendance } from "@/lib/attendance";
import { getInjuries } from "@/lib/injuries";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";

export default async function AdminDashboardPage() {
  const [account, gameSummary, memberCount, pendingGuests, needingAttendance, injuries] = await Promise.all([
    requireAccount(),
    getNextAdminGameSummary(),
    countAccounts(),
    listPendingGuestRequests(),
    getGamesNeedingAttendance(),
    getInjuries(),
  ]);
  const { game, confirmedCount } = gameSummary;
  const cap = game?.cap ?? 16;

  return (
    <>
      <Header title="SUNDAY RUNS" subtitle="COMMISSIONER VIEW" tag="ADMIN" exitHref="/" />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-[18px] p-5">
          {pendingGuests.length > 0 && (
            <Link
              href="/admin/guests"
              prefetch={false}
              className="flex items-center gap-3.5 rounded-2xl border border-gold/30 bg-navy-light px-4 py-3.5"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gold">
                <span className="font-display text-lg text-navy">{pendingGuests.length}</span>
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="font-display text-[15px] text-cream">GUEST REQUESTS PENDING</span>
                <span className="text-[11px] text-muted-navy">
                  {pendingGuests.map((r) => r.guest_name).join(", ")} waiting on you
                </span>
              </div>
              <span className="text-lg text-gold">›</span>
            </Link>
          )}
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

          <div className="grid grid-cols-2 gap-2.5">
            <Link
              href="/admin/members"
              prefetch={false}
              className="flex flex-col gap-2.5 rounded-[14px] border-[1.5px] border-navy/25 bg-card p-3.5"
            >
              <div className="relative h-5 w-7">
                <div className="absolute left-0 top-0.5 h-4 w-4 rounded-full bg-navy" />
                <div className="absolute left-[11px] top-0.5 h-4 w-4 rounded-full bg-gold" />
              </div>
              <span className="font-display text-[13px] tracking-wide text-navy">MANAGE MEMBERS</span>
              <span className="text-[10px] text-muted">{memberCount} people</span>
            </Link>
            <Link
              href={needingAttendance[0] ? `/admin/attendance/${needingAttendance[0].id}` : "/admin/games"}
              prefetch={false}
              className="flex flex-col gap-2.5 rounded-[14px] border-[1.5px] border-navy/25 bg-card p-3.5"
            >
              <div className="h-5 w-4 border-b-[3px] border-l-[3px] border-navy" style={{ transform: "rotate(-45deg)" }} />
              <span className="font-display text-[13px] tracking-wide text-navy">MARK ATTENDANCE</span>
              <span className="text-[10px] text-muted">
                {needingAttendance.length === 0
                  ? "All caught up"
                  : `${needingAttendance.length} game${needingAttendance.length === 1 ? "" : "s"} need${needingAttendance.length === 1 ? "s" : ""} it`}
              </span>
            </Link>
            <Link
              href="/admin/attendance"
              prefetch={false}
              className="flex flex-col gap-2.5 rounded-[14px] border-[1.5px] border-navy/25 bg-card p-3.5"
            >
              <div className="flex h-5 items-end gap-1">
                <div className="h-2 w-1.5 bg-navy" />
                <div className="h-4 w-1.5 bg-gold" />
                <div className="h-5 w-1.5 bg-navy" />
              </div>
              <span className="font-display text-[13px] tracking-wide text-navy">ATTENDANCE STATS</span>
              <span className="text-[10px] text-muted">Streaks and missed games</span>
            </Link>
            <Link
              href="/admin/il"
              prefetch={false}
              className="flex flex-col gap-2.5 rounded-[14px] border-[1.5px] border-navy/25 bg-card p-3.5"
            >
              <div className="h-5 w-5 rounded-full border-[3px] border-danger" />
              <span className="font-display text-[13px] tracking-wide text-navy">MANAGE IL</span>
              <span className="text-[10px] text-muted">
                {injuries.length === 0 ? "Nobody's out" : `${injuries.length} out right now`}
              </span>
            </Link>
            <Link
              href="/admin/goat"
              prefetch={false}
              className="flex flex-col gap-2.5 rounded-[14px] border-[1.5px] border-navy/25 bg-card p-3.5"
            >
              <div className="h-5 w-5 rounded-full border-[3px] border-gold" />
              <span className="font-display text-[13px] tracking-wide text-navy">GOAT TAG</span>
              <span className="text-[10px] text-muted">Who&apos;s tagged, who can see it</span>
            </Link>
            {account.fantasy_member && (
              <Link
                href="/admin/fantasy"
                prefetch={false}
                className="flex flex-col gap-2.5 rounded-[14px] border-[1.5px] border-navy/25 bg-card p-3.5"
              >
                <div className="h-5 w-5 rounded-full border-[3px] border-navy" />
                <span className="font-display text-[13px] tracking-wide text-navy">MANAGE FANTASY</span>
                <span className="text-[10px] text-muted">Standings, loser, contract</span>
              </Link>
            )}
          </div>
        </div>
      </main>
      <BottomNav
        items={[
          { label: "DASH", href: "/admin", active: true },
          { label: "GAMES", href: "/admin/games", active: false },
          { label: "GUESTS", href: "/admin/guests", active: false },
          { label: "MEMBERS", href: "/admin/members", active: false },
        ]}
      />
    </>
  );
}
