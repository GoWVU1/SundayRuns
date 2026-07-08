"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionAccount } from "@/lib/auth";
import { getCurrentGame } from "@/lib/games";
import { claimSpot, cancelRsvp } from "@/lib/rsvps";

export async function claimSpotAction() {
  const account = await getSessionAccount();
  if (!account) redirect("/login");

  const game = await getCurrentGame();
  if (!game || !game.is_open) return;

  await claimSpot(game.id, account.id);
  revalidatePath("/");
}

export async function cancelRsvpAction() {
  const account = await getSessionAccount();
  if (!account) redirect("/login");

  const game = await getCurrentGame();
  if (!game) return;

  await cancelRsvp(game.id, account.id);
  revalidatePath("/");
}
