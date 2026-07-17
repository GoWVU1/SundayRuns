import Link from "next/link";
import { requireAccount } from "@/lib/auth";
import { getAdminAttendanceStats, getGamesNeedingAttendance } from "@/lib/attendance";
import { getGoatAccountIds, canViewGoatTags } from "@/lib/goat";
import { formatGameDateTime } from "@/lib/time";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { TierBadge } from "@/components/TierBadge";

export default async function AdminAttendanceStatsPage() {
  const [viewer, stats, needingAttendance, goatAccountIds] = await Promise.all([
    requireAccount(),
    getAdminAttendanceStats(),
    getGamesNeedingAttendance(),
    getGoatAccountIds(),
  ]);
  const canSeeGoat = await canViewGoatTags(viewer.id);
  const goatSet = new Set(goatAccountIds);

  return (
    <>
      <Header title="ATTENDANCE STATS" backHref="/admin" exitHref="/" />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3.5 px-5 pt-[18px] pb-6">
          {needingAttendance.length > 0 && (
            <Link
              href={`/admin/attendance/${needingAttendance[0].id}`}
              prefetch={false}
              className="rounded-full bg-gold py-3 text-center text-xs font-extrabold tracking-wide text-navy"
            >
              MARK {needingAttendance.length} UNFINISHED GAME{needingAttendance.length === 1 ? "" : "S"}
            </Link>
          )}
          <span className="text-[11px] text-muted">
            Streaks count consecutive marked standard games. Missed games are confirmed roster spots marked no-show.
          </span>

          {stats.map((stat) => (
            <details
              key={stat.accountId}
              className="rounded-2xl border-[1.5px] border-navy/25 bg-card [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate text-sm font-bold text-navy">{stat.name}</span>
                  <TierBadge tier={stat.tier} isGoat={canSeeGoat && goatSet.has(stat.accountId)} className="w-fit" />
                </div>
                <div className="text-center">
                  <span className="block font-display text-xl text-gold">{stat.currentStreak}</span>
                  <span className="text-[8px] font-bold tracking-wide text-muted">STREAK</span>
                </div>
                <div className="text-center">
                  <span className="block font-display text-xl text-navy">{stat.gamesPlayed}</span>
                  <span className="text-[8px] font-bold tracking-wide text-muted">PLAYED</span>
                </div>
                <div className="text-center">
                  <span className={`block font-display text-xl ${stat.missedCount > 0 ? "text-danger" : "text-navy"}`}>
                    {stat.missedCount}
                  </span>
                  <span className="text-[8px] font-bold tracking-wide text-muted">MISSED</span>
                </div>
              </summary>
              <div className="border-t border-navy/10 px-4 py-3">
                {stat.missedGames.length === 0 ? (
                  <span className="text-[11px] text-muted">No missed games.</span>
                ) : (
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-extrabold tracking-[2px] text-muted">MISSED GAMES</span>
                    {stat.missedGames.map((game) => (
                      <Link
                        key={game.gameId}
                        href={`/admin/attendance/${game.gameId}`}
                        prefetch={false}
                        className="flex items-center justify-between gap-3 rounded-[10px] border border-navy/15 px-3 py-2"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-navy">{formatGameDateTime(game.startsAt)}</span>
                          <span className="text-[10px] text-muted">{game.location || "Location TBD"}</span>
                        </div>
                        <span className="text-navy">›</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </details>
          ))}
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
