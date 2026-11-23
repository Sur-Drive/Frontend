"use client";

import { useRef } from "react";
import { CATEGORY_IDS, CATEGORY_META } from "@/types/analytics";
import type { CategoryId } from "@/types/analytics";

interface CategoryTabsProps {
  value: CategoryId;
  onChange: (category: CategoryId) => void;
}

// Five equal-width category cards that behave as tabs (role="tablist"/"tab" with
// arrow-key navigation). Horizontally scrollable on mobile, 2 columns on tablet.
export function CategoryTabs({ value, onChange }: CategoryTabsProps) {
  const listRef = useRef<HTMLDivElement>(null);

  function moveTo(index: number) {
    const clamped = (index + CATEGORY_IDS.length) % CATEGORY_IDS.length;
    const id = CATEGORY_IDS[clamped];
    onChange(id);
    const buttons =
      listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons?.[clamped]?.focus();
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label="Analytics category"
      className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 xl:grid-cols-5"
    >
      {CATEGORY_IDS.map((id, index) => {
        const meta = CATEGORY_META[id];
        const Icon = meta.icon;
        const active = id === value;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            id={`analytics-tab-${id}`}
            aria-selected={active}
            aria-controls="analytics-panel"
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(id)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") {
                event.preventDefault();
                moveTo(index + 1);
              } else if (event.key === "ArrowLeft") {
                event.preventDefault();
                moveTo(index - 1);
              } else if (event.key === "Home") {
                event.preventDefault();
                moveTo(0);
              } else if (event.key === "End") {
                event.preventDefault();
                moveTo(CATEGORY_IDS.length - 1);
              }
            }}
            className={`flex w-56 min-w-0 shrink-0 snap-start items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:w-auto ${
              active
                ? "border-brand bg-brand-soft"
                : "border-border bg-surface hover:border-brand/40"
            }`}
          >
            <span
              aria-hidden="true"
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                active ? "bg-brand text-white" : "bg-surface-muted text-ink-muted"
              }`}
            >
              <Icon className="size-5" />
            </span>
            <span className="min-w-0 text-sm font-medium text-ink">
              {meta.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
