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
import type { AnalyticsTrend } from "@/types/analytics";

interface AnalyticsTrendCardProps {
  trend: AnalyticsTrend;
}

function TrendDot({
  cx,
  cy,
  color,
}: {
  cx?: number;
  cy?: number;
  color: string;
}) {
  if (cx == null || cy == null) return <g />;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="var(--surface)"
      stroke={color}
      strokeWidth={2}
    />
  );
}

function TrendTooltip({
  active,
  payload,
  label,
  trend,
}: {
  active?: boolean;
  payload?: { value?: number | string }[];
  label?: string | number;
  trend: AnalyticsTrend;
}) {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0]?.value ?? 0);
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-ink">{label}</p>
      <p className="mt-1 text-ink-muted">{trend.formatValue(value)}</p>
    </div>
  );
}

// Monotone area chart with a soft gradient fill, dashed gridlines and hollow
// markers, matching the Analytics design. Recharts' ResponsiveContainer reports
// its measured size on the client only, so the SVG is absent during SSR and on
// the first client render — identical output on both, no hydration mismatch.
export function AnalyticsTrendCard({ trend }: AnalyticsTrendCardProps) {
  const stroke = trend.accent === "accent" ? "var(--accent)" : "var(--brand)";

  return (
    <Card title={trend.title} subtitle={trend.subtitle}>
      <div
        className="h-56 sm:h-64 lg:h-72"
        role="img"
        aria-label={trend.summary}
        style={{ outline: "none" }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={trend.data}
            margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
          >
            <defs>
              <linearGradient id="analyticsTrendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.25} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              minTickGap={4}
              tick={{ fill: "var(--ink-subtle)", fontSize: 11 }}
            />
            <YAxis
              domain={trend.yDomain}
              ticks={trend.yTicks}
              tickFormatter={trend.formatTick}
              tickLine={false}
              axisLine={false}
              width={48}
              tick={{ fill: "var(--ink-subtle)", fontSize: 11 }}
            />
            <Tooltip
              content={<TrendTooltip trend={trend} />}
              cursor={{ stroke: "var(--border)" }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={stroke}
              strokeWidth={3}
              fill="url(#analyticsTrendFill)"
              isAnimationActive={false}
              dot={<TrendDot color={stroke} />}
              activeDot={{
                r: 5,
                fill: "var(--surface)",
                stroke: stroke,
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <table className="sr-only">
        <caption>{trend.title}</caption>
        <thead>
          <tr>
            <th scope="col">Period</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {trend.data.map((point) => (
            <tr key={point.label}>
              <th scope="row">{point.label}</th>
              <td>{trend.formatValue(point.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
