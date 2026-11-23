"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Clock,
  Download,
  Plus,
  Search,
  TriangleAlert,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { StatusPill } from "@/components/ui/StatusPill";
import { Pagination, PAGE_SIZE } from "@/components/ui/Pagination";
import { FilterPopover } from "@/components/ui/FilterPopover";
import { Tabs } from "@/components/ui/Tabs";
import type { TabItem } from "@/components/ui/Tabs";
import { PageHeader } from "@/components/admin/PageHeader";
import { RecordsToolbar } from "@/components/admin/RecordsToolbar";
import { StatCard, StatCardGrid } from "@/components/admin/StatCard";
import { RecordsTable } from "@/components/admin/records/RecordsTable";
import type { Column } from "@/components/admin/records/RecordsTable";
import {
  RecordsError,
  RecordsSkeleton,
} from "@/components/admin/records/RecordsListState";
import { EntityDrawer } from "@/components/admin/details/EntityDrawer";
import { useRecordsQuery } from "@/lib/hooks/useRecordsQuery";
import { buildVerificationDetails } from "@/lib/entity-details/verification";
import {
  fetchVerificationPage,
  fetchVerificationStats,
  mapVerificationListItem,
  mapVerificationSummary,
  statLabel,
} from "@/lib/verification";
import type { VerificationTab } from "@/lib/verification";
import { downloadCsv, toCsv } from "@/lib/csv";
import { useConfirmedExport } from "@/lib/hooks/useConfirmedExport";
import { EM_DASH, formatNumber } from "@/lib/format";
import { verificationStatusDisplay } from "@/types/verification";
import type { VerificationRequest } from "@/types/verification";
import type { VerificationStatsResponse } from "@/types/verification-api";

// Display label for useRecordsQuery's "all" sentinel inside the toolbar.
const ALL = "all";
const ALL_STATUSES_LABEL = "All statuses";

// Status select options map 1:1 onto confirmed `status` query param values
// (re-confirmed 2026-11-11: every value returns 200, with totals consistent
// with /verification/stats). The design's
// "In Review" / "Resubmission" have no backend value and are never offered.
const QUEUE_STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: ALL_STATUSES_LABEL, value: ALL },
  { label: "Pending Review", value: "pending" },
  { label: "Approved", value: "verified" },
  { label: "Rejected", value: "rejected" },
];
const EXPIRING_STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: ALL_STATUSES_LABEL, value: ALL },
  { label: "Expiring soon", value: "expiring_soon" },
  { label: "Expired", value: "expired" },
];

const TAB_ITEMS: TabItem[] = [
  { id: "driver", label: "Driver Verification" },
  { id: "vehicle", label: "Vehicle Verification" },
  { id: "fleet", label: "Fleet Verification" },
  { id: "expiring", label: "Expiring Documents" },
];

type TabId = (typeof TAB_ITEMS)[number]["id"];

// Tabs with a confirmed list endpoint. The fleet tab has none, so it
// renders an availability note instead of a
// list — never a fabricated empty queue.
const FETCHABLE_TABS: ReadonlySet<string> = new Set([
  "driver",
  "vehicle",
  "expiring",
]);

// Reviewer filter: no confirmed reviewer/assignment query param exists on any
// verification list endpoint, so the control stays visible but disabled.
const ALL_REVIEWERS = "all";
const ASSIGNED = "Assigned";
const UNASSIGNED = "Unassigned";

const CSV_COLUMNS = [
  "Request ID",
  "Applicant",
  "Submission type",
  "Document",
  "Submission date",
  "Expiry date",
  "Assigned reviewer",
  "Status",
];

const COLUMNS: Column<VerificationRequest>[] = [
  {
    key: "applicant",
    header: "Applicant",
    cell: (request) => (
      <span className="flex min-w-0 items-center gap-3">
        <InitialsAvatar initials={request.initials} tone={request.tone} />
        <span className="min-w-0 truncate text-sm font-semibold text-ink">
          {request.applicant}
        </span>
      </span>
    ),
  },
  {
    key: "type",
    header: "Submission type",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (request) => request.type,
  },
  {
    key: "document",
    header: "Document",
    className: "whitespace-nowrap text-sm",
    cell: (request) => request.document,
  },
  {
    key: "submitted",
    header: "Submission date",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (request) => request.submittedLabel,
  },
  {
    key: "expiry",
    header: "Expiry date",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (request) => request.expiryLabel ?? EM_DASH,
  },
  {
    key: "reviewer",
    header: "Assigned reviewer",
    className: "whitespace-nowrap text-sm",
    cell: (request) =>
      request.reviewer ?? (
        <span className="text-sm text-ink-muted">Unassigned</span>
      ),
  },
  {
    key: "status",
    header: "Status",
    cell: (request) => {
      const display = verificationStatusDisplay(request.status);
      return <StatusPill tone={display.tone} label={display.label} />;
    },
  },
];

export function VerificationView() {
  const confirmedExport = useConfirmedExport();
  const [tab, setTab] = useState<TabId>("driver");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Stats: `data` null = not loaded or failed -> the cards render "—"; a
  // loaded response shows the endpoint's true zeros (never a fabricated 0).
  const [statsData, setStatsData] = useState<VerificationStatsResponse | null>(
    null,
  );
  const [statsRetry, setStatsRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    fetchVerificationStats(controller.signal)
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

  const summary = mapVerificationSummary(statsData);

  // Server-side pagination/filtering: useRecordsQuery owns the debounced
  // search (400ms), page resets, totals, loading/error states and the
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
    loading,
    error,
    retry,
    updateRows,
  } = useRecordsQuery<VerificationRequest>({
    filterKeys: ["status"],
    fetchPage: async (
      { page: nextPage, pageSize, query: search, filters },
      signal,
    ) => {
      if (!FETCHABLE_TABS.has(tab)) {
        // The fleet tab never hits the backend; its panel shows the
        // availability note instead of this placeholder page.
        return { items: [], total: 0, totalPages: 0 };
      }
      const result = await fetchVerificationPage(
        tab as VerificationTab,
        {
          page: nextPage,
          limit: pageSize,
          search: search.trim() || undefined,
          status: filters.status !== ALL ? filters.status : undefined,
        },
        signal,
      );
      return {
        items: result.items.map(mapVerificationListItem),
        total: result.total,
        totalPages: result.totalPages,
      };
    },
  });

  const selected = rows.find((item) => item.id === selectedId) ?? null;

  // One Retry for both resources (they share the backend).
  function retryAll() {
    retry();
    setStatsRetry((token) => token + 1);
  }

  // Drawer footer actions: EntityDrawer runs the PATCH via runEntityAction
  // and calls this only after the backend confirms, so it refetches the
  // queue and the stats. No row or stat is ever mutated locally first.
  function handleAction() {
    retryAll();
  }

  function changeTab(id: string) {
    setTab(id as TabId);
    setSelectedId(null);
    // Clear the previous tab's rows so the switch shows the skeleton, never
    // another queue's records.
    updateRows(() => []);
    // A fresh filter identity resets to page 1 and refetches with the new
    // tab; the previous tab's status value is never sent to the wrong queue.
    setFilter("status", ALL);
  }

  function handleExport() {
    const exportRows = rows.map((request) => [
      request.id,
      request.applicant,
      request.type,
      request.document,
      request.submittedLabel,
      request.expiryLabel ?? "",
      request.reviewer ?? "Unassigned",
      verificationStatusDisplay(request.status).label,
    ]);
    const today = new Date().toISOString().slice(0, 10);
    downloadCsv(`verification-${today}.csv`, toCsv(CSV_COLUMNS, exportRows));
  }

  const statusOptions =
    tab === "expiring" ? EXPIRING_STATUS_OPTIONS : QUEUE_STATUS_OPTIONS;
  const statusLabel =
    statusOptions.find((option) => option.value === filterValues.status)
      ?.label ?? ALL_STATUSES_LABEL;

  const filters = (
    <FilterPopover activeCount={activeFilterCount} onClear={clearFilters}>
      {/* No confirmed reviewer/assignment query param — visible but disabled. */}
      <span title="Not available yet" className="block">
        <Select
          label="Filter by reviewer"
          value={ALL_REVIEWERS}
          onChange={() => undefined}
          disabled
        >
          <option value={ALL_REVIEWERS}>All reviewers</option>
          <option value={ASSIGNED}>{ASSIGNED}</option>
          <option value={UNASSIGNED}>{UNASSIGNED}</option>
        </Select>
      </span>
    </FilterPopover>
  );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Verification Centre"
        description="Review driver, vehicle and fleet documents in one workspace."
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
            {/* No confirmed bulk-assign endpoint: the
                button stays in place but disabled; disabled buttons swallow
                hover, so the reason rides on a wrapper span. */}
            <span title="Not available yet" className="inline-flex">
              <Button disabled>
                <Plus className="size-4" aria-hidden="true" />
                Assign reviews
              </Button>
            </span>
          </>
        }
      />

      <StatCardGrid>
        <StatCard
          icon={Clock}
          tone="brand"
          label="Pending Review"
          value={statLabel(summary.pendingReview)}
        />
        {/* No in-review field exists on /verification/stats — the card never
            shows a fabricated number, only the availability note. */}
        <StatCard
          icon={Search}
          tone="success"
          label="In Review"
          value={EM_DASH}
          note="Not available yet"
          noteTone="muted"
        />
        <StatCard
          icon={Check}
          tone="warning"
          label="Approved Today"
          value={statLabel(summary.approvedToday)}
        />
        <StatCard
          icon={TriangleAlert}
          tone="info"
          label="Expiring Soon"
          value={statLabel(summary.expiringSoon)}
          note={
            summary.expiringSoonWindowDays === null
              ? undefined
              : `Within ${formatNumber(summary.expiringSoonWindowDays)} days`
          }
        />
      </StatCardGrid>


      <Card className="min-w-0">
        <Tabs tabs={TAB_ITEMS} value={tab} onChange={changeTab} />
        <div
          role="tabpanel"
          id={`panel-${tab}`}
          aria-labelledby={`tab-${tab}`}
          className="pt-4"
        >
          {!FETCHABLE_TABS.has(tab) ? (
            // Fleet verification has no backend endpoint: the tab stays in
            // place with an availability note, never a fake empty queue.
            <p className="px-1 py-8 text-center text-sm text-ink-muted">
              Not available yet
            </p>
          ) : (
            <>
              <RecordsToolbar
                query={query}
                onQueryChange={setQuery}
                placeholder="Search verification centre..."
                searchLabel="Search verification centre"
                statusOptions={statusOptions.map((option) => option.label)}
                status={statusLabel}
                onStatusChange={(value) =>
                  setFilter(
                    "status",
                    statusOptions.find((option) => option.label === value)
                      ?.value ?? ALL,
                  )
                }
                filters={filters}
                resultCount={total}
                countLabel="records"
              />

              {loading && rows.length === 0 ? (
                <RecordsSkeleton />
              ) : error && rows.length === 0 ? (
                <RecordsError message={error} onRetry={retryAll} />
              ) : (
                <div
                  aria-busy={loading}
                  className={
                    loading
                      ? "opacity-60 transition-opacity"
                      : "transition-opacity"
                  }
                >
                  {error ? (
                    <div className="mb-4">
                      <RecordsError message={error} onRetry={retryAll} />
                    </div>
                  ) : null}
                  <RecordsTable
                    columns={COLUMNS}
                    rows={rows}
                    getKey={(request) => request.id}
                    onOpen={(request) => setSelectedId(request.id)}
                    rowLabel={(request) => request.applicant}
                    minWidth={1120}
                    emptyMessage="No verification requests match your filters."
                    renderCard={(request) => {
                      const display = verificationStatusDisplay(request.status);
                      return (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <InitialsAvatar
                                initials={request.initials}
                                tone={request.tone}
                              />
                              <p className="min-w-0 truncate text-sm font-semibold text-ink">
                                {request.applicant}
                              </p>
                            </div>
                            <StatusPill
                              tone={display.tone}
                              label={display.label}
                            />
                          </div>
                          <p className="mt-2 text-sm text-ink-muted">
                            {request.type} · {request.document}
                          </p>
                          <p className="mt-1 text-sm text-ink-muted">
                            {request.submittedLabel} ·{" "}
                            {request.expiryLabel ?? EM_DASH}
                          </p>
                          <p className="mt-1 text-sm text-ink-muted">
                            {request.reviewer ?? "Unassigned"}
                          </p>
                        </>
                      );
                    }}
                  />
                </div>
              )}

              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={total}
                onPageChange={setPage}
              />
            </>
          )}
        </div>
      </Card>

      <EntityDrawer
        model={selected ? buildVerificationDetails(selected) : null}
        onClose={() => setSelectedId(null)}
        onAction={handleAction}
      />

      {confirmedExport.dialog}
    </div>
  );
}

