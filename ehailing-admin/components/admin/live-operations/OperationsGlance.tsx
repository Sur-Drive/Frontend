import {
  Activity,
  ArrowRight,
  Car,
  MapPin,
  Search,
  TriangleAlert,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EM_DASH } from "@/lib/format";
import { glanceLabel } from "@/lib/live-operations";
import { TONE_STYLES } from "@/types/overview";
import type { Tone } from "@/types/overview";
import type { LiveGlance } from "@/lib/live-operations";

interface OperationsGlanceProps {
  // Every value is number | null: null (unloaded / failed / field the
  // endpoint does not have) renders "—", a loaded true zero renders "0".
  stats: LiveGlance;
  // Refresh failure note; values keep showing the last good data.
  error: string | null;
  stale: boolean;
}

interface GlanceRowSpec {
  key: string;
  label: string;
  // null = the endpoint exposes no such field; the cell shows "—" with the
  // app's "Not available yet" treatment instead of a fabricated number.
  value: number | null;
  available: boolean;
  icon: LucideIcon;
  tone: Tone;
}

export function OperationsGlance({ stats, error, stale }: OperationsGlanceProps) {
  const rows: GlanceRowSpec[] = [
    { key: "online", label: "Online Drivers", value: null, available: false, icon: User, tone: "brand" },
    { key: "active", label: "Active Rides", value: stats.activeRides, available: true, icon: Car, tone: "brand" },
    { key: "searching", label: "Searching", value: stats.searching, available: true, icon: Search, tone: "warning" },
    { key: "en-route", label: "Driver En Route", value: null, available: false, icon: ArrowRight, tone: "brand" },
    { key: "arrived", label: "Driver Arrived", value: null, available: false, icon: MapPin, tone: "success" },
    { key: "in-progress", label: "In Progress", value: stats.inProgress, available: true, icon: Activity, tone: "success" },
    { key: "delayed", label: "Delayed Rides", value: stats.delayedRides, available: true, icon: TriangleAlert, tone: "warning" },
  ];

  // Utilisation needs the online-driver count, which no confirmed endpoint
  // provides — it stays "—" with the availability note, never a made-up %.
  const utilisationLabel = EM_DASH;

  return (
    <Card
      title="Operations at a glance"
      subtitle="Real-time ride lifecycle"
      className="flex min-w-0 flex-1 flex-col"
    >
      {error ? (
        <p role="status" className="mb-2 text-xs font-medium text-danger">
          {error}
          {stale ? " — showing last data" : ""}
        </p>
      ) : null}
      <ul className="divide-y divide-border">
        {rows.map((row) => {
          const t = TONE_STYLES[row.tone];
          const Icon = row.icon;
          const isDelayed = row.key === "delayed";
          return (
            <li
              key={row.key}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${t.soft} ${t.text}`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="truncate text-sm text-ink-muted">
                  {row.label}
                </span>
              </div>
              <span
                title={row.available ? undefined : "Not available yet"}
                className={`shrink-0 text-xl font-semibold ${
                  isDelayed ? "text-danger" : "text-ink"
                }`}
              >
                {row.available ? glanceLabel(row.value) : EM_DASH}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 rounded-xl bg-surface-muted p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-ink-muted">Driver utilisation</span>
          <span title="Not available yet" className="text-sm font-bold text-ink">
            {utilisationLabel}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Driver utilisation"
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-border"
        >
          <div className="h-full rounded-full bg-brand" style={{ width: "0%" }} />
        </div>
        <p className="mt-2 text-xs text-ink-muted">
          Online driver counts not available yet
        </p>
      </div>
    </Card>
  );
}
