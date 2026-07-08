"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionAccount } from "@/lib/auth";
import { adjustCurrentGameCap, toggleCurrentGame, updateGameDetails } from "@/lib/games";
import { setAccountAdmin, setAccountPassword } from "@/lib/accounts";

async function requireAdmin() {
  const account = await getSessionAccount();
  if (!account) redirect("/login");
  if (!account.is_admin) redirect("/");
  return account;
}

function revalidateGameScreens() {
  revalidatePath("/admin/game");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function toggleGameAction() {
  await requireAdmin();
  await toggleCurrentGame();
  revalidateGameScreens();
}

export async function updateGameAction(formData: FormData) {
  await requireAdmin();
  await updateGameDetails({
    gameDate: String(formData.get("gameDate") || ""),
    gameTime: String(formData.get("gameTime") || ""),
    location: String(formData.get("location") || ""),
  });
  revalidateGameScreens();
}

export async function capUpAction() {
  await requireAdmin();
  await adjustCurrentGameCap(1);
  revalidateGameScreens();
}

export async function capDownAction() {
  await requireAdmin();
  await adjustCurrentGameCap(-1);
  revalidateGameScreens();
}

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
