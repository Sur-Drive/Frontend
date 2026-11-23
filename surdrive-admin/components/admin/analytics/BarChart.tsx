import { niceMax, formatYStep } from '@/lib/chartScale';

type BarChartProps = {
  xLabels: readonly string[];
  values: number[];
  /** Optional y-axis labels, top-to-bottom. Omitted = generated dynamically. */
  ySteps?: readonly string[];
  /** Tailwind bg class for the bars */
  barClass?: string;
};

/**
 * Simple vertical bar chart (div-based, consistent with GrowthChart — no
 * chart library). Y-axis max scales dynamically from the data with headroom.
 */
export function BarChart({
  xLabels,
  values,
  ySteps,
  barClass = 'bg-[#22C55E]',
}: BarChartProps) {
  const stepCount = ySteps ? ySteps.length - 1 : 4;
  const dataMax = Math.max(...values, 1);
  const yMax = ySteps ? Number(ySteps[0]) : niceMax(dataMax, stepCount);
  const steps =
    ySteps ??
    Array.from({ length: stepCount + 1 }, (_, index) =>
      formatYStep(yMax - (yMax / stepCount) * index),
    );

  return (
    <div className="flex gap-3">
      {/* Y axis */}
      <div className="flex h-56 flex-col justify-between text-right text-[11px] text-ink-placeholder">
        {steps.map((step) => (
          <span key={step}>{step}</span>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex h-56 items-end justify-between gap-3 border-b border-line-card">
          {values.map((value, index) => (
            <div key={xLabels[index]} className="flex h-full min-w-0 flex-1 items-end">
              <div
                className={`w-full rounded-t-md transition-all duration-300 ${barClass}`}
                style={{ height: `${Math.max((Math.min(value, yMax) / yMax) * 100, 1)}%` }}
              />
            </div>
          ))}
        </div>

        {/* X axis */}
        <div className="mt-2 flex">
          {xLabels.map((label) => (
            <span key={label} className="min-w-0 flex-1 truncate text-center text-[11px] text-ink-placeholder">
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
