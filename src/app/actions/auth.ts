"use server";

import { redirect } from "next/navigation";
import {
  createAccount,
  findAccountByPhone,
  normalizePhone,
  setAccountPassword,
  setAccountTier,
} from "@/lib/accounts";
import { createSession, destroySession, verifyPassword } from "@/lib/auth";

export type AuthFormState = { error?: string };

export async function signupAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const phone = String(formData.get("phone") || "");
  const password = String(formData.get("password") || "");

  if (!firstName) return { error: "Enter your first name." };
  if (!lastName) return { error: "Enter your last name." };
  if (normalizePhone(phone).length < 10) return { error: "Enter a valid phone number." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };

  const existing = await findAccountByPhone(phone);
  if (existing) {
    // A guest account (invited by a sponsor, no password) claiming their own
    // login for the first time — not a collision, just "activate my account."
    if (existing.tier === "guest" && !existing.password_hash) {
      await setAccountPassword(existing.id, password);
      await setAccountTier(existing.id, "extended");
      await createSession(existing.id);
      redirect("/");
    }
    return { error: "That phone number is already registered — try logging in instead." };
  }

  const account = await createAccount(firstName, lastName, phone, password);
  await createSession(account.id);
  redirect("/");
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const phone = String(formData.get("phone") || "");
  const password = String(formData.get("password") || "");

  const account = await findAccountByPhone(phone);
  if (!account || !account.password_hash) return { error: "No account found for that phone number." };

  const valid = await verifyPassword(password, account.password_hash);
  if (!valid) return { error: "Wrong password." };

  await createSession(account.id);
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
