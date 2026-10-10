import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import SOSActiveModal from "../../components/Sosactivemodal";
import { useCurrentLocation } from "../../hooks/useCurrentLocation";
import {
  useTriggerDriverSos,
  useCancelDriverSos,
} from "../hooks/useDriverSos";

const HOLD_MS = 3000;
// Last resort only, if we have no GPS/IP location at all (same as the passenger SOS).
const DEFAULT_COORDS = { latitude: 6.5244, longitude: 3.3792 };

const RING_R = 20;
const RING_C = 2 * Math.PI * RING_R;

/**
 * Driver SOS: press and hold for 3s -> sends the driver's location to POST /sos
 * and opens the "SOS Active" modal. The modal can be closed with the X or
 * "Cancel SOS" (which also cancels the alert on the backend).
 */
export default function SosButton() {
  const { coords } = useCurrentLocation();
  const coordsRef = useRef(coords);
  coordsRef.current = coords;

  const triggerSos = useTriggerDriverSos();
  const cancelSos = useCancelDriverSos();

  const [isPressing, setIsPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hint, setHint] = useState<string | null>(null);
  const [sosActive, setSosActive] = useState(false);
  const [sosError, setSosError] = useState<string | null>(null);
  const [sosId, setSosId] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const completedRef = useRef(false);
  const hintTimerRef = useRef<number | null>(null);
  // Set when the driver cancels before the trigger request has returned an id,
  // so we can cancel the alert as soon as the id arrives.
  const cancelledEarlyRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(
    () => () => {
      clearTimer();
      if (hintTimerRef.current !== null) window.clearTimeout(hintTimerRef.current);
    },
    [],
  );

  const flashHint = (text: string) => {
    setHint(text);
    if (hintTimerRef.current !== null) window.clearTimeout(hintTimerRef.current);
    hintTimerRef.current = window.setTimeout(() => setHint(null), 1800);
  };

  const fireSos = useCallback(() => {
    const loc = coordsRef.current ?? DEFAULT_COORDS;
    cancelledEarlyRef.current = false;
    setSosError(null);
    setSosId(null);
    setSosActive(true);

    triggerSos.mutate(
      { latitude: loc.latitude, longitude: loc.longitude },
      {
        onSuccess: (data: any) => {
          const id = data?.id ?? data?.data?.id;
          if (!id) return;
          if (cancelledEarlyRef.current) {
            cancelSos.mutate(String(id));
          } else {
            setSosId(String(id));
          }
        },
        onError: (err) => {
          console.error("[sos] failed to trigger", err);
          setSosError(
            err instanceof Error ? err.message : "Failed to send SOS alert",
          );
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startPress = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (sosActive) return;

    completedRef.current = false;
    setHint(null);
    setIsPressing(true);
    setProgress(0);
    startRef.current = Date.now();
    clearTimer();

    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      setProgress(Math.min(elapsed / HOLD_MS, 1));

      if (elapsed >= HOLD_MS) {
        clearTimer();
        completedRef.current = true; // so endPress doesn't show the "hold" hint
        setIsPressing(false);
        setProgress(0);
        fireSos();
      }
    }, 16);
  };

  const endPress = (e?: React.PointerEvent) => {
    e?.stopPropagation();
    if (!isPressing && timerRef.current === null) return;
    clearTimer();
    setIsPressing(false);
    if (!completedRef.current) {
      setProgress(0);
      flashHint("Hold for 3 seconds");
    }
  };

  const handleClose = () => {
    if (sosId) {
      cancelSos.mutate(sosId);
    } else {
      cancelledEarlyRef.current = true;
    }
    setSosId(null);
    setSosActive(false);
    setSosError(null);
    completedRef.current = false;
  };

  const handleCall112 = () => {
    window.location.href = "tel:112";
  };

  return (
    <>
      <div className="relative">
        <button
          type="button"
          aria-label="SOS — hold for 3 seconds to send an emergency alert"
          onPointerDown={startPress}
          onPointerUp={endPress}
          onPointerLeave={endPress}
          onPointerCancel={endPress}
          onContextMenu={(e) => e.preventDefault()}
          className="relative flex h-11 w-11 select-none items-center justify-center overflow-hidden rounded-full bg-[#E53935] text-xs font-extrabold text-white shadow-md"
          style={{
            touchAction: "none",
            WebkitTouchCallout: "none",
            WebkitUserSelect: "none",
          }}
        >
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full -rotate-90"
            viewBox="0 0 44 44"
            style={{ opacity: progress > 0 ? 1 : 0, transition: "opacity 0.15s" }}
          >
            <circle
              cx="22"
              cy="22"
              r={RING_R}
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - progress)}
            />
          </svg>
          {isPressing && (
            <span className="pointer-events-none absolute inset-0 animate-ping rounded-full border-2 border-white/40" />
          )}
          <span className="pointer-events-none relative z-10">SOS</span>
        </button>

        {(isPressing || hint) && (
          <span className="pointer-events-none absolute right-0 top-full mt-2 whitespace-nowrap rounded-lg bg-[#1F2937]/85 px-2.5 py-1 text-xs font-medium text-white shadow">
            {isPressing ? "Keep holding…" : hint}
          </span>
        )}
      </div>

      {createPortal(
        <AnimatePresence>
          {sosActive && (
            <SOSActiveModal
              onCancel={handleClose}
              onCall={handleCall112}
              errorMessage={sosError}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
