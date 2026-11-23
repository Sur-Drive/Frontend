"use client";

import { useState } from "react";

// Distinct From / To date pickers with invalid-range validation. Draft values
// are kept in local state so an invalid intermediate range (empty or reversed)
// never reaches the URL; onChange only fires when the range is valid.
//
// Invalid when:
//   - either input is empty, or
//   - To is chronologically before From.
//
// While invalid: the offending input(s) get a warning border/ring, the badge
// becomes a soft-danger "Invalid range" pill, and onChange is suppressed.
interface DateRangeControlsProps {
  from: string; // ISO yyyy-mm-dd (inclusive)
  to: string; // ISO yyyy-mm-dd (inclusive)
  onChange: (from: string, to: string) => void;
}

export function DateRangeControls({
  from,
  to,
  onChange,
}: DateRangeControlsProps) {
  // Local draft values so an invalid intermediate range never propagates.
  // Drafts stay in sync with props because onChange only fires for valid
  // ranges, which updates the URL and re-renders this component with matching
  // props; no effect-based sync is needed.
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);

  const fromEmpty = !draftFrom;
  const toEmpty = !draftTo;
  const isReversed = Boolean(draftFrom && draftTo && draftTo < draftFrom);
  const isInvalid = fromEmpty || toEmpty || isReversed;

  const fromError = fromEmpty;
  const toError = toEmpty || isReversed;

  const handleFromChange = (value: string) => {
    setDraftFrom(value);
    const newToEmpty = !draftTo;
    const newIsReversed = Boolean(value && draftTo && draftTo < value);
    if (!value || newToEmpty || newIsReversed) return;
    onChange(value, draftTo);
  };

  const handleToChange = (value: string) => {
    setDraftTo(value);
    const newFromEmpty = !draftFrom;
    const newIsReversed = Boolean(draftFrom && value && value < draftFrom);
    if (!value || newFromEmpty || newIsReversed) return;
    onChange(draftFrom, value);
  };

  const errorRing = "ring-2 ring-warning/20";
  const errorBorder = "border-warning";
  const focusRing = "focus-visible:outline-none focus-visible:ring-warning";

  const baseInput =
    "h-10 w-full min-w-0 rounded-lg border bg-surface px-2 text-base text-ink sm:text-sm";

  const fromClassName = `${baseInput} ${fromError ? errorBorder : "border-border"} ${errorRing} ${focusRing}`;
  const toClassName = `${baseInput} ${toError ? errorBorder : "border-border"} ${errorRing} ${focusRing}`;

  const badgeClassName = isInvalid
    ? "inline-flex items-center gap-2 rounded-xl border border-danger bg-danger-soft px-3 py-1.5 text-xs font-medium text-danger whitespace-nowrap"
    : "inline-flex items-center gap-2 rounded-xl border border-border bg-brand-soft px-3 py-1.5 text-xs font-medium text-brand whitespace-nowrap";

  const dotClassName = isInvalid ? "bg-danger" : "bg-brand";

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-3">
      <div className="flex min-w-0 flex-col gap-1">
        <label className="text-xs font-medium text-ink-muted">From</label>
        <input
          type="date"
          value={draftFrom}
          max={draftTo || undefined}
          onChange={(event) => handleFromChange(event.target.value)}
          className={fromClassName}
          aria-invalid={fromError || undefined}
        />
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <label className="text-xs font-medium text-ink-muted">To</label>
        <input
          type="date"
          value={draftTo}
          min={draftFrom || undefined}
          onChange={(event) => handleToChange(event.target.value)}
          className={toClassName}
          aria-invalid={toError || undefined}
        />
      </div>
      <span
        aria-label={isInvalid ? "Invalid range" : `Active range ${draftFrom} to ${draftTo}`}
        className={badgeClassName}
      >
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${dotClassName}`}
          aria-hidden="true"
        />
        {isInvalid ? "Invalid range" : `${draftFrom} to ${draftTo}`}
      </span>
    </div>
  );
}
