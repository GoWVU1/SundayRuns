"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { localInputToUtc } from "@/lib/time";
import { isRankedTier, type RankedTier } from "@/lib/tiers";
import {
  adjustStandardGameCap,
  createGame,
  deleteGame,
  ensureStandardGame,
  toggleGameOpen,
  updateGame,
  updateGameTemplate,
  updateStandardGame,
  type GameVisibility,
} from "@/lib/games";

function revalidateGameScreens() {
  revalidatePath("/admin/game");
  revalidatePath("/admin/games");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function toggleStandardGameAction() {
  await requireAdmin();
  const game = await ensureStandardGame();
  await toggleGameOpen(game.id);
  revalidateGameScreens();
}

export async function updateStandardGameAction(formData: FormData) {
  await requireAdmin();
  const startsAtInput = String(formData.get("startsAt") || "");
  await updateStandardGame({
    startsAt: localInputToUtc(startsAtInput),
    location: String(formData.get("location") || ""),
  });
  revalidateGameScreens();
}

export async function capUpAction() {
  await requireAdmin();
  await adjustStandardGameCap(1);
  revalidateGameScreens();
}

export async function capDownAction() {
  await requireAdmin();
  await adjustStandardGameCap(-1);
  revalidateGameScreens();
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
    cap,
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
    cap,
    visibility: (String(formData.get("visibility") || "standard") as GameVisibility),
    visibleTiers: formData.getAll("visibleTiers").map(String).filter(isRankedTier) as RankedTier[],
  });
  revalidatePath("/admin/games");
  revalidatePath("/admin/games/new");
}
