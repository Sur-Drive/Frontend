import { useCallback, useState } from "react";
import { useRegisterDeviceToken } from "./useNotifications";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type PushSubscribeStatus =
  | "idle"
  | "subscribing"
  | "subscribed"
  | "denied"
  | "error";

export type PushSubscribeResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "unsupported"
        | "no-vapid-key"
        | "denied"
        | "register-failed"
        | "subscribe-failed";
    };

export function usePushSubscription() {
  const [status, setStatus] = useState<PushSubscribeStatus>("idle");
  const registerDeviceToken = useRegisterDeviceToken();

  const subscribe = useCallback(async (): Promise<PushSubscribeResult> => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("error");
      return { ok: false, reason: "unsupported" };
    }

    if (!VAPID_PUBLIC_KEY) {
      console.error("VITE_VAPID_PUBLIC_KEY is not set — check your .env");
      setStatus("error");
      return { ok: false, reason: "no-vapid-key" };
    }

    setStatus("subscribing");

    try {
      //   const permission = await Notification.requestPermission()
      //   console.log(permission)
      //   if (permission !== 'granted') {
      //     setStatus('denied')
      //     return { ok: false, reason: 'denied' }
      //   }

      //   const registration = await navigator.serviceWorker.ready

      //   let subscription = await registration.pushManager.getSubscription()

      //   console.log(subscription);
      //   if (!subscription) {
      //     try {
      //       subscription = await registration.pushManager.subscribe({
      //         userVisibleOnly: true,
      //         applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      //       })
      //     } catch (subscribeErr) {
      //       console.error('pushManager.subscribe failed', subscribeErr)
      //       setStatus('error')
      //       return { ok: false, reason: 'subscribe-failed' }
      //     }
      //   }
      const permission = await Notification.requestPermission();
      console.log(permission);
      if (permission !== "granted") {
        setStatus("denied");
        return { ok: false, reason: "denied" };
      }

      console.log("waiting for service worker...");
      const registration = await navigator.serviceWorker.ready;
      console.log("service worker ready", registration);

      let subscription = await registration.pushManager.getSubscription();
      console.log("existing subscription?", subscription);

      if (!subscription) {
        try {
          console.log("calling pushManager.subscribe...");
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
              VAPID_PUBLIC_KEY,
            ) as BufferSource,
          });
          console.log("subscribe resolved", subscription);
        } catch (subscribeErr) {
          console.error("pushManager.subscribe failed", subscribeErr);
          setStatus("error");
          return { ok: false, reason: "subscribe-failed" };
        }
      }

      try {
        await registerDeviceToken.mutateAsync({
          token: JSON.stringify(subscription),
          platform: "web",
        });
        console.log(subscription);
      } catch (registerErr) {
        console.error(
          "Registering device token with backend failed",
          registerErr,
        );
        setStatus("error");
        return { ok: false, reason: "register-failed" };
      }

      setStatus("subscribed");
      return { ok: true };
    } catch (err) {
      console.error("Push subscription failed", err);
      setStatus("error");
      return { ok: false, reason: "subscribe-failed" };
    }
  }, [registerDeviceToken]);

  return { subscribe, status, isSubscribing: status === "subscribing" };
}
