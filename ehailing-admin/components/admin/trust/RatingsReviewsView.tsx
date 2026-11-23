"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { AlertTriangle, Download, Plus, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { FilterPopover } from "@/components/ui/FilterPopover";
import { Pagination, PAGE_SIZE } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/admin/PageHeader";
import { RecordsToolbar } from "@/components/admin/RecordsToolbar";
import { StatCard } from "@/components/admin/StatCard";
import {
  RecordsError,
  RecordsSkeleton,
} from "@/components/admin/records/RecordsListState";
import { useRecordsQuery } from "@/lib/hooks/useRecordsQuery";
import { useConfirmedExport } from "@/lib/hooks/useConfirmedExport";
import { downloadCsv, toCsv } from "@/lib/csv";
import { entityActionMessage } from "@/lib/toast-messages";
import {
  REVIEW_STATUS_OPTIONS,
  averageLabel,
  fetchRatingDetail,
  fetchRatingsPage,
  fetchRatingsStats,
  mapRatingDetail,
  mapRatingListItem,
  mapRatingsSummary,
  reviewStatusDisplay,
  runReviewAction,
  statLabel,
} from "@/lib/ratings";
import type { ReviewDetailModel } from "@/lib/ratings";
import type { RatingsStatsResponse } from "@/types/ratings-api";
import type { Review } from "@/types/trust";
import { ReviewRow } from "./ReviewParts";
import {
  ReviewDetailsDrawer,
  reviewActionDialogTitle,
} from "./ReviewDetailsDrawer";
import type { ReviewActionId } from "./ReviewDetailsDrawer";

// The flag/unflag PATCHes MAY notify the review author or the rated user — the
// backend does not document who, if anyone, is notified, so the confirm dialog
// says so (see runReviewAction in lib/ratings.ts).
const CONFIRM_DESCRIPTION =
  "This action may notify the review's author or the rated user. Please confirm you want to continue.";

const ALL = "all";
const ALL_STATUSES_LABEL = "All statuses";

const RATING_OPTIONS = ["all", "5", "4", "3", "2", "1"];

const CSV_COLUMNS = [
  "Reviewer",
  "Rating",
  "Review",
  "Ride",
  "Rated",
  "Date",
  "Status",
];

export function RatingsReviewsView() {
  const toast = useToast();
  const confirmedExport = useConfirmedExport();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Stats: data null = not loaded or failed -> the cards render "—"; a loaded
  // response shows the endpoint's true zeros (never a fabricated 0).
  const [statsData, setStatsData] = useState<RatingsStatsResponse | null>(null);
  const [statsRetry, setStatsRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    fetchRatingsStats(controller.signal)
      .then((data) => {
        if (cancelled) return;
        setStatsData(data);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        if (cause instanceof Error && cause.name === "AbortError") return;
        // Unloaded/failed -> every stat stays null -> "—".
        setStatsData(null);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [statsRetry]);

  const summary = mapRatingsSummary(statsData);

  // Server-side pagination/filtering: useRecordsQuery owns the debounced
  // search (400 ms), page resets, totals, loading/error states and the
  // stale-response protection for the list.
  const {
    query,
    setQuery,
    filterValues,
    setFilter,
    clearFilters,
    activeFilterCount,
    page,
    setPage,
    rows,
    total,
    // The hook's loading state is the LIST's; the action dialog keeps its own
    // `loading` further down.
    loading: listLoading,
    error,
    retry,
  } = useRecordsQuery<Review>({
    filterKeys: ["status", "rating"],
    fetchPage: async (
      { page: nextPage, pageSize, query: search, filters },
      signal,
    ) => {
      const result = await fetchRatingsPage(
        {
          page: nextPage,
          limit: pageSize,
          search: search.trim() || undefined,
          moderationStatus:
            filters.status !== ALL ? filters.status : undefined,
          rating: filters.rating !== ALL ? filters.rating : undefined,
        },
        signal,
      );
      return {
        items: result.items.map(mapRatingListItem),
        total: result.total,
        totalPages: result.totalPages,
      };
    },
  });

  // Lazy detail (GET /ratings/{id}) with its own loading/error/Retry and
  // stale-response protection (the cancelled flag aborts superseded fetches
  // when the selection or retry token changes).
  const [detailState, setDetailState] = useState<{
    loading: boolean;
    error: string | null;
    model: ReviewDetailModel | null;
  }>({ loading: false, error: null, model: null });
  const [detailRetry, setDetailRetry] = useState(0);

  useEffect(() => {
    if (!selectedId) return;
    const controller = new AbortController();
    let cancelled = false;
    fetchRatingDetail(selectedId, controller.signal)
      .then((detail) => {
        if (cancelled) return;
        setDetailState({
          loading: false,
          error: null,
          model: mapRatingDetail(detail),
        });
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        if (cause instanceof Error && cause.name === "AbortError") return;
        setDetailState({
          loading: false,
          model: null,
          error:
            cause instanceof Error && cause.message
              ? cause.message
              : "Request failed. Please try again.",
        });
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedId, detailRetry]);

  function openDetails(id: string) {
    setDetailState({ loading: true, error: null, model: null });
    setSelectedId(id);
  }

  function closeDetails() {
    setSelectedId(null);
    setDetailState({ loading: false, error: null, model: null });
  }

  function retryDetail() {
    setDetailState((current) => ({ ...current, loading: true, error: null }));
    setDetailRetry((token) => token + 1);
  }

  // One refetch point used after mutations and by Retry buttons: list, stats
  // and the open detail (the detail effect no-ops while the drawer is closed).
  function refetchAll() {
    retry();
    setStatsRetry((token) => token + 1);
    setDetailRetry((token) => token + 1);
  }

  const selected = rows.find((item) => item.id === selectedId) ?? null;

  // Shared confirm for the drawer footer flag / remove-flag actions.
  const [pending, setPending] = useState<{
    reviewId: string;
    action: ReviewActionId;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const pendingReview = pending
    ? (rows.find((item) => item.id === pending.reviewId) ?? null)
    : null;

  function openAction(reviewId: string, action: ReviewActionId) {
    if (!rows.some((item) => item.id === reviewId)) return;
    setActionError(null);
    setPending({ reviewId, action });
  }

  async function handleActionConfirm(note: string) {
    if (!pending || !pendingReview || loading) return;
    const { reviewId, action } = pending;
    setLoading(true);
    setActionError(null);
    try {
      // MAY NOTIFY people (the review's author or the rated user) — backend
      // behaviour is unobservable from the .http; see the matching note on
      // runReviewAction. The backend confirms first; only then does
      // onConfirmed refetch list + stats + detail — no local state changes
      // before that.
      await runReviewAction({
        ratingId: reviewId,
        action,
        note,
        onConfirmed: refetchAll,
      });
      const { title, description } = entityActionMessage(
        "review",
        action === "flag" ? "flag" : "unflag",
        pendingReview.reviewer.name,
      );
      toast.success({ title, description });
      setLoading(false);
      setPending(null);
    } catch (cause) {
      // Failure: the dialog stays open with the backend's message (403/404/
      // 409/422 via ApiError, friendly text on network failure); the displayed
      // state is untouched because nothing was refetched or patched locally.
      setLoading(false);
      setActionError(
        cause instanceof Error && cause.message
          ? cause.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  function closeAction() {
    if (loading) return;
    setPending(null);
    setActionError(null);
  }

  // Export rows come from the CURRENT page (server-side filtering), matching
  // the safety/incidents export behaviour.
  function csvRows() {
    return rows.map((review) => [
      `${review.reviewerLabel} ${review.reviewer.name}`,
      review.rating === null ? "" : String(review.rating),
      review.text,
      review.rideId,
      `${review.ratedLabel} ${review.rated.name}`,
      review.timeLabel,
      reviewStatusDisplay(review.status).label,
    ]);
  }

  function handleExport() {
    downloadCsv("ratings-reviews.csv", toCsv(CSV_COLUMNS, csvRows()));
  }

  // Same rows as Export, with a stat-card summary block on top.
  function handleExportReport() {
    const summaryLines: (string | number)[][] = [
      ["Platform Average", averageLabel(summary.platformAverage)],
      ["Driver Rating", averageLabel(summary.driverRating)],
      ["Passenger Rating", averageLabel(summary.passengerRating)],
      ["Low Rated Rides", statLabel(summary.lowRatedRides)],
      [],
      CSV_COLUMNS,
      ...csvRows(),
    ];
    downloadCsv(
      "ratings-reviews-report.csv",
      toCsv(["Ratings & Reviews Report"], summaryLines),
    );
  }

  const pendingIsFlag = pending?.action === "flag";
  const statusLabel =
    REVIEW_STATUS_OPTIONS.find((option) => option.value === filterValues.status)
      ?.label ?? ALL_STATUSES_LABEL;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ratings & Reviews"
        description="Monitor rider feedback and flag reviews that need follow-up."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                confirmedExport.requestExport("Confirm export", handleExport)
              }
            >
              <Download className="size-4" aria-hidden="true" />
              Export
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                confirmedExport.requestExport(
                  "Confirm export report",
                  handleExportReport,
                )
              }
            >
              <Plus className="size-4" aria-hidden="true" />
              Export report
            </Button>
          </>
        }
      />
      {/* __LIST__ */}
      {/* Four equal-width stat cards (4 xl / 2 md / 1 mobile). The first is a
          large gold-star card; the rest reuse StatCard. */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="flex min-w-0 items-center gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-warning-soft text-warning">
            <Star
              className="size-6 fill-warning text-warning"
              aria-hidden="true"
            />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-ink-muted">Platform Average</p>
            <p className="mt-1 text-2xl font-semibold text-ink">
              {averageLabel(summary.platformAverage)}
            </p>
            {summary.platformAverageNote ? (
              <p className="mt-1 text-xs text-ink-muted">
                {summary.platformAverageNote}
              </p>
            ) : null}
          </div>
        </div>
        <StatCard
          icon={Users}
          tone="brand"
          label="Driver Rating"
          value={averageLabel(summary.driverRating)}
          note={summary.driverRatingNote ?? undefined}
        />
        <StatCard
          icon={Users}
          tone="success"
          label="Passenger Rating"
          value={averageLabel(summary.passengerRating)}
          note={summary.passengerRatingNote ?? undefined}
        />
        {/* /ratings/stats exposes no trend/delta field, so the low-rated card
            carries no note (see mapRatingsSummary). */}
        <StatCard
          icon={AlertTriangle}
          tone="warning"
          label="Low Rated Rides"
          value={statLabel(summary.lowRatedRides)}
        />
      </div>
      {/* __SECTION__ */}
      <section className="rounded-2xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border p-4 pb-0">
          <h2 className="px-0 text-base font-semibold text-ink">
            Recent reviews
          </h2>
          <div className="pt-4">
            <RecordsToolbar
              query={query}
              onQueryChange={setQuery}
              placeholder="Search ratings & reviews..."
              searchLabel="Search ratings & reviews"
              statusOptions={REVIEW_STATUS_OPTIONS.map(
                (option) => option.label,
              )}
              status={statusLabel}
              onStatusChange={(value) => {
                const option = REVIEW_STATUS_OPTIONS.find(
                  (item) => item.label === value,
                );
                if (option) setFilter("status", option.value);
              }}
              filters={
                <FilterPopover
                  activeCount={activeFilterCount}
                  onClear={clearFilters}
                >
                  <SelectLabel>Rating</SelectLabel>
                  <Select
                    label="Rating"
                    options={RATING_OPTIONS}
                    value={filterValues.rating}
                    onChange={(event) =>
                      setFilter("rating", event.target.value)
                    }
                  />
                </FilterPopover>
              }
              resultCount={total}
              countLabel="records"
            />
          </div>
        </div>

        <div className="p-4 pt-0">
          {listLoading && rows.length === 0 ? (
            <RecordsSkeleton />
          ) : error && rows.length === 0 ? (
            <RecordsError message={error} onRetry={refetchAll} />
          ) : (
            <div
              aria-busy={listLoading}
              className={
                listLoading
                  ? "opacity-60 transition-opacity"
                  : "transition-opacity"
              }
            >
              {error ? (
                <div className="mb-4">
                  <RecordsError message={error} onRetry={refetchAll} />
                </div>
              ) : null}
              {rows.length > 0 ? (
                <ul>
                  {rows.map((review) => (
                    <ReviewRow
                      key={review.id}
                      review={review}
                      onOpen={() => openDetails(review.id)}
                    />
                  ))}
                </ul>
              ) : (
                <p className="py-10 text-center text-sm text-ink-muted">
                  No reviews match your search.
                </p>
              )}
            </div>
          )}

          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        </div>
      </section>

      <ReviewDetailsDrawer
        review={selected}
        detailState={
          selected ? { ...detailState, onRetry: retryDetail } : null
        }
        onClose={closeDetails}
        onRequestAction={(action) =>
          selected ? openAction(selected.id, action) : undefined
        }
        actionPending={pending !== null}
      />

      {/* Flag / remove-flag confirmation. */}
      <ConfirmDialog
        open={pending !== null}
        title={pending ? reviewActionDialogTitle(pending.action) : ""}
        description={CONFIRM_DESCRIPTION}
        tone={pendingIsFlag ? "danger" : "default"}
        confirmTone={pendingIsFlag ? "danger" : "brand"}
        noteLabel="Internal note"
        confirmLabel="Confirm action"
        loading={loading}
        error={actionError}
        onConfirm={handleActionConfirm}
        onCancel={closeAction}
      />

      {confirmedExport.dialog}
    </div>
  );
}

// Small label used above selects inside the filter popover.
function SelectLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1.5 block text-sm font-medium text-ink">
      {children}
    </span>
  );
}
