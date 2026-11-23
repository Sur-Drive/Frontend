"use client";

import { useEffect, useState } from "react";
import { Activity, ArrowRight, Check, Clock, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Select } from "@/components/ui/Select";
import { Pagination, PAGE_SIZE } from "@/components/ui/Pagination";
import { FilterPopover } from "@/components/ui/FilterPopover";
import { Tabs } from "@/components/ui/Tabs";
import { PageHeader } from "@/components/admin/PageHeader";
import { RecordsToolbar } from "@/components/admin/RecordsToolbar";
import { StatCard, StatCardGrid } from "@/components/admin/StatCard";
import { RecordsTable } from "@/components/admin/records/RecordsTable";
import type { Column } from "@/components/admin/records/RecordsTable";
import {
  RecordsError,
  RecordsSkeleton,
} from "@/components/admin/records/RecordsListState";
import { PersonCell } from "@/components/ui/PersonCell";
import { StatusPill } from "@/components/ui/StatusPill";
import { useToast } from "@/components/ui/Toast";
import { useRecordsQuery } from "@/lib/hooks/useRecordsQuery";
import {
  REFUND_STATUS_OPTIONS,
  TRANSACTION_METHOD_OPTIONS,
  buildRefundDetailModel,
  exportRefundsCsv,
  fetchRefundDetail,
  fetchRefundTimeline,
  fetchRefundsPage,
  fetchRefundsStats,
  lagosMonthWindow,
  mapRefundListItem,
  mapRefundStats,
  nairaLabel,
  refundSourceFromDetail,
  refundStatusDisplay,
} from "@/lib/finance";
import type { FinanceRefundRow, RefundModelSource } from "@/lib/finance";
import type { FinanceRefundsStatsResponse } from "@/types/finance-api";
import type { EntityDetailsModel } from "@/types/entity-details";
import { RefundDetailsDrawer } from "./RefundDetailsDrawer";

// Sentinel meaning "no restriction" for the toolbar filters (useRecordsQuery).
const ALL = "all";

// What the export confirm dialog says: the CSV mirrors the on-screen filters
// and can hold up to 50,000 rows.
const EXPORT_REFUNDS_DESCRIPTION =
  "Downloads a CSV of the refunds matching the filters currently shown in the list (up to 50,000 rows).";

// Tabs are shortcuts into the same server-side status filter the toolbar's
// select drives: Pending Review = pending, Processing = processing,
// Completed = refunded, Rejected = rejected. `failed` has no tab of its own
// and stays reachable via the select.
const TAB_ITEMS: { id: string; label: string; status: string }[] = [
  { id: "all", label: "All Refunds", status: ALL },
  { id: "pending", label: "Pending Review", status: "pending" },
  { id: "processing", label: "Processing", status: "processing" },
  { id: "completed", label: "Completed", status: "refunded" },
  { id: "rejected", label: "Rejected", status: "rejected" },
];

const STAT_ICONS = [ArrowRight, Clock, Activity, Check] as const;
const STAT_TONES = ["brand", "success", "warning", "info"] as const;

const COLUMNS: Column<FinanceRefundRow>[] = [
  {
    key: "reference",
    header: "TRANSACTION ID",
    className: "whitespace-nowrap text-sm font-semibold text-ink",
    cell: (refund) => refund.reference,
  },
  {
    key: "ride",
    header: "RIDE ID",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (refund) => refund.rideReference,
  },
  {
    key: "passenger",
    header: "PASSENGER",
    cell: (refund) => <PersonCell person={refund.passenger} />,
  },
  {
    key: "method",
    header: "PAYMENT METHOD",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (refund) => refund.methodLabel,
  },
  {
    key: "gross",
    header: "GROSS FARE",
    className: "whitespace-nowrap text-sm font-medium text-ink",
    cell: (refund) => nairaLabel(refund.gross),
  },
  {
    key: "commission",
    header: "COMMISSION",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (refund) => nairaLabel(refund.commission),
  },
  {
    key: "earnings",
    header: "DRIVER EARNINGS",
    className: "whitespace-nowrap text-sm font-medium text-ink",
    cell: (refund) => nairaLabel(refund.earnings),
  },
  {
    key: "status",
    header: "STATUS",
    cell: (refund) => {
      const status = refundStatusDisplay(refund.status);
      return <StatusPill tone={status.tone} label={status.label} />;
    },
  },
  {
    key: "date",
    header: "DATE",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (refund) => refund.dateLabel,
  },
];

// Mobile card mirror of the table row.
function RefundRowCard({ refund }: { refund: FinanceRefundRow }) {
  const status = refundStatusDisplay(refund.status);
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-semibold text-ink">
          {refund.reference}
        </p>
        <StatusPill tone={status.tone} label={status.label} />
      </div>
      <div className="mt-2">
        <PersonCell person={refund.passenger} />
      </div>
      <p className="mt-2 truncate text-sm text-ink-muted">
        {refund.methodLabel} · {refund.dateLabel}
      </p>
      <p className="mt-1 text-xs text-ink-muted">
        Gross {nairaLabel(refund.gross)} · Commission{" "}
        {nairaLabel(refund.commission)} · Earnings {nairaLabel(refund.earnings)}
      </p>
    </>
  );
}

export function RefundsView() {
  // Stats cards: null until the first successful GET renders "—" in every
  // card; a loaded response shows the endpoint's true zeros (all 0 today —
  // no refund has ever been issued on this backend).
  const [stats, setStats] = useState<FinanceRefundsStatsResponse | null>(null);
  const [statsRetry, setStatsRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    // Explicit current-month window in Africa/Lagos (UTC+1, no DST): the cards
    // say "Refunded This Month", so the window must not depend on the server's
    // timezone. An unreadable clock sends no window and the endpoint keeps its
    // own default — never a guessed one.
    fetchRefundsStats(
      lagosMonthWindow(new Date()) ?? undefined,
      controller.signal,
    )
      .then((data) => {
        if (cancelled) return;
        setStats(data);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        if (cause instanceof Error && cause.name === "AbortError") return;
        // Unloaded/failed -> every card stays "—" (never a fabricated zero).
        setStats(null);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [statsRetry]);

  const cards = mapRefundStats(stats);

  // Server-side pagination/filtering: useRecordsQuery owns the debounced
  // search (400 ms), page resets, totals, loading/error states and the
  // stale-response protection for the list. The tabs and the toolbar's
  // status select share one underlying filter value, so they can never
  // disagree about what the list is showing.
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
    loading: listLoading,
    error,
    retry,
  } = useRecordsQuery<FinanceRefundRow>({
    filterKeys: ["status", "method"],
    fetchPage: async (
      { page: nextPage, pageSize, query: search, filters },
      signal,
    ) => {
      const result = await fetchRefundsPage(
        {
          page: nextPage,
          limit: pageSize,
          search: search.trim() || undefined,
          status: filters.status !== ALL ? filters.status : undefined,
          method: filters.method !== ALL ? filters.method : undefined,
        },
        signal,
      );
      return {
        items: (result.data ?? []).map(mapRefundListItem),
        total: Number(result.meta?.total) || 0,
        totalPages: Number(result.meta?.totalPages) || 0,
      };
    },
  });

  // The active tab mirrors the shared status filter; a select value with no
  // tab of its own (Failed) simply highlights nothing.
  const activeTab =
    TAB_ITEMS.find((tab) => tab.status === filterValues.status) ?? null;

  function changeTab(id: string) {
    const tab = TAB_ITEMS.find((item) => item.id === id);
    if (!tab || tab.status === filterValues.status) return;
    // setFilter resets to page 1 and marks the list loading (event handler —
    // never a synchronous setState inside an effect body).
    setFilter("status", tab.status);
  }

  // Lazy detail (GET /refunds/{id} + GET /refunds/{id}/timeline, one drawer
  // load) with its own loading/error/Retry and stale-response protection,
  // mirroring the transactions detail pattern.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailState, setDetailState] = useState<{
    loading: boolean;
    error: string | null;
    model: EntityDetailsModel | null;
    // The mapped live detail: the canApprove/canReject flags
    // behind the drawer's Approve/Reject actions.
    source: RefundModelSource | null;
  }>({ loading: false, error: null, model: null, source: null });
  const [detailRetry, setDetailRetry] = useState(0);

  useEffect(() => {
    if (!selectedId) return;
    const controller = new AbortController();
    let cancelled = false;
    Promise.all([
      fetchRefundDetail(selectedId, controller.signal),
      fetchRefundTimeline(selectedId, controller.signal),
    ])
      .then(([detail, timeline]) => {
        if (cancelled) return;
        const source = refundSourceFromDetail(detail, timeline);
        setDetailState({
          loading: false,
          error: null,
          model: buildRefundDetailModel(source),
          source,
        });
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        if (cause instanceof Error && cause.name === "AbortError") return;
        setDetailState({
          loading: false,
          model: null,
          source: null,
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
    setDetailState({ loading: true, error: null, model: null, source: null });
    setSelectedId(id);
  }

  function closeDetails() {
    setSelectedId(null);
    setDetailState({ loading: false, error: null, model: null, source: null });
  }

  function retryDetail() {
    setDetailState((current) => ({ ...current, loading: true, error: null }));
    setDetailRetry((token) => token + 1);
  }

  const selected = rows.find((item) => item.id === selectedId) ?? null;

  // One retry point for the list error banner: refetches the list AND the
  // stats cards, so a failed stats request recovers with the next Retry too.
  function refetchAll() {
    retry();
    setStatsRetry((token) => token + 1);
  }

  // One refetch point for a confirmed refund mutation: the
  // list, the stats cards and the open drawer's detail (+ timeline) all
  // reload once the backend has confirmed the change — never before.
  function refetchAfterAction() {
    refetchAll();
    retryDetail();
  }

  // Backend CSV export: the confirm-then-download flow from the
  // activity logs view — the dialog owns loading/error, the confirm button
  // disables while the download runs, and failures surface the backend's
  // message inside the dialog.
  const toast = useToast();
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  function openExport() {
    setExportError(null);
    setExportOpen(true);
  }

  function closeExport() {
    if (exporting) return;
    setExportOpen(false);
    setExportError(null);
  }

  async function handleExportConfirm(): Promise<void> {
    if (exporting) return;
    setExporting(true);
    setExportError(null);
    try {
      // Exactly the filters the list is showing: the search box value and the
      // status/method selects (the lib trims and skips empty ones, matching
      // the list fetcher). page/limit are pagination, not filters.
      const filename = await exportRefundsCsv({
        search: query.trim() || undefined,
        status: filterValues.status !== ALL ? filterValues.status : undefined,
        method: filterValues.method !== ALL ? filterValues.method : undefined,
      });
      toast.success({
        title: "Export ready",
        description: `${filename} has been downloaded.`,
      });
      setExportOpen(false);
    } catch (cause: unknown) {
      setExportError(
        cause instanceof Error && cause.message
          ? cause.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Refunds"
        description="Review refund requests and monitor reimbursement status."
        actions={
          // Wired to GET /admin/finance/refunds/export; the
          // button disables while a download is running.
          <Button
            variant="primary"
            onClick={openExport}
            disabled={exporting}
          >
            <Download className="size-4" aria-hidden="true" />
            Export refunds
          </Button>
        }
      />

      <StatCardGrid>
        {cards.map((card, index) => {
          const Icon = STAT_ICONS[index % STAT_ICONS.length];
          const tone = STAT_TONES[index % STAT_TONES.length];
          return (
            <StatCard
              key={card.label}
              icon={Icon}
              tone={tone}
              label={card.label}
              value={card.value}
              note={card.note ?? undefined}
              noteTone={card.noteTone}
            />
          );
        })}
      </StatCardGrid>

      <Card className="min-w-0">
        <Tabs
          tabs={TAB_ITEMS.map(({ id, label }) => ({ id, label }))}
          value={activeTab?.id ?? ""}
          onChange={changeTab}
        />
        <div
          role="tabpanel"
          id={`panel-${activeTab?.id ?? "all"}`}
          aria-labelledby={`tab-${activeTab?.id ?? "all"}`}
          className="pt-4"
        >
          <RecordsToolbar
            query={query}
            onQueryChange={setQuery}
            placeholder="Search refunds..."
            searchLabel="Search refunds"
            statusOptions={REFUND_STATUS_OPTIONS.map((option) => option.label)}
            status={
              REFUND_STATUS_OPTIONS.find(
                (option) => option.value === filterValues.status,
              )?.label ?? "All statuses"
            }
            onStatusChange={(value) => {
              const option = REFUND_STATUS_OPTIONS.find(
                (item) => item.label === value,
              );
              if (option) setFilter("status", option.value);
            }}
            filters={
              <FilterPopover
                activeCount={activeFilterCount}
                onClear={clearFilters}
              >
                {/* The method filter is validated server-side (probed 400 on
                    an unknown value), reusing the payments method enum. */}
                <Select
                  label="Filter by method"
                  options={TRANSACTION_METHOD_OPTIONS.map(
                    (option) => option.label,
                  )}
                  value={
                    TRANSACTION_METHOD_OPTIONS.find(
                      (option) => option.value === filterValues.method,
                    )?.label ?? "All methods"
                  }
                  onChange={(event) => {
                    const option = TRANSACTION_METHOD_OPTIONS.find(
                      (item) => item.label === event.target.value,
                    );
                    if (option) setFilter("method", option.value);
                  }}
                  className="w-full"
                />
              </FilterPopover>
            }
            resultCount={total}
            countLabel="records"
          />

          {listLoading ? (
            <RecordsSkeleton />
          ) : error ? (
            <RecordsError message={error} onRetry={refetchAll} />
          ) : (
            <RecordsTable
              columns={COLUMNS}
              rows={rows}
              getKey={(refund) => refund.id}
              onOpen={(refund) => openDetails(refund.id)}
              rowLabel={(refund) => refund.reference}
              minWidth={1180}
              emptyMessage="No refunds match your filters."
              renderCard={(refund) => <RefundRowCard refund={refund} />}
            />
          )}

          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
        </div>
      </Card>

      <RefundDetailsDrawer
        row={selected}
        state={detailState}
        onRetry={retryDetail}
        onClose={closeDetails}
        onRefetch={refetchAfterAction}
      />

      <ConfirmDialog
        open={exportOpen}
        title="Confirm export"
        description={EXPORT_REFUNDS_DESCRIPTION}
        confirmLabel="Confirm export"
        confirmTone="brand"
        loading={exporting}
        error={exportError}
        onConfirm={handleExportConfirm}
        onCancel={closeExport}
      />
    </div>
  );
}
