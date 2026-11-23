"use client";

import { useEffect, useState } from "react";
import { Download, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { RecordsTable } from "@/components/admin/records/RecordsTable";
import type { Column } from "@/components/admin/records/RecordsTable";
import {
  RecordsError,
  RecordsSkeleton,
} from "@/components/admin/records/RecordsListState";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DateRangePopover } from "@/components/ui/DateRangePopover";
import type { DateRangePreset } from "@/components/ui/DateRangePopover";
import { Pagination, PAGE_SIZE } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { StatusPill } from "@/components/ui/StatusPill";
import { useRecordsQuery } from "@/lib/hooks/useRecordsQuery";
import {
  activityActionLabel,
  activityActionTone,
  dateRangeParams,
  downloadActivityLogsCsv,
  fetchActivityLogFilterOptions,
  fetchActivityLogs,
  fetchActivityLogsStats,
  formatActivityStats,
  mapActivityLogFilterOptions,
  mapActivityLogRow,
} from "@/lib/activity-logs";
import { toast } from "@/lib/toast-store";
import { EM_DASH, humanize } from "@/lib/format";
import type { ActivityLogRow } from "@/types/activity-logs";
import type {
  ActivityLogFilterOptions,
  ActivityLogsStatsResponse,
} from "@/types/activity-logs-api";
import { formatIsoDay } from "@/types/analytics";

// Sentinel for "no restriction" on every filter, including the date filter
// (the backend default: no from/to) — same value useRecordsQuery inits with.
const ALL = "all";

// Date presets for the shared DateRangePopover (the design's labels, plus an
// "All time" default so the page opens on the backend's default window —
// Today would hide every existing record). "Custom" is not a preset; it is
// chosen through the popover's From/To inputs and stored as "from|to".
const DATE_PRESETS: DateRangePreset[] = [
  { id: "all", label: "All time" },
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
];

const EXPORT_DESCRIPTION =
  "Please confirm you want to continue.";

const LOG_COLUMNS: Column<ActivityLogRow>[] = [
  {
    key: "activity",
    header: "Activity",
    className: "min-w-56 text-sm font-semibold text-ink",
    cell: (row) => row.activity,
  },
  {
    key: "user",
    header: "User",
    className: "whitespace-nowrap text-sm font-medium text-ink",
    cell: (row) => row.user,
  },
  {
    key: "role",
    header: "Role",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (row) => row.role,
  },
  {
    key: "action",
    header: "Action",
    // Chip plus the HTTP method (and status code when present) so the method
    // is always visible on every row.
    cell: (row) => (
      <span className="flex flex-col items-start gap-1">
        <StatusPill
          tone={activityActionTone(row.action)}
          label={activityActionLabel(row.action)}
        />
        <span className="font-mono text-[11px] text-ink-muted">
          {row.method}
          {row.statusCode === EM_DASH ? "" : ` · ${row.statusCode}`}
        </span>
      </span>
    ),
  },
  {
    key: "entity",
    header: "Entity",
    className: "text-sm",
    cell: (row) => (
      <span className="min-w-0 wrap-break-word">
        <span className="font-medium text-ink">{row.entityKind}</span>
        <span className="text-ink-muted"> • {row.entitySubject}</span>
      </span>
    ),
  },
  {
    key: "timestamp",
    header: "Timestamp",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (row) => row.timestamp,
  },
  {
    key: "ip",
    header: "IP address",
    className: "whitespace-nowrap text-sm tabular-nums text-ink-muted",
    cell: (row) => row.ip,
  },
];

// "just now" for the first minute, then a coarse relative label.
function verifiedLabel(at: number, now: number): string {
  const seconds = Math.max(0, Math.floor((now - at) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)} hr ago`;
}

function customDayLabel(iso: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? formatIsoDay(iso) : EM_DASH;
}

// Trigger label for the date control: preset name, or the custom window.
function dateRangeLabel(dateValue: string): string {
  if (dateValue.includes("|")) {
    const [fromIso, toIso] = dateValue.split("|");
    return `Custom: ${customDayLabel(fromIso)} – ${customDayLabel(toIso)}`;
  }
  return (
    DATE_PRESETS.find((preset) => preset.id === dateValue)?.label ?? "All time"
  );
}

export function ActivityLogsView() {
  // Loaded once a real list response arrived (even with zero items) — the
  // flag separates "first load failed" (full error) from "refresh failed"
  // (stale banner over the last good data).
  const [loaded, setLoaded] = useState(false);
  const [lastVerifiedAt, setLastVerifiedAt] = useState(() => Date.now());
  // Re-render cadence for the relative "Last verified" label; read during
  // render so the label never calls Date.now() in render.
  const [tick, setTick] = useState(() => Date.now());

  // Stats: null = not loaded or failed -> footer "—"; a loaded response
  // shows the endpoint's true zeros (never a fabricated 0).
  const [statsData, setStatsData] = useState<ActivityLogsStatsResponse | null>(
    null,
  );
  const [statsRetry, setStatsRetry] = useState(0);

  // Filter options from /filter-options (open-ended values, never hardcoded).
  // null while loading or after a failure -> the selects show only "All".
  const [optionsData, setOptionsData] =
    useState<ActivityLogFilterOptions | null>(null);
  const [optionsRetry, setOptionsRetry] = useState(0);

  // Backend CSV export with its own loading/error states.
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    const interval = window.setInterval(() => setTick(Date.now()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    fetchActivityLogsStats(controller.signal)
      .then((data) => {
        if (!cancelled) setStatsData(data);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        if (cause instanceof Error && cause.name === "AbortError") return;
        // Unloaded/failed -> footer stays "—".
        setStatsData(null);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [statsRetry]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    fetchActivityLogFilterOptions(controller.signal)
      .then((data) => {
        if (!cancelled) setOptionsData(data);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        if (cause instanceof Error && cause.name === "AbortError") return;
        setOptionsData(null);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [optionsRetry]);

  const filterOptions = optionsData
    ? mapActivityLogFilterOptions(optionsData)
    : null;

  // Server-side pagination/filtering: useRecordsQuery owns the debounced
  // search (400ms), page resets, totals, loading/error states and the
  // stale-response protection. The date range rides in as the "date" filter
  // value so changing it resets to page 1 and refetches like every other
  // filter.
  const {
    query,
    setQuery,
    filterValues,
    setFilter,
    page,
    setPage,
    rows,
    total,
    loading,
    error,
    retry,
  } = useRecordsQuery<ActivityLogRow>({
    filterKeys: ["user", "role", "action", "entity", "date"],
    fetchPage: async (
      { page: nextPage, pageSize, query: search, filters },
      signal,
    ) => {
      const range = dateRangeParams(filters.date);
      const result = await fetchActivityLogs(
        {
          page: nextPage,
          limit: pageSize,
          search: search.trim() || undefined,
          userId: filters.user !== ALL ? filters.user : undefined,
          roleName: filters.role !== ALL ? filters.role : undefined,
          action: filters.action !== ALL ? filters.action : undefined,
          entityType: filters.entity !== ALL ? filters.entity : undefined,
          from: range.from,
          to: range.to,
        },
        signal,
      );
      setLoaded(true);
      setLastVerifiedAt(Date.now());
      return {
        items: Array.isArray(result.items)
          ? result.items.map(mapActivityLogRow)
          : [],
        total: Number(result.total) || 0,
        totalPages: Number(result.totalPages) || 0,
      };
    },
  });

  const dateValue = filterValues.date;
  const dateLabel = dateRangeLabel(dateValue);

  // The export endpoint accepts only action/from/to; when any other filter is
  // active the confirm dialog must say so instead of silently dropping it.
  const exportIgnoresFilters =
    query.trim() !== "" ||
    filterValues.user !== ALL ||
    filterValues.role !== ALL ||
    filterValues.entity !== ALL;

  function handleRefresh() {
    retry();
    setStatsRetry((token) => token + 1);
    setOptionsRetry((token) => token + 1);
  }

  function openExport() {
    setExportError(null);
    setExportOpen(true);
  }

  function closeExport() {
    if (exporting) return;
    setExportOpen(false);
    setExportError(null);
  }

  // Downloads the backend CSV through fetch + Blob (Authorization header from
  // the session cookie). Loading state disables the confirm button (no double
  // submit); failures surface the backend message inside the dialog.
  async function handleExportConfirm(): Promise<void> {
    if (exporting) return;
    setExporting(true);
    setExportError(null);
    try {
      const filename = await downloadActivityLogsCsv({
        action: filterValues.action !== ALL ? filterValues.action : undefined,
        ...dateRangeParams(filterValues.date),
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
        title="Activity Logs"
        description="Review a tamper-proof record of every admin action on the platform."
        actions={
          <Button variant="secondary" onClick={openExport}>
            <Download className="size-4" aria-hidden="true" />
            Export
          </Button>
        }
      />

      {/* Read-only banner. The design lets the "Integrity verified" tile
          overflow the card's right edge; here it stays inside with normal
          padding and wraps below the text on narrow screens. */}
      <section
        aria-label="Audit record status"
        className="flex min-w-0 flex-col gap-4 rounded-2xl border border-success/30 bg-success-soft p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface shadow-sm">
            <ShieldCheck className="size-5 text-success" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">
              Read-only audit records
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              Activity logs cannot be edited or deleted. Records are retained
              according to your compliance policy.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-start rounded-xl border border-success/30 bg-surface px-3 py-2 sm:self-center">
          <span
            className="size-1.5 rounded-full bg-success"
            aria-hidden="true"
          />
          <span className="text-xs font-medium text-success">
            Integrity verified
          </span>
        </div>
      </section>

      <Card className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="w-full min-w-0 sm:w-72 sm:flex-1">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Search activity logs"
                placeholder="Search activity or entity..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-base text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              />
            </div>
          </div>

          {/* Filter options come from /filter-options (open-ended); while the
              request is pending or failed the selects show only "All". */}
          <Select
            label="Filter by user"
            className="w-full sm:w-40"
            value={filterValues.user}
            onChange={(event) => setFilter("user", event.target.value)}
          >
            <option value={ALL}>All users</option>
            {filterOptions?.users.map((user) => (
              <option key={user.userId} value={user.userId}>
                {user.userName}
              </option>
            ))}
          </Select>

          <Select
            label="Filter by role"
            className="w-full sm:w-44"
            value={filterValues.role}
            onChange={(event) => setFilter("role", event.target.value)}
          >
            <option value={ALL}>All roles</option>
            {filterOptions?.roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </Select>

          <Select
            label="Filter by action"
            className="w-full sm:w-40"
            value={filterValues.action}
            onChange={(event) => setFilter("action", event.target.value)}
          >
            <option value={ALL}>All actions</option>
            {filterOptions?.actions.map((action) => (
              <option key={action} value={action}>
                {activityActionLabel(action)}
              </option>
            ))}
          </Select>

          <Select
            label="Filter by entity"
            className="w-full sm:w-40"
            value={filterValues.entity}
            onChange={(event) => setFilter("entity", event.target.value)}
          >
            <option value={ALL}>All entities</option>
            {filterOptions?.entityTypes.map((entityType) => (
              <option key={entityType} value={entityType}>
                {humanize(entityType)}
              </option>
            ))}
          </Select>

          <DateRangePopover
            presets={DATE_PRESETS}
            activePresetId={dateValue.includes("|") ? null : dateValue}
            triggerLabel={dateLabel}
            onPreset={(id) => setFilter("date", id)}
            onCustom={(from, to) => setFilter("date", `${from}|${to}`)}
            className="w-full min-w-0 sm:w-auto"
          />

          <Button
            variant="secondary"
            onClick={handleRefresh}
            className="h-11 w-full px-4 sm:w-auto"
          >
            <RefreshCw
              className={loading ? "size-4 animate-spin" : "size-4"}
              aria-hidden="true"
            />
            Refresh
          </Button>
        </div>

        {loading && !loaded ? (
          <RecordsSkeleton />
        ) : error && !loaded ? (
          <RecordsError message={error} onRetry={retry} />
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
                <RecordsError message={error} onRetry={retry} />
              </div>
            ) : null}

            {/* Read-only records: no row menu, no detail view, no actions
                column, and no hover/pointer affordance (interactive={false}). */}
            <RecordsTable
              columns={LOG_COLUMNS}
              rows={rows}
              getKey={(row) => row.id}
              minWidth={1120}
              emptyMessage="No activity matches your filters."
              interactive={false}
              hideActions
              renderCard={(row) => (
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 text-sm font-semibold text-ink">
                      {row.activity}
                    </p>
                    <StatusPill
                      tone={activityActionTone(row.action)}
                      label={activityActionLabel(row.action)}
                    />
                  </div>
                  <p className="text-sm text-ink-muted">
                    <span className="font-medium text-ink">{row.user}</span> •{" "}
                    {row.role}
                  </p>
                  <p className="text-sm text-ink">
                    <span className="font-medium">{row.entityKind}</span>
                    <span className="text-ink-muted">
                      {" "}
                      • {row.entitySubject}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-muted">
                    <span className="font-mono">
                      {row.method}
                      {row.statusCode === EM_DASH ? "" : ` · ${row.statusCode}`}
                    </span>
                    <span>{row.timestamp}</span>
                    <span className="tabular-nums">{row.ip}</span>
                  </div>
                </div>
              )}
            />

            {/* Server-side pagination: totals come from the response
                envelope (total/totalPages), never from an array length. */}
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onPageChange={setPage}
            />
          </div>
        )}

        <div className="mt-4 flex flex-col gap-1 border-t border-border pt-4 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          {/* Stats from /stats summary fields: "—" until loaded, true zeros
              once loaded — never derived from the items array. */}
          <p>{formatActivityStats(statsData)}</p>
          <p>
            Last verified: {verifiedLabel(lastVerifiedAt, tick)} • Retention: 7
            years
          </p>
        </div>
      </Card>

      <ConfirmDialog
        open={exportOpen}
        title="Confirm export"
        description={EXPORT_DESCRIPTION}
        confirmLabel="Confirm export"
        confirmTone="brand"
        loading={exporting}
        error={exportError}
        onConfirm={handleExportConfirm}
        onCancel={closeExport}
      >
        {exportIgnoresFilters ? (
          <p className="text-sm text-ink-muted">
            Export applies only the action and date range filters. Search,
            user, role and entity filters are not applied.
          </p>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}



