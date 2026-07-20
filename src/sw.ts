/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching'

declare let self: ServiceWorkerGlobalScope

// Required by injectManifest — Workbox replaces this at build time with
// the actual list of files to precache. Keep this line as-is.
precacheAndRoute(self.__WB_MANIFEST)

// ---------- Push notifications ----------

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return

  let payload: { title?: string; body?: string; url?: string; icon?: string } = {}
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'SurDrive', body: event.data.text() }
  }

  const title = payload.title ?? 'SurDrive'
  const options: NotificationOptions = {
    body: payload.body ?? '',
    icon: payload.icon ?? '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: { url: payload.url ?? '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Clicking the notification focuses an existing tab if one is open,
// otherwise opens a new one at the target URL.
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const targetUrl = (event.notification.data as { url?: string } | undefined)?.url ?? '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return (client as WindowClient).focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})