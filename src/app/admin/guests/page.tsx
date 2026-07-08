import { listPendingGuestRequests, listRecentGuestDecisions } from "@/lib/guests";
import { formatGameDateTime } from "@/lib/time";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { PillButton } from "@/components/Button";
import { approveGuestRequestAction, denyGuestRequestAction } from "@/app/actions/guests";

export default async function AdminGuestsPage() {
  const [pending, recent] = await Promise.all([listPendingGuestRequests(), listRecentGuestDecisions()]);

  return (
    <>
      <Header title="GUEST REQUESTS" backHref="/admin" exitHref="/" />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 px-5 pt-[18px] pb-6">
          <span className="text-xs text-muted">
            Approving adds them straight to the roster under their sponsor&apos;s name.
          </span>

          {pending.length === 0 && (
            <div className="py-6 text-center text-xs text-muted">No pending requests right now.</div>
          )}

          {pending.map((r) => (
            <div
              key={r.id}
              className="flex flex-col gap-3 rounded-2xl border-[1.5px] border-navy/30 bg-card p-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-lg text-navy">{r.guest_name}</span>
                <span className="rounded-full border border-[#8a6a00] px-2.5 py-1 text-[9px] font-extrabold tracking-wide text-[#8a6a00]">
                  PENDING
                </span>
              </div>
              <span className="text-xs leading-relaxed text-muted">
                Sponsored by <strong className="text-navy">{r.sponsor_name}</strong> · {r.guest_phone}
                <br />
                Requested {formatGameDateTime(r.requested_at)}
              </span>
              <div className="flex gap-2.5">
                <form action={approveGuestRequestAction} className="flex-1">
                  <input type="hidden" name="requestId" value={r.id} />
                  <PillButton type="submit" variant="gold">
                    APPROVE
                  </PillButton>
                </form>
                <form action={denyGuestRequestAction} className="flex-1">
                  <input type="hidden" name="requestId" value={r.id} />
                  <button
                    type="submit"
                    className="w-full rounded-full border-[1.5px] border-danger py-4 font-display text-lg tracking-wide text-danger"
                  >
                    DENY
                  </button>
                </form>
              </div>
            </div>
          ))}

          <div className="mt-1 flex items-center gap-2.5">
            <span className="font-display text-[14px] tracking-wide text-navy">RECENT DECISIONS</span>
            <div className="h-px flex-1 bg-navy/20" />
          </div>
          <div className="overflow-hidden rounded-2xl border-[1.5px] border-navy/20 bg-card">
            {recent.length === 0 && (
              <div className="px-3.5 py-3 text-center text-xs text-muted">No decisions yet.</div>
            )}
            {recent.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 border-b border-navy/10 px-3.5 py-[11px] last:border-b-0"
              >
                <span className="flex-1 text-[13px] text-navy">
                  {r.guest_name} · sponsored by {r.sponsor_name}
                </span>
                <span
                  className={`text-[9px] font-extrabold tracking-wide ${
                    r.status === "approved" ? "text-success" : "text-danger"
                  }`}
                >
                  {r.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
      <BottomNav
        items={[
          { label: "DASH", href: "/admin", active: false },
          { label: "GAMES", href: "/admin/games", active: false },
          { label: "GUESTS", href: "/admin/guests", active: true },
          { label: "MEMBERS", href: "/admin/members", active: false },
        ]}
      />
    </>
  );
}
