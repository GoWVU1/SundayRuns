"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { setGoatAccountIds, setGoatVisibleAccountIds } from "@/lib/goat";

function revalidateGoatSurfaces() {
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
}

export async function setGoatTaggedAction(formData: FormData) {
  await requireAdmin();
  const accountIds = formData.getAll("goatAccountIds").map(String);
  await setGoatAccountIds(accountIds);
  revalidateGoatSurfaces();
}

export async function setGoatVisibilityAction(formData: FormData) {
  await requireAdmin();
  const accountIds = formData.getAll("visibleAccountIds").map(String);
  await setGoatVisibleAccountIds(accountIds);
  revalidateGoatSurfaces();
}
