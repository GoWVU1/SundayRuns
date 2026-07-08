"use client";

import { useEffect, useState } from "react";
import { subscribePushAction } from "@/app/actions/push";
import { TagButton } from "@/components/Button";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function PushOptIn({ alreadySubscribed }: { alreadySubscribed: boolean }) {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(alreadySubscribed);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && "serviceWorker" in navigator && "PushManager" in window);
  }, []);

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!supported || subscribed || !publicKey) return null;

  async function handleSubscribe() {
    setWorking(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setWorking(false);
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey as string),
      });
      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) throw new Error("Incomplete subscription");
      await subscribePushAction({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      });
      setSubscribed(true);
    } catch (err) {
      console.error("Push subscribe failed:", err);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-gold/30 bg-navy-light px-4 py-3">
      <span className="text-xs text-muted-navy">Get notified when a spot opens up</span>
      <TagButton type="button" variant="gold" onClick={handleSubscribe} disabled={working}>
        {working ? "…" : "ENABLE"}
      </TagButton>
    </div>
  );
}
