"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarRange, ChevronDown } from "lucide-react";
import { Button } from "./Button";

export interface DateRangePreset {
  id: string;
  label: string;
}

interface DateRangePopoverProps {
  presets: DateRangePreset[];
  // Highlighted preset; null while a custom window is active.
  activePresetId: string | null;
  onPreset: (id: string) => void;
  onCustom: (from: string, to: string) => void;
  // Label on the trigger button (the active selection).
  triggerLabel: string;
  // Prefill for the custom inputs (ISO yyyy-mm-dd).
  defaultFrom?: string;
  defaultTo?: string;
  // Opens the panel on mount (e.g. right after the user picks "Custom Date").
  openOnMount?: boolean;
  align?: "left" | "right";
  className?: string;
}

// Shared date-range control: a trigger button (calendar icon + current
// selection) opening a panel with preset ranges plus a Custom section (From/To
// native date inputs + Apply, blocked when From > To). Escape and outside
// clicks close it and return focus to the trigger. Dates are plain ISO
// yyyy-mm-dd strings — callers convert them (daysAgo, URL params).
export function DateRangePopover({
  presets,
  activePresetId,
  onPreset,
  onCustom,
  triggerLabel,
  defaultFrom,
  defaultTo,
  openOnMount = false,
  align = "left",
  className,
}: DateRangePopoverProps) {
  const [open, setOpen] = useState(openOnMount);
  const [from, setFrom] = useState(defaultFrom ?? "");
  const [to, setTo] = useState(defaultTo ?? "");
  const [error, setError] = useState<string | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click and Escape (focus returns to the trigger).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !panelRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function applyCustom() {
    // ISO yyyy-mm-dd strings compare correctly in lexicographic order.
    if (!from || !to) {
      setError("Choose both a start and an end date.");
      return;
    }
    if (from > to) {
      setError("The start date cannot be after the end date.");
      return;
    }
    setError(null);
    setOpen(false);
    triggerRef.current?.focus();
    onCustom(from, to);
  }

  return (
    <div className={className ?? "relative w-full min-w-0 sm:w-auto"}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:w-auto"
      >
        <span className="flex items-center gap-2">
          <CalendarRange
            className="size-4 shrink-0 text-ink-muted"
            aria-hidden="true"
          />
          {triggerLabel}
        </span>
        <ChevronDown
          className="size-4 shrink-0 text-ink-muted"
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Choose a date range"
          className={`absolute top-full z-40 mt-2 w-72 rounded-2xl border border-border bg-surface p-4 shadow-lg ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          <div
            role="group"
            aria-label="Preset ranges"
            className="flex flex-col gap-1"
          >
            {presets.map((preset) => {
              const active = preset.id === activePresetId;
              return (
                <button
                  key={preset.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setOpen(false);
                    triggerRef.current?.focus();
                    onPreset(preset.id);
                  }}
                  className={`rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                    active
                      ? "bg-brand-soft font-semibold text-brand"
                      : "text-ink hover:bg-surface-muted"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="mt-3 border-t border-border pt-3">
            <p className="text-sm font-medium text-ink">Custom</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-ink-muted">
                From
                <input
                  type="date"
                  value={from}
                  max={to || undefined}
                  onChange={(event) => {
                    setFrom(event.target.value);
                    setError(null);
                  }}
                  className="h-10 w-full min-w-0 rounded-lg border border-border bg-surface px-2 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:text-sm"
                />
              </label>
              <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-ink-muted">
                To
                <input
                  type="date"
                  value={to}
                  min={from || undefined}
                  onChange={(event) => {
                    setTo(event.target.value);
                    setError(null);
                  }}
                  className="h-10 w-full min-w-0 rounded-lg border border-border bg-surface px-2 text-base text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:text-sm"
                />
              </label>
            </div>
            {error ? (
              <p role="alert" className="mt-2 text-xs text-danger">
                {error}
              </p>
            ) : null}
            <Button className="mt-3 w-full" onClick={applyCustom}>
              Apply
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
