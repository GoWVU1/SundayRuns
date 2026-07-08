"use server";

import { revalidatePath } from "next/cache";
import { requireAccount, requireAdmin } from "@/lib/auth";
import { assertGameVisible } from "@/lib/games";
import { canSponsorGuest } from "@/lib/tiers";
import { approveGuestRequest, denyGuestRequest, requestGuestInvite } from "@/lib/guests";

export type GuestRequestFormState = { error?: string; success?: boolean };

export async function submitGuestRequestAction(
  _prevState: GuestRequestFormState,
  formData: FormData
): Promise<GuestRequestFormState> {
  const account = await requireAccount();
  if (!canSponsorGuest(account.tier)) return { error: "Only Core and Regular members can invite guests." };

  const gameId = String(formData.get("gameId") || "");
  const guestName = String(formData.get("guestName") || "").trim();
  const guestPhone = String(formData.get("guestPhone") || "").trim();
  if (!guestName) return { error: "Add the guest's name." };
  if (guestPhone.replace(/\D/g, "").length < 10) return { error: "Add a valid phone number." };

  await assertGameVisible(account, gameId);

  const { error } = await requestGuestInvite({
    gameId,
    sponsorAccountId: account.id,
    guestName,
    guestPhone,
  });
  if (error) return { error };

  revalidatePath("/guests/new");
  return { success: true };
}

export async function approveGuestRequestAction(formData: FormData) {
  const admin = await requireAdmin();
  const requestId = String(formData.get("requestId") || "");
  await approveGuestRequest(requestId, admin.id);
  revalidatePath("/admin/guests");
  revalidatePath("/");
}

export async function denyGuestRequestAction(formData: FormData) {
  const admin = await requireAdmin();
  const requestId = String(formData.get("requestId") || "");
  await denyGuestRequest(requestId, admin.id);
  revalidatePath("/admin/guests");
}
