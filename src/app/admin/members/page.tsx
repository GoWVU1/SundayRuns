import { getSessionAccount } from "@/lib/auth";
import { listAccounts } from "@/lib/accounts";
import { getTierGuestAllowances } from "@/lib/guests";
import { TIER_ORDER, TIER_LABELS } from "@/lib/tiers";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MembersList } from "@/components/MembersList";
import { setTierGuestAllowanceAction } from "@/app/actions/guests";

export default async function AdminMembersPage() {
  const [account, accounts, allowances] = await Promise.all([
    getSessionAccount(),
    listAccounts(),
    getTierGuestAllowances(),
  ]);

  // Never let password hashes leave the server boundary.
  const members = accounts.map((a) => ({
    id: a.id,
    name: a.name,
    phone: a.phone,
    is_admin: a.is_admin,
    tier: a.tier,
    fantasy_member: a.fantasy_member,
  }));
  const adminCount = accounts.filter((a) => a.is_admin).length;

  return (
    <>
      <Header title="MEMBERS" backHref="/admin" exitHref="/" />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3.5 px-5 pt-[18px] pb-6">
          <div className="flex flex-col gap-2.5 rounded-2xl border-[1.5px] border-navy/30 bg-card p-4">
            <span className="text-[10px] font-extrabold tracking-[2px] text-muted">
              MONTHLY GUEST ALLOWANCE
            </span>
            <span className="-mt-1 text-[11px] text-muted">0 means that tier can&apos;t bring guests at all.</span>
            {TIER_ORDER.map((tier) => (
              <form
                key={tier}
                action={setTierGuestAllowanceAction}
                className="flex items-center gap-3 rounded-[10px] border border-navy/15 px-3 py-2"
              >
                <input type="hidden" name="tier" value={tier} />
                <span className="flex-1 text-xs font-bold text-navy">{TIER_LABELS[tier]}</span>
                <input
                  type="number"
                  name="monthlyAllowance"
                  min={0}
                  max={20}
                  defaultValue={allowances[tier]}
                  className="w-14 rounded-md border border-navy/20 bg-cream px-2 py-1 text-center text-sm text-navy outline-none focus:border-navy/50"
                />
                <button
                  type="submit"
                  className="rounded-full bg-navy px-3 py-1.5 text-[10px] font-extrabold tracking-wide text-cream"
                >
                  SAVE
                </button>
              </form>
            ))}
          </div>

          <MembersList members={members} currentAccountId={account?.id ?? ""} adminCount={adminCount} />
        </div>
      </main>
      <BottomNav
        items={[
          { label: "DASH", href: "/admin", active: false },
          { label: "GAMES", href: "/admin/games", active: false },
          { label: "GUESTS", href: "/admin/guests", active: false },
          { label: "MEMBERS", href: "/admin/members", active: true },
        ]}
      />
    </>
  );
}
