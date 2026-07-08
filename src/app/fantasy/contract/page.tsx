import { requireAccount } from "@/lib/auth";
import { getContractArticles } from "@/lib/fantasy";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { memberNavItems } from "@/lib/nav";

export default async function FantasyContractPage() {
  const account = await requireAccount();
  const articles = await getContractArticles();

  return (
    <>
      <Header title="THE CONTRACT" backHref="/fantasy" />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1 text-center">
            <span className="font-display text-lg tracking-wide text-navy">
              SUNDAY RUNS — RULES AND REGULATIONS 2.0
            </span>
            <span className="text-[11px] text-muted">Ratified by the league · binding until amended</span>
          </div>

          {articles.map((a) => (
            <details
              key={a.article_number}
              className="overflow-hidden rounded-2xl border-[1.5px] border-navy/30 bg-card [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5">
                <span className="text-sm font-bold text-navy">{a.title}</span>
                <span className="text-navy">›</span>
              </summary>
              <div className="flex flex-col gap-3 border-t border-navy/10 px-4 py-3.5">
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted">
                  {a.body || "[ The full article text hasn't been added yet. ]"}
                </p>
              </div>
            </details>
          ))}
        </div>
      </main>
      <BottomNav items={await memberNavItems(account, "FANTASY")} />
    </>
  );
}
