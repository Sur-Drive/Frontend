import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  fullWidth?: boolean;
  variant?: "primary" | "secondary" | "danger";
  ref?: Ref<HTMLButtonElement>;
  children: ReactNode;
}

export function Button({
  loading = false,
  fullWidth = false,
  variant = "primary",
  children,
  className = "",
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors " +
    "focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg " +
    "disabled:cursor-not-allowed disabled:opacity-70";

  const variants: Record<"primary" | "secondary" | "danger", string> = {
    primary:
      "bg-brand px-5 h-12 text-white shadow-sm shadow-brand/40 hover:bg-brand-hover",
    secondary:
      "bg-surface px-5 h-12 text-ink border border-border hover:bg-brand-soft",
    danger:
      "bg-danger px-5 h-12 text-white shadow-sm shadow-danger/40 hover:bg-danger/90 focus-visible:ring-danger",
  };

  const width = fullWidth ? "w-full" : "";

  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${width} ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
}

