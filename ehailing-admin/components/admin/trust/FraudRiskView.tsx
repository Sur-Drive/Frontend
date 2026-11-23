"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Check,
  Download,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { FilterPopover } from "@/components/ui/FilterPopover";
import { Pagination, PAGE_SIZE } from "@/components/ui/Pagination";
import { Tabs } from "@/components/ui/Tabs";
import type { TabItem } from "@/components/ui/Tabs";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/admin/PageHeader";
import { RecordsToolbar } from "@/components/admin/RecordsToolbar";
import { StatCard } from "@/components/admin/StatCard";
import {
  RecordsError,
  RecordsSkeleton,
} from "@/components/admin/records/RecordsListState";
import { RecordsTable } from "@/components/admin/records/RecordsTable";
import { useRecordsQuery } from "@/lib/hooks/useRecordsQuery";
import { useConfirmedExport } from "@/lib/hooks/useConfirmedExport";
import { downloadCsv, toCsv } from "@/lib/csv";
import {
  LEVEL_PARAMS,
  STATUS_PARAMS,
  fetchFraudCaseDetail,
  fetchFraudCasesPage,
  fetchFraudStats,
  mapCaseTimeline,
  mapFraudCaseListItem,
  mapFraudSummary,
  riskLevelDisplay,
  riskPatternDisplay,
  riskScoreLabel,
  riskStatusDisplay,
  runCaseAction,
  statLabel,
} from "@/lib/fraud";
import type { CaseActionId, CaseTimelineEvent } from "@/lib/fraud";
import type { FraudStatsResponse } from "@/types/fraud-api";
import { RISK_STATUSES } from "@/types/trust";
import type { RiskCase } from "@/types/trust";
import { RISK_COLUMNS, RiskCard } from "./RiskParts";
import {
  ACTION_META,
  actionDialogTitle,
  disabledReason,
  RiskDetailsDrawer,
} from "./RiskDetailsDrawer";
import type { RiskActionId } from "./RiskDetailsDrawer";

const ALL = "all";
const ALL_STATUSES_LABEL = "All statuses";

const TABS: TabItem[] = [
  { id: "all-signals", label: "All Signals" },
  { id: "critical", label: "Critical" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "reviewed", label: "Reviewed" },
];

// Tabs are presets over the same server params as the toolbar filters: the
// Critical/High/Medium tabs drive the riskLevel filter, the Reviewed tab maps
// to status=resolved (the design's single terminal "Reviewed" state became the
// backend's resolved + dismissed pair; dismissed cases stay reachable through
// the status dropdown).
const TAB_FILTERS: Partial<
  Record<string, { key: "riskLevel" | "status"; value: string }>
> = {
  critical: { key: "riskLevel", value: "critical" },
  high: { key: "riskLevel", value: "high" },
  medium: { key: "riskLevel", value: "medium" },
  reviewed: { key: "status", value: "resolved" },
};

// Raw riskLevel filter value -> the tab that represents it (highlight sync).
const RISK_LEVEL_TABS: Record<string, string> = {
  critical: "critical",
  high: "high",
  medium: "medium",
};

const CSV_COLUMNS = [
  "Subject",
  "Risk pattern",
  "Signal",
  "Risk level",
  "Risk score",
  "Detected",
  "Status",
];

export function FraudRiskView() {
  const confirmedExport = useConfirmedExport();

  // Stats: data null = not loaded or failed -> the cards render "—"; a loaded
  // response shows the endpoint's true zeros (every observed field was 0 on
  // 2026-11-15).
  const [statsData, setStatsData] = useState<FraudStatsResponse | null>(null);
  const [statsRetry, setStatsRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    fetchFraudStats(controller.signal)
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

  const summary = mapFraudSummary(statsData);

  // Tab highlight state; the server query lives in the useRecordsQuery
  // filters (tabs write into them — see handleTabChange).
  const [tab, setTab] = useState("all-signals");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Server-side pagination/filtering: the backend owns status/riskLevel/
  // search; this hook owns debounce, page resets and stale-response
  // protection. patternType/assignedTo/from-to exist on the endpoint but the
  // design has no control for them, so they are never sent.
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
  } = useRecordsQuery<RiskCase>({
    filterKeys: ["status", "riskLevel"],
    fetchPage: (state, signal) =>
      fetchFraudCasesPage(
        {
          page: state.page,
          limit: state.pageSize,
          search: state.query,
          status:
            state.filters.status === ALL ? undefined : state.filters.status,
          riskLevel:
            state.filters.riskLevel === ALL
              ? undefined
              : state.filters.riskLevel,
        },
        signal,
      ).then((response) => ({
        items: response.items.map((item, index) =>
          mapFraudCaseListItem(item, `row-${state.page}-${index}`),
        ),
        total: response.total,
        totalPages: response.totalPages,
      })),
  });

  const toast = useToast();

  // Detail fetch for the open case. The drawer is fed from the CURRENT rows
  // (so a post-mutation refetch updates the open drawer's status pill); this
  // ref keeps that lookup current without adding rows to the effect deps.
  const rowsRef = useRef<RiskCase[]>([]);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  // Case detail + timeline: unknown fields -> the drawer renders "—" /
  // empty states; the detail shape is unverified (see mapCaseTimeline).
  const [detailState, setDetailState] = useState<{
    loading: boolean;
    error: string | null;
    events: CaseTimelineEvent[] | null;
  }>({ loading: false, error: null, events: null });
  const [detailRetry, setDetailRetry] = useState(0);

  useEffect(() => {
    if (!selectedId) return;
    // The detail URL needs the backend record id, not the display reference.
    const recordId = rowsRef.current.find(
      (item) => item.id === selectedId,
    )?.recordId;
    if (!recordId) {
      setDetailState({ loading: false, error: null, events: null });
      return;
    }
    const controller = new AbortController();
    let cancelled = false;
    fetchFraudCaseDetail(recordId, controller.signal)
      .then((detail) => {
        if (cancelled) return;
        setDetailState({
          loading: false,
          error: null,
          events: mapCaseTimeline(detail),
        });
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        if (cause instanceof Error && cause.name === "AbortError") return;
        setDetailState({
          loading: false,
          events: null,
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

  function openDetails(risk: RiskCase) {
    setDetailState({ loading: true, error: null, events: null });
    setSelectedId(risk.id);
  }

  function closeDetails() {
    setSelectedId(null);
    setDetailState({ loading: false, error: null, events: null });
  }

  function retryDetail() {
    setDetailState((current) => ({ ...current, loading: true, error: null }));
    setDetailRetry((token) => token + 1);
  }

  // Shared confirm for the footer + row-menu escalate/resolve/dismiss
  // actions (add-note has no confirm: it focuses the Notes tab instead; and
  // assign never reaches the dialog — it is disabled without an officers
  // endpoint). The action is the lib's CaseActionId.
  const [pending, setPending] = useState<{
    caseId: string;
    caseKey: string;
    action: CaseActionId;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Bumped to force the drawer's Notes tab open and focus the note field.
  const [notesFocusKey, setNotesFocusKey] = useState(0);

  // Save-note request state for the drawer's Notes tab.
  const [noteState, setNoteState] = useState<{
    saving: boolean;
    error: string | null;
  }>({ saving: false, error: null });
  // Bumped after the backend confirms a saved note; the drawer clears its
  // draft then (never before).
  const [noteSavedKey, setNoteSavedKey] = useState(0);

  function openAction(risk: RiskCase, action: RiskActionId) {
    if (action === "add-note") {
      // Add note has no confirm dialog: open the drawer on the Notes tab and
      // focus the field instead.
      if (selectedId !== risk.id) {
        setDetailState({ loading: true, error: null, events: null });
        setSelectedId(risk.id);
      }
      setNotesFocusKey((key) => key + 1);
      return;
    }
    if (action === "assign" || disabledReason(risk, action)) return;
    setActionError(null);
    setPending({ caseId: risk.recordId, caseKey: risk.id, action });
  }

  // Confirm-dialog copy, exactly as far as the .http documents: escalate may
  // notify staff; resolve/dismiss may change the subject's account standing.
  function confirmDescription(action: RiskActionId): string {
    if (action === "escalate") {
      return "Escalation may notify staff. Please confirm you want to continue.";
    }
    if (action === "resolve") {
      return "Resolving may change the subject's account standing. Please confirm you want to continue.";
    }
    return "Dismissing may change the subject's account standing. Please confirm you want to continue.";
  }

  async function handleActionConfirm(note: string) {
    if (!pending || actionLoading) return;
    const subject =
      rows.find((item) => item.id === pending.caseKey)?.subject?.name ??
      "The case";
    setActionLoading(true);
    setActionError(null);
    try {
      // The backend confirms first; only then does onConfirmed refetch list +
      // stats + detail — no local state changes before that.
      await runCaseAction({
        caseId: pending.caseId,
        action: pending.action,
        note,
        onConfirmed: refetchAll,
      });
      const toastByAction: Record<
        Exclude<RiskActionId, "assign">,
        { title: string; description: string }
      > = {
        "add-note": {
          title: "Note added",
          description: "Your note has been saved to the case timeline.",
        },
        escalate: {
          title: "Risk case escalated",
          description: `${subject} has been escalated to the senior team.`,
        },
        resolve: {
          title: "Case resolved",
          description: `${subject} has been marked as resolved.`,
        },
        dismiss: {
          title: "Case dismissed",
          description: `${subject} has been dismissed as a false positive.`,
        },
      };
      toast.success(toastByAction[pending.action]);
      setActionLoading(false);
      setPending(null);
    } catch (cause) {
      // Failure: the dialog stays open with the backend's message; the
      // displayed state is untouched because nothing was refetched or patched
      // locally.
      setActionLoading(false);
      setActionError(
        cause instanceof Error && cause.message
          ? cause.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  function closeAction() {
    if (actionLoading) return;
    setPending(null);
    setActionError(null);
  }

  // Saving a note has no confirm dialog; it persists through POST /notes and
  // the drawer clears its draft only after the backend confirms.
  async function handleSaveNote(caseKey: string, note: string) {
    const recordId = rows.find((item) => item.id === caseKey)?.recordId;
    if (!recordId || noteState.saving) return;
    setNoteState({ saving: true, error: null });
    try {
      await runCaseAction({
        caseId: recordId,
        action: "add-note",
        note,
        // Notes don't change the case status, so only the detail (timeline)
        // needs a refetch — the list/stats are unaffected.
        onConfirmed: () => setDetailRetry((token) => token + 1),
      });
      setNoteState({ saving: false, error: null });
      setNoteSavedKey((key) => key + 1);
      toast.success({
        title: "Note added",
        description: "Your note has been saved to the case timeline.",
      });
    } catch (cause) {
      setNoteState({
        saving: false,
        error:
          cause instanceof Error && cause.message
            ? cause.message
            : "Something went wrong. Please try again.",
      });
    }
  }


  // Tabs own the two linked filters: switching tabs resets both, then applies
  // the clicked tab's preset. setFilter only runs when a value actually
  // changes, so re-clicking the active tab never refetches.
  function handleTabChange(next: string) {
    setTab(next);
    const preset = TAB_FILTERS[next];
    if (filterValues.riskLevel !== ALL) setFilter("riskLevel", ALL);
    if (filterValues.status !== ALL) setFilter("status", ALL);
    if (preset && filterValues[preset.key] !== preset.value) {
      setFilter(preset.key, preset.value);
    }
  }

  // Risk-level popover: the Critical/High/Medium tabs mirror this filter, so
  // the highlight follows the choice.
  function handleRiskLevelSelect(value: string) {
    const raw = value === ALL ? ALL : (LEVEL_PARAMS[value] ?? ALL);
    if (filterValues.riskLevel !== raw) setFilter("riskLevel", raw);
    setTab(raw === ALL ? "all-signals" : (RISK_LEVEL_TABS[raw] ?? "all-signals"));
  }

  // Status dropdown: the Reviewed tab represents status=resolved, so the
  // highlight follows the choice.
  function handleStatusSelect(label: string) {
    if (label === ALL_STATUSES_LABEL) {
      if (filterValues.status !== ALL) setFilter("status", ALL);
      setTab("all-signals");
      return;
    }
    const raw = STATUS_PARAMS[label];
    if (!raw) return;
    if (filterValues.status !== raw) setFilter("status", raw);
    setTab(raw === "resolved" ? "reviewed" : "all-signals");
  }

  // One refetch point used by the Retry buttons: list + stats.
  function refetchAll() {
    retry();
    setStatsRetry((token) => token + 1);
  }

  // Export rows come from the CURRENT page (server-side filtering), matching
  // the ratings/safety export behaviour.
  function csvRows() {
    return rows.map((risk) => [
      risk.subject?.name ?? "—",
      riskPatternDisplay(risk.pattern),
      risk.signal ?? "—",
      riskLevelDisplay(risk.riskLevel).label,
      riskScoreLabel(risk.riskScore),
      risk.detectedLabel,
      riskStatusDisplay(risk.status).label,
    ]);
  }

  function handleExport() {
    downloadCsv("fraud-risk.csv", toCsv(CSV_COLUMNS, csvRows()));
  }

  // Same rows as Export, with a stat-card summary block on top.
  function handleExportReport() {
    const summaryLines: (string | number)[][] = [
      ["Open Risk Cases", statLabel(summary.openRiskCases)],
      ["High-risk Accounts", statLabel(summary.highRiskAccounts)],
      ["Payment Signals", statLabel(summary.paymentSignals)],
      ["Prevented Loss", summary.preventedLoss ?? "—"],
      [],
      CSV_COLUMNS,
      ...csvRows(),
    ];
    downloadCsv(
      "fraud-risk-report.csv",
      toCsv(["Fraud & Risk Report"], summaryLines),
    );
  }

  const currentStatusRaw = filterValues.status;
  const statusLabel =
    currentStatusRaw === ALL
      ? ALL_STATUSES_LABEL
      : (RISK_STATUSES.find(
          (label) => STATUS_PARAMS[label] === currentStatusRaw,
        ) ?? ALL_STATUSES_LABEL);

  const selected = rows.find((item) => item.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Fraud & Risk Management"
        description="Detect suspicious activity and protect the platform in real time."
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
                  "Confirm export risk report",
                  handleExportReport,
                )
              }
            >
              <Plus className="size-4" aria-hidden="true" />
              Export risk report
            </Button>
          </>
        }
      />

      {/* Four equal-width stat cards (4 xl / 2 md / 1 mobile) so the row
          reflows cleanly instead of hugging content at a fixed width. Notes
          are derived from endpoint fields and omitted (never fabricated) when
          the field is missing — /fraud/stats has no preventedLossMonth, so
          that card shows "—" with no note. */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={AlertTriangle}
          tone="brand"
          label="Open Risk Cases"
          value={statLabel(summary.openRiskCases)}
          note={
            summary.openRiskCasesCritical === null
              ? undefined
              : `${summary.openRiskCasesCritical} critical`
          }
          noteTone="muted"
        />
        <StatCard
          icon={ShieldCheck}
          tone="success"
          label="High-risk Accounts"
          value={statLabel(summary.highRiskAccounts)}
          note={
            summary.highRiskAccountsToday === null
              ? undefined
              : `+${summary.highRiskAccountsToday} today`
          }
        />
        <StatCard
          icon={Wallet}
          tone="warning"
          label="Payment Signals"
          value={statLabel(summary.paymentSignals)}
          note="Last 24 hours"
          noteTone="muted"
        />
        <StatCard
          icon={Check}
          tone="info"
          label="Prevented Loss"
          value={summary.preventedLoss ?? "—"}
          note={summary.preventedLoss === null ? undefined : "This month"}
          noteTone="muted"
        />
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="border-b border-border">
          <Tabs tabs={TABS} value={tab} onChange={handleTabChange} />
        </div>

        <div className="pt-4">
          <RecordsToolbar
            query={query}
            onQueryChange={setQuery}
            placeholder="Search fraud & risk management..."
            searchLabel="Search fraud & risk management"
            statusOptions={[ALL_STATUSES_LABEL, ...RISK_STATUSES]}
            status={statusLabel}
            onStatusChange={handleStatusSelect}
            filters={
              <FilterPopover
                activeCount={activeFilterCount}
                onClear={clearFilters}
              >
                <SelectLabel>Risk level</SelectLabel>
                <Select
                  label="Risk level"
                  options={[ALL, ...Object.keys(LEVEL_PARAMS)]}
                  value={
                    filterValues.riskLevel === ALL
                      ? ALL
                      : (Object.keys(LEVEL_PARAMS).find(
                          (label) =>
                            LEVEL_PARAMS[label] === filterValues.riskLevel,
                        ) ?? ALL)
                  }
                  onChange={(event) =>
                    handleRiskLevelSelect(event.target.value)
                  }
                />
              </FilterPopover>
            }
            resultCount={total}
            countLabel="records"
          />
        </div>

        <div className="p-4 pt-0">
          {loading && rows.length === 0 ? (
            <RecordsSkeleton />
          ) : error && rows.length === 0 ? (
            <RecordsError message={error} onRetry={refetchAll} />
          ) : (
            <div
              aria-busy={loading}
              className={
                loading ? "opacity-60 transition-opacity" : "transition-opacity"
              }
            >
              {error ? (
                <div className="mb-4">
                  <RecordsError message={error} onRetry={refetchAll} />
                </div>
              ) : null}
              <RecordsTable<RiskCase>
                columns={RISK_COLUMNS}
                rows={rows}
                getKey={(risk) => risk.id}
                onOpen={openDetails}
                renderCard={(risk) => <RiskCard risk={risk} />}
                minWidth={940}
                emptyMessage="No risk signals match your search."
                rowLabel={(risk) => risk.subject?.name ?? risk.id}
                renderActions={(risk) => (
                  <RowMenu
                    risk={risk}
                    onView={() => openDetails(risk)}
                    onAction={(action) => openAction(risk, action)}
                  />
                )}
              />
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

      <RiskDetailsDrawer
        risk={selected}
        detailState={selected ? { ...detailState, onRetry: retryDetail } : null}
        onClose={closeDetails}
        onRequestAction={(action) =>
          selected ? openAction(selected, action) : undefined
        }
        actionPending={pending !== null}
        focusNotesKey={notesFocusKey}
        noteState={noteState}
        onSaveNote={(caseKey, note) => void handleSaveNote(caseKey, note)}
        noteSavedKey={noteSavedKey}
      />

      {/* Escalate/resolve/dismiss confirmation (add-note has none). The copy
          states only what the .http documents: escalation may notify staff;
          resolve/dismiss may change the subject's account standing. */}
      <ConfirmDialog
        open={pending !== null}
        title={pending ? actionDialogTitle(pending.action) : ""}
        description={pending ? confirmDescription(pending.action) : ""}
        confirmTone={
          ACTION_META.find((item) => item.id === pending?.action)?.confirmTone ??
          "brand"
        }
        noteLabel="Internal note"
        noteRequired={pending?.action === "resolve" || pending?.action === "dismiss"}
        confirmLabel={
          pending?.action === "escalate"
            ? "Escalate"
            : pending?.action === "resolve"
              ? "Resolve case"
              : "Dismiss case"
        }
        loading={actionLoading}
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

// Per-row "..." menu mirroring the drawer footer actions, plus View details.
// Assign stays disabled ("Not available yet"); escalate/resolve/dismiss open
// the shared confirm dialog.
function RowMenu({
  risk,
  onView,
  onAction,
}: {
  risk: RiskCase;
  onView: () => void;
  onAction: (action: RiskActionId) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative inline-block text-left"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${risk.subject?.name ?? "case"}`}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <MoreHorizontal className="size-4" aria-hidden="true" />
      </button>
      {open ? (
        <RowMenuBackdrop onClose={() => setOpen(false)}>
          <MenuItem onSelect={onView} onClose={() => setOpen(false)}>
            View details
          </MenuItem>
          <MenuItem
            title={disabledReason(risk, "add-note")}
            disabled={disabledReason(risk, "add-note") !== undefined}
            onSelect={() => onAction("add-note")}
            onClose={() => setOpen(false)}
          >
            Add note
          </MenuItem>
          <MenuItem
            title={disabledReason(risk, "escalate")}
            disabled={disabledReason(risk, "escalate") !== undefined}
            onSelect={() => onAction("escalate")}
            onClose={() => setOpen(false)}
          >
            Escalate risk
          </MenuItem>
          <MenuItem
            title={disabledReason(risk, "assign")}
            disabled
            onSelect={() => undefined}
            onClose={() => setOpen(false)}
          >
            Assign
          </MenuItem>
          <MenuItem
            title={disabledReason(risk, "resolve")}
            disabled={disabledReason(risk, "resolve") !== undefined}
            onSelect={() => onAction("resolve")}
            onClose={() => setOpen(false)}
          >
            Resolve
          </MenuItem>
          <MenuItem
            title={disabledReason(risk, "dismiss")}
            disabled={disabledReason(risk, "dismiss") !== undefined}
            onSelect={() => onAction("dismiss")}
            onClose={() => setOpen(false)}
          >
            Dismiss
          </MenuItem>
        </RowMenuBackdrop>
      ) : null}
    </div>
  );
}

// Closes the menu on outside pointer-down and Escape.
function RowMenuBackdrop({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) onClose();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      className="absolute right-0 top-full z-40 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg"
    >
      {children}
    </div>
  );
}

function MenuItem({
  children,
  onSelect,
  onClose,
  disabled = false,
  title,
}: {
  children: ReactNode;
  onSelect: () => void;
  onClose: () => void;
  disabled?: boolean;
  // Disabled-state tooltip explaining why the action is unavailable.
  title?: string;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      title={title}
      onClick={() => {
        onSelect();
        onClose();
      }}
      className="block w-full px-4 py-2 text-left text-sm text-ink transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}



