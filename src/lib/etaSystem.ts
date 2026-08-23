// ─── ETA system helpers ────────────────────────────────────────────
// Pure, framework-agnostic formatting/derivation helpers for the ETA
// system (current ETA, remaining time/distance, traffic-adjusted ETA).
// Kept separate from useEtaSystem so they're easy to unit test and reuse
// anywhere a route's duration needs to be turned into UI text.

/** Wall-clock arrival time `minutesFromNow` minutes from now, e.g. "4:32 PM". */
export function formatClockTime(minutesFromNow: number): string {
  const arrival = new Date(Date.now() + Math.max(0, minutesFromNow) * 60000);
  return arrival.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** "24 min" under an hour, "1 hr 4 min" (or "1 hr") beyond it. */
export function formatEtaDuration(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

/** "8.3 km" / "450 m" for short remaining distances. */
export function formatEtaDistance(km: number): string {
  if (km < 1) return `${Math.max(0, Math.round(km * 1000))} m`;
  return `${km.toFixed(1)} km`;
}

export type TrafficTone = "slower" | "faster" | "typical";

export interface TrafficStatus {
  deltaMinutes: number;
  label: string;
  tone: TrafficTone;
}

/** Turns a delta (current duration − baseline duration, in minutes)
 *  captured when the route was planned into a human label. Deltas under
 *  a minute read as "typical" rather than flapping on rounding noise. */
export function describeTrafficDelta(deltaMinutes: number): TrafficStatus {
  const rounded = Math.round(deltaMinutes);
  if (Math.abs(rounded) < 1) {
    return { deltaMinutes: 0, label: "Typical traffic", tone: "typical" };
  }
  if (rounded > 0) {
    return {
      deltaMinutes: rounded,
      label: `+${rounded} min from traffic`,
      tone: "slower",
    };
  }
  return {
    deltaMinutes: rounded,
    label: `${Math.abs(rounded)} min faster than usual`,
    tone: "faster",
  };
}

/** "Updated just now" / "Updated 12s ago" — proves the ETA is live rather
 *  than a one-time calculation. */
export function formatFreshness(
  lastUpdatedAt: number,
  now: number = Date.now(),
): string {
  const seconds = Math.max(0, Math.round((now - lastUpdatedAt) / 1000));
  if (seconds < 5) return "Updated just now";
  if (seconds < 60) return `Updated ${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  return `Updated ${minutes} min ago`;
}
