"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { SideSheet } from "@/components/ui/SideSheet";
import { Tabs } from "@/components/ui/Tabs";
import type { TabItem } from "@/components/ui/Tabs";
import { StatusPill } from "@/components/ui/StatusPill";
import { Button } from "@/components/ui/Button";
import { RatingValue } from "@/components/ui/RatingValue";
import { reviewStatusDisplay } from "@/lib/ratings";
import type { ReviewDetailModel } from "@/lib/ratings";
import type { Review } from "@/types/trust";
import type { DetailItem } from "@/types/ride-details";

const TABS: TabItem[] = [
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Timeline" },
  { id: "history", label: "History" },
  { id: "notes", label: "Notes" },
];

// Footer action ids. "flag" shows for every state except the moderation queue
// ("under_review"), "unflag" for queued ones; both go through the parent's
// confirm dialog. "View ride" needs no dialog (it navigates to the Rides page
// with a deep link).
export type ReviewActionId = "flag" | "unflag";

// Dialog title and confirm-button tone for a footer action.
export function reviewActionDialogTitle(action: ReviewActionId): string {
  return action === "flag" ? "Confirm flag review" : "Confirm remove flag";
}

// Primary-styled link matching the drawer footer buttons (mirrors the shared
// EntityDrawer's link variant so "View ride" looks like a button).
const VIEW_RIDE_LINK_CLASS =
  "inline-flex h-11! flex-1 items-center justify-center gap-2 rounded-xl px-5! text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg sm:flex-none " +
  "bg-brand text-white shadow-sm shadow-brand/40 hover:bg-brand-hover";

function InfoCard({ item }: { item: DetailItem }) {
  return (
    <div className="rounded-xl bg-surface-muted p-4">
      <p className="text-xs text-ink-muted">{item.label}</p>
      <p className="mt-1 text-sm font-medium text-ink">
        {item.pill ? (
          <StatusPill tone={item.pill.tone} label={item.pill.label} />
        ) : (
          (item.value ?? "—")
        )}
      </p>
    </div>
  );
}

function InfoGrid({ items }: { items: DetailItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <InfoCard key={item.label} item={item} />
      ))}
    </div>
  );
}

// Data-derived timeline: the submitted step always comes from the list row's
// createdAt; the moderation step only appears once the lazy detail (GET
// /ratings/{id}) supplies a real moderatedAt — never a fabricated time.
// Renders a loading line while the detail is in flight.
function TimelineList({
  steps,
  loading,
}: {
  steps: { title: string; time: string }[];
  loading: boolean;
}) {
  if (steps.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        {loading ? "Loading details…" : "No timeline events yet."}
      </p>
    );
  }
  return (
    <ol className="flex flex-col gap-4">
      {steps.map((step, index) => (
        <li key={step.title} className="relative flex items-start gap-3">
          {index < steps.length - 1 ? (
            <span
              aria-hidden="true"
              className="absolute left-[7.5px] top-5 -bottom-4 w-px bg-border"
            />
          ) : null}
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-success-soft"
          >
            <Check className="size-3 text-success" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-sm font-medium text-ink">{step.title}</span>
            <span className="text-xs text-ink-muted">{step.time}</span>
          </span>
        </li>
      ))}
      {loading ? (
        <li className="flex items-center gap-2 text-sm text-ink-muted">
          <span
            aria-hidden="true"
            className="size-3.5 animate-spin rounded-full border-2 border-border border-t-brand"
          />
          Loading details…
        </li>
      ) : null}
    </ol>
  );
}

// Lazy detail fetch state owned by the view (GET /ratings/{id}). `model` is
// the sanitized, display-ready payload — the raw response never reaches this
// component. While loading, the list row renders underneath.
interface ReviewDetailState {
  loading: boolean;
  error: string | null;
  model: ReviewDetailModel | null;
  onRetry: () => void;
}

interface ReviewDetailsDrawerProps {
  review: Review | null;
  // Null while the drawer is closed or the first fetch has not started.
  detailState: ReviewDetailState | null;
  onClose: () => void;
  // A footer button was clicked; the parent opens its confirm dialog.
  onRequestAction: (action: ReviewActionId) => void;
  // True while the parent's confirm dialog is open, so this sheet stops owning
  // Escape/focus (the dialog owns them while stacked on top).
  actionPending: boolean;
}

// Review details side sheet: full review text, info grid and activity
// timeline on Overview; the footer flips between "Flag review" (danger) and
// "Remove flag" (outline) while "View ride" always deep-links to the Rides
// page.
export function ReviewDetailsDrawer({
  review,
  detailState,
  onClose,
  onRequestAction,
  actionPending,
}: ReviewDetailsDrawerProps) {
  const [tab, setTab] = useState("overview");
  const [prevId, setPrevId] = useState(review?.id ?? null);

  // Reset to the first tab whenever a different review is opened.
  if ((review?.id ?? null) !== prevId) {
    setPrevId(review?.id ?? null);
    setTab("overview");
  }

  if (!review) return null;

  // The list row renders immediately; the lazy detail (timeline moderation
  // step, last-updated label) fills in when it arrives. Only display fields
  // are ever shown.
  const model = detailState?.model ?? null;
  const status = reviewStatusDisplay(review.status);

  // Queued reviews ("under_review") offer the remove-flag action; every other
  // state offers flag.
  const action: ReviewActionId =
    review.status === "under_review" ? "unflag" : "flag";

  const infoItems: DetailItem[] = [
    { label: "Review ID", value: review.id },
    {
      label: "Rating",
      value: review.rating === null ? "—" : review.rating.toFixed(1),
    },
    { label: review.reviewerLabel, value: review.reviewer.name },
    { label: review.ratedLabel, value: review.rated.name },
    { label: "Ride", value: review.rideId },
    { label: "Date", value: review.timeLabel },
    {
      label: "Status",
      value: null,
      pill: { tone: status.tone, label: status.label },
    },
  ];

  const subtitle = model?.updatedLabel
    ? `Ride ${review.rideId} • Last updated ${model.updatedLabel}`
    : `Ride ${review.rideId}`;

  // Submitted always; the moderation step only once the detail confirms a
  // real moderatedAt (never fabricated).
  const steps = [
    { title: "Review submitted", time: review.timeLabel },
    ...(model?.moderatedStep ? [model.moderatedStep] : []),
  ];

  return (
    <SideSheet
      open
      onClose={onClose}
      eyebrow="REVIEW DETAILS"
      title={review.reviewer.name}
      subtitle={subtitle}
      headerExtras={
        <>
          <RatingValue value={review.rating} className="mr-2" />
          <Tabs tabs={TABS} value={tab} onChange={setTab} />
        </>
      }
      footer={
        <>
          <Button
            key={action}
            variant={action === "flag" ? "danger" : "secondary"}
            onClick={() => onRequestAction(action)}
            className="h-11! flex-1 px-5! sm:flex-none"
          >
            {action === "flag" ? "Flag review" : "Remove flag"}
          </Button>
          <Link
            href={`/admin/ride-management?ride=${review.rideId}`}
            className={VIEW_RIDE_LINK_CLASS}
          >
            View ride
          </Link>
        </>
      }
      // While the confirm dialog is open it owns Escape, focus and clicks.
      closeOnEscape={!actionPending}
      trapFocus={!actionPending}
    >
      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        tabIndex={0}
        className="outline-none"
      >
        {/* Lazy detail fetch state (GET /ratings/{id}): loading line or error
            banner with Retry, mirroring EntityDrawer's detailState. The list
            row keeps rendering underneath either way. */}
        {detailState && (detailState.loading || detailState.error) ? (
          detailState.loading ? (
            <div
              role="status"
              aria-busy="true"
              className="mb-4 flex items-center gap-2 text-sm text-ink-muted"
            >
              <span
                className="size-3.5 animate-spin rounded-full border-2 border-border border-t-brand"
                aria-hidden="true"
              />
              Loading details…
            </div>
          ) : (
            <div
              role="alert"
              className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-danger-soft px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="min-w-0 text-sm font-medium text-danger">
                {detailState.error}
              </p>
              <Button
                variant="secondary"
                onClick={detailState.onRetry}
                className="shrink-0 self-start sm:self-auto"
              >
                Retry
              </Button>
            </div>
          )
        ) : null}
        {tab === "overview" ? (
          <div className="flex flex-col gap-6">
            <section>
              <h3 className="text-base font-normal text-ink">Review</h3>
              <div className="mt-3 border-t border-border pt-3">
                <p className="text-sm leading-relaxed text-ink">
                  {review.text}
                </p>
              </div>
            </section>
            <section>
              <h3 className="text-base font-normal text-ink">
                Review details
              </h3>
              <div className="mt-3 border-t border-border pt-3">
                <InfoGrid items={infoItems} />
              </div>
            </section>
            <section>
              <h3 className="text-base font-normal text-ink">
                Activity timeline
              </h3>
              <div className="mt-3 border-t border-border pt-3">
                <TimelineList
                  steps={steps}
                  loading={detailState?.loading ?? false}
                />
              </div>
            </section>
          </div>
        ) : null}

        {tab === "timeline" ? (
          <TimelineList
            steps={steps}
            loading={detailState?.loading ?? false}
          />
        ) : null}

        {tab === "history" ? (
          // No history endpoint exists for ratings; the tab stays in place
          // with the app's availability note (same treatment as the safety
          // incident drawer's endpoint-less tab).
          <p className="px-1 py-8 text-center text-sm text-ink-muted">
            Not available yet
          </p>
        ) : null}

        {tab === "notes" ? (
          <div>
            <label
              htmlFor="review-notes"
              className="text-sm font-medium text-ink"
            >
              Internal notes
            </label>
            {/* The backend stores no note field for reviews (only
                moderationNotes on a moderation decision — lib/ratings.ts), so
                the controls keep their slots disabled with a "Not saved yet"
                helper, matching the ConfirmDialog noteDisabled treatment. */}
            <span title="Not available yet" className="block">
              <textarea
                id="review-notes"
                disabled
                placeholder="Add an internal note about this review..."
                className="mt-2 min-h-32 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
              />
            </span>
            <div className="mt-3">
              <span title="Not available yet" className="inline-block">
                <Button variant="primary" disabled className="h-11! px-5!">
                  Save note
                </Button>
              </span>
              <p className="mt-1 text-xs text-ink-muted">Not saved yet</p>
            </div>
          </div>
        ) : null}
      </div>
    </SideSheet>
  );
}
