"use client";

import type { ReactNode, SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  // Simple label list; use children instead when option values differ.
  options?: string[];
  children?: ReactNode;
}

// Native select styled like the dashboard's "All cities" control: surface,
// border, rounded-xl, fixed height and a chevron that never blocks the click.
export function Select({
  label,
  options,
  children,
  className = "",
  ...rest
}: SelectProps) {
  return (
    <div className={`relative min-w-0 ${className}`}>
      <select
        aria-label={label}
        className="h-11 w-full appearance-none rounded-xl border border-border bg-surface pl-3 pr-9 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50"
        {...rest}
      >
        {options
          ? options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))
          : children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
        aria-hidden="true"
      />
    </div>
  );
}
