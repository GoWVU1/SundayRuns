"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { setInjury, clearInjury, setIlVisibleAccountIds } from "@/lib/injuries";

export async function setInjuryAction(formData: FormData) {
  await requireAdmin();
  const accountId = String(formData.get("accountId") || "");
  const description = String(formData.get("description") || "").trim();
  const expectedReturn = String(formData.get("expectedReturn") || "").trim();
  if (!accountId || !description) return;

  await setInjury(accountId, description, expectedReturn || null);
  revalidatePath("/il");
  revalidatePath("/admin/il");
}

export async function clearInjuryAction(formData: FormData) {
  await requireAdmin();
  const accountId = String(formData.get("accountId") || "");
  if (!accountId) return;

  await clearInjury(accountId);
  revalidatePath("/il");
  revalidatePath("/admin/il");
}

export async function setIlAccessAction(formData: FormData) {
  await requireAdmin();
  const accountIds = formData.getAll("visibleAccountIds").map(String);
  await setIlVisibleAccountIds(accountIds);
  revalidatePath("/il");
  revalidatePath("/admin/il");
}
