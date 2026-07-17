import Link from "next/link";
import { requireAccount } from "@/lib/auth";
import { getInitials } from "@/lib/accounts";
import { getAccountAttendanceSummary } from "@/lib/attendance";
import { getGuestsBroughtCount } from "@/lib/guests";
import { getLatestChampionAccountId } from "@/lib/fantasy";
import { hasActiveSubscription } from "@/lib/push";
import { canViewGoatTags, getGoatAccountIds } from "@/lib/goat";
import { TIER_LABELS, isRankedTier } from "@/lib/tiers";
import { formatMonthYear } from "@/lib/time";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { TagSubmitButton } from "@/components/SubmitButton";
import { PushOptIn } from "@/components/PushOptIn";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";
import { DeleteAccountForm } from "@/components/DeleteAccountForm";
import { memberNavItems } from "@/lib/nav";
import { logoutAction } from "@/app/actions/auth";

export default async function AccountPage() {
  const account = await requireAccount();

  const [attendance, guestsBrought, championAccountId, pushSubscribed, goatAccountIds, canSeeGoat] =
    await Promise.all([
      getAccountAttendanceSummary(account.id, 8),
      getGuestsBroughtCount(account.id),
      getLatestChampionAccountId(),
      hasActiveSubscription(account.id),
      getGoatAccountIds(),
      canViewGoatTags(account.id),
    ]);

  const { currentStreak: streakCount, gamesPlayed, noShows, recentWeeks } = attendance;
  const isChampion = account.id === championAccountId;
  const isGoat = canSeeGoat && goatAccountIds.includes(account.id);
  const rankedTier = isRankedTier(account.tier) ? account.tier : "extended";
  const tierLabel = isGoat ? "GOAT" : TIER_LABELS[rankedTier];

  return (
    <>
      <Header title="MY ACCOUNT" backHref="/" />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-[18px] p-5">
          <div className="relative flex flex-col items-center gap-2.5 rounded-2xl border border-gold/30 bg-navy-light px-5 py-[22px] text-center">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-gold bg-navy">
                <span className="font-display text-2xl tracking-wide text-gold">{getInitials(account)}</span>
              </div>
              {isChampion && (
                <div className="absolute -top-2.5 left-1/2 flex h-[21px] w-[26px] -translate-x-1/2 items-center justify-center rounded-[5px] bg-navy-light">
                  <svg width="19" height="16" viewBox="0 0 24 20">
                    <path
                      d="M2 18L2 7L7.5 11.5L12 3L16.5 11.5L22 7L22 18Z"
                      fill="#FFC72C"
                      stroke="#041E42"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
            </div>
            <span className="font-display text-2xl tracking-wide text-cream">{account.name.toUpperCase()}</span>
            <span className="rounded-full bg-gold px-3 py-1 text-[9px] font-extrabold tracking-wide text-navy">
              {tierLabel} MEMBER
            </span>
          </div>

          {account.fantasy_member && (
            <>
              <div className="flex items-center gap-2.5">
                <span className="font-display text-[15px] tracking-wide text-navy">FANTASY LEAGUE</span>
                <div className="h-0.5 flex-1 bg-navy" />
              </div>
              <Link
                href={`/fantasy/champion/${account.id}`}
                className="flex items-center gap-3.5 rounded-2xl border border-gold/30 bg-navy px-4 py-3.5"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gold">
                  <span className="font-display text-base text-navy">$</span>
                </div>
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="font-display text-[15px] text-cream">
                    {isChampion ? "REIGNING LEAGUE CHAMPION" : "MY LIFETIME WINNINGS"}
                  </span>
                  <span className="text-[11px] text-muted-navy">Tap to view your full recap</span>
                </div>
                <span className="text-lg text-gold">›</span>
              </Link>
            </>
          )}

          <div className="flex items-center gap-2.5">
            <span className="font-display text-[15px] tracking-wide text-navy">ATTENDANCE STREAK</span>
            <div className="h-0.5 flex-1 bg-navy" />
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-gold/30 bg-navy-light p-[18px]">
            <div className="flex h-[76px] w-[76px] flex-shrink-0 items-center justify-center rounded-full bg-gold">
              <div className="flex h-[62px] w-[62px] flex-col items-center justify-center rounded-full bg-navy-light">
                <span className="font-display text-2xl leading-none text-gold">{streakCount}</span>
                <span className="text-[7px] font-bold tracking-wide text-muted-navy">WEEKS</span>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <span className="font-display text-[13px] tracking-wide text-cream">CURRENT STREAK</span>
              <div className="flex gap-1">
                {recentWeeks.length === 0 && <span className="text-[10px] text-muted-navy">No games marked yet</span>}
                {recentWeeks.map((present, i) => (
                  <div key={i} className={`h-4 flex-1 rounded ${present ? "bg-gold" : "bg-white/15"}`} />
                ))}
              </div>
              <span className="text-[10px] text-muted-navy">Last {recentWeeks.length || 8} weeks marked</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="font-display text-[15px] tracking-wide text-navy">MY INFO</span>
            <div className="h-0.5 flex-1 bg-navy" />
          </div>
          <div className="overflow-hidden rounded-2xl border-[1.5px] border-navy/30 bg-card">
            <div className="flex items-center gap-3 border-b border-navy/10 px-4 py-[13px]">
              <span className="w-[90px] text-[10px] font-extrabold tracking-wide text-muted">NAME</span>
              <span className="flex-1 text-sm font-semibold text-navy">{account.name}</span>
            </div>
            <div className="flex items-center gap-3 border-b border-navy/10 px-4 py-[13px]">
              <span className="w-[90px] text-[10px] font-extrabold tracking-wide text-muted">PHONE</span>
              <span className="flex-1 text-sm font-semibold text-navy">{account.phone}</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-[13px]">
              <span className="w-[90px] text-[10px] font-extrabold tracking-wide text-muted">MEMBER SINCE</span>
              <span className="flex-1 text-sm font-semibold text-navy">{formatMonthYear(account.created_at)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="font-display text-[15px] tracking-wide text-navy">MY HISTORY</span>
            <div className="h-0.5 flex-1 bg-navy" />
          </div>
          <div className="flex gap-2.5">
            <div className="flex-1 rounded-[14px] border-[1.5px] border-navy/20 bg-card p-3 text-center">
              <span className="block font-display text-2xl text-navy">{gamesPlayed}</span>
              <span className="text-[9px] font-bold tracking-wide text-muted">GAMES PLAYED</span>
            </div>
            <div className="flex-1 rounded-[14px] border-[1.5px] border-navy/20 bg-card p-3 text-center">
              <span className="block font-display text-2xl text-navy">{guestsBrought}</span>
              <span className="text-[9px] font-bold tracking-wide text-muted">GUESTS BROUGHT</span>
            </div>
            <div className="flex-1 rounded-[14px] border-[1.5px] border-navy/20 bg-card p-3 text-center">
              <span className="block font-display text-2xl text-navy">{noShows}</span>
              <span className="text-[9px] font-bold tracking-wide text-muted">NO-SHOWS</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="font-display text-[15px] tracking-wide text-navy">SETTINGS</span>
            <div className="h-0.5 flex-1 bg-navy" />
          </div>
          <PushOptIn alreadySubscribed={pushSubscribed} />
          <ChangePasswordForm />

          <form action={logoutAction} className="mt-1 flex justify-center">
            <TagSubmitButton pendingLabel="SIGNING OUT…" variant="danger" className="w-full py-3">
              SIGN OUT
            </TagSubmitButton>
          </form>

          <DeleteAccountForm />
        </div>
      </main>
      <BottomNav items={await memberNavItems(account, "ACCOUNT")} />
    </>
  );
}
