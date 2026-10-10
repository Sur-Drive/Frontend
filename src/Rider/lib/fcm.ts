/**
 * Gets this browser/device's FCM token so it can be sent to
 * POST /notifications/device-token. Requires:
 *   npm i firebase
 *   VITE_FIREBASE_* env vars + VITE_FIREBASE_VAPID_KEY (see below)
 * The service worker (src/sw.ts) must be registered first.
 */
export async function getFcmToken(): Promise<string | null> {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return null;

  const permission =
    Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;
  if (permission !== "granted") return null;

  const { initializeApp, getApps } = await import("firebase/app");
  const { getMessaging, getToken, isSupported } = await import("firebase/messaging");
  if (!(await isSupported())) return null;

  const app =
    getApps()[0] ??
    initializeApp({
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    });

  const registration = await navigator.serviceWorker.ready;
  return getToken(getMessaging(app), {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
}

const TOKEN_KEY = "fcmDeviceToken";
export const getStoredFcmToken = () => localStorage.getItem(TOKEN_KEY);
export const storeFcmToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearFcmToken = () => localStorage.removeItem(TOKEN_KEY);
