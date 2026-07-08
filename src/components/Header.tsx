import Link from "next/link";
import { getSessionAccount } from "@/lib/auth";
import { getInitials } from "@/lib/accounts";
import { getLatestChampionAccountId } from "@/lib/fantasy";
import { AvatarBadge, HeaderMark } from "./Logo";

export async function Header({
  title,
  subtitle,
  tag,
  backHref,
  exitHref,
}: {
  title: string;
  subtitle?: string;
  tag?: string;
  backHref?: string;
  exitHref?: string;
}) {
  const account = exitHref ? null : await getSessionAccount();
  const isChampion = account ? account.id === (await getLatestChampionAccountId()) : false;

  return (
    <div className="flex-shrink-0">
      <div className="flex items-center justify-between bg-navy px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          {backHref && (
            <Link href={backHref} className="mr-0.5 font-display text-[22px] text-gold">
              ←
            </Link>
          )}
          <HeaderMark />
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-[15px] tracking-wide text-cream">{title}</span>
              {tag && (
                <span className="rounded-full bg-gold px-1.5 py-0.5 text-[8px] font-extrabold tracking-wide text-navy">
                  {tag}
                </span>
              )}
            </div>
            {subtitle && (
              <span className="text-[9px] font-bold tracking-[2px] text-muted-navy">{subtitle}</span>
            )}
          </div>
        </div>
        {exitHref ? (
          <Link
            href={exitHref}
            className="rounded-full bg-gold px-3 py-2 text-[10px] font-extrabold tracking-wide text-navy"
          >
            EXIT
          </Link>
        ) : (
          <Link href="/account" aria-label="Account" title="Account">
            <AvatarBadge initials={account ? getInitials(account) : undefined} isChampion={isChampion} />
          </Link>
        )}
      </div>
      <div className="h-1 bg-gold" />
    </div>
  );
}
