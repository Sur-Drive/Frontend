"use client";

import { useEffect, useState } from "react";
import { Activity, Clock, Download, TriangleAlert, Wallet } from "lucide-react";
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
  SETTLEMENT_STATUS_OPTIONS,
  buildSettlementDetailModel,
  exportSettlementsCsv,
  fetchSettlementDetail,
  fetchSettlementTimeline,
  fetchSettlementsPage,
  fetchSettlementsStats,
  mapSettlementListItem,
  mapSettlementStats,
  nairaLabel,
  settlementSourceFromDetail,
  settlementStatusDisplay,
} from "@/lib/finance";
import type { FinanceSettlementRow, SettlementModelSource } from "@/lib/finance";
import type { FinanceSettlementsStatsResponse } from "@/types/finance-api";
import type { EntityDetailsModel } from "@/types/entity-details";
import { SettlementDetailsDrawer } from "./SettlementDetailsDrawer";

// Sentinel meaning "no restriction" for the toolbar filters (useRecordsQuery).
const ALL = "all";

// What the export confirm dialog says: the CSV mirrors the on-screen filters
// and can hold up to 50,000 rows.
const EXPORT_SETTLEMENTS_DESCRIPTION =
  "Downloads a CSV of the settlements matching the filters currently shown in the list (up to 50,000 rows).";

// Tabs are shortcuts into the same server-side status filter the toolbar's
// select drives: Pending Approval = pending_approval, Processing = processing,
// Completed = paid, Failed = failed. flagged/rejected/cancelled
// have no tab of their own (they show under All or through the
// status filter) and stay reachable via the select.
const TAB_ITEMS: { id: string; label: string; status: string }[] = [
  { id: "all", label: "All Settlements", status: ALL },
  { id: "pending", label: "Pending Approval", status: "pending_approval" },
  { id: "processing", label: "Processing", status: "processing" },
  { id: "completed", label: "Completed", status: "paid" },
  { id: "failed", label: "Failed", status: "failed" },
];

const ALL_BANKS = "all";

const COLUMNS: Column<FinanceSettlementRow>[] = [
  {
    key: "driver",
    header: "DRIVER",
    cell: (settlement) => <PersonCell person={settlement.driver} />,
  },
  {
    key: "bank",
    header: "BANK",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (settlement) => settlement.bank,
  },
  {
    key: "account",
    header: "ACCOUNT NUMBER",
    className: "whitespace-nowrap text-sm text-ink-muted",
    // Already masked by the backend — rendered as-is, never
    // unmasked or re-masked.
    cell: (settlement) => settlement.accountMasked,
  },
  {
    key: "amount",
    header: "AMOUNT",
    className: "whitespace-nowrap text-sm font-medium text-ink",
    cell: (settlement) => nairaLabel(settlement.amount),
  },
  {
    key: "period",
    header: "PERIOD",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (settlement) => settlement.period,
  },
  {
    key: "status",
    header: "STATUS",
    cell: (settlement) => {
      const display = settlementStatusDisplay(settlement.status);
      return <StatusPill tone={display.tone} label={display.label} />;
    },
  },
];

function SettlementRowCard({
  settlement,
}: {
  settlement: FinanceSettlementRow;
}) {
  const display = settlementStatusDisplay(settlement.status);
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <PersonCell person={settlement.driver} />
        <StatusPill tone={display.tone} label={display.label} />
      </div>
      <p className="mt-2 truncate text-sm text-ink-muted">
        {settlement.bank} · {settlement.accountMasked}
      </p>
      <p className="mt-1 text-sm font-semibold text-ink">
        {nairaLabel(settlement.amount)}
      </p>
      <p className="mt-0.5 text-sm text-ink-muted">{settlement.period}</p>
    </>
  );
}

const STAT_ICONS = [Wallet, Clock, Activity, TriangleAlert] as const;
const STAT_TONES = ["brand", "success", "warning", "info"] as const;

export function SettlementsView() {
  // Stats cards: null until the first successful GET renders "—" in every
  // card; a loaded response shows the endpoint's true zeros (all 0 today —
  // no settlement exists on this backend yet).
  const [stats, setStats] = useState<FinanceSettlementsStatsResponse | null>(
    null,
  );
  const [statsRetry, setStatsRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    fetchSettlementsStats(undefined, controller.signal)
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

  const cards = mapSettlementStats(stats);

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
  } = useRecordsQuery<FinanceSettlementRow>({
    filterKeys: ["status"],
    fetchPage: async (
      { page: nextPage, pageSize, query: search, filters },
      signal,
    ) => {
      const result = await fetchSettlementsPage(
        {
          page: nextPage,
          limit: pageSize,
          search: search.trim() || undefined,
          status: filters.status !== ALL ? filters.status : undefined,
        },
        signal,
      );
      return {
        items: (result.data ?? []).map(mapSettlementListItem),
        total: Number(result.meta?.total) || 0,
        totalPages: Number(result.meta?.totalPages) || 0,
      };
    },
  });

  // The active tab mirrors the shared status filter; a select value with no
  // tab of its own (Flagged/Rejected/Cancelled) simply highlights nothing.
  const activeTab =
    TAB_ITEMS.find((tab) => tab.status === filterValues.status) ?? null;

  function changeTab(id: string) {
    const tab = TAB_ITEMS.find((item) => item.id === id);
    if (!tab || tab.status === filterValues.status) return;
    // setFilter resets to page 1 and marks the list loading (event handler —
    // never a synchronous setState inside an effect body).
    setFilter("status", tab.status);
  }

  // Lazy detail (GET /settlements/{id} + GET /settlements/{id}/timeline, one
  // drawer load) with its own loading/error/Retry and stale-response
  // protection, mirroring the refunds detail pattern. detailStatus keeps the
  // raw backend status for the processing poll below.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // `source` is the mapped live detail: its can* flags decide
  // which settlement actions even render, and the drawer's runAction reads
  // the amount/masked account/reference from it for the money-moving dialogs.
  const [detailState, setDetailState] = useState<{
    loading: boolean;
    error: string | null;
    model: EntityDetailsModel | null;
    source: SettlementModelSource | null;
  }>({ loading: false, error: null, model: null, source: null });
  const [detailRetry, setDetailRetry] = useState(0);
  const [detailStatus, setDetailStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId) return;
    const controller = new AbortController();
    let cancelled = false;
    Promise.all([
      fetchSettlementDetail(selectedId, controller.signal),
      fetchSettlementTimeline(selectedId, controller.signal),
    ])
      .then(([detail, timeline]) => {
        if (cancelled) return;
        setDetailStatus(
          typeof detail.status === "string" ? detail.status : null,
        );
        const source = settlementSourceFromDetail(detail, timeline);
        setDetailState({
          loading: false,
          error: null,
          model: buildSettlementDetailModel(source),
          source,
        });
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        if (cause instanceof Error && cause.name === "AbortError") return;
        setDetailState((current) => ({
          loading: false,
          // A background poll failure keeps the last good drawer content (the
          // next tick refetches); a first load without a model shows the
          // error banner with its own Retry.
          model: current.model,
          source: current.source,
          error:
            current.model
              ? null
              : cause instanceof Error && cause.message
                ? cause.message
                : "Request failed. Please try again.",
        }));
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedId, detailRetry]);

  // While an open settlement is `processing`, the final paid/failed arrives
  // asynchronously via the gateway: refetch the detail every 12s
  // until the status leaves processing. Read-only — nothing is ever mutated,
  // and the interval dies with the drawer close or the status change.
  useEffect(() => {
    if (!selectedId || detailStatus !== "processing") return;
    const handle = setInterval(() => {
      setDetailRetry((token) => token + 1);
    }, 12000);
    return () => clearInterval(handle);
  }, [selectedId, detailStatus]);

  function openDetails(id: string) {
    setDetailState({ loading: true, error: null, model: null, source: null });
    setDetailStatus(null);
    setSelectedId(id);
  }

  function closeDetails() {
    setSelectedId(null);
    setDetailStatus(null);
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

  // After a CONFIRMED settlement action settles (and on the reject 409
  // "someone else acted first" reload): refetch the list, the stats cards AND
  // this drawer's detail + timeline. Nothing changed locally before this —
  // the fresh detail is the only source of truth, it feeds the 12s processing
  // poll (approve moves the settlement to processing) and it is what lifts
  // the drawer's ambiguous-failure gate.
  function refetchAfterAction() {
    refetchAll();
    setDetailRetry((token) => token + 1);
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
      // status tabs/select (the lib trims and skips empty ones, matching the
      // list fetcher — the settlements list has no method filter).
      // page/limit are pagination, not filters.
      const filename = await exportSettlementsCsv({
        search: query.trim() || undefined,
        status: filterValues.status !== ALL ? filterValues.status : undefined,
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
        title="Driver Settlements"
        description="Review, approve and monitor driver payouts."
        actions={
          // Wired to GET /admin/finance/settlements/export; the
          // button disables while a download is running.
          <Button
            variant="primary"
            onClick={openExport}
            disabled={exporting}
          >
            <Download className="size-4" aria-hidden="true" />
            Export report
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
            placeholder="Search driver settlements..."
            searchLabel="Search driver settlements"
            statusOptions={SETTLEMENT_STATUS_OPTIONS.map(
              (option) => option.label,
            )}
            status={
              SETTLEMENT_STATUS_OPTIONS.find(
                (option) => option.value === filterValues.status,
              )?.label ?? "All statuses"
            }
            onStatusChange={(value) => {
              const option = SETTLEMENT_STATUS_OPTIONS.find(
                (item) => item.label === value,
              );
              if (option) setFilter("status", option.value);
            }}
            filters={
              <FilterPopover
                activeCount={activeFilterCount}
                onClear={clearFilters}
              >
                {/* The design's bank filter has no server-side counterpart
                    (the endpoint takes only status/search/from-to), so it
                    renders disabled until the backend grows one. */}
                <span
                  title="Not available yet"
                  className="inline-block w-full"
                >
                  <Select
                    label="Filter by bank"
                    disabled
                    defaultValue={ALL_BANKS}
                    className="w-full"
                  >
                    <option value={ALL_BANKS}>All banks</option>
                  </Select>
                </span>
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
              getKey={(settlement) => settlement.id}
              onOpen={(settlement) => openDetails(settlement.id)}
              rowLabel={(settlement) => settlement.reference}
              minWidth={960}
              emptyMessage="No settlements match your filters."
              renderCard={(settlement) => (
                <SettlementRowCard settlement={settlement} />
              )}
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

      <SettlementDetailsDrawer
        row={selected}
        state={detailState}
        onRetry={retryDetail}
        onClose={closeDetails}
        onRefetch={refetchAfterAction}
      />

      <ConfirmDialog
        open={exportOpen}
        title="Confirm export"
        description={EXPORT_SETTLEMENTS_DESCRIPTION}
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
