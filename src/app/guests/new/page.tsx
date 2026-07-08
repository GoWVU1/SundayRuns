import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { getNextVisibleGame } from "@/lib/games";
import { getMonthlyGuestAllowanceRemaining, listMyGuestRequests } from "@/lib/guests";
import { canSponsorGuest } from "@/lib/tiers";
import { formatGameDateTime } from "@/lib/time";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/Card";
import { Ring } from "@/components/Ring";
import { GuestRequestForm } from "@/components/GuestRequestForm";
import { memberNavItems } from "@/lib/nav";

const STATUS_STYLE: Record<string, string> = {
  pending: "#8a6a00",
  approved: "#15803d",
  denied: "#b3261e",
};

export default async function NewGuestRequestPage() {
  const account = await requireAccount();
  if (!canSponsorGuest(account.tier)) redirect("/");

  const [next, remaining, myRequests] = await Promise.all([
    getNextVisibleGame(account),
    getMonthlyGuestAllowanceRemaining(account.id),
    listMyGuestRequests(account.id),
  ]);

  return (
    <>
      <Header title="BRING A GUEST" backHref="/" />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-5">
          <Card tone="dark" className="flex items-center gap-4">
            <Ring fraction={remaining / 2} size={76} thickness={7}>
              <span className="font-display text-xl leading-none text-gold">{remaining}/2</span>
            </Ring>
            <div className="flex flex-col gap-0.5">
              <span className="font-display text-[13px] tracking-wide text-cream">GUEST INVITES LEFT</span>
              <span className="text-[11px] leading-relaxed text-muted-navy">
                Resets on the 1st. Every guest needs the commissioner&apos;s approval.
              </span>
            </div>
          </Card>

          {!next && (
            <Card tone="light" className="py-6 text-center text-xs text-muted">
              No upcoming game to invite someone to yet.
            </Card>
          )}

          {next && <GuestRequestForm gameId={next.game.id} remaining={remaining} />}

          <div className="mt-1 flex items-center gap-2.5">
            <span className="font-display text-[15px] tracking-wide text-navy">YOUR REQUESTS</span>
            <div className="h-0.5 flex-1 bg-navy" />
          </div>

          <div className="overflow-hidden rounded-2xl border-[1.5px] border-navy/30 bg-card">
            {myRequests.length === 0 && (
              <div className="px-3.5 py-4 text-center text-xs text-muted">No requests yet.</div>
            )}
            {myRequests.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 border-b border-navy/10 px-3.5 py-3 last:border-b-0"
              >
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-sm font-bold text-navy">{r.guest_name}</span>
                  <span className="text-[11px] text-muted">{formatGameDateTime(r.decided_at ?? r.requested_at)}</span>
                </div>
                <span
                  className="rounded-full border px-2.5 py-1 text-[9px] font-extrabold tracking-wide"
                  style={{ borderColor: STATUS_STYLE[r.status], color: STATUS_STYLE[r.status] }}
                >
                  {r.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
      <BottomNav items={memberNavItems(account, "GUESTS")} />
    </>
  );
}
