/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import { Serwist, type PrecacheEntry } from "serwist";

declare global {
  interface ServiceWorkerGlobalScope {
    __SW_MANIFEST: (PrecacheEntry | string)[];
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

serwist.addEventListeners();

// ---------------------------------------------------------------------------
// Push notification handler
// Fired when the server sends a push message via web-push.
// iOS 16.4+ with the app added to Home Screen is required on Safari/iOS.
// ---------------------------------------------------------------------------

interface PushPayload {
  title: string;
  body: string;
}

self.addEventListener("push", (event: PushEvent) => {
  const payload = event.data?.json() as PushPayload;
  const title = payload?.title ?? "Food Inventory";
  const body = payload?.body ?? "You have items expiring soon.";

  const notifOptions = {
    body,
    icon: "/icon-192x192.png",
    tag: "expiry-reminder",
    renotify: true,
    data: { url: "/dashboard" },
  };
  event.waitUntil(
    self.registration.showNotification(title, notifOptions as unknown as NotificationOptions)
  );
});

// ---------------------------------------------------------------------------
// Notification click handler
// Focuses an existing dashboard tab or opens a new one.
// ---------------------------------------------------------------------------

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const targetUrl =
    (event.notification.data as { url: string })?.url ?? "/dashboard";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url.includes("/dashboard") && "focus" in client) {
            return client.focus();
          }
        }
        return self.clients.openWindow(targetUrl);
      })
  );
});
