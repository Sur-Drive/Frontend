import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { RatingValue } from "@/components/ui/RatingValue";
import { StatusPill } from "@/components/ui/StatusPill";
import { reviewStatusDisplay } from "@/lib/ratings";
import type { Review } from "@/types/trust";

// One review row: avatar + name + gold rating, the review text ("—" when the
// backend comment is null), then a muted "Ride … • <rated party> … • date"
// line. The status chip renders for every moderation state except the default
// "none" (Published), which the design shows chip-less. The whole row is a
// button that opens the details drawer.
export function ReviewRow({
  review,
  onOpen,
}: {
  review: Review;
  onOpen: () => void;
}) {
  // Raw moderationStatus -> label + tone; unknown values get a humanised
  // label on a neutral chip.
  const status = reviewStatusDisplay(review.status);
  return (
    <li className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`View review by ${review.reviewer.name}`}
        className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
      >
        <InitialsAvatar
          initials={review.reviewer.initials}
          tone={review.reviewer.tone}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-3">
            <span className="flex min-w-0 flex-wrap items-center gap-x-2">
              <span className="truncate text-sm font-semibold text-ink">
                {review.reviewer.name}
              </span>
              <RatingValue value={review.rating} decimals={1} />
            </span>
            {review.status && review.status !== "none" ? (
              <StatusPill tone={status.tone} label={status.label} />
            ) : null}
          </span>
          <span className="mt-1 line-clamp-2 block text-sm text-ink">
            {review.text}
          </span>
          <span className="mt-1 block truncate text-xs text-ink-muted">
            Ride{" "}
            <span className="font-semibold text-ink">{review.rideId}</span>
            {` • ${review.ratedLabel} `}
            {review.rated.name}
            {` • ${review.timeLabel}`}
          </span>
        </span>
      </button>
    </li>
  );
}

