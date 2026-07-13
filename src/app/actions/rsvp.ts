"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
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
  const { promotedAccountId, blocked } = await cancelRsvp(gameId, account.id);
  if (blocked) return;
  revalidatePath("/");

  // The roster response should not wait on an external push service. Next's
  // after() keeps the Vercel invocation alive while sending post-response.
  if (promotedAccountId) {
    after(async () => {
      await sendWaitlistPromotionPush(promotedAccountId, game).catch((err) =>
        console.error("Waitlist promotion push failed:", err)
      );
    });
  }
}
