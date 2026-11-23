"use client";

import { useEffect, useRef, useState } from "react";
import { Sector } from "recharts";
import type { PieSectorShapeProps } from "recharts";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/Card";
import type { AnalyticsDistribution } from "@/types/analytics";

// Same three segment colours as the Overview donut: brand, accent, then brand
// at 25% opacity for the light-lavender third slice.
const SEGMENTS = [
  { color: "var(--brand)", opacity: 1 },
  { color: "var(--accent)", opacity: 1 },
  { color: "var(--brand)", opacity: 0.25 },
];

const GROW_PX = 6;

interface CategoryDistributionCardProps {
  distribution: AnalyticsDistribution;
}

// Donut with the total in the centre and an interactive legend. Clicking a
// segment or legend row grows it and dims the others; hovering previews.
// Clicking again or tapping outside clears the selection.
export function CategoryDistributionCard({
  distribution,
}: CategoryDistributionCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef(false);
  const activeIndex = hoverIndex ?? selectedIndex;
  const active = activeIndex !== null ? distribution.slices[activeIndex] : null;

  function clearAll() {
    setSelectedIndex(null);
    setHoverIndex(null);
  }

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      touchRef.current = event.pointerType === "touch";
      if (!wrapRef.current?.contains(event.target as Node)) clearAll();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") clearAll();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function isFocusVisible(el: Element): boolean {
    try {
      return el.matches(":focus-visible");
    } catch {
      return false;
    }
  }

  const hover = (i: number) => setHoverIndex(i);
  const unhover = () => setHoverIndex(null);
  const toggle = (i: number) =>
    setSelectedIndex((prev) => (prev === i ? null : i));

  const data = distribution.slices.map((slice, i) => ({
    ...slice,
    fill: SEGMENTS[i % SEGMENTS.length].color,
    fillOpacity: SEGMENTS[i % SEGMENTS.length].opacity,
  }));

  const renderSector = (props: PieSectorShapeProps) => {
    const index = props.index;
    const isActive = index === activeIndex;
    const dim = !isActive && activeIndex !== null;
    const seg = SEGMENTS[index % SEGMENTS.length];
    const base = Number(props.outerRadius ?? 0);
    return (
      <Sector
        {...props}
        outerRadius={base + (isActive ? GROW_PX : 0)}
        fill={seg.color}
        fillOpacity={dim ? 0.4 : seg.opacity}
        style={{ transition: "fill-opacity 150ms ease" }}
      />
    );
  };

  return (
    <Card title={distribution.title}>
      {/* Zero slices = the window had no requests (counts sum to the total),
          so an empty note replaces the donut instead of an empty chart. */}
      {distribution.slices.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink-muted">
          No data for this range
        </p>
      ) : (
      <div ref={wrapRef} className="flex flex-col items-center gap-5">
        <div
          role="img"
          aria-label={distribution.summary}
          className="relative size-40"
          style={{ outline: "none" }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="percent"
                nameKey="name"
                innerRadius="68%"
                outerRadius="100%"
                paddingAngle={2}
                stroke="none"
                startAngle={90}
                endAngle={-270}
                isAnimationActive={false}
                shape={renderSector}
                onMouseEnter={(_, index) => {
                  if (!touchRef.current) hover(index);
                }}
                onMouseLeave={unhover}
                onClick={(_, index) => toggle(index)}
              >
                {data.map((_, i) => (
                  <Cell key={i} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div
            aria-live="polite"
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center"
          >
            {active ? (
              <>
                <span className="text-2xl font-bold text-ink">
                  {active.value}
                </span>
                <span className="text-xs text-ink-subtle">
                  {active.name} · {active.percent}%
                </span>
              </>
            ) : (
              <>
                <span className="text-2xl font-bold text-ink">
                  {distribution.total}
                </span>
                <span className="text-xs text-ink-subtle">
                  {distribution.caption}
                </span>
              </>
            )}
          </div>
        </div>

        <ul className="w-full max-w-60 space-y-2 sm:w-auto">
          {data.map((slice, i) => {
            const isActive = activeIndex === i;
            return (
              <li key={slice.name}>
                <button
                  type="button"
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") hover(i);
                  }}
                  onPointerLeave={unhover}
                  onFocus={(event) => {
                    if (isFocusVisible(event.currentTarget)) hover(i);
                  }}
                  onBlur={unhover}
                  onClick={() => toggle(i)}
                  aria-pressed={selectedIndex === i}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                    isActive ? "bg-brand-soft" : ""
                  }`}
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: SEGMENTS[i % SEGMENTS.length].color,
                      opacity: SEGMENTS[i % SEGMENTS.length].opacity,
                    }}
                    aria-hidden="true"
                  />
                  <span className="text-ink-muted">{slice.name}</span>
                  <span className="ml-auto font-semibold text-ink">
                    {slice.value}
                  </span>
                  <span className="w-9 text-right text-xs text-ink-subtle">
                    {slice.percent}%
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      )}
    </Card>
  );
}
