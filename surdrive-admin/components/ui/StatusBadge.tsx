type StatusBadgeProps = {
  label: string;
  /** Tailwind color classes for the badge, e.g. 'bg-[#E9F9F1] text-[#17A277]' */
  className: string;
};

/**
 * Pilled status label with a leading filled dot. The dot inherits the badge's
 * text color via `bg-current`, so it always matches the status color.
 */
export function StatusBadge({ label, className }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${className}`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
}