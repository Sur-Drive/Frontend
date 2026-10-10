import { useEffect, useRef, useState } from "react";
import { acquireRideSocket, releaseRideSocket } from "../lib/rideSocket";

/** Payload of the `ride.offer_sent` event (docs/events.html #1). */
export interface RideOffer {
  rideId: string;
  driverId: string;
  attemptId: string;
  distanceKm: number;
  etaMin: number;
  expiresAt: string;
  pickupCodeRequired: boolean;
  pickupAddress?: string;
  riderRating?: number;
  estimatedFare?: number;
}

/**
 * Listens for ride offers sent to this driver. Only connects while `enabled`
 * (i.e. while the driver is online). The offer clears itself when it expires,
 * or when the ride is cancelled / taken.
 */
export function useRideOffers(enabled: boolean) {
  const [offer, setOffer] = useState<RideOffer | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setOffer(null);
      setConnected(false);
      return;
    }
    const socket = acquireRideSocket();
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onOffer = (p: RideOffer) => {
      console.log("[socket] ride.offer_sent", p);
      setOffer(p);
    };
    const onGone = (p: { rideId?: string }) =>
      setOffer((cur) => (cur && cur.rideId === p?.rideId ? null : cur));

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("ride.offer_sent", onOffer);
    socket.on("ride.cancelled", onGone);
    socket.on("ride.driver_assigned", onGone);
    setConnected(socket.connected);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("ride.offer_sent", onOffer);
      socket.off("ride.cancelled", onGone);
      socket.off("ride.driver_assigned", onGone);
      releaseRideSocket();
    };
  }, [enabled]);

  // Countdown + auto-expire.
  useEffect(() => {
    if (!offer) return;
    const tick = () => {
      const left = Math.ceil((new Date(offer.expiresAt).getTime() - Date.now()) / 1000);
      if (left <= 0) setOffer(null);
      else setSecondsLeft(left);
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [offer]);

  return { offer, secondsLeft, connected, clearOffer: () => setOffer(null) };
}

type Handler = (payload: any) => void;

/**
 * Subscribes to one ride's room and runs handlers for its lifecycle events,
 * e.g. { "ride.cancelled": fn, "ride.completed": fn }. Re-subscribes after
 * a reconnect.
 */
export function useRideEvents(rideId: string | undefined, handlers: Record<string, Handler>) {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    if (!rideId) return;
    const socket = acquireRideSocket();
    const subscribe = () => socket.emit("ride.subscribe", { rideId }, (r: any) => console.log("[socket] subscribe", r));
    // events.html: on reconnect re-subscribe AND fetch the ride once, because
    // events fired while we were offline are lost. "reconnected" is optional.
    let first = true;
    const onConnect = () => {
      subscribe();
      if (!first) ref.current["reconnected"]?.(undefined);
      first = false;
    };
    if (socket.connected) onConnect();
    socket.on("connect", onConnect);

    const names = Object.keys(ref.current).filter((n) => n !== "reconnected");
    const wrapped = names.map((n) => {
      const fn: Handler = (p) => {
        if (p?.rideId && p.rideId !== rideId) return;
        console.log(`[socket] ${n}`, p);
        ref.current[n]?.(p);
      };
      socket.on(n, fn);
      return [n, fn] as const;
    });

    return () => {
      socket.off("connect", onConnect);
      wrapped.forEach(([n, fn]) => socket.off(n, fn));
      socket.emit("ride.unsubscribe", { rideId });
      releaseRideSocket();
    };
  }, [rideId]);
}
