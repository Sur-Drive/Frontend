"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  Bell,
  Check,
  Download,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
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
import { RecordsTable } from "@/components/admin/records/RecordsTable";
import {
  RecordsError,
  RecordsSkeleton,
} from "@/components/admin/records/RecordsListState";
import { useRecordsQuery } from "@/lib/hooks/useRecordsQuery";
import { useConfirmedExport } from "@/lib/hooks/useConfirmedExport";
import { downloadCsv, toCsv } from "@/lib/csv";
import { entityActionMessage } from "@/lib/toast-messages";
import {
  fetchSafetyIncidentDetail,
  fetchSafetyIncidentsPage,
  fetchSafetyStats,
  incidentSeverityDisplay,
  incidentStatusDisplay,
  incidentTypeDisplay,
  mapIncidentDetail,
  mapIncidentListItem,
  mapSafetyStats,
  runIncidentAction,
  runIncidentCreate,
  statLabel,
} from "@/lib/safety-incidents";
import type {
  IncidentCreateDraft,
  IncidentDetailModel,
} from "@/lib/safety-incidents";
import type { SafetyStatsResponse } from "@/types/safety-incidents-api";
import { INCIDENT_OFFICERS, INCIDENT_STATUSES, SEVERITIES } from "@/types/trust";
import type { Incident } from "@/types/trust";
import { INCIDENT_COLUMNS, IncidentCard } from "./IncidentParts";
import {
  ACTION_META,
  actionDialogTitle,
  disabledReason,
  IncidentDetailsDrawer,
} from "./IncidentDetailsDrawer";
import type { IncidentActionId } from "./IncidentDetailsDrawer";
import { LogIncidentDrawer } from "./LogIncidentDrawer";

const CONFIRM_DESCRIPTION =
  "Please confirm you want to continue.";

// Filter values carry confirmed backend query-param values (api/
// safety-incidents.http: status=open|under_investigation|resolved,
// severity=low|medium|high|critical). The design's "Evidence Review" has no
// confirmed status param value, so it is never offered (same treatment as the
// verification centre's no-backend options).
const ALL = "all";
const ALL_STATUSES_LABEL = "All statuses";

const STATUS_PARAM_BY_LABEL: Record<string, string> = {
  Open: "open",
  "Under Investigation": "under_investigation",
  Resolved: "resolved",
};

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: ALL_STATUSES_LABEL, value: ALL },
  ...INCIDENT_STATUSES.filter((label) => STATUS_PARAM_BY_LABEL[label]).map(
    (label) => ({ label, value: STATUS_PARAM_BY_LABEL[label] }),
  ),
];

// Severity select: option labels are the design's Severity words; the filter
// stores the confirmed lowercase param value.
function severitySelectLabel(value: string): string {
  if (value === ALL) return "all";
  return (
    SEVERITIES.find((severity) => severity.toLowerCase() === value) ?? value
  );
}

const TABS: TabItem[] = [
  { id: "all-incidents", label: "All Incidents" },
  { id: "critical", label: "Critical" },
  { id: "under-investigation", label: "Under Investigation" },
  { id: "resolved", label: "Resolved" },
];

// The active tab is DERIVED from the status/severity filters so the tabs, the
// status select and the severity popover can never send conflicting values for
// the same query params (both filters map 1:1 onto confirmed params).
function tabFromFilters(status: string, severity: string): string {
  if (status === "under_investigation") return "under-investigation";
  if (status === "resolved") return "resolved";
  if (severity === "critical") return "critical";
  return "all-incidents";
}

// Clicking a tab sets both filters in one batched update (a single refetch;
// page reset handled by useRecordsQuery.setFilter).
function filtersForTab(tabId: string): { status: string; severity: string } {
  if (tabId === "under-investigation") {
    return { status: "under_investigation", severity: ALL };
  }
  if (tabId === "resolved") return { status: "resolved", severity: ALL };
  if (tabId === "critical") return { status: ALL, severity: "critical" };
  return { status: ALL, severity: ALL };
}

const CSV_COLUMNS = [
  "Incident ID",
  "Type",
  "Ride ID",
  "Reported by",
  "Severity",
  "Assigned officer",
  "Date",
  "Status",
];

export function SafetyIncidentsView() {
  const toast = useToast();
  const confirmedExport = useConfirmedExport();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Stats: data null = not loaded or failed -> the cards render "—"; a loaded
  // response shows the endpoint's true zeros (never a fabricated 0).
  const [statsData, setStatsData] = useState<SafetyStatsResponse | null>(null);
  const [statsRetry, setStatsRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    fetchSafetyStats(controller.signal)
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

  const summary = mapSafetyStats(statsData);

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
  } = useRecordsQuery<Incident>({
    filterKeys: ["status", "severity"],
    fetchPage: async (
      { page: nextPage, pageSize, query: search, filters },
      signal,
    ) => {
      const result = await fetchSafetyIncidentsPage(
        {
          page: nextPage,
          limit: pageSize,
          search: search.trim() || undefined,
          status: filters.status !== ALL ? filters.status : undefined,
          severity: filters.severity !== ALL ? filters.severity : undefined,
        },
        signal,
      );
      return {
        items: result.items.map(mapIncidentListItem),
        total: result.total,
        totalPages: result.totalPages,
      };
    },
  });

  const tab = tabFromFilters(filterValues.status, filterValues.severity);

  function changeTab(id: string) {
    const target = filtersForTab(id);
    if (
      target.status === filterValues.status &&
      target.severity === filterValues.severity
    ) {
      return;
    }
    // Both updates batch into one state commit -> one refetch.
    if (target.status !== filterValues.status) {
      setFilter("status", target.status);
    }
    if (target.severity !== filterValues.severity) {
      setFilter("severity", target.severity);
    }
  }

  // Lazy detail (GET /safety/incidents/{id}) with its own loading/error/Retry
  // and stale-response protection (the cancelled flag aborts superseded
  // fetches when the selection or retry token changes).
  const [detailState, setDetailState] = useState<{
    loading: boolean;
    error: string | null;
    model: IncidentDetailModel | null;
  }>({ loading: false, error: null, model: null });
  const [detailRetry, setDetailRetry] = useState(0);

  useEffect(() => {
    if (!selectedId) return;
    const controller = new AbortController();
    let cancelled = false;
    fetchSafetyIncidentDetail(selectedId, controller.signal)
      .then((detail) => {
        if (cancelled) return;
        setDetailState({
          loading: false,
          error: null,
          model: mapIncidentDetail(detail),
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

  // Shared confirm for footer + row-menu actions.
  const [pending, setPending] = useState<{
    incidentId: string;
    action: IncidentActionId;
  } | null>(null);
  // Kept for the design's assign-officer select inside the confirm dialog; the
  // action itself is disabled (no officer user-id source), so the dialog never
  // opens yet.
  const [officer, setOfficer] = useState("");
  const [loading, setLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const selected = rows.find((item) => item.id === selectedId) ?? null;
  const pendingIncident = pending
    ? (rows.find((item) => item.id === pending.incidentId) ?? null)
    : null;

  function openAction(incidentId: string, action: IncidentActionId) {
    const incident = rows.find((item) => item.id === incidentId);
    if (!incident || loading || disabledReason(incident, action)) return;
    setActionError(null);
    if (action === "assign-officer") {
      setOfficer(incident.officer ?? INCIDENT_OFFICERS[0]);
    }
    setPending({ incidentId, action });
  }

  async function handleActionConfirm(note: string) {
    if (!pending || !pendingIncident || loading) return;
    const { incidentId, action } = pending;
    if (action === "assign-officer") return; // disabled — never wired
    setLoading(true);
    setActionError(null);
    try {
      // MAY NOTIFY people (reporter / assigned officer / emergency contacts)
      // or trigger external effects — backend behaviour is unobservable from
      // the .http; see the matching note on runIncidentAction. The backend
      // confirms first; only then does onConfirmed refetch list + stats +
      // detail — no local state changes before that.
      await runIncidentAction({
        action,
        incidentId,
        severity: pendingIncident.severity,
        status: pendingIncident.status,
        note,
        onConfirmed: refetchAll,
      });
      toast.success(entityActionMessage("incident", action, incidentId));
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

  // Create flow: drawer hands the form values, the parent confirms once.
  const [createOpen, setCreateOpen] = useState(false);
  const [createDraft, setCreateDraft] = useState<IncidentCreateDraft | null>(
    null,
  );
  const [createResetKey, setCreateResetKey] = useState(0);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  async function handleCreateConfirm() {
    if (!createDraft || createLoading) return;
    setCreateLoading(true);
    setCreateError(null);
    try {
      // MAY NOTIFY people (safety officers / reporter) or trigger external
      // alerting — see the matching note on runIncidentCreate. The dialog's
      // note has NO confirmed body field on POST /incidents, so it is
      // deliberately NOT sent (it never reaches this handler).
      // onConfirmed refetches list + stats + detail after the POST lands.
      await runIncidentCreate(createDraft, refetchAll);
      toast.success({
        title: "Incident logged",
        description: "The incident has been recorded.",
      });
      setCreateLoading(false);
      setCreateDraft(null);
      setCreateOpen(false);
      setCreateResetKey((key) => key + 1);
    } catch (cause) {
      // Failure: dialog stays open with the backend's message; the drawer's
      // values and the displayed lists are untouched.
      setCreateLoading(false);
      setCreateError(
        cause instanceof Error && cause.message
          ? cause.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  function closeCreate() {
    if (createLoading) return;
    setCreateDraft(null);
    setCreateOpen(false);
    setCreateError(null);
  }

  function handleExport() {
    const exportRows = rows.map((incident) => [
      incident.id,
      incidentTypeDisplay(incident.type),
      incident.rideId,
      incident.reporter.name,
      incidentSeverityDisplay(incident.severity).label,
      incident.officer ?? "Unassigned",
      incident.dateLabel,
      incidentStatusDisplay(incident.status).label,
    ]);
    downloadCsv("safety-incidents.csv", toCsv(CSV_COLUMNS, exportRows));
  }

  const pendingMeta = pending
    ? ACTION_META.find((item) => item.id === pending.action)
    : undefined;
  const statusLabel =
    STATUS_OPTIONS.find((option) => option.value === filterValues.status)
      ?.label ?? ALL_STATUSES_LABEL;

  const filters = (
    <FilterPopover activeCount={activeFilterCount} onClear={clearFilters}>
      <SelectLabel>Severity</SelectLabel>
      <Select
        label="Severity"
        options={["all", ...SEVERITIES]}
        value={severitySelectLabel(filterValues.severity)}
        onChange={(event) =>
          setFilter("severity", event.target.value.toLowerCase())
        }
      />
    </FilterPopover>
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Safety & Incidents"
        description="Track, assign and resolve safety reports across the platform."
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
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Log incident
            </Button>
          </>
        }
      />

      {/* Five equal-width stat cards (5 xl / 3 lg / 2 md / 1 mobile). Values
          come from /safety/stats only: null (unloaded / failed / no such
          field) renders "—", a loaded true zero renders "0". */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          icon={AlertTriangle}
          tone="brand"
          label="Open Incidents"
          value={statLabel(summary.openIncidents)}
        />
        {/* /safety/stats exposes no SOS-alert counter: the card stays in
            place showing "—" with the availability note. */}
        <StatCard
          icon={Bell}
          tone="success"
          label="SOS Alerts"
          value={statLabel(summary.sosAlerts)}
          note="Not available yet"
          noteTone="muted"
        />
        <StatCard
          icon={ShieldCheck}
          tone="warning"
          label="Critical Cases"
          value={statLabel(summary.criticalCases)}
        />
        {/* /safety/stats exposes no under-investigation counter either. */}
        <StatCard
          icon={Search}
          tone="info"
          label="Under Investigation"
          value={statLabel(summary.underInvestigation)}
          note="Not available yet"
          noteTone="muted"
        />
        <StatCard
          icon={Check}
          tone="orange"
          label="Resolved Today"
          value={statLabel(summary.resolvedToday)}
        />
      </div>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="border-b border-border">
          <Tabs tabs={TABS} value={tab} onChange={changeTab} />
        </div>

        <div className="pt-4">
          <RecordsToolbar
            query={query}
            onQueryChange={setQuery}
            placeholder="Search safety & incidents..."
            searchLabel="Search safety & incidents"
            statusOptions={STATUS_OPTIONS.map((option) => option.label)}
            status={statusLabel}
            onStatusChange={(value) => {
              const option = STATUS_OPTIONS.find(
                (item) => item.label === value,
              );
              if (option) setFilter("status", option.value);
            }}
            filters={filters}
            resultCount={total}
            countLabel="records"
          />

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
              <RecordsTable<Incident>
                columns={INCIDENT_COLUMNS}
                rows={rows}
                getKey={(incident) => incident.id}
                onOpen={(incident) => openDetails(incident.id)}
                renderCard={(incident) => <IncidentCard incident={incident} />}
                minWidth={900}
                emptyMessage="No incidents match your search."
                rowLabel={(incident) => incident.id}
                renderActions={(incident) => (
                  <RowMenu
                    incident={incident}
                    onView={() => openDetails(incident.id)}
                    onAction={(action) => openAction(incident.id, action)}
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

      <IncidentDetailsDrawer
        incident={selected}
        detailState={
          selected ? { ...detailState, onRetry: retryDetail } : null
        }
        onClose={closeDetails}
        onRequestAction={(action) =>
          selected ? openAction(selected.id, action) : undefined
        }
        actionPending={pending !== null}
      />

      <LogIncidentDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onRequestCreate={(draft) => {
          setCreateOpen(false);
          setCreateDraft(draft);
        }}
        resetKey={createResetKey}
      />

      {/* Assign-officer / escalate / resolve confirmation. The officer select
          is rendered above the note for assign-officer (that action stays
          disabled, so the dialog cannot open yet). For resolve the note is
          sent as the confirmed body field resolutionNotes; escalate's note has
          no confirmed body field and is not sent (buildIncidentUpdateBody),
          so that note control renders disabled with an availability tooltip.
          */}
      <ConfirmDialog
        open={pending !== null}
        title={pending ? actionDialogTitle(pending.action) : ""}
        description={CONFIRM_DESCRIPTION}
        tone={pendingMeta?.confirmTone === "danger" ? "danger" : "default"}
        confirmTone={pendingMeta?.confirmTone ?? "brand"}
        noteLabel="Internal note"
        noteDisabled={pending?.action === "escalate"}
        confirmLabel="Confirm action"
        loading={loading}
        error={actionError}
        onConfirm={handleActionConfirm}
        onCancel={closeAction}
      >
        {pending?.action === "assign-officer" ? (
          <div>
            <SelectLabel>Assigned officer</SelectLabel>
            <Select
              label="Assigned officer"
              value={officer}
              onChange={(event) => setOfficer(event.target.value)}
            >
              {INCIDENT_OFFICERS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
      </ConfirmDialog>

      {/* Log-incident confirmation, handed off from LogIncidentDrawer. The
          note has no confirmed body field on POST /incidents, so it is never
          sent to the backend; the control stays in place but renders
          disabled. */}
      <ConfirmDialog
        open={createDraft !== null}
        title="Confirm log incident"
        description={CONFIRM_DESCRIPTION}
        noteLabel="Internal note"
        noteDisabled
        confirmLabel="Log incident"
        loading={createLoading}
        error={createError}
        onConfirm={() => handleCreateConfirm()}
        onCancel={closeCreate}
      />

      {confirmedExport.dialog}
    </div>
  );
}

// Small label used above selects inside the confirm dialog / filter popover.
function SelectLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1.5 block text-sm font-medium text-ink">
      {children}
    </span>
  );
}


// Per-row "..." menu mirroring the drawer footer actions, plus View details.
function RowMenu({
  incident,
  onView,
  onAction,
}: {
  incident: Incident;
  onView: () => void;
  onAction: (action: IncidentActionId) => void;
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
        aria-label={`Actions for ${incident.id}`}
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
            title={disabledReason(incident, "assign-officer")}
            disabled={disabledReason(incident, "assign-officer") !== undefined}
            onSelect={() => onAction("assign-officer")}
            onClose={() => setOpen(false)}
          >
            Assign officer
          </MenuItem>
          <MenuItem
            title={disabledReason(incident, "escalate")}
            disabled={disabledReason(incident, "escalate") !== undefined}
            onSelect={() => onAction("escalate")}
            onClose={() => setOpen(false)}
          >
            Escalate
          </MenuItem>
          <MenuItem
            tone="danger"
            title={disabledReason(incident, "resolve")}
            disabled={disabledReason(incident, "resolve") !== undefined}
            onSelect={() => onAction("resolve")}
            onClose={() => setOpen(false)}
          >
            Resolve
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
  tone = "default",
  title,
}: {
  children: ReactNode;
  onSelect: () => void;
  onClose: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
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
      className={`block w-full px-4 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        tone === "danger"
          ? "text-danger hover:bg-danger-soft"
          : "text-ink hover:bg-surface-muted"
      }`}
    >
      {children}
    </button>
  );
}
