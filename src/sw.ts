// /// <reference lib="webworker" />
// import { precacheAndRoute } from "workbox-precaching";

// declare let self: ServiceWorkerGlobalScope;

// precacheAndRoute(self.__WB_MANIFEST);

// // ---------- Push notification ----------

// self.addEventListener("push", (event: PushEvent) => {
//     if (!event.data) return;

//     let payload: {
//         title?: string;
//         body?: string;
//         url?: string;
//         icon?: string;
//     } = {};
//     try {
//         payload = event.data.json();
//     } catch {
//         payload = { title: "SurDrive", body: event.data.text() };
//     }

//     const title = payload.title ?? "SurDrive";
//     const options: NotificationOptions = {
//         body: payload.body ?? "",
//         icon: payload.icon ?? "/pwa-192x192.png",
//         badge: "/pwa-192x192.png",
//         data: { url: payload.url ?? "/" },
//     };

//     event.waitUntil(self.registration.showNotification(title, options));
// });

// // Clicking the notification focuses an existing tab if one is open,
// // otherwise opens a new one at the target URL.
// self.addEventListener("notificationclick", (event: NotificationEvent) => {
//     event.notification.close();
//     const targetUrl =
//         (event.notification.data as { url?: string } | undefined)?.url ?? "/";

//     event.waitUntil(
//         self.clients
//             .matchAll({ type: "window", includeUncontrolled: true })
//             .then((clientList) => {
//                 for (const client of clientList) {
//                     if (client.url === targetUrl && "focus" in client) {
//                         return (client as WindowClient).focus();
//                     }
//                 }
//                 if (self.clients.openWindow) {
//                     return self.clients.openWindow(targetUrl);
//                 }
//             }),
//     );
// });

/// <reference lib="webworker" />
import { precacheAndRoute, createHandlerBoundToURL } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";

declare let self: ServiceWorkerGlobalScope;

// Activate the new service worker as soon as it finishes installing,
// instead of sitting in "waiting" until every open tab is closed.
// Without this, phones that already have an old SW installed keep
// getting served the old cached index.html + old JS chunks forever
// after a new deploy — which is what caused the blank plan-route page.
self.skipWaiting();
self.addEventListener("activate", () => {
  self.clients.claim();
});

precacheAndRoute(self.__WB_MANIFEST);

// SPA navigation fallback: precacheAndRoute only matches exact
// precached URLs (e.g. /assets/xyz-hash.js), not client-side routes
// like /plan-route. This makes direct navigations / reloads / deep
// links to any route fall back to the cached app shell.
registerRoute(new NavigationRoute(createHandlerBoundToURL("/index.html")));

// ---------- Push notification ----------

self.addEventListener("push", (event: PushEvent) => {
  if (!event.data) return;

  let payload: {
    title?: string;
    body?: string;
    url?: string;
    icon?: string;
  } = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "SurDrive", body: event.data.text() };
  }

  const title = payload.title ?? "SurDrive";
  const options: NotificationOptions = {
    body: payload.body ?? "",
    icon: payload.icon ?? "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    data: { url: payload.url ?? "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Clicking the notification focuses an existing tab if one is open,
// otherwise opens a new one at the target URL.
self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();
  const targetUrl =
    (event.notification.data as { url?: string } | undefined)?.url ?? "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === targetUrl && "focus" in client) {
            return (client as WindowClient).focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      }),
  );
});
