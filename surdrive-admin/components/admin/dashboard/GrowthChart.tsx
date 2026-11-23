import { niceMax, formatYStep } from '@/lib/chartScale';
import { useState } from 'react';

type GrowthChartProps = {
  labels: string[];
  data: number[];
};

const STEP_COUNT = 5;

export function GrowthChart({ labels, data }: GrowthChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const yMax = niceMax(Math.max(...data, 1), STEP_COUNT);
  const steps = Array.from({ length: STEP_COUNT + 1 }, (_, index) =>
    formatYStep(yMax - (yMax / STEP_COUNT) * index),
  );

  return (
    <div className="flex flex-col rounded-2xl border border-line-card bg-surface-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink-primary">User Growth</h2>
        </div>
      </div>

      <div className="mt-6 flex gap-3 min-w-0">
        {/* Y axis — ticks generated dynamically from the real data */}
        <div className="flex h-56 flex-col justify-between text-right text-[11px] text-ink-placeholder">
          {steps.map((step) => (
            <span key={step}>{step}</span>
          ))}
        </div>

        {/* One column per month: bar + its own label share the same flex child,
            so a bar can never drift out of alignment with its label. */}
        <div className="flex min-w-0 flex-1 items-stretch justify-between">
          {data.map((value, index) => {
            const heightPct = (Math.min(value, yMax) / yMax) * 100;
            const isHovered = hoveredIndex === index;
            const showLabel = index % 3 === 0;
            return (
              <div
                key={labels[index] ?? index}
                className="group relative flex min-w-0 flex-1 flex-col items-stretch"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setHoveredIndex(hoveredIndex === index ? null : index)}
              >
                {/* Bar area — inset via px so adjacent bars keep visual spacing;
                    border-b continues across columns to form the baseline */}
                <div className="flex h-56 items-end border-b border-line-card px-1 sm:px-1.5">
                  <div
                    className={`w-full rounded-t-md transition-all duration-300 group-hover:opacity-90 ${
                      isHovered
                        ? 'bg-[linear-gradient(180deg,#7C3AED_0%,#2E1065_100%)]'
                        : 'bg-[#EDEBF2]'
                    }`}
                    style={{ height: `${Math.max(heightPct, 1)}%` }}
                  />
                </div>
                {isHovered && labels[index] != null && (
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 flex-col gap-0.5 rounded-lg bg-[#2E1065] px-3 py-2 text-white shadow-lg group-hover:flex">
                    <span className="whitespace-nowrap text-[10px] text-white/70">{labels[index]}</span>
                    <span className="whitespace-nowrap text-[11px]">
                      <span className="font-semibold">{value.toLocaleString('en-NG')}</span>
                    </span>
                  </div>
                )}
                {/* Label — rendered under its own bar; hidden labels keep the
                    column sized via flex-1 so every bar stays evenly spaced.
                    Mobile shows every 3rd label; desktop shows all 13. */}
                <span
                  className={`mt-2 whitespace-nowrap text-center text-[11px] text-ink-placeholder ${
                    showLabel ? '' : 'invisible sm:visible'
                  }`}
                >
                  {labels[index]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
