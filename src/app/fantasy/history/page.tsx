import { requireAccount } from "@/lib/auth";
import { getPunishmentHistory, PUNISHMENTS } from "@/lib/fantasy";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { memberNavItems } from "@/lib/nav";

const STATUS_COLOR: Record<string, string> = {
  COMPLETED: "#15803d",
  "IN PROGRESS": "#8a6a00",
  TBD: "#6b6353",
};

export default async function FantasyHistoryPage() {
  const account = await requireAccount();
  const history = await getPunishmentHistory();

  return (
    <>
      <Header title="PUNISHMENT HISTORY" backHref="/fantasy/loser" />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3.5 px-5 pt-[18px] pb-6">
          <span className="text-xs leading-relaxed text-muted">
            Feeds the off-limits flags on the punishment picker automatically.
          </span>
          <div className="overflow-hidden rounded-2xl border-[1.5px] border-navy/30 bg-card">
            {history.length === 0 && (
              <div className="px-3.5 py-4 text-center text-xs text-muted">No history yet.</div>
            )}
            {history.map((h) => (
              <div
                key={h.year}
                className="flex items-center gap-3 border-b border-navy/10 px-4 py-[13px] last:border-b-0"
              >
                <span className="w-11 flex-shrink-0 font-display text-lg text-muted">{h.year}</span>
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-sm font-bold text-navy">{h.loser_name}</span>
                  <span className="text-[11px] text-muted">
                    {h.punishment ? PUNISHMENTS.find((p) => p.key === h.punishment)?.name : "TBD"}
                  </span>
                </div>
                <span
                  className="flex-shrink-0 text-[9px] font-extrabold tracking-wide"
                  style={{ color: STATUS_COLOR[h.status] }}
                >
                  {h.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
      <BottomNav items={memberNavItems(account, "FANTASY")} />
    </>
  );
}
