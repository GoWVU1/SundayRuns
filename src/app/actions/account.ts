"use server";

import { redirect } from "next/navigation";
import { destroySession, requireAccount, verifyPassword } from "@/lib/auth";
import { countAdmins, deleteAccount, setAccountPassword } from "@/lib/accounts";

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

export type DeleteAccountState = { error?: string };

export async function deleteOwnAccountAction(
  _prevState: DeleteAccountState,
  formData: FormData
): Promise<DeleteAccountState> {
  const account = await requireAccount();
  const password = String(formData.get("password") || "");

  if (!account.password_hash) return { error: "This account has no password to confirm with." };
  const valid = await verifyPassword(password, account.password_hash);
  if (!valid) return { error: "Wrong password." };
  if (account.is_admin && (await countAdmins()) <= 1) {
    return { error: "You're the only admin — make someone else admin first." };
  }

  await deleteAccount(account.id);
  await destroySession();
  redirect("/login");
}
