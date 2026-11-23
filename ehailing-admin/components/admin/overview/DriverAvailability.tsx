"use client";

import { Card } from "@/components/ui/Card";
import { formatNumber } from "@/lib/format";

interface DriverAvailabilityProps {
  // Online drivers from dashboard.stats.onlineDrivers; null until the
  // dashboard fetch has landed ("—" body).
  total: number | null;
}

// The endpoint exposes only the online-drivers total — the on-trip /
// available / on-break breakdown has no field, so the ring keeps its neutral
// track and the slice list is replaced by the availability note.
export function DriverAvailability({ total }: DriverAvailabilityProps) {
  if (total === null) {
    return (
      <Card title="Driver Availability" subtitle="Current driver network">
        <p className="flex h-40 items-center justify-center text-center text-sm text-ink-muted">
          —
        </p>
      </Card>
    );
  }

  return (
    <Card title="Driver Availability" subtitle="Current driver network">
      <div
        role="img"
        aria-label={`Driver availability: ${formatNumber(total)} drivers online.`}
        style={{ outline: "none" }}
      >
        <div className="relative mx-auto size-40">
          <svg viewBox="0 0 120 120" className="size-full -rotate-90" style={{ outline: "none" }}>
            {/* No breakdown endpoint, so the ring stays an empty track. */}
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="var(--success-soft)"
              strokeWidth="7"
            />
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold text-ink">
              {formatNumber(total)}
            </span>
            <span className="text-xs text-ink-muted">Online</span>
          </div>
        </div>
      </div>

      <p className="mt-5 text-center text-sm text-ink-muted">
        Not available yet
      </p>
    </Card>
  );
}
