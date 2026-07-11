"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { markAttendance } from "@/lib/attendance";

export async function markAttendanceAction(formData: FormData) {
  const admin = await requireAdmin();
  const gameId = String(formData.get("gameId") || "");
  const accountId = String(formData.get("accountId") || "");
  const status = String(formData.get("status") || "");
  if (status !== "present" && status !== "no_show") return;

  await markAttendance(gameId, accountId, status, admin.id);
  revalidatePath(`/admin/attendance/${gameId}`);
  revalidatePath("/admin/attendance");
  revalidatePath("/admin");
  revalidatePath("/account");
  revalidatePath("/");
}
