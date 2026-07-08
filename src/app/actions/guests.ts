"use server";

import { revalidatePath } from "next/cache";
import { requireAccount, requireAdmin } from "@/lib/auth";
import { assertGameVisible } from "@/lib/games";
import { isRankedTier } from "@/lib/tiers";
import {
  approveGuestRequest,
  canSponsorGuest,
  denyGuestRequest,
  getEligibleGuestSponsorLabel,
  requestGuestInvite,
  setTierGuestAllowance,
} from "@/lib/guests";

export type GuestRequestFormState = { error?: string; success?: boolean };

export async function submitGuestRequestAction(
  _prevState: GuestRequestFormState,
  formData: FormData
): Promise<GuestRequestFormState> {
  const account = await requireAccount();
  if (!(await canSponsorGuest(account.tier)))
    return { error: `Only ${await getEligibleGuestSponsorLabel()} members can invite guests.` };

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

export async function setTierGuestAllowanceAction(formData: FormData) {
  await requireAdmin();
  const tier = String(formData.get("tier") || "");
  const monthlyAllowance = Number(formData.get("monthlyAllowance"));
  if (!isRankedTier(tier) || !Number.isFinite(monthlyAllowance)) return;

  await setTierGuestAllowance(tier, Math.max(0, Math.round(monthlyAllowance)));
  revalidatePath("/admin/members");
  revalidatePath("/guests/new");
  revalidatePath("/");
}
