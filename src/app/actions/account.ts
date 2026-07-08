"use server";

import { requireAccount, verifyPassword } from "@/lib/auth";
import { setAccountPassword } from "@/lib/accounts";

export type ChangePasswordState = { error?: string; success?: boolean };

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const account = await requireAccount();
  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");

  if (!account.password_hash) return { error: "This account has no password to change." };
  const valid = await verifyPassword(currentPassword, account.password_hash);
  if (!valid) return { error: "Current password is wrong." };
  if (newPassword.length < 6) return { error: "New password must be at least 6 characters." };

  await setAccountPassword(account.id, newPassword);
  return { success: true };
}
