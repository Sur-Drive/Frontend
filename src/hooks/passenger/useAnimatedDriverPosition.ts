
import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  distanceMeters,
  type TrackingPoint,
} from "../../lib/passenger/rideTracking";

const ANIMATION_MS = 3500;
const MAX_ANIMATED_JUMP_METERS = 250;

export function useAnimatedDriverPosition(
  target: TrackingPoint | null,
  enabled = true,
) {
  const [position, setPosition] =
    useState<TrackingPoint | null>(target);

  const positionRef =
    useRef<TrackingPoint | null>(target);

  useEffect(() => {
    if (!target) {
      positionRef.current = null;
      setPosition(null);
      return;
    }

    const start = positionRef.current;

    if (!start || !enabled) {
      positionRef.current = target;
      setPosition(target);
      return;
    }

    const distance = distanceMeters(
      start,
      target,
    );

    // Avoid visually driving across the city
    // after a GPS jump or long disconnection.
    if (
      distance < 1 ||
      distance > MAX_ANIMATED_JUMP_METERS
    ) {
      positionRef.current = target;
      setPosition(target);
      return;
    }

    let frame = 0;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;

      const t = Math.min(
        1,
        elapsed / ANIMATION_MS,
      );

      const eased =
        t * t * (3 - 2 * t);

      const next = {
        lat:
          start.lat +
          (target.lat - start.lat) * eased,
        lng:
          start.lng +
          (target.lng - start.lng) * eased,
      };

      positionRef.current = next;
      setPosition(next);

      if (t < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [
    target?.lat,
    target?.lng,
    enabled,
  ]);

  return position;
}
