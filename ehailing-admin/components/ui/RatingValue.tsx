import { Star } from "lucide-react";

interface RatingValueProps {
  // null renders as an em dash (unrated).
  value: number | null;
  // Decimal places to show, e.g. 5 -> "5.0" with 1 and 4.92 with 2.
  decimals?: number;
  className?: string;
}

// Filled warning-coloured star plus the rating (e.g. 4.9 or 4.92), text-sm.
// Unrated rows keep the star and show an em dash instead of a value.
export function RatingValue({
  value,
  decimals = 1,
  className = "",
}: RatingValueProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-sm text-ink ${className}`.trim()}
    >
      <Star
        className="size-3.5 shrink-0 fill-warning text-warning"
        aria-hidden="true"
      />
      {value === null ? "—" : value.toFixed(decimals)}
    </span>
  );
}
