"use server";

import { redirect } from "next/navigation";
import { createAccount, findAccountByPhone, normalizePhone } from "@/lib/accounts";
import { createSession, destroySession, verifyPassword } from "@/lib/auth";

export type AuthFormState = { error?: string };

export async function signupAction(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "");
  const password = String(formData.get("password") || "");

  if (!name) return { error: "Enter your name." };
  if (normalizePhone(phone).length < 10) return { error: "Enter a valid phone number." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };

  const existing = await findAccountByPhone(phone);
  if (existing) return { error: "That phone number is already registered — try logging in instead." };

  const account = await createAccount(name, phone, password);
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
  if (!account) return { error: "No account found for that phone number." };

  const valid = await verifyPassword(password, account.password_hash);
  if (!valid) return { error: "Wrong password." };

  await createSession(account.id);
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
