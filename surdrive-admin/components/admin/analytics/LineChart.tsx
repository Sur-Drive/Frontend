import type { LineSeries } from '@/types';
import { niceMax } from '@/lib/chartScale';


const VIEW_W = 600;
const VIEW_H = 220;

/**
 * Smooth quadratic path through the midpoints of each segment (no library).
 */
function buildSmoothPath(points: [number, number][]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i][0] + points[i + 1][0]) / 2;
    const midY = (points[i][1] + points[i + 1][1]) / 2;
    d += ` Q ${points[i][0]} ${points[i][1]} ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last[0]} ${last[1]}`;
  return d;
}

type LineChartProps = {
  /** Unique id used to namespace the SVG gradient defs */
  chartId: string;
  xLabels: readonly string[];
  series: LineSeries[];
  /** Optional y-axis labels, top-to-bottom (e.g. ['1000', '750', ..., '0']) */
  ySteps?: readonly string[];
  /** Always-visible point dots; false = dots appear on hover only */
  showDots?: boolean;
};

/**
 * Dual-line chart with soft area fills and per-point hover tooltips
 * (pure SVG + CSS group-hover, consistent with GrowthChart — no chart library).
 * TODO: replace with a real charting solution if interaction grows.
 */
export function LineChart({ chartId, xLabels, series, ySteps, showDots = true }: LineChartProps) {
  const count = xLabels.length;
  const dataMax = Math.max(...series.map((s) => Math.max(...s.values)), 1);
  const yMax = ySteps ? Number(ySteps[0]) : niceMax(dataMax, 4);
  const xOf = (index: number) => (count <= 1 ? 0 : (index / (count - 1)) * VIEW_W);
  const yOf = (value: number) => VIEW_H - (Math.min(value, yMax) / yMax) * VIEW_H;
  const topPct = (value: number) => (1 - Math.min(value, yMax) / yMax) * 100;

  return (
    <div className="flex gap-3">
      {/* Y axis */}
      {ySteps && (
        <div className="flex h-56 flex-col justify-between text-right text-[11px] text-ink-placeholder">
          {ySteps.map((step) => (
            <span key={step}>{step}</span>
          ))}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="relative h-56">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              {series.map((s) => (
                <linearGradient key={s.id} id={`${chartId}-${s.id}-fill`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.fillFrom ?? s.color} stopOpacity="0.28" />
                  <stop offset="100%" stopColor={s.fillFrom ?? s.color} stopOpacity="0.02" />
                </linearGradient>
              ))}
            </defs>

            {/* Area fills */}
            {series.map((s) => {
              const points = s.values.map((value, index) => [xOf(index), yOf(value)] as [number, number]);
              return (
                <path
                  key={`${s.id}-area`}
                  d={`${buildSmoothPath(points)} L ${xOf(count - 1)} ${VIEW_H} L ${xOf(0)} ${VIEW_H} Z`}
                  fill={`url(#${chartId}-${s.id}-fill)`}
                />
              );
            })}

            {/* Lines */}
            {series.map((s) => {
              const points = s.values.map((value, index) => [xOf(index), yOf(value)] as [number, number]);
              return (
                <path
                  key={`${s.id}-line`}
                  d={buildSmoothPath(points)}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>

          {/* Hover columns + point dots */}
          <div className="absolute inset-0 flex">
            {xLabels.map((label, index) => {
              const isFirst = index === 0;
              const isLast = index === count - 1;
              return (
                <div key={label} className="group relative h-full flex-1">
                  {series.map((s) => (
                    <span
                      key={s.id}
                      className={`pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ring-2 ring-surface-card ${
                        showDots ? '' : 'opacity-0 transition-opacity group-hover:opacity-100'
                      }`}
                      style={{
                        left: '50%',
                        top: `${topPct(s.values[index])}%`,
                        borderColor: s.color,
                        backgroundColor: 'rgb(var(--color-surface-card))',
                      }}
                    />
                  ))}
                  {/* Tooltip (anchored to the first series' point) */}
                  <div
                    className={`pointer-events-none absolute z-10 hidden group-hover:block ${
                      isFirst ? 'left-0' : isLast ? 'right-0' : 'left-1/2'
                    }`}
                    style={{ top: `${topPct(series[0].values[index])}%` }}
                  >
                    <div
                      className={`flex -translate-y-[calc(100%+10px)] flex-col gap-0.5 whitespace-nowrap rounded-lg border border-line-card bg-surface-card px-3 py-2 shadow-lg ${
                        isFirst ? '' : isLast ? '-translate-x-full' : '-translate-x-1/2'
                      }`}
                    >
                      <span className="text-[10px] text-ink-tertiary">{label}</span>
                      {series.map((s) => (
                        <span key={s.id} className="flex items-center gap-1.5 text-[11px] text-ink-secondary">
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: s.color }}
                          />
                          {s.label}
                          <span className="font-semibold text-ink-primary">
                            {s.format
                              ? s.format(s.values[index])
                              : s.values[index].toLocaleString('en-US')}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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