"use client";

import { useEffect, useRef, useState } from "react";
import { Sector } from "recharts";
import type { PieSectorShapeProps } from "recharts";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/Card";
import { formatNumber } from "@/lib/format";
import type { CategorySlice } from "@/types/overview";

interface RideCategoryDonutProps {
  // Slices mapped from dashboard.categoryDistribution (validated shape).
  data: CategorySlice[];
  total: number;
  // True when the response carried items without the expected keys — the donut
  // renders "Not available yet" instead of a guessed mapping.
  unavailable?: boolean;
}

// Economy brand, Comfort accent, SUV brand at 25% opacity.
const SEGMENTS = [
  { color: "var(--brand)", opacity: 1 },
  { color: "var(--accent)", opacity: 1 },
  { color: "var(--brand)", opacity: 0.25 },
];

const GROW_PX = 6;

export function RideCategoryDonut({
  data,
  total,
  unavailable,
}: RideCategoryDonutProps) {
  // Same split as the other charts: selected is set only by click, hovered is
  // the temporary mouse/focus preview. One shared state let a click toggle off
  // the selection that the focus and mouseenter of that same click had just made.
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  // True while a touch gesture is in flight so the browser's synthesized mouse
  // events on the SVG sectors don't leave a sticky hover.
  const touchRef = useRef(false);
  const activeIndex = hoverIndex ?? selectedIndex;
  const active = activeIndex !== null ? data[activeIndex] : null;

  function clearAll() {
    setSelectedIndex(null);
    setHoverIndex(null);
  }

  // Tapping outside the donut/legend clears the active segment. Also records
  // whether the current gesture is a touch, so the mouse events the browser
  // synthesizes after a tap don't leave a hover stuck to that sector.
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

  // :focus-visible is the only reliable signal that focus came from a keyboard.
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

  // No slices: the field carried no category data for the day (observed empty
  // while completedToday was 0), so an empty note replaces the chart instead
  // of a zero-width donut. An unrecognised item shape renders "Not available
  // yet" rather than a guessed mapping.
  if (data.length === 0 || unavailable) {
    return (
      <Card title="Ride Category Distribution">
        <p className="flex h-40 items-center justify-center text-center text-sm text-ink-muted">
          {unavailable ? "Not available yet" : "No data for today"}
        </p>
      </Card>
    );
  }

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
    <Card title="Ride Category Distribution">
      <div ref={wrapRef} className="flex flex-col items-center gap-5">
        <div
          role="img"
          aria-label={`Ride category split: ${data
            .map((d) => `${d.name} ${d.percent}%`)
            .join(", ")}.`}
          className="relative size-40"
          style={{ outline: "none" }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="count"
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
                  {formatNumber(active.count)}
                </span>
                <span className="text-xs text-ink-subtle">
                  {active.name} · {active.percent}%
                </span>
              </>
            ) : (
              <>
                <span className="text-2xl font-bold text-ink">
                  {formatNumber(total)}
                </span>
                <span className="text-xs text-ink-subtle">Total rides</span>
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
                    // Touch would otherwise leave a hover stuck to the tapped row.
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
                    {formatNumber(slice.count)}
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
    </Card>
  );
}

