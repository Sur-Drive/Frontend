import { useEffect, useState } from "react";

export interface LiveCoords {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}

/**
 * Continuously tracks the driver's GPS position (navigator.geolocation
 * .watchPosition). Unlike useCurrentLocation, which reads once, this updates
 * as the driver moves and also reports heading and speed.
 * Returns null until the first GPS fix (or if permission is denied) — callers
 * should fall back to useCurrentLocation's coords in that case.
 */
export function useDriverLiveLocation(enabled = true): LiveCoords | null {
  const [pos, setPos] = useState<LiveCoords | null>(null);

  useEffect(() => {
    if (!enabled || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (p) =>
        setPos({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
          ...(typeof p.coords.heading === "number" && !isNaN(p.coords.heading)
            ? { heading: p.coords.heading }
            : {}),
          ...(typeof p.coords.speed === "number" && !isNaN(p.coords.speed)
            ? { speed: p.coords.speed }
            : {}),
        }),
      (e) => console.warn("[location] watch error:", e.message),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [enabled]);

  return pos;
}
