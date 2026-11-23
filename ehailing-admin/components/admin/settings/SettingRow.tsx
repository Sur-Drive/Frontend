import type { ReactNode } from "react";

// One settings row: bold label + muted helper on the left, the control on the
// right (about 55% on sm+, stacked on mobile), hairline divider below.
export function SettingRow({
  label,
  helper,
  controlId,
  error,
  warning,
  children,
}: {
  label: string;
  helper: string;
  controlId: string;
  error?: string;
  warning?: string;
  children: ReactNode;
}) {
  const messageId = error ? `${controlId}-error` : warning ? `${controlId}-warning` : undefined;
  return (
    <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0 sm:max-w-[45%]">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="mt-1 text-xs text-ink-muted">{helper}</p>
      </div>
      <div className="min-w-0 sm:w-[55%] sm:max-w-md">
        {children}
        {error ? (
          <p id={messageId} role="alert" className="mt-1.5 text-xs text-danger">
            {error}
          </p>
        ) : warning ? (
          <p id={messageId} className="mt-1.5 text-xs text-warning">
            {warning}
          </p>
        ) : null}
      </div>
    </div>
  );
}

// Toggle rows use the same shell with the switch as the control.
export function SettingToggleRow({
  label,
  helper,
  control,
}: {
  label: string;
  helper: string;
  control: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-5">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="mt-0.5 text-xs text-ink-muted">{helper}</p>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}
