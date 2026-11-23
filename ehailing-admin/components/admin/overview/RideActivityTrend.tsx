"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { niceAxisScale, formatNumber } from "@/lib/format";
import type { HourPoint } from "@/types/overview";

const X_TICKS = ["12 AM", "4 AM", "8 AM", "12 PM", "4 PM", "8 PM"];

interface RideActivityTrendProps {
  // null = the dashboard fetch has not landed yet (renders "—").
  data: HourPoint[] | null;
  // e.g. "All Cities ride activity" — scoped by the city selector.
  title: string;
  subtitle: string;
}

// Show a marker only on every third point; the rest render nothing.
function RequestDot({
  cx,
  cy,
  index,
}: {
  cx?: number;
  cy?: number;
  index?: number;
}) {
  const i = index ?? 0;
  if (i % 3 !== 0 || cx == null || cy == null) return <g />;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill="var(--surface)"
      stroke="var(--brand)"
      strokeWidth={3}
    />
  );
}

function TrendTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value?: number | string }[];
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-ink">{label}</p>
      <p className="mt-1 text-brand">
        Requests: {formatNumber(Number(payload[0]?.value ?? 0))}
      </p>
    </div>
  );
}

// The dashboard endpoint provides a single hourly series of today's ride
// requests (all statuses — the day's cancelled request is counted), so the
// design's completed/cancelled pair collapses into one honest series.
export function RideActivityTrend({ data, title, subtitle }: RideActivityTrendProps) {
  if (data === null) {
    return (
      <Card title={title} subtitle={subtitle}>
        <p className="flex h-56 items-center justify-center text-center text-sm text-ink-muted sm:h-64 lg:h-72">
          —
        </p>
      </Card>
    );
  }

  // Axis follows the scoped series so a smaller city view stays readable.
  const axis = niceAxisScale(Math.max(...data.map((point) => point.count)));

  return (
    <Card title={title} subtitle={subtitle}>
      <div
        className="h-56 sm:h-64 lg:h-72"
        role="img"
        aria-label="Ride requests by hour of day, from midnight to 11 PM."
        style={{ outline: "none" }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="requestsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="label"
              ticks={X_TICKS}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--ink-subtle)", fontSize: 11 }}
            />
            <YAxis
              domain={[0, axis.max]}
              ticks={axis.ticks}
              tickLine={false}
              axisLine={false}
              width={44}
              tick={{ fill: "var(--ink-subtle)", fontSize: 11 }}
            />
            <Tooltip content={<TrendTooltip />} cursor={{ stroke: "var(--border)" }} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="var(--brand)"
              strokeWidth={3}
              fill="url(#requestsFill)"
              dot={<RequestDot />}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex items-center justify-center gap-5 text-xs text-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-brand" aria-hidden="true" />
          Ride requests
        </span>
      </div>
    </Card>
  );
}

