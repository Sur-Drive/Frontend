"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  ChartLine,
  Check,
  Clock,
  Download,
  TriangleAlert,
  User,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Select } from "@/components/ui/Select";
import { Pagination, PAGE_SIZE } from "@/components/ui/Pagination";
import { FilterPopover } from "@/components/ui/FilterPopover";
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
  TRANSACTION_METHOD_OPTIONS,
  TRANSACTION_STATUS_OPTIONS,
  buildTransactionDetailModel,
  exportTransactionsCsv,
  fetchFinanceOverview,
  fetchTransactionDetail,
  fetchTransactionTimeline,
  fetchTransactionsPage,
  mapOverviewCards,
  mapTransactionListItem,
  nairaLabel,
  transactionSourceFromDetail,
  transactionStatusDisplay,
} from "@/lib/finance";
import type {
  FinanceTransactionRow,
  TransactionModelSource,
} from "@/lib/finance";
import type { FinanceOverviewResponse } from "@/types/finance-api";
import type { EntityDetailsModel } from "@/types/entity-details";
import { TransactionDetailsDrawer } from "./TransactionDetailsDrawer";

// Sentinel meaning "no restriction" for the toolbar filters.
const ALL = "all";

// What the export confirm dialog says: the CSV mirrors the on-screen filters
// and can hold up to 50,000 rows.
const EXPORT_TRANSACTIONS_DESCRIPTION =
  "Downloads a CSV of the transactions matching the filters currently shown in the list (up to 50,000 rows).";

const STAT_ICONS = [
  Wallet,
  ChartLine,
  User,
  Check,
  TriangleAlert,
  ArrowRight,
  Clock,
] as const;

const STAT_TONES = [
  "brand",
  "success",
  "warning",
  "info",
  "warning",
  "brand",
  "success",
] as const;

const COLUMNS: Column<FinanceTransactionRow>[] = [
  {
    key: "reference",
    header: "TRANSACTION ID",
    className: "whitespace-nowrap text-sm font-semibold text-ink",
    cell: (tx) => tx.reference,
  },
  {
    key: "ride",
    header: "RIDE ID",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (tx) => tx.rideReference,
  },
  {
    key: "passenger",
    header: "PASSENGER",
    cell: (tx) => <PersonCell person={tx.passenger} />,
  },
  {
    key: "method",
    header: "PAYMENT METHOD",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (tx) => tx.methodLabel,
  },
  {
    key: "gross",
    header: "GROSS FARE",
    className: "whitespace-nowrap text-sm font-medium text-ink",
    cell: (tx) => nairaLabel(tx.gross),
  },
  {
    key: "commission",
    header: "COMMISSION",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (tx) => nairaLabel(tx.commission),
  },
  {
    key: "earnings",
    header: "DRIVER EARNINGS",
    className: "whitespace-nowrap text-sm font-medium text-ink",
    cell: (tx) => nairaLabel(tx.earnings),
  },
  {
    key: "status",
    header: "STATUS",
    cell: (tx) => {
      const status = transactionStatusDisplay(tx.status);
      return <StatusPill tone={status.tone} label={status.label} />;
    },
  },
  {
    key: "date",
    header: "DATE",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (tx) => tx.dateLabel,
  },
];

// Mobile card mirror of the table row.
function TransactionRowCard({ tx }: { tx: FinanceTransactionRow }) {
  const status = transactionStatusDisplay(tx.status);
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-semibold text-ink">
          {tx.reference}
        </p>
        <StatusPill tone={status.tone} label={status.label} />
      </div>
      <div className="mt-2">
        <PersonCell person={tx.passenger} />
      </div>
      <p className="mt-2 truncate text-sm text-ink-muted">
        {tx.methodLabel} · {tx.dateLabel}
      </p>
      <p className="mt-1 text-xs text-ink-muted">
        Gross {nairaLabel(tx.gross)} · Commission {nairaLabel(tx.commission)} ·
        Earnings {nairaLabel(tx.earnings)}
      </p>
    </>
  );
}

export function PaymentsView() {
  // Overview cards: null until the first successful GET renders "—" in every
  // card; a loaded response shows the endpoint's true zeros.
  const [overview, setOverview] = useState<FinanceOverviewResponse | null>(
    null,
  );
  const [overviewRetry, setOverviewRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    fetchFinanceOverview(undefined, controller.signal)
      .then((data) => {
        if (cancelled) return;
        setOverview(data);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        if (cause instanceof Error && cause.name === "AbortError") return;
        // Unloaded/failed -> every card stays "—" (never a fabricated zero).
        setOverview(null);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [overviewRetry]);

  const cards = mapOverviewCards(overview);

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
    loading: listLoading,
    error,
    retry,
  } = useRecordsQuery<FinanceTransactionRow>({
    filterKeys: ["status", "method"],
    fetchPage: async (
      { page: nextPage, pageSize, query: search, filters },
      signal,
    ) => {
      const result = await fetchTransactionsPage(
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
        items: (result.data ?? []).map(mapTransactionListItem),
        total: Number(result.meta?.total) || 0,
        totalPages: Number(result.meta?.totalPages) || 0,
      };
    },
  });

  // Lazy detail (GET /transactions/{id} + GET /transactions/{id}/timeline,
  // one drawer load) with its own loading/error/Retry and stale-response
  // protection, mirroring the ratings detail pattern.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailState, setDetailState] = useState<{
    loading: boolean;
    error: string | null;
    model: EntityDetailsModel | null;
    // The mapped live detail: the paymentId + refundableAmount
    // + canRefund behind the drawer's Initiate refund action.
    source: TransactionModelSource | null;
  }>({ loading: false, error: null, model: null, source: null });
  const [detailRetry, setDetailRetry] = useState(0);

  useEffect(() => {
    if (!selectedId) return;
    const controller = new AbortController();
    let cancelled = false;
    Promise.all([
      fetchTransactionDetail(selectedId, controller.signal),
      fetchTransactionTimeline(selectedId, controller.signal),
    ])
      .then(([detail, timeline]) => {
        if (cancelled) return;
        const source = transactionSourceFromDetail(detail, timeline);
        setDetailState({
          loading: false,
          error: null,
          model: buildTransactionDetailModel(source),
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

  const selected =
    rows.find((item) => item.id === selectedId) ?? null;

  // One retry point for the list error banner: refetches the list AND the
  // overview cards, so a failed overview recovers with the next Retry too.
  function refetchAll() {
    retry();
    setOverviewRetry((token) => token + 1);
  }

  // One refetch point for a confirmed refund mutation: the
  // list, the overview cards and the open drawer's detail (+ timeline) all
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
      const filename = await exportTransactionsCsv({
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
        title="Finance Overview"
        description="Track payments, platform revenue and transaction performance."
        actions={
          // "Export transactions" is wired to GET /admin/finance/transactions/
          // export. The secondary "Export" slot has no backend
          // endpoint, so it stays disabled with the availability tooltip
          // (wrapper span, because disabled buttons swallow hover).
          <div className="flex items-center gap-3">
            <span title="Not available yet" className="inline-block">
              <Button variant="secondary" disabled>
                <Download className="size-4" aria-hidden="true" />
                Export
              </Button>
            </span>
            <Button
              variant="primary"
              onClick={openExport}
              disabled={exporting}
            >
              <Download className="size-4" aria-hidden="true" />
              Export transactions
            </Button>
          </div>
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
        <RecordsToolbar
          query={query}
          onQueryChange={setQuery}
          placeholder="Search transactions, rides or passengers..."
          searchLabel="Search transactions, rides or passengers"
          statusOptions={TRANSACTION_STATUS_OPTIONS.map(
            (option) => option.label,
          )}
          status={
            TRANSACTION_STATUS_OPTIONS.find(
              (option) => option.value === filterValues.status,
            )?.label ?? "All statuses"
          }
          onStatusChange={(value) => {
            const option = TRANSACTION_STATUS_OPTIONS.find(
              (item) => item.label === value,
            );
            if (option) setFilter("status", option.value);
          }}
          filters={
            <FilterPopover activeCount={activeFilterCount} onClear={clearFilters}>
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
            getKey={(tx) => tx.id}
            onOpen={(tx) => openDetails(tx.id)}
            rowLabel={(tx) => tx.reference}
            minWidth={1180}
            emptyMessage="No transactions match your filters."
            renderCard={(tx) => <TransactionRowCard tx={tx} />}
          />
        )}

        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
        />
      </Card>

      <TransactionDetailsDrawer
        row={selected}
        state={detailState}
        onRetry={retryDetail}
        onClose={closeDetails}
        onRefetch={refetchAfterAction}
      />

      <ConfirmDialog
        open={exportOpen}
        title="Confirm export"
        description={EXPORT_TRANSACTIONS_DESCRIPTION}
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



