// Status colour convention: success = complete or healthy; info = in flight
// (the system or a driver is working on it); brand = a trip underway;
// warning = waiting on an admin or needs attention; danger = failed or
// urgent; neutral = inactive, or waiting on someone other than the admin.
export type StatusTone =
  | "brand"
  | "neutral"
  | "warning"
  | "danger"
  | "success"
  | "info";

const PILL_BG: Record<StatusTone, string> = {
  brand: "bg-brand-soft",
  neutral: "bg-surface-muted",
  warning: "bg-warning-soft",
  danger: "bg-danger-soft",
  success: "bg-success-soft",
  info: "bg-info-soft",
};

const PILL_TEXT: Record<StatusTone, string> = {
  brand: "text-brand",
  neutral: "text-ink-muted",
  warning: "text-warning",
  danger: "text-danger",
  success: "text-success",
  info: "text-info",
};

const DOT_BG: Record<StatusTone, string> = {
  brand: "bg-brand",
  neutral: "bg-ink-subtle",
  warning: "bg-warning",
  danger: "bg-danger",
  success: "bg-success",
  info: "bg-info",
};

interface StatusPillProps {
  tone: StatusTone;
  label: string;
}

export function StatusPill({ tone, label }: StatusPillProps) {
  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center gap-1.5 self-start rounded-full px-3 py-1 text-xs font-semibold ${PILL_BG[tone]} ${PILL_TEXT[tone]}`}
    >
      <span className={`size-1.5 rounded-full ${DOT_BG[tone]}`} aria-hidden="true" />
      {label}
    </span>
  );
}
