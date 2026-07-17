import { listAccounts } from "@/lib/accounts";
import { getGoatAccountIds, getGoatVisibleAccountIds } from "@/lib/goat";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { PillSubmitButton } from "@/components/SubmitButton";
import { AccountMultiSelect } from "@/components/AccountMultiSelect";
import { setGoatTaggedAction, setGoatVisibilityAction } from "@/app/actions/goat";

export default async function AdminGoatPage() {
  const [accounts, goatAccountIds, visibleAccountIds] = await Promise.all([
    listAccounts(),
    getGoatAccountIds(),
    getGoatVisibleAccountIds(),
  ]);

  return (
    <>
      <Header title="GOAT TAG" backHref="/admin" exitHref="/" />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-4 p-5">
          <form
            action={setGoatTaggedAction}
            className="flex flex-col gap-3 rounded-2xl border-[1.5px] border-gold/60 bg-card p-4"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-extrabold tracking-wide text-navy">WHO HAS THE GOAT TAG</span>
              <span className="text-[10px] text-muted">
                Replaces their tier badge with GOAT, wherever it&apos;s shown to someone who can see it.
              </span>
            </div>
            <AccountMultiSelect members={accounts} defaultSelectedIds={goatAccountIds} name="goatAccountIds" />
            <PillSubmitButton pendingLabel="SAVING…" variant="navy">
              SAVE TAGGED
            </PillSubmitButton>
          </form>

          <form
            action={setGoatVisibilityAction}
            className="flex flex-col gap-3 rounded-2xl border-[1.5px] border-navy/20 bg-card p-4"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-extrabold tracking-wide text-navy">WHO CAN SEE THE GOAT TAG</span>
              <span className="text-[10px] text-muted">
                Nobody sees it by default — not even the tagged person, unless they&apos;re picked here too.
              </span>
            </div>
            <AccountMultiSelect members={accounts} defaultSelectedIds={visibleAccountIds} />
            <PillSubmitButton pendingLabel="SAVING…" variant="navy">
              SAVE VIEWERS
            </PillSubmitButton>
          </form>
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
