import Link from "next/link";
import { listUpcomingGames } from "@/lib/games";
import { formatGameDateTime } from "@/lib/time";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { ActionSubmitButton } from "@/components/SubmitButton";
import { deleteGameAction, toggleGameOpenAction } from "@/app/actions/games";

export default async function AdminGamesListPage() {
  const games = await listUpcomingGames();

  return (
    <>
      <Header title="MANAGE GAMES" backHref="/admin" exitHref="/" />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3.5 px-5 pt-[18px] pb-6">
          <Link
            href="/admin/games/new"
            prefetch={false}
            className="w-full rounded-full bg-gold py-4 text-center font-display text-lg tracking-wide text-navy"
          >
            + NEW GAME
          </Link>
          <Link
            href="/admin/games/templates"
            prefetch={false}
            className="w-full rounded-full border border-navy/25 py-2.5 text-center text-[11px] font-extrabold tracking-wide text-navy"
          >
            EDIT QUICK-CREATE TEMPLATES
          </Link>
          <Link
            href="/admin/games/windows"
            prefetch={false}
            className="w-full rounded-full border border-navy/25 py-2.5 text-center text-[11px] font-extrabold tracking-wide text-navy"
          >
            EDIT SIGNUP WINDOWS
          </Link>

          {games.length === 0 && (
            <div className="py-6 text-center text-xs text-muted">No upcoming games yet.</div>
          )}

          {games.map((g) => (
            <div
              key={g.id}
              className="flex flex-col gap-2 rounded-2xl border-[1.5px] border-navy/30 bg-card p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-lg text-navy">{formatGameDateTime(g.starts_at)}</span>
                <span
                  className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[9px] font-extrabold tracking-wide ${
                    g.visibility === "restricted" ? "bg-navy text-cream" : "border border-navy/25 text-muted"
                  }`}
                >
                  {g.visibility === "restricted" ? "RESTRICTED" : "STANDARD"}
                </span>
              </div>
              <span className="text-xs text-muted">{g.location || "Location TBD"} · Cap {g.cap}</span>
              <div className="mt-1.5 flex items-center gap-2">
                <form action={toggleGameOpenAction} className="flex-1">
                  <input type="hidden" name="gameId" value={g.id} />
                  <ActionSubmitButton
                    pendingLabel="SAVING…"
                    className={`w-full rounded-full py-2 text-[11px] font-extrabold tracking-wide ${
                      g.is_open ? "bg-gold text-navy" : "border border-navy/25 text-navy"
                    }`}
                  >
                    {g.is_open ? "OPEN" : "CLOSED"}
                  </ActionSubmitButton>
                </form>
                <Link
                  href={`/admin/games/${g.id}`}
                  prefetch={false}
                  className="flex-1 rounded-full border border-navy/25 py-2 text-center text-[11px] font-extrabold tracking-wide text-navy"
                >
                  EDIT
                </Link>
                <form action={deleteGameAction}>
                  <input type="hidden" name="gameId" value={g.id} />
                  <ConfirmSubmitButton
                    confirmMessage={`Delete the ${formatGameDateTime(g.starts_at)} game? This can't be undone.`}
                    className="rounded-full border border-danger px-3 py-2 text-[11px] font-extrabold text-danger"
                  >
                    DELETE
                  </ConfirmSubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      </main>
      <BottomNav
        items={[
          { label: "DASH", href: "/admin", active: false },
          { label: "GAMES", href: "/admin/games", active: true },
          { label: "GUESTS", href: "/admin/guests", active: false },
          { label: "MEMBERS", href: "/admin/members", active: false },
        ]}
      />
    </>
  );
}
