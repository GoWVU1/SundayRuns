import { redirect } from "next/navigation";
import { getSessionAccount } from "@/lib/auth";
import { getCurrentGame } from "@/lib/games";
import { getRoster } from "@/lib/rsvps";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/Card";
import { Ring } from "@/components/Ring";
import { PillButton, TagButton } from "@/components/Button";
import { claimSpotAction, cancelRsvpAction } from "@/app/actions/rsvp";

export default async function HomePage() {
  const account = await getSessionAccount();
  if (!account) redirect("/login");

  const game = await getCurrentGame();
  const roster = game ? await getRoster(game.id) : [];
  const confirmed = roster.filter((r) => r.status === "confirmed");
  const waitlisted = roster.filter((r) => r.status === "waitlisted");
  const mine = roster.find((r) => r.account_id === account.id) ?? null;

  const cap = game?.cap ?? 16;
  const spotsLeft = Math.max(0, cap - confirmed.length);
  const isFull = confirmed.length >= cap;
  const mySpotNumber =
    mine?.status === "confirmed"
      ? confirmed.findIndex((r) => r.account_id === account.id) + 1
      : null;
  const myWaitlistPosition =
    mine?.status === "waitlisted"
      ? waitlisted.findIndex((r) => r.account_id === account.id) + 1
      : null;

  return (
    <>
      <Header title="SUNDAY RUNS" subtitle="PICKUP BASKETBALL CLUB" />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-[18px] p-5">
          {!game?.is_open && (
            <Card tone="dark" className="flex flex-col items-center gap-2 py-[26px] text-center">
              <span className="font-display text-[22px] text-cream">NO GAME TOGGLED ON YET</span>
              <span className="text-xs leading-relaxed text-muted-navy">
                The commissioner hasn&apos;t opened this week&apos;s run. Check back soon.
              </span>
            </Card>
          )}

          {game?.is_open && !mine && (
            <Card tone="dark">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold tracking-[3px] text-muted-navy">
                  NEXT RUN
                </span>
                <span className="rounded-full bg-gold px-3 py-1 text-[10px] font-extrabold tracking-wide text-navy">
                  GAME ON
                </span>
              </div>
              <div className="mt-2 flex flex-col gap-0.5">
                <span className="font-display text-[26px] tracking-wide text-cream">
                  {game.game_date || "Date TBD"} · {game.game_time || "Time TBD"}
                </span>
                <span className="text-xs text-muted-navy">{game.location || "Location TBD"}</span>
              </div>
              <div className="my-4 h-px bg-gold/20" />
              <div className="flex items-center gap-5">
                <Ring fraction={confirmed.length / cap} size={132} thickness={12}>
                  <span className="font-display text-[38px] leading-none text-gold">
                    {confirmed.length}
                  </span>
                  <span className="text-[9px] font-bold tracking-wide text-muted-navy">OF {cap}</span>
                </Ring>
                <div className="flex flex-col gap-1.5">
                  <span className="font-display text-[15px] tracking-wide text-cream">
                    {isFull ? "Waitlist only — game is full" : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`}
                  </span>
                  <span className="text-xs leading-relaxed text-muted-navy">
                    Your window is open now.
                  </span>
                </div>
              </div>
              <form action={claimSpotAction} className="mt-[18px]">
                <PillButton type="submit">{isFull ? "JOIN WAITLIST" : "CLAIM MY SPOT"}</PillButton>
              </form>
            </Card>
          )}

          {mine?.status === "confirmed" && (
            <Card tone="dark" className="flex flex-col gap-4">
              <div className="flex items-center gap-[18px]">
                <Ring fraction={confirmed.length / cap} size={96} thickness={9}>
                  <span className="font-display text-[22px] leading-none text-gold">
                    {confirmed.length}/{cap}
                  </span>
                </Ring>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-extrabold tracking-[3px] text-muted-navy">
                    YOU&apos;RE IN, {account.name.toUpperCase()}
                  </span>
                  <span className="font-display text-xl leading-none text-cream">
                    SPOT #{mySpotNumber} · {game?.game_date}
                  </span>
                  <span className="text-xs text-muted-navy">
                    {game?.game_time} · {game?.location}
                  </span>
                </div>
              </div>
              <div className="h-px bg-gold/25" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-navy">Can&apos;t make it anymore?</span>
                <form action={cancelRsvpAction}>
                  <TagButton variant="danger" type="submit">
                    GIVE UP MY SPOT
                  </TagButton>
                </form>
              </div>
            </Card>
          )}

          {mine?.status === "waitlisted" && (
            <Card tone="dark" className="flex flex-col gap-3">
              <span className="text-[10px] font-extrabold tracking-[3px] text-muted-navy">
                YOU&apos;RE ON THE WAITLIST
              </span>
              <span className="font-display text-2xl text-cream">POSITION #{myWaitlistPosition}</span>
              <span className="text-xs leading-relaxed text-muted-navy">
                Game is full at {cap}. First to respond when a spot opens gets it.
              </span>
              <form action={cancelRsvpAction}>
                <TagButton variant="danger" type="submit" className="mt-1">
                  LEAVE WAITLIST
                </TagButton>
              </form>
            </Card>
          )}

          <div className="flex items-center gap-2.5">
            <span className="font-display text-[15px] tracking-wide text-navy">CONFIRMED ROSTER</span>
            <div className="h-0.5 flex-1 bg-navy" />
            <span className="text-[11px] font-extrabold text-muted">{confirmed.length}</span>
          </div>

          <div className="overflow-hidden rounded-2xl border-[1.5px] border-navy/30 bg-card">
            {confirmed.length === 0 && (
              <div className="px-3.5 py-4 text-center text-xs text-muted">
                No one&apos;s confirmed yet.
              </div>
            )}
            {confirmed.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-3 border-b border-navy/10 px-3.5 py-[11px] last:border-b-0"
              >
                <span className="w-5 font-display text-[15px] text-[#9c8f6e]">{i + 1}</span>
                <span className="flex-1 text-sm font-semibold text-navy">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
      <BottomNav
        items={[
          { label: "HOME", href: "/", active: true },
          ...(account.is_admin ? [{ label: "ADMIN", href: "/admin", active: false }] : []),
        ]}
      />
    </>
  );
}
