import type { TrafficStatus } from "../../lib/etaSystem";

interface TrafficEtaBadgeProps {
  traffic: TrafficStatus | null;
  /** "Updated 12s ago" — omit to hide the freshness line entirely. */
  freshnessLabel?: string;
  className?: string;
}

const TONE_STYLES: Record<TrafficStatus["tone"], string> = {
  slower: "bg-amber-50 text-amber-700 border-amber-100",
  faster: "bg-emerald-50 text-emerald-700 border-emerald-100",
  typical: "bg-gray-50 text-gray-500 border-gray-100",
};

/** Traffic-adjusted ETA indicator: how the live route duration compares
 *  to the duration captured when it was planned, plus a small pulsing
 *  dot + "Updated Xs ago" to make the continuous updating visible. */
export default function TrafficEtaBadge({
  traffic,
  freshnessLabel,
  className = "",
}: TrafficEtaBadgeProps) {
  if (!traffic) return null;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[11px] sm:text-xs font-medium ${TONE_STYLES[traffic.tone]} ${className}`}
    >
      <span className="relative flex w-1.5 h-1.5 flex-shrink-0">
        <span className="absolute inline-flex w-full h-full bg-current rounded-full opacity-40 animate-ping" />
        <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-current" />
      </span>
      <span>{traffic.label}</span>
      {freshnessLabel && <span className="opacity-60">· {freshnessLabel}</span>}
    </div>
  );
}
