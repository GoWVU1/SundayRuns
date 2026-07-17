import { notFound } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { getGameById } from "@/lib/games";
import { getAttendanceForGame } from "@/lib/attendance";
import { getGoatAccountIds, canViewGoatTags } from "@/lib/goat";
import { formatGameDateTime } from "@/lib/time";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { TierBadge } from "@/components/TierBadge";
import { ActionSubmitButton } from "@/components/SubmitButton";
import { markAttendanceAction } from "@/app/actions/attendance";

export default async function AdminAttendancePage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = await params;
  const [viewer, game, roster, goatAccountIds] = await Promise.all([
    requireAccount(),
    getGameById(gameId),
    getAttendanceForGame(gameId),
    getGoatAccountIds(),
  ]);
  if (!game) notFound();
  const canSeeGoat = await canViewGoatTags(viewer.id);
  const goatSet = new Set(goatAccountIds);

  return (
    <>
      <Header title={`ATTENDANCE · ${formatGameDateTime(game.starts_at)}`} backHref="/admin" exitHref="/" />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3.5 px-5 pt-[18px] pb-6">
          <span className="text-xs text-muted">
            No-shows and late cancels get logged against an account&apos;s reliability history.
          </span>
          <div className="overflow-hidden rounded-2xl border-[1.5px] border-navy/30 bg-card">
            {roster.length === 0 && (
              <div className="px-3.5 py-4 text-center text-xs text-muted">No confirmed players.</div>
            )}
            {roster.map((p) => (
              <div
                key={p.account_id}
                className="flex items-center gap-3 border-b border-navy/10 px-3.5 py-3 last:border-b-0"
              >
                <div className="flex flex-1 flex-col gap-1">
                  <span className="text-sm font-bold text-navy">{p.name}</span>
                  <TierBadge tier={p.tier} isGoat={canSeeGoat && goatSet.has(p.account_id)} className="w-fit" />
                </div>
                <div className="flex gap-2">
                  <form action={markAttendanceAction}>
                    <input type="hidden" name="gameId" value={gameId} />
                    <input type="hidden" name="accountId" value={p.account_id} />
                    <input type="hidden" name="status" value="present" />
                    <ActionSubmitButton
                      aria-label="Mark present"
                      className={`flex h-[34px] w-[34px] items-center justify-center rounded-full border-[1.5px] border-success ${
                        p.status === "present" ? "bg-success" : "bg-transparent"
                      }`}
                    >
                      <div
                        className="h-[7px] w-3 -translate-y-px rotate-[-45deg] border-b-2 border-l-2"
                        style={{ borderColor: p.status === "present" ? "#f4efe2" : "#15803d" }}
                      />
                    </ActionSubmitButton>
                  </form>
                  <form action={markAttendanceAction}>
                    <input type="hidden" name="gameId" value={gameId} />
                    <input type="hidden" name="accountId" value={p.account_id} />
                    <input type="hidden" name="status" value="no_show" />
                    <ActionSubmitButton
                      aria-label="Mark no-show"
                      className={`relative flex h-[34px] w-[34px] items-center justify-center rounded-full border-[1.5px] border-danger ${
                        p.status === "no_show" ? "bg-danger" : "bg-transparent"
                      }`}
                    >
                      <div className="relative h-3 w-3">
                        <div
                          className="absolute left-0 top-1/2 h-0.5 w-3 -translate-y-1/2 rotate-45"
                          style={{ background: p.status === "no_show" ? "#f4efe2" : "#b3261e" }}
                        />
                        <div
                          className="absolute left-0 top-1/2 h-0.5 w-3 -translate-y-1/2 -rotate-45"
                          style={{ background: p.status === "no_show" ? "#f4efe2" : "#b3261e" }}
                        />
                      </div>
                    </ActionSubmitButton>
                  </form>
                </div>
              </div>
            ))}
          </div>
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
