"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  getCurrentLoser,
  getOffLimitsPunishments,
  isPunishmentKey,
  markLoserCompleted,
  markLoserStarted,
  pickPunishment,
  setDuesPaid,
  setStanding,
  startNewLoser,
  updateContractArticle,
  updateStandingNarrative,
} from "@/lib/fantasy";

function revalidateFantasy() {
  revalidatePath("/fantasy");
  revalidatePath("/fantasy/loser");
  revalidatePath("/fantasy/punishments");
  revalidatePath("/fantasy/history");
  revalidatePath("/admin/fantasy");
  revalidatePath("/admin/fantasy/loser");
}

export async function setStandingAction(formData: FormData) {
  await requireAdmin();
  const year = Number(formData.get("year"));
  const place = Number(formData.get("place"));
  if (place !== 1 && place !== 2 && place !== 3) return;
  const displayName = String(formData.get("displayName") || "").trim();
  const payoutUsd = Number(formData.get("payoutUsd"));
  if (!displayName || !Number.isFinite(payoutUsd)) return;

  await setStanding({ year, place, displayName, payoutUsd });
  revalidateFantasy();
}

export async function saveChampionRecapAction(formData: FormData) {
  await requireAdmin();
  const year = Number(formData.get("year"));
  const place = Number(formData.get("place"));
  if (place !== 1 && place !== 2 && place !== 3) return;
  const displayName = String(formData.get("displayName") || "").trim();
  const payoutUsd = Number(formData.get("payoutUsd"));
  if (!displayName || !Number.isFinite(payoutUsd)) return;

  await setStanding({ year, place, displayName, payoutUsd });
  await updateStandingNarrative({
    year,
    place,
    record: String(formData.get("record") || "").trim(),
    finalStanding: String(formData.get("finalStanding") || "").trim(),
    clinched: String(formData.get("clinched") || "").trim(),
    mvp: String(formData.get("mvp") || "").trim(),
    note: String(formData.get("note") || "").trim(),
  });
  revalidateFantasy();
  revalidatePath(`/admin/fantasy/champion/${place}`);
}

export async function toggleDuesPaidAction(formData: FormData) {
  await requireAdmin();
  const year = Number(formData.get("year"));
  const accountId = String(formData.get("accountId") || "");
  const paid = formData.get("paid") === "true";
  if (!Number.isFinite(year) || !accountId) return;

  await setDuesPaid(year, accountId, paid);
  revalidateFantasy();
}

export async function startNewLoserAction(formData: FormData) {
  await requireAdmin();
  const year = Number(formData.get("year"));
  const displayName = String(formData.get("displayName") || "").trim();
  if (!displayName || !Number.isFinite(year)) return;

  await startNewLoser({ year, displayName });
  revalidateFantasy();
}

export async function pickPunishmentAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  const punishment = String(formData.get("punishment") || "");
  if (!isPunishmentKey(punishment)) return;

  const current = await getCurrentLoser();
  if (!current || current.id !== id) return;
  const offLimits = await getOffLimitsPunishments(current);
  if (offLimits.some((o) => o.key === punishment)) return; // Section 4.4 — server-side enforced, not just UI-greyed

  await pickPunishment(id, punishment);
  revalidateFantasy();
}

export async function markLoserStartedAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  await markLoserStarted(id);
  revalidateFantasy();
}

export async function markLoserCompletedAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  await markLoserCompleted(id);
  revalidateFantasy();
}

export async function updateContractArticleAction(formData: FormData) {
  await requireAdmin();
  const articleNumber = Number(formData.get("articleNumber"));
  const body = String(formData.get("body") || "");
  if (!Number.isFinite(articleNumber)) return;

  await updateContractArticle(articleNumber, body);
  revalidatePath("/fantasy/contract");
  revalidatePath("/admin/fantasy/contract");
}
