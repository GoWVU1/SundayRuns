"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { markAttendance, applyAutoTierChanges, isGameFullyMarked } from "@/lib/attendance";

export async function markAttendanceAction(formData: FormData) {
  const admin = await requireAdmin();
  const gameId = String(formData.get("gameId") || "");
  const accountId = String(formData.get("accountId") || "");
  const status = String(formData.get("status") || "");
  if (status !== "present" && status !== "no_show") return;

  await markAttendance(gameId, accountId, status, admin.id);
  // Re-evaluate tiers only once this game's whole roster is resolved — there's
  // no cron infrastructure here, so this piggybacks on marking. Running it
  // mid-roster would treat teammates not yet clicked as absent for this game,
  // which could demote someone moments before they'd have been marked present.
  if (await isGameFullyMarked(gameId)) {
    await applyAutoTierChanges();
  }
  revalidatePath(`/admin/attendance/${gameId}`);
  revalidatePath("/admin/attendance");
  revalidatePath("/admin");
  revalidatePath("/admin/members");
  revalidatePath("/account");
  revalidatePath("/");
}
