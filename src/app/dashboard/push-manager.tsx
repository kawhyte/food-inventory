"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { savePushSubscription } from "./actions";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const bytes = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    bytes[i] = rawData.charCodeAt(i);
  }
  return bytes;
}

export function PushManager() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setEnabled(Notification.permission === "granted");
    }
  }, []);

  async function handleToggle(checked: boolean) {
    if (!checked) {
      setEnabled(false);
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setEnabled(false);
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      await savePushSubscription(sub.toJSON());
      setEnabled(true);
    } catch (err) {
      console.error("Push subscribe failed:", err);
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between px-1 py-2 mt-2 rounded-xl border bg-muted/40">
      <Label htmlFor="push-toggle" className="text-sm cursor-pointer pl-1">
        Push Notifications
      </Label>
      <Switch
        id="push-toggle"
        checked={enabled}
        onCheckedChange={handleToggle}
        disabled={loading}
        className="mr-1"
      />
    </div>
  );
}
