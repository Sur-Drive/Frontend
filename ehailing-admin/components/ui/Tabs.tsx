"use client";

import { useRef } from "react";

export interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange: (id: string) => void;
}

// Accessible tablist with a roving tabindex and Arrow/Home/End keys. The row
// scrolls inside itself on narrow screens so it never widens the page.
export function Tabs({ tabs, value, onChange }: TabsProps) {
  const listRef = useRef<HTMLDivElement>(null);

  function moveTo(index: number) {
    const clamped = (index + tabs.length) % tabs.length;
    onChange(tabs[clamped].id);
    const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>(
      '[role="tab"]',
    );
    buttons?.[clamped]?.focus();
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      className="no-scrollbar flex gap-1 overflow-x-auto border-b border-border"
    >
      {tabs.map((tab) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => {
              const index = tabs.findIndex((item) => item.id === tab.id);
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
                moveTo(tabs.length - 1);
              }
            }}
            className={`relative shrink-0 px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              selected
                ? "font-semibold text-brand"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {tab.label}
            {selected ? (
              <span
                aria-hidden="true"
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
