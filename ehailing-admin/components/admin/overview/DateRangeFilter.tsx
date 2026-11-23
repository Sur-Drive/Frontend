"use client";

import type { ReactNode } from "react";
import { CalendarRange, ChevronDown } from "lucide-react";
import { PERIOD_IDS, PERIOD_LABELS } from "@/types/analytics";
import type { PeriodId } from "@/types/analytics";

interface DateRangeFilterProps {
  value: PeriodId;
  onChange: (period: PeriodId) => void;
  // Replaces the static readout while "Custom Date" is active — the shared
  // DateRangePopover trigger + panel (Analytics passes it; Overview does not,
  // so that page keeps the plain "Last 14 days" readout).
  customPopover?: ReactNode;
}

// Shared period control, extracted from the Overview header so Analytics reuses
// the exact same markup: a bordered white card with a filled brand pill on the
// active segment. The custom slot renders either the caller's popover or the
// static last-14-days readout (derived from props, so a deep link
// (?period=custom) renders identically on the server and the client).
export function DateRangeFilter({ value, onChange, customPopover }: DateRangeFilterProps) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <div className="-mx-1 min-w-0 overflow-x-auto px-1 sm:mx-0 sm:px-0">
        <div
          role="group"
          aria-label="Date range"
          className="inline-flex rounded-xl border border-border bg-surface p-1"
        >
          {PERIOD_IDS.map((period) => {
            const active = period === value;
            return (
              <button
                key={period}
                type="button"
                aria-pressed={active}
                onClick={() => onChange(period)}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:text-sm ${
                  active
                    ? "bg-brand text-white shadow-sm"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {PERIOD_LABELS[period]}
              </button>
            );
          })}
        </div>
      </div>

      {value === "custom" ? (
        customPopover ?? (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs text-ink-muted">
            <CalendarRange className="size-4 shrink-0 text-ink-subtle" aria-hidden="true" />
            <span className="whitespace-nowrap">Last 14 days</span>
            <ChevronDown className="size-4 shrink-0 text-ink-subtle" aria-hidden="true" />
          </div>
        )
      ) : null}
    </div>
  );
}
