'use client';

import { useRef, useState } from 'react';

type HazardMixProps = {
  labels: string[];
  data: number[];
  colors: string[];
};

type HazardSlice = {
  id: string;
  label: string;
  value: number;
  color: string;
};

const formatNumber = (value: number): string => value.toLocaleString('en-US');

export function HazardMix({ labels, data, colors }: HazardMixProps) {
  const slices: HazardSlice[] = labels.map((label, index) => ({
    id: label + index,
    label,
    value: data[index] ?? 0,
    color: colors[index] ?? '#E5E7EB',
  }));

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  let offset = 0;
  const segments = slices.map((slice) => {
    const length = total > 0 ? (slice.value / total) * circumference : 0;
    const segment = { ...slice, dash: `${length} ${circumference - length}`, offset };
    offset += length;
    return segment;
  });

  const [hoveredSegment, setHoveredSegment] = useState<HazardSlice | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const centerLabel = hoveredSegment?.label ?? (total > 0 ? 'Total' : null);
  const centerValue = hoveredSegment ? hoveredSegment.value : total;

  const updateTooltipPos = (event: React.MouseEvent) => {
    const rect = chartRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltipPos({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  };

  return (
    <div className="flex flex-col rounded-2xl border border-line-card bg-surface-card p-6">
      <div>
        <h2 className="text-base font-semibold text-ink-primary">Hazard Mix</h2>
        <p className="mt-0.5 text-xs text-ink-tertiary">Showing hazard distribution</p>
      </div>
      <div ref={chartRef} className="relative mx-auto my-8 h-44 w-44">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={radius} fill="none" stroke={slices.length > 0 ? 'transparent' : '#E5E7EB'} strokeWidth="18" />
          {segments.map((segment) => (
            <g key={segment.id}>
              <circle cx="60" cy="60" r={radius} fill="none" stroke={segment.color} strokeWidth="18" strokeDasharray={segment.dash} strokeDashoffset={-segment.offset} />
              <circle cx="60" cy="60" r={radius} fill="none" stroke="transparent" strokeWidth="60" strokeDasharray={segment.dash} strokeDashoffset={-segment.offset} pointerEvents="stroke" className="cursor-pointer"
                onMouseEnter={(event) => { setHoveredSegment(segment); updateTooltipPos(event); }}
                onMouseMove={updateTooltipPos}
                onMouseLeave={() => { setHoveredSegment(null); setTooltipPos(null); }} />
            </g>
          ))}
        </svg>
        {hoveredSegment && tooltipPos && (
          <div className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[160%] whitespace-nowrap rounded-lg bg-surface-card px-3 py-1.5 text-xs font-medium text-ink-primary shadow-lg ring-1 ring-line-card"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}>
            {hoveredSegment.label}: {formatNumber(hoveredSegment.value)}
          </div>
        )}
        {centerLabel !== null && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-semibold text-ink-primary">{centerLabel}</span>
            <span className="text-xs text-ink-tertiary">{formatNumber(centerValue)}</span>
          </div>
        )}
      </div>
      <ul className="mt-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {slices.map((slice) => (
          <li key={slice.id} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: slices.length > 0 ? slice.color : '#E5E7EB' }} />
            <span className="text-[11px] text-ink-secondary">{slice.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
