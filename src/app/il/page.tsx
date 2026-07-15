import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { getInjuries, canViewIL } from "@/lib/injuries";
import { formatShortDate } from "@/lib/time";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { TierBadge } from "@/components/TierBadge";
import { memberNavItems } from "@/lib/nav";

export default async function InjuredListPage() {
  const account = await requireAccount();
  if (!(await canViewIL(account))) redirect("/");
  const injuries = await getInjuries();

  return (
    <>
      <Header title="INJURED LIST" subtitle="WHO'S OUT AND WHEN THEY'RE BACK" />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3.5 p-5">
          {injuries.length === 0 && (
            <div className="rounded-2xl border-[1.5px] border-navy/20 bg-card px-4 py-8 text-center text-xs text-muted">
              Nobody&apos;s on the IL right now.
            </div>
          )}
          {injuries.map((entry) => (
            <div
              key={entry.account_id}
              className="flex flex-col gap-1.5 rounded-2xl border-[1.5px] border-navy/20 bg-card p-4"
            >
              <div className="flex items-center gap-2">
                <span className="flex-1 truncate text-sm font-bold text-navy">{entry.name}</span>
                <TierBadge tier={entry.tier} />
              </div>
              <span className="text-xs text-muted">{entry.description}</span>
              <span className="text-[10px] font-extrabold tracking-wide text-danger">
                {entry.expected_return ? entry.expected_return.toUpperCase() : "TIMELINE TBD"}
                <span className="ml-2 font-normal normal-case tracking-normal text-muted">
                  out since {formatShortDate(entry.started_at)}
                </span>
              </span>
            </div>
          ))}
        </div>
      </main>
      <BottomNav items={await memberNavItems(account, "IL")} />
    </>
  );
}
