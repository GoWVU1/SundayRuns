"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { localInputToUtc } from "@/lib/time";
import { isRankedTier, type RankedTier } from "@/lib/tiers";
import { adminEnrollRsvp, adminRemoveRsvp, type RsvpStatus } from "@/lib/rsvps";
import { sendWaitlistPromotionPush } from "@/lib/push";
import {
  createGame,
  deleteGame,
  getGameById,
  setTierUnlockSetting,
  toggleGameOpen,
  updateGame,
  updateGameTemplate,
  type GameVisibility,
  type GameTierUnlocks,
  type TierUnlockSettings,
} from "@/lib/games";

function revalidateGameScreens() {
  revalidatePath("/admin/games");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function toggleGameOpenAction(formData: FormData) {
  await requireAdmin();
  const gameId = String(formData.get("gameId") || "");
  await toggleGameOpen(gameId);
  revalidateGameScreens();
}

export async function deleteGameAction(formData: FormData) {
  await requireAdmin();
  const gameId = String(formData.get("gameId") || "");
  await deleteGame(gameId);
  revalidateGameScreens();
}

function readGameForm(formData: FormData) {
  const visibility = (String(formData.get("visibility") || "standard") as GameVisibility);
  const rawCap = Number(formData.get("cap"));
  const cap = Number.isFinite(rawCap) ? Math.max(1, Math.min(50, Math.round(rawCap))) : 16;
  const useCustomUnlocks = visibility === "standard" && formData.get("useCustomUnlocks") === "true";
  const tierUnlocks = useCustomUnlocks
    ? Object.fromEntries(
        (["core", "regular", "extended"] as RankedTier[]).map((tier) => [
          tier,
          localInputToUtc(String(formData.get(`unlock-${tier}`) || "")),
        ])
      ) as GameTierUnlocks
    : null;
  return {
    startsAt: localInputToUtc(String(formData.get("startsAt") || "")),
    location: String(formData.get("location") || ""),
    address: String(formData.get("address") || ""),
    cap,
    isOpen: formData.get("isOpen") === "true",
    visibility,
    visibleTiers: formData.getAll("visibleTiers").map(String).filter(isRankedTier) as RankedTier[],
    visibleAccountIds: formData.getAll("visibleAccountIds").map(String),
    tierUnlocks,
  };
}

export async function createGameAction(formData: FormData) {
  const admin = await requireAdmin();
  const fields = readGameForm(formData);
  await createGame({ ...fields, createdBy: admin.id });
  revalidateGameScreens();
  redirect("/admin/games");
}

export async function updateGameAction(formData: FormData) {
  await requireAdmin();
  const gameId = String(formData.get("gameId") || "");
  const fields = readGameForm(formData);
  await updateGame(gameId, fields);
  revalidateGameScreens();
  redirect("/admin/games");
}

export async function adminEnrollRsvpAction(formData: FormData) {
  await requireAdmin();
  const gameId = String(formData.get("gameId") || "");
  const accountId = String(formData.get("accountId") || "");
  const rawStatus = String(formData.get("status") || "confirmed");
  if (!gameId || !accountId || (rawStatus !== "confirmed" && rawStatus !== "waitlisted")) return;
  await adminEnrollRsvp(gameId, accountId, rawStatus as RsvpStatus);
  revalidatePath(`/admin/games/${gameId}`);
  revalidatePath(`/admin/attendance/${gameId}`);
  revalidateGameScreens();
}

export async function adminRemoveRsvpAction(formData: FormData) {
  await requireAdmin();
  const gameId = String(formData.get("gameId") || "");
  const accountId = String(formData.get("accountId") || "");
  if (!gameId || !accountId) return;

  const { promotedAccountId } = await adminRemoveRsvp(gameId, accountId);
  revalidatePath(`/admin/games/${gameId}`);
  revalidatePath(`/admin/attendance/${gameId}`);
  revalidateGameScreens();

  if (promotedAccountId) {
    const game = await getGameById(gameId);
    if (game) {
      after(async () => {
        await sendWaitlistPromotionPush(promotedAccountId, game).catch((err) =>
          console.error("Waitlist promotion push failed:", err)
        );
      });
    }
  }
}

export async function setTierUnlockSettingAction(formData: FormData) {
  await requireAdmin();
  const tier = String(formData.get("tier") || "");
  if (!isRankedTier(tier)) return;

  const daysBefore = Math.max(0, Math.min(14, Math.round(Number(formData.get("daysBefore")) || 0)));
  const time = String(formData.get("time") || "18:00");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return;

  await setTierUnlockSetting(tier, daysBefore, time);
  revalidatePath("/admin/games/windows");
  revalidatePath("/");
}

export async function updateGameTemplateAction(formData: FormData) {
  await requireAdmin();
  const slotRaw = Number(formData.get("slot"));
  if (slotRaw !== 1 && slotRaw !== 2) return;

  const rawCap = Number(formData.get("cap"));
  const cap = Number.isFinite(rawCap) ? Math.max(1, Math.min(50, Math.round(rawCap))) : 16;
  const visibility = (String(formData.get("visibility") || "standard") as GameVisibility);
  const useCustomUnlocks = visibility === "standard" && formData.get("useCustomUnlocks") === "true";
  const tierUnlocks = useCustomUnlocks
    ? Object.fromEntries(
        (["core", "regular", "extended"] as RankedTier[]).map((tier) => {
          const daysBefore = Math.max(
            0,
            Math.min(14, Math.round(Number(formData.get(`daysBefore-${tier}`)) || 0))
          );
          const time = String(formData.get(`time-${tier}`) || "18:00");
          if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error(`Invalid ${tier} unlock time`);
          return [tier, { daysBefore, time }];
        })
      ) as TierUnlockSettings
    : null;

  await updateGameTemplate({
    slot: slotRaw,
    name: String(formData.get("name") || "").trim() || `Template ${slotRaw}`,
    location: String(formData.get("location") || ""),
    address: String(formData.get("address") || ""),
    cap,
    visibility,
    visibleTiers: formData.getAll("visibleTiers").map(String).filter(isRankedTier) as RankedTier[],
    tierUnlocks,
  });
  revalidatePath("/admin/games");
  revalidatePath("/admin/games/new");
}
