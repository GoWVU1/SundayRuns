"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { isRankedTier } from "@/lib/tiers";
import {
  countAdmins,
  deleteAccount,
  findAccountById,
  setAccountAdmin,
  setAccountFantasyMember,
  setAccountName,
  setAccountPassword,
  setAccountTier,
} from "@/lib/accounts";

export type ResetPasswordState = { error?: string; success?: boolean };

export async function resetPasswordAction(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  await requireAdmin();
  const accountId = String(formData.get("accountId") || "");
  const newPassword = String(formData.get("newPassword") || "");
  if (newPassword.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  await setAccountPassword(accountId, newPassword);
  revalidatePath("/admin/members");
  return { success: true };
}

export async function setAdminAction(formData: FormData) {
  const admin = await requireAdmin();
  const accountId = String(formData.get("accountId") || "");
  const makeAdmin = String(formData.get("makeAdmin") || "") === "true";
  // Guard against a lone admin accidentally locking themselves out.
  if (accountId === admin.id && !makeAdmin) return;
  await setAccountAdmin(accountId, makeAdmin);
  revalidatePath("/admin/members");
}

export async function setTierAction(formData: FormData) {
  await requireAdmin();
  const accountId = String(formData.get("accountId") || "");
  const tier = String(formData.get("tier") || "");
  if (!isRankedTier(tier)) return;
  await setAccountTier(accountId, tier);
  revalidatePath("/admin/members");
  revalidatePath("/");
}

export async function setFantasyMemberAction(formData: FormData) {
  await requireAdmin();
  const accountId = String(formData.get("accountId") || "");
  const fantasyMember = String(formData.get("fantasyMember") || "") === "true";
  await setAccountFantasyMember(accountId, fantasyMember);
  revalidatePath("/admin/members");
}

export type SetNicknameState = { error?: string; success?: boolean };

export async function setNicknameAction(
  _prevState: SetNicknameState,
  formData: FormData
): Promise<SetNicknameState> {
  await requireAdmin();
  const accountId = String(formData.get("accountId") || "");
  const nickname = String(formData.get("nickname") || "").trim();
  if (!nickname) return { error: "Nickname can't be empty." };
  if (nickname.length > 40) return { error: "Keep it under 40 characters." };

  await setAccountName(accountId, nickname);
  revalidatePath("/admin/members");
  revalidatePath("/");
  return { success: true };
}

export async function deleteAccountAction(formData: FormData) {
  const admin = await requireAdmin();
  const accountId = String(formData.get("accountId") || "");
  // Self-delete goes through the /account page instead, where you re-enter your password.
  if (!accountId || accountId === admin.id) return;

  const target = await findAccountById(accountId);
  if (!target) return;
  // Never leave the group with zero admins.
  if (target.is_admin && (await countAdmins()) <= 1) return;

  await deleteAccount(accountId);
  revalidatePath("/admin/members");
}
