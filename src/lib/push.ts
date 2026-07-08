import "server-only";
import webPush from "web-push";
import { sql } from "@/lib/db";
import { formatGameDateTime } from "@/lib/time";
import type { Game } from "@/lib/games";

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT;
const vapidConfigured = Boolean(vapidPublicKey && vapidPrivateKey && vapidSubject);

if (vapidConfigured) {
  webPush.setVapidDetails(vapidSubject!, vapidPublicKey!, vapidPrivateKey!);
}

export type PushSubscriptionJSON = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function saveSubscription(accountId: string, subscription: PushSubscriptionJSON): Promise<void> {
  await sql`
    insert into push_subscriptions (account_id, endpoint, p256dh, auth)
    values (${accountId}, ${subscription.endpoint}, ${subscription.keys.p256dh}, ${subscription.keys.auth})
    on conflict (endpoint) do update set
      account_id = ${accountId}, p256dh = ${subscription.keys.p256dh}, auth = ${subscription.keys.auth}
  `;
}

export async function removeSubscription(endpoint: string): Promise<void> {
  await sql`delete from push_subscriptions where endpoint = ${endpoint}`;
}

export async function hasActiveSubscription(accountId: string): Promise<boolean> {
  const [row] = await sql<{ id: string }[]>`
    select id from push_subscriptions where account_id = ${accountId} limit 1
  `;
  return !!row;
}

/**
 * Fans out to every subscribed device for this account. Called AFTER the RSVP
 * transaction commits (see actions/rsvp.ts) — a network call while holding the
 * game row's `for update` lock would be the wrong shape, and a push failure
 * should never roll back a legitimate waitlist promotion.
 */
export async function sendWaitlistPromotionPush(accountId: string, game: Game): Promise<void> {
  if (!vapidConfigured) return;

  const subs = await sql<{ id: string; endpoint: string; p256dh: string; auth: string }[]>`
    select id, endpoint, p256dh, auth from push_subscriptions where account_id = ${accountId}
  `;
  if (subs.length === 0) return;

  const payload = JSON.stringify({
    title: "You're in!",
    body: `A spot opened up — you're confirmed for ${formatGameDateTime(game.starts_at)}.`,
    url: "/",
  });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Push service says this endpoint is gone — self-heal rather than retry forever.
          await sql`delete from push_subscriptions where id = ${sub.id}`;
        } else {
          console.error("Push send failed:", err);
        }
      }
    })
  );
}
