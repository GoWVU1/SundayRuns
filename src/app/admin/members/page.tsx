import { getSessionAccount } from "@/lib/auth";
import { listAccounts } from "@/lib/accounts";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { MembersList } from "@/components/MembersList";

export default async function AdminMembersPage() {
  const [account, accounts] = await Promise.all([getSessionAccount(), listAccounts()]);

  // Never let password hashes leave the server boundary.
  const members = accounts.map((a) => ({
    id: a.id,
    name: a.name,
    phone: a.phone,
    is_admin: a.is_admin,
  }));

  return (
    <>
      <Header title="MEMBERS" backHref="/admin" exitHref="/" />
      <main className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3.5 px-5 pt-[18px] pb-6">
          <MembersList members={members} currentAccountId={account?.id ?? ""} />
        </div>
      </main>
      <BottomNav
        items={[
          { label: "DASH", href: "/admin", active: false },
          { label: "GAME", href: "/admin/game", active: false },
          { label: "MEMBERS", href: "/admin/members", active: true },
        ]}
      />
    </>
  );
}
