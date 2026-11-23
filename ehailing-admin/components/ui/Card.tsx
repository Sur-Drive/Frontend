import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

// Shared card shell used across the dashboard: surface, border, rounded corners
// and a soft shadow, with an optional title/subtitle header and right slot.
export function Card({
  title,
  subtitle,
  action,
  className = "",
  children,
}: CardProps) {
  const hasHeader = Boolean(title || action);
  return (
    <section
      className={`flex min-w-0 flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm ${className}`}
    >
      {hasHeader ? (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? (
              <h2 className="truncate text-base font-normal text-ink">
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p className="mt-0.5 text-xs text-ink-subtle">{subtitle}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
