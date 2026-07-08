import { getContractArticles } from "@/lib/fantasy";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { updateContractArticleAction } from "@/app/actions/fantasy";

export default async function AdminFantasyContractPage() {
  const articles = await getContractArticles();

  return (
    <>
      <Header title="EDIT THE CONTRACT" backHref="/admin/fantasy" exitHref="/" />
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
                  {a.body || "[ The full article text hasn't been added yet — paste it in below. ]"}
                </p>
                <form action={updateContractArticleAction} className="flex flex-col gap-2">
                  <input type="hidden" name="articleNumber" value={a.article_number} />
                  <textarea
                    name="body"
                    defaultValue={a.body}
                    rows={5}
                    placeholder="Paste the article text here..."
                    className="w-full rounded-[10px] border border-navy/20 bg-cream p-3 text-xs text-navy outline-none focus:border-navy/50"
                  />
                  <button
                    type="submit"
                    className="self-end rounded-full bg-navy px-4 py-2 text-[11px] font-extrabold tracking-wide text-cream"
                  >
                    SAVE
                  </button>
                </form>
              </div>
            </details>
          ))}
        </div>
      </main>
      <BottomNav
        items={[
          { label: "DASH", href: "/admin", active: false },
          { label: "GAMES", href: "/admin/games", active: false },
          { label: "GUESTS", href: "/admin/guests", active: false },
          { label: "MEMBERS", href: "/admin/members", active: false },
        ]}
      />
    </>
  );
}
