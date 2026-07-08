import Link from "next/link";
import { requireAccount } from "@/lib/auth";
import { getNextVisibleGame } from "@/lib/games";
import { getRoster } from "@/lib/rsvps";
import { formatGameDateTime, formatUnlockLabel } from "@/lib/time";
import { TIER_LABELS, isRankedTier } from "@/lib/tiers";
import { canSponsorGuest } from "@/lib/guests";
import { getAttendanceStreaks } from "@/lib/attendance";
import { getLatestChampionAccountId } from "@/lib/fantasy";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/Card";
import { Ring } from "@/components/Ring";
import { PillButton, TagButton } from "@/components/Button";
import { RosterRow } from "@/components/RosterRow";
import { PushOptIn } from "@/components/PushOptIn";
import { ClaimCelebration } from "@/components/ClaimCelebration";
import { AddToCalendar } from "@/components/AddToCalendar";
import { claimSpotAction, cancelRsvpAction } from "@/app/actions/rsvp";
import { hasActiveSubscription } from "@/lib/push";
import { memberNavItems } from "@/lib/nav";

export default async function HomePage() {
  const account = await requireAccount();

  const [next, alreadySubscribed] = await Promise.all([
    getNextVisibleGame(account),
    hasActiveSubscription(account.id),
  ]);
  const game = next?.game ?? null;
  const isClaimable = next?.isClaimable ?? false;
  const windowOpensAt = next?.windowOpensAt ?? null;

  const roster = game ? await getRoster(game.id) : [];
  const confirmed = roster.filter((r) => r.status === "confirmed");
  const waitlisted = roster.filter((r) => r.status === "waitlisted");
  const mine = roster.find((r) => r.account_id === account.id) ?? null;

  const [streaks, championAccountId, canInvite] = await Promise.all([
    getAttendanceStreaks(confirmed.map((r) => r.account_id)),
    getLatestChampionAccountId(),
    canSponsorGuest(account.tier),
  ]);

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

  const rankedTier = isRankedTier(account.tier) ? account.tier : "extended";
  const tierLabel = TIER_LABELS[rankedTier];

  const isOff = !game || !game.is_open;
  const isWindowLocked = !isOff && !mine && !isClaimable;

  return (
    <>
      <Header title="SUNDAY RUNS" subtitle="PICKUP BASKETBALL CLUB" />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-[18px] p-5">
          <PushOptIn alreadySubscribed={alreadySubscribed} />
          {isOff && (
            <Card tone="dark" className="flex flex-col items-center gap-2 py-[26px] text-center">
              <span className="font-display text-[22px] text-cream">NO GAME TOGGLED ON YET</span>
              <span className="text-xs leading-relaxed text-muted-navy">
                The commissioner hasn&apos;t opened this week&apos;s run. Check back soon.
              </span>
            </Card>
          )}

          {isWindowLocked && game && (
            <Card tone="dark">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold tracking-[3px] text-muted-navy">NEXT RUN</span>
                <span className="rounded-full border border-gold/40 px-3 py-1 text-[10px] font-extrabold tracking-wide text-gold">
                  GAME ON
                </span>
              </div>
              <div className="mt-2 flex flex-col gap-0.5">
                <span className="font-display text-[26px] tracking-wide text-cream">
                  {formatGameDateTime(game.starts_at)}
                </span>
                <span className="text-xs text-muted-navy">{game.location || "Location TBD"}</span>
              </div>
              <div className="mt-3">
                <AddToCalendar game={game} />
              </div>
              <div className="my-4 h-px bg-gold/20" />
              <span className="font-display text-lg tracking-wide text-gold">
                YOUR WINDOW OPENS {windowOpensAt ? formatUnlockLabel(windowOpensAt) : "SOON"}
              </span>
              <span className="mt-1.5 block text-xs leading-relaxed text-muted-navy">
                You&apos;re a {tierLabel} member — spots open in priority order.
              </span>
            </Card>
          )}

          {!isOff && !mine && isClaimable && game && (
            <Card tone="dark">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold tracking-[3px] text-muted-navy">NEXT RUN</span>
                <span className="rounded-full bg-gold px-3 py-1 text-[10px] font-extrabold tracking-wide text-navy">
                  GAME ON
                </span>
              </div>
              <div className="mt-2 flex flex-col gap-0.5">
                <span className="font-display text-[26px] tracking-wide text-cream">
                  {formatGameDateTime(game.starts_at)}
                </span>
                <span className="text-xs text-muted-navy">{game.location || "Location TBD"}</span>
              </div>
              <div className="mt-3">
                <AddToCalendar game={game} />
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
                <input type="hidden" name="gameId" value={game.id} />
                <PillButton type="submit">{isFull ? "JOIN WAITLIST" : "CLAIM MY SPOT"}</PillButton>
              </form>
              <div className="mt-2.5 text-center text-[11px] text-muted-navy">
                You&apos;re a <strong className="text-gold">{tierLabel}</strong> member
              </div>
            </Card>
          )}

          {mine?.status === "confirmed" && game && (
            <Card tone="dark" className="flex flex-col gap-4">
              <ClaimCelebration
                gameId={game.id}
                accountId={account.id}
                subline={`Spot #${mySpotNumber} · ${formatGameDateTime(game.starts_at)}`}
              />
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
                    SPOT #{mySpotNumber} · {formatGameDateTime(game.starts_at)}
                  </span>
                  <span className="text-xs text-muted-navy">{game.location}</span>
                </div>
              </div>
              <AddToCalendar game={game} />
              <div className="h-px bg-gold/25" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-navy">Can&apos;t make it anymore?</span>
                <form action={cancelRsvpAction}>
                  <input type="hidden" name="gameId" value={game.id} />
                  <TagButton variant="danger" type="submit">
                    GIVE UP MY SPOT
                  </TagButton>
                </form>
              </div>
            </Card>
          )}

          {mine?.status === "waitlisted" && game && (
            <Card tone="dark" className="flex flex-col gap-3">
              <span className="text-[10px] font-extrabold tracking-[3px] text-muted-navy">
                YOU&apos;RE ON THE WAITLIST
              </span>
              <span className="font-display text-2xl text-cream">POSITION #{myWaitlistPosition}</span>
              <span className="text-xs leading-relaxed text-muted-navy">
                Game is full at {cap}. First to respond when a spot opens gets it.
              </span>
              <AddToCalendar game={game} />
              <form action={cancelRsvpAction}>
                <input type="hidden" name="gameId" value={game.id} />
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
              <RosterRow
                key={p.id}
                num={i + 1}
                name={p.name}
                tier={p.tier}
                sponsorName={p.sponsor_name}
                streak={streaks.get(p.account_id) ?? 0}
                isChampion={p.account_id === championAccountId}
              />
            ))}
          </div>

          {canInvite && (
            <Link
              href="/guests/new"
              className="w-full rounded-full bg-navy py-3 text-center text-xs font-extrabold tracking-wide text-cream"
            >
              INVITE A GUEST
            </Link>
          )}
        </div>
      </main>
      <BottomNav items={await memberNavItems(account, "HOME")} />
    </>
  );
}
