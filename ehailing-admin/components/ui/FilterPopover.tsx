"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Funnel } from "lucide-react";

interface FilterPopoverProps {
  activeCount: number;
  onClear: () => void;
  children: ReactNode;
}

export function FilterPopover({
  activeCount,
  onClear,
  children,
}: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
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

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <Funnel className="size-4" aria-hidden="true" />
        Filters
        {activeCount > 0 ? (
          <span
            aria-hidden="true"
            className="flex size-5 items-center justify-center rounded-full bg-brand-soft text-[11px] font-semibold text-brand"
          >
            {activeCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Filters"
          className="absolute left-0 top-full z-40 mt-2 w-72 rounded-2xl border border-border bg-surface p-4 shadow-lg"
        >
          <div className="flex flex-col gap-3">{children}</div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onClear}
              className="rounded px-1 text-sm font-medium text-brand transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              Clear all
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
