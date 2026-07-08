"use server";

import { revalidatePath } from "next/cache";
import { requireAccount } from "@/lib/auth";
import { assertGameVisible } from "@/lib/games";
import { claimSpot, cancelRsvp } from "@/lib/rsvps";
import { sendWaitlistPromotionPush } from "@/lib/push";

export async function claimSpotAction(formData: FormData) {
  const account = await requireAccount();
  const gameId = String(formData.get("gameId") || "");

  const { isClaimable } = await assertGameVisible(account, gameId);
  if (!isClaimable) return;

  await claimSpot(gameId, account.id);
  revalidatePath("/");
}

export async function cancelRsvpAction(formData: FormData) {
  const account = await requireAccount();
  const gameId = String(formData.get("gameId") || "");

  const { game } = await assertGameVisible(account, gameId);
  const { promotedAccountId } = await cancelRsvp(gameId, account.id);
  revalidatePath("/");

  // Sent after the transaction commits — awaited (not fire-and-forget) since
  // Vercel serverless functions aren't guaranteed to keep running post-response.
  if (promotedAccountId) {
    await sendWaitlistPromotionPush(promotedAccountId, game).catch((err) =>
      console.error("Waitlist promotion push failed:", err)
    );
  }
}
