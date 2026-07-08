"use server";

import { requireAccount } from "@/lib/auth";
import { removeSubscription, saveSubscription, type PushSubscriptionJSON } from "@/lib/push";

export async function subscribePushAction(subscription: PushSubscriptionJSON) {
  const account = await requireAccount();
  await saveSubscription(account.id, subscription);
}

export async function unsubscribePushAction(endpoint: string) {
  await requireAccount();
  await removeSubscription(endpoint);
}
