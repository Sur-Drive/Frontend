'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { XIcon } from '@/components/ui/icons/XIcon';
import { ChevronDownIcon } from '@/components/ui/icons/ChevronDownIcon';
import { FilterIcon } from '@/components/ui/icons/FilterIcon';
import { useModalBehavior } from '@/lib/useModalBehavior';
import { computePanelPlacement, type PanelPlacement } from '@/lib/panelPlacement';

export type FilterOption = { value: string; label: string };

type FilterPopoverProps = {
  open: boolean;
  /** Toggles the popover from the trigger button. */
  onToggle: () => void;
  onClose: () => void;
  /** Optional status tabs rendered inside the popover (e.g. SUCCESS / FAILED / PENDING). */
  statusOptions?: FilterOption[];
  activeStatus?: string | null;
  onStatusChange: (value: string) => void;
  /** Optional inclusive date range inputs (local dates, 'YYYY-MM-DD'). */
  showDateRange?: boolean;
  dateFrom?: string | null;
  dateTo?: string | null;
  onDateChange: (next: { from: string | null; to: string | null }) => void;
  onClearAll: () => void;
};

/**
 * Reusable filter popover built on the app's existing click-outside menu
 * pattern (same as SubscriptionActionsMenu / FleetActionsMenu). Changes apply
 * immediately — each selection rewrites the URL and refetches the list via the
 * parent's hook bindings.
 */
export function FilterPopover({
  open,
  onToggle,
  onClose,
  statusOptions,
  activeStatus,
  onStatusChange,
  showDateRange = false,
  dateFrom,
  dateTo,
  onDateChange,
  onClearAll,
}: FilterPopoverProps) {
  // Escape closes through the same path as the backdrop and the close button.
  // No scroll lock: this is a dropdown, not a modal.
  useModalBehavior({ open, onClose, lockScroll: false });

  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Measured placement: the panel flips right/up only when the natural
  // placement would overflow the viewport (trigger near the right edge or
  // bottom edge of the window).
  const [placement, setPlacement] = useState<PanelPlacement>({ x: 'left', y: 'down' });
  const [localFrom, setLocalFrom] = useState(dateFrom ?? '');
  const [localTo, setLocalTo] = useState(dateTo ?? '');

  // Measure after open, BEFORE paint (useLayoutEffect), so the correction
  // never flashes in the overflowing position. Recompute on resize.
  useLayoutEffect(() => {
    if (!open) return;
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel) return;

    const update = () => {
      const r = root.getBoundingClientRect();
      setPlacement((prev) => {
        const next = computePanelPlacement(
          { left: r.left, right: r.right, top: r.top, bottom: r.bottom },
          { width: panel.offsetWidth, height: panel.offsetHeight },
          { width: window.innerWidth, height: window.innerHeight },
        );
        return prev.x === next.x && prev.y === next.y ? prev : next;
      });
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [open]);

  // Close on click-outside.
  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open, onClose]);

  // Keep local date inputs in sync with controlled values.
  useEffect(() => {
    setLocalFrom(dateFrom ?? '');
    setLocalTo(dateTo ?? '');
  }, [dateFrom, dateTo]);

  const handleClearAll = () => {
    onClearAll();
    onClose();
  };

  const trigger = (
    <button
      type="button"
      onClick={onToggle}
      aria-haspopup="listbox"
      aria-expanded={open}
      className="flex items-center gap-2 rounded-full border border-line-pill px-3.5 py-1.5 text-sm text-ink-secondary transition-colors hover:border-line-hover"
    >
      <FilterIcon className="h-4 w-4" />
      Filter
      <ChevronDownIcon className="h-4 w-4 text-ink-tertiary" />
    </button>
  );

  if (!open) return trigger;

  const panelPosition = [
    placement.x === 'right' ? 'right-0' : 'left-0',
    placement.y === 'up' ? 'bottom-full mb-2' : 'top-full mt-2',
  ].join(' ');

  return (
    <div ref={rootRef} className="relative z-50">
      {trigger}
      <div
        ref={panelRef}
        className={`absolute ${panelPosition} w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-line-card bg-surface-card p-4 shadow-lg`}
      >
        {statusOptions && statusOptions.length > 0 && (
          <>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-ink-tertiary">
              Status
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {statusOptions.map((option) => {
                const active = activeStatus === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onStatusChange(option.value);
                      onClose();
                    }}
                    className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-brand-primary text-white'
                        : 'border border-line-pill text-ink-secondary hover:bg-surface-hover hover:text-ink-primary'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {showDateRange && (
          <>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-ink-tertiary">
              Date range
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-ink-tertiary">From</label>
                <input
                  type="date"
                  value={localFrom}
                  onChange={(event) =>
                    onDateChange({
                      from: event.target.value || null,
                      to: localTo || null,
                    })
                  }
                  className="h-9 w-full rounded-lg border border-line-pill bg-surface-card px-3 py-2 text-sm text-ink-primary outline-none transition-colors focus:border-brand-primary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-ink-tertiary">To</label>
                <input
                  type="date"
                  value={localTo}
                  onChange={(event) =>
                    onDateChange({
                      from: localFrom || null,
                      to: event.target.value || null,
                    })
                  }
                  className="h-9 w-full rounded-lg border border-line-pill bg-surface-card px-3 py-2 text-sm text-ink-primary outline-none transition-colors focus:border-brand-primary"
                />
              </div>
            </div>
          </>
        )}

        <div className="mt-4 flex items-center justify-end gap-3 pt-4 border-t border-line-divider">
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs font-medium text-ink-secondary underline underline-offset-2 transition-colors hover:text-ink-primary"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filter panel"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-tertiary transition-colors hover:bg-surface-hover hover:text-ink-primary"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}