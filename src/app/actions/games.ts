"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { localInputToUtc } from "@/lib/time";
import { isRankedTier, type RankedTier } from "@/lib/tiers";
import {
  createGame,
  deleteGame,
  setTierUnlockOffset,
  toggleGameOpen,
  updateGame,
  updateGameTemplate,
  windowToUnlockOffset,
  type GameVisibility,
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
  return {
    startsAt: localInputToUtc(String(formData.get("startsAt") || "")),
    location: String(formData.get("location") || ""),
    address: String(formData.get("address") || ""),
    cap,
    isOpen: formData.get("isOpen") === "true",
    visibility,
    visibleTiers: formData.getAll("visibleTiers").map(String).filter(isRankedTier) as RankedTier[],
    visibleAccountIds: formData.getAll("visibleAccountIds").map(String),
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

export async function setTierUnlockOffsetAction(formData: FormData) {
  await requireAdmin();
  const tier = String(formData.get("tier") || "");
  if (!isRankedTier(tier)) return;

  const daysBefore = Number(formData.get("daysBefore")) || 0;
  const [hh, mm] = String(formData.get("time") || "18:00").split(":").map(Number);
  const timeMinutes = (hh || 0) * 60 + (mm || 0);

  await setTierUnlockOffset(tier, windowToUnlockOffset(daysBefore, timeMinutes));
  revalidatePath("/admin/games/windows");
  revalidatePath("/");
}

export async function updateGameTemplateAction(formData: FormData) {
  await requireAdmin();
  const slotRaw = Number(formData.get("slot"));
  if (slotRaw !== 1 && slotRaw !== 2) return;

  const rawCap = Number(formData.get("cap"));
  const cap = Number.isFinite(rawCap) ? Math.max(1, Math.min(50, Math.round(rawCap))) : 16;

  await updateGameTemplate({
    slot: slotRaw,
    name: String(formData.get("name") || "").trim() || `Template ${slotRaw}`,
    location: String(formData.get("location") || ""),
    address: String(formData.get("address") || ""),
    cap,
    visibility: (String(formData.get("visibility") || "standard") as GameVisibility),
    visibleTiers: formData.getAll("visibleTiers").map(String).filter(isRankedTier) as RankedTier[],
  });
  revalidatePath("/admin/games");
  revalidatePath("/admin/games/new");
}
