import { redirect } from "next/navigation";
import { getSessionAccount } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const account = await getSessionAccount();
  if (!account) redirect("/login");
  if (!account.is_admin) redirect("/");
  return <>{children}</>;
}
