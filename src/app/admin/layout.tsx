import { requireAdmin } from "@/lib/auth";

// Every admin route is authenticated and database-backed. Make that explicit
// so Next/Vercel never tries to execute admin queries during static generation.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <>{children}</>;
}
