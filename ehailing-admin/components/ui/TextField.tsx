import type { InputHTMLAttributes, ReactNode } from "react";

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string;
  label: string;
  icon?: ReactNode;
  error?: string;
  trailing?: ReactNode;
  // Visually hides the label (screen readers still announce it). Used when the
  // visible label lives elsewhere, e.g. Platform Settings rows.
  hideLabel?: boolean;
}

export function TextField({
  id,
  label,
  icon,
  error,
  trailing,
  hideLabel = false,
  className = "",
  ...rest
}: TextFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className={
          hideLabel ? "sr-only" : "text-sm font-medium text-ink"
        }
      >
        {label}
      </label>
      <div className="relative">
        {icon ? (
          <span
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle"
            aria-hidden="true"
          >
            {icon}
          </span>
        ) : null}
        <input
          id={id}
          className={
            "h-12 w-full rounded-xl border bg-surface pl-11 pr-4 text-base text-ink " +
            "placeholder:text-ink-subtle transition-colors " +
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 focus-visible:ring-offset-bg " +
            (error ? "border-danger" : "border-border") +
            (trailing ? " pr-14" : "") +
            (className ? ` ${className}` : "")
          }
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          {...rest}
        />
        {trailing ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {trailing}
          </span>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
