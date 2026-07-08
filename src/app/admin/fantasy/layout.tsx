import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";

// admin/layout.tsx already enforces is_admin. Fantasy membership is independent
// of is_admin (see src/proxy.ts) — an admin who isn't personally in the league
// shouldn't manage it either.
export default async function AdminFantasyLayout({ children }: { children: React.ReactNode }) {
  const account = await requireAccount();
  if (!account.fantasy_member) redirect("/admin");
  return <>{children}</>;
}
