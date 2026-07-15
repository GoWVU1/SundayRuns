import { listAccounts } from "@/lib/accounts";
import { getInjuries } from "@/lib/injuries";
import { formatShortDate } from "@/lib/time";
import { getTierLabel } from "@/lib/tiers";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { PillSubmitButton, ActionSubmitButton } from "@/components/SubmitButton";
import { setInjuryAction, clearInjuryAction } from "@/app/actions/injuries";

export default async function AdminInjuriesPage() {
  const [accounts, injuries] = await Promise.all([listAccounts(), getInjuries()]);

  return (
    <>
      <Header title="INJURED LIST" backHref="/admin" exitHref="/" />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-5">
          <form
            action={setInjuryAction}
            className="flex flex-col gap-3 rounded-2xl border-[1.5px] border-gold/60 bg-card p-4"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-extrabold tracking-wide text-navy">ADD / UPDATE INJURY</span>
              <span className="text-[10px] text-muted">
                Saving again for the same member overwrites their existing entry.
              </span>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-extrabold tracking-[2px] text-muted">MEMBER</span>
              <select
                name="accountId"
                required
                className="w-full rounded-[10px] border border-navy/20 bg-cream px-3.5 py-3 text-sm text-navy outline-none"
              >
                <option value="">Select a member</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({getTierLabel(a.tier)})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-extrabold tracking-[2px] text-muted">INJURY</span>
              <input
                name="description"
                required
                placeholder="e.g. Sprained ankle"
                className="w-full rounded-[10px] border border-navy/20 bg-cream px-3.5 py-3 text-sm text-navy outline-none"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-extrabold tracking-[2px] text-muted">
                EXPECTED RETURN (OPTIONAL)
              </span>
              <input
                name="expectedReturn"
                type="date"
                className="w-full rounded-[10px] border border-navy/20 bg-cream px-3.5 py-3 text-sm text-navy outline-none"
              />
            </label>
            <PillSubmitButton pendingLabel="SAVING…" variant="navy">
              SAVE
            </PillSubmitButton>
          </form>

          <div className="flex flex-col gap-3.5 rounded-2xl border-[1.5px] border-navy/20 bg-card p-4">
            <span className="text-xs font-extrabold tracking-wide text-navy">
              CURRENTLY ON IL ({injuries.length})
            </span>
            {injuries.length === 0 ? (
              <span className="text-[11px] text-muted">Nobody&apos;s out right now.</span>
            ) : (
              injuries.map((entry) => (
                <div
                  key={entry.account_id}
                  className="flex items-center gap-3 border-t border-navy/10 pt-3 first:border-t-0 first:pt-0"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-bold text-navy">{entry.name}</span>
                    <span className="text-[11px] text-muted">{entry.description}</span>
                    <span className="text-[10px] text-muted">
                      {entry.expected_return
                        ? `Back ${formatShortDate(entry.expected_return)}`
                        : "Return TBD"}{" "}
                      · out since {formatShortDate(entry.started_at)}
                    </span>
                  </div>
                  <form action={clearInjuryAction}>
                    <input type="hidden" name="accountId" value={entry.account_id} />
                    <ActionSubmitButton
                      pendingLabel="…"
                      className="flex-shrink-0 rounded-full border border-danger px-3 py-1.5 text-[10px] font-extrabold tracking-wide text-danger"
                    >
                      CLEAR
                    </ActionSubmitButton>
                  </form>
                </div>
              ))
            )}
          </div>
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
