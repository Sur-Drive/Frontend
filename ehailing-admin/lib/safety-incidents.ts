// Safety Incidents data layer: confirmed apiFetch calls (GET list/detail/stats,
// POST create, PATCH escalate/resolve), the one mapping layer from backend
// records to the design's Incident rows, and the display helpers that render
// raw backend vocabulary with a neutral fallback for unknown values.
//
// Confirmed endpoints (re-observed 2026-11-11):
//   GET   /admin/ride-hailing/safety/stats                  bare { open, unassigned, critical, resolvedToday }
//   GET   /admin/ride-hailing/safety/incidents              envelope { items, total, page, limit, totalPages }
//   GET   /admin/ride-hailing/safety/incidents/{id}         full detail object
//   POST  /admin/ride-hailing/safety/incidents              create
//   PATCH /admin/ride-hailing/safety/incidents/{id}         status / severity / resolutionNotes
//   PATCH /admin/ride-hailing/safety/incidents/{id}/assign  assignedTo = officer userId — NOT wired (see below)
//
// NOT wired: /assign requires an officer *user id*, but the confirm dialog
// only collects display names and no officers endpoint exists, so "Assign
// officer" stays disabled with "Not available yet".
import { apiFetch } from "@/lib/api";
import { EM_DASH, formatDateLabel, formatNumber, formatTimeLabel, humanize } from "@/lib/format";
import { INCIDENT_STATUS_TONE, SEVERITIES, SEVERITY_TONE } from "@/types/trust";
import type { Incident, IncidentStatus } from "@/types/trust";
import type { StatusTone } from "@/components/ui/StatusPill";
import type {
  SafetyIncidentCreateBody,
  SafetyIncidentDetailResponse,
  SafetyIncidentListItem,
  SafetyIncidentListResponse,
  SafetyIncidentUpdateBody,
  SafetyStatsResponse,
} from "@/types/safety-incidents-api";

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

export interface SafetyIncidentsPageQuery {
  page: number;
  limit: number;
  // Confirmed query params only: search, status,
  // severity. Anything else is never sent.
  search?: string;
  status?: string;
  severity?: string;
}

// GET /admin/ride-hailing/safety/incidents — observed envelope
// { items, total, page, limit, totalPages } (default limit=20).
export async function fetchSafetyIncidentsPage(
  query: SafetyIncidentsPageQuery,
  signal?: AbortSignal,
): Promise<SafetyIncidentListResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });
  // User input: trim so whitespace-only search never becomes a query param.
  const search = query.search?.trim();
  if (search) params.set("search", search);
  if (query.status) params.set("status", query.status);
  if (query.severity) params.set("severity", query.severity);
  return apiFetch<SafetyIncidentListResponse>(
    `/admin/ride-hailing/safety/incidents?${params.toString()}`,
    { signal },
  );
}

// GET /admin/ride-hailing/safety/stats — bare object, no envelope. Confirmed
// NOT to respond to query params (re-probed 2026-11-11 with ?status=open: same
// four numbers), so it is always fetched unfiltered and never derived from a
// list length.
export async function fetchSafetyStats(
  signal?: AbortSignal,
): Promise<SafetyStatsResponse> {
  return apiFetch<SafetyStatsResponse>("/admin/ride-hailing/safety/stats", {
    signal,
  });
}

// GET /admin/ride-hailing/safety/incidents/{id} — full detail object.
export async function fetchSafetyIncidentDetail(
  incidentId: string,
  signal?: AbortSignal,
): Promise<SafetyIncidentDetailResponse> {
  return apiFetch<SafetyIncidentDetailResponse>(
    `/admin/ride-hailing/safety/incidents/${encodeURIComponent(incidentId)}`,
    { signal },
  );
}

// POST /admin/ride-hailing/safety/incidents — response shape never observed,
// so it is typed unknown and never trusted: callers refetch instead.
export async function createIncident(
  body: SafetyIncidentCreateBody,
): Promise<unknown> {
  return apiFetch<unknown>("/admin/ride-hailing/safety/incidents", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// PATCH /admin/ride-hailing/safety/incidents/{id} — response shape never
// observed, typed unknown and never trusted.
export async function updateIncident(
  incidentId: string,
  body: SafetyIncidentUpdateBody,
): Promise<unknown> {
  return apiFetch<unknown>(
    `/admin/ride-hailing/safety/incidents/${encodeURIComponent(incidentId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}

// ---------------------------------------------------------------------------
// Body builders (pure — exercised directly by the fixture check)
// ---------------------------------------------------------------------------

export interface IncidentActionContext {
  incidentId: string;
  severity: string; // raw backend value
  status: string; // raw backend value
  note: string;
}

// Escalate mirrors the .http "Update — escalate severity" example: raise
// severity to the top of the documented scale (critical) and move the incident
// into under_investigation. The dialog's note has NO confirmed body field on
// this endpoint, so it is deliberately NOT sent.
export function buildIncidentUpdateBody(
  action: "escalate" | "resolve",
  ctx: IncidentActionContext,
): SafetyIncidentUpdateBody {
  if (action === "escalate") {
    return { severity: "critical", status: "under_investigation" };
  }
  // resolve — mirrors the .http "Update — resolve with notes" example.
  // resolutionNotes carries the dialog note when present (its requirement is
  // unobserved, so an empty note omits the field instead of sending "").
  const note = ctx.note.trim();
  return note
    ? { status: "resolved", resolutionNotes: note }
    : { status: "resolved" };
}

// datetime-local value ("2026-11-06T14:30") -> ISO datetime for occurredAt.
// Throws on an unparseable value (the form's validation normally prevents it).
function toIsoDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Enter a valid date and time.");
  }
  return date.toISOString();
}

// The form's "Related trip or party" maps to the optional body field rideId,
// which the backend requires to exist in the rides table. Free text that is
// clearly not a ride id (the design's placeholder even allows account names)
// is NOT sent — the field says so in the UI — so unknown text can never fail
// the whole create. Only UUID-shaped values are forwarded.
function asRideId(tripId: string): string | undefined {
  const value = tripId.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  )
    ? value
    : undefined;
}

// Design labels -> confirmed backend incidentType values (api/
// safety-incidents.http vocabulary: sos_alert, harassment, assault, theft,
// accident, vehicle_damage, unsafe_driving, payment_dispute, other).
// "Route Deviation" has no backend value and is a disabled option in the form,
// so it can never reach this map.
const CREATE_TYPE_VALUES: Record<string, string> = {
  "SOS Alert": "sos_alert",
  "Driver Behaviour": "unsafe_driving",
  "Vehicle Accident": "accident",
  Other: "other",
};

// What LogIncidentDrawer hands to the parent's confirm dialog.
export interface IncidentCreateDraft {
  type: string; // design label from INCIDENT_TYPES
  tripId: string;
  location: string;
  dateTime: string; // datetime-local value
  severity: string; // design label from SEVERITIES
  description: string;
}

export function buildIncidentCreateBody(
  draft: IncidentCreateDraft,
): SafetyIncidentCreateBody {
  const incidentType = CREATE_TYPE_VALUES[draft.type.trim()];
  if (!incidentType) {
    // Defensive: the unmapped design option is disabled in the form.
    throw new Error(`No confirmed incident type for "${draft.type}".`);
  }
  const body: SafetyIncidentCreateBody = {
    incidentType,
    location: draft.location.trim(),
    occurredAt: toIsoDateTime(draft.dateTime),
    severity: draft.severity.trim().toLowerCase(),
    description: draft.description,
  };
  const rideId = asRideId(draft.tripId);
  if (rideId) body.rideId = rideId;
  return body;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

// One incident mutation at a time: a second confirm fired while a PATCH/POST
// is still in flight rejects instead of double-submitting (the dialog also
// disables its confirm button while `loading`).
let mutationInFlight = false;

async function withMutationLock(run: () => Promise<void>): Promise<void> {
  if (mutationInFlight) {
    throw new Error("An incident update is already in progress.");
  }
  mutationInFlight = true;
  try {
    await run();
  } finally {
    mutationInFlight = false;
  }
}

export interface IncidentActionRequest extends IncidentActionContext {
  action: "escalate" | "resolve";
  // Invoked ONLY after the backend confirms — this is the view's single
  // refetch point (list + stats + detail). On failure it never runs, so the
  // displayed state stays untouched and the dialog keeps the backend message.
  onConfirmed: () => void;
}

// Runs one confirm-dialog action: build body -> PATCH -> onConfirmed().
// Failures (403/404/409/422 carry the backend message via ApiError) rethrow
// untouched.
// NOTE FOR REVIEWERS: escalate/resolve are safety-workflow mutations — the
// backend MAY notify the reporter, the assigned officer or emergency contacts
// and MAY trigger external effects; we cannot observe that from the .http.
export async function runIncidentAction(
  request: IncidentActionRequest,
): Promise<void> {
  await withMutationLock(async () => {
    const body = buildIncidentUpdateBody(request.action, request);
    await updateIncident(request.incidentId, body);
    request.onConfirmed();
  });
}

// Creates an incident from the Log-incident draft (same onConfirmed contract
// as runIncidentAction).
// NOTE FOR REVIEWERS: creating a safety incident MAY notify safety officers or
// the reporter and MAY trigger external alerting; we cannot observe that from
// the .http.
export async function runIncidentCreate(
  draft: IncidentCreateDraft,
  onConfirmed: () => void,
): Promise<void> {
  await withMutationLock(async () => {
    const body = buildIncidentCreateBody(draft);
    await createIncident(body);
    onConfirmed();
  });
}

// ---------------------------------------------------------------------------
// Action preconditions (fixture-tested; the drawer re-exports this as
// disabledReason so the footer buttons and row menu share one source).
// ---------------------------------------------------------------------------

export function incidentActionDisabledReason(
  incident: Incident,
  action: "assign-officer" | "escalate" | "resolve",
): string | undefined {
  if (action === "assign-officer") {
    // PATCH /assign needs the officer's user id; the dialog only collects a
    // display name and no endpoint resolves names to ids.
    return "Not available yet";
  }
  const resolved = incidentStatusDisplay(incident.status).label === "Resolved";
  if (action === "escalate") {
    if (resolved) return "Resolved incidents can't be escalated.";
    if (incidentSeverityDisplay(incident.severity).label === "Critical") {
      return "Already at critical severity.";
    }
    return undefined;
  }
  // resolve
  if (resolved) return "Incident is already resolved.";
  return undefined;
}

// ---------------------------------------------------------------------------
// Display helpers — raw backend vocabulary in, { label, tone } out. Unknown
// values fall back to a humanised label on a neutral chip; observed values are
// never treated as exhaustive.
// ---------------------------------------------------------------------------

export interface IncidentDisplay {
  label: string;
  tone: StatusTone;
}

const STATUS_LABELS: Record<string, IncidentStatus> = {
  open: "Open",
  under_investigation: "Under Investigation",
  resolved: "Resolved",
};

export function incidentStatusDisplay(
  raw: string | null | undefined,
): IncidentDisplay {
  const value = (raw ?? "").trim();
  if (!value) return { label: EM_DASH, tone: "neutral" };
  const label = STATUS_LABELS[value.toLowerCase()];
  if (label) return { label, tone: INCIDENT_STATUS_TONE[label] };
  // e.g. "dismissed" (documented but not in the design's status set) and any
  // future value: humanised label on a neutral chip.
  return { label: humanize(value), tone: "neutral" };
}

export function incidentSeverityDisplay(
  raw: string | null | undefined,
): IncidentDisplay {
  const value = (raw ?? "").trim();
  if (!value) return { label: EM_DASH, tone: "neutral" };
  const match = SEVERITIES.find(
    (severity) => severity.toLowerCase() === value.toLowerCase(),
  );
  if (match) return { label: match, tone: SEVERITY_TONE[match] };
  return { label: humanize(value), tone: "neutral" };
}

// Backend incidentType -> the design's table labels where they match, else a
// humanised label (harassment -> "Harassment", payment_dispute -> "Payment
// Dispute", ...).
const TYPE_LABELS: Record<string, string> = {
  sos_alert: "SOS Alert",
  unsafe_driving: "Driver Behaviour",
  accident: "Vehicle Accident",
  other: "Other",
};

export function incidentTypeDisplay(raw: string | null | undefined): string {
  const value = (raw ?? "").trim();
  if (!value) return EM_DASH;
  return TYPE_LABELS[value.toLowerCase()] ?? humanize(value);
}

// Stat card label: null/undefined (not loaded, failed, missing field) is "—";
// a loaded true zero stays "0".
export function statLabel(value: number | null | undefined): string {
  return value === null || value === undefined ? EM_DASH : formatNumber(value);
}

// ---------------------------------------------------------------------------
// Mapping layer — backend record -> design Incident. Sensitive fields
// (reportedBy.phoneNumber / email, description, location.address and
// coordinates, resolutionNotes, accusedUser, sourceId) are NOT copied, so they
// never reach component state, the table, the CSV export or the drawer.
// ---------------------------------------------------------------------------

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

const AVATAR_TONES = ["brand", "success", "warning", "info"] as const;

// Deterministic avatar from the name (same input -> same output on server and
// client, so hydration never mismatches) — mirrors lib/verification.ts.
function makePerson(name: string): Incident["reporter"] {
  const words = name.split(/\s+/).filter((word) => /^[A-Za-z0-9]/.test(word));
  const initials = words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash + name.charCodeAt(index)) % AVATAR_TONES.length;
  }
  return {
    name,
    initials: initials || EM_DASH,
    tone: AVATAR_TONES[hash],
  };
}

// assignedOfficer is null in every observed sample; when set its shape is
// unobserved. Read only a possible `name` (string or { name }) and fall back
// to null -> the design's "Unassigned".
function officerName(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (value && typeof value === "object") {
    const name = asString((value as Record<string, unknown>).name);
    if (name) return name;
  }
  return null;
}

// One shared defensive mapping for list items and detail objects (the detail
// carries every list field plus extras that are deliberately dropped).
export function mapIncidentListItem(
  item: SafetyIncidentListItem | null | undefined,
): Incident {
  const record = (item ?? {}) as Partial<SafetyIncidentListItem>;
  const reporter = (record.reportedBy ?? {}) as Partial<
    NonNullable<SafetyIncidentListItem["reportedBy"]>
  >;
  const name = asString(reporter.name) || EM_DASH;
  return {
    id: asString(record.id),
    type: asString(record.incidentType),
    rideId: asString(record.rideId) || EM_DASH,
    reporter: makePerson(name),
    severity: asString(record.severity),
    officer: officerName(record.assignedOfficer),
    dateLabel: formatDateLabel(record.createdAt),
    status: asString(record.status),
  };
}

export interface IncidentTimelineStep {
  title: string;
  time: string;
}

// Drawer-ready detail: the mapped row plus only the extra display fields the
// design shows (last-updated label and data-derived timeline steps). Free
// text, contacts, coordinates and notes never leave this function.
export interface IncidentDetailModel {
  incident: Incident;
  updatedLabel: string | null;
  timeline: IncidentTimelineStep[];
}

function dateTimeLabel(value: string | null | undefined): string {
  if (!value) return EM_DASH;
  const dateLabel = formatDateLabel(value);
  if (dateLabel === EM_DASH) return EM_DASH;
  const timeLabel = formatTimeLabel(value);
  return timeLabel === EM_DASH ? dateLabel : `${dateLabel}, ${timeLabel}`;
}

export function mapIncidentDetail(
  detail: SafetyIncidentDetailResponse | null | undefined,
): IncidentDetailModel {
  const incident = mapIncidentListItem(detail);
  const record = (detail ?? {}) as Partial<SafetyIncidentDetailResponse>;
  const createdAt = asString(record.createdAt);
  const updatedAt = asString(record.updatedAt);
  const resolvedAt = asString(record.resolvedAt);

  const timeline: IncidentTimelineStep[] = [
    { title: "Record created", time: dateTimeLabel(createdAt) },
  ];
  if (incident.officer) {
    // No assignedAt field exists on the endpoint — the time renders "—".
    timeline.push({ title: "Assigned for review", time: EM_DASH });
  }
  if (updatedAt && updatedAt !== createdAt) {
    timeline.push({
      title: "Latest status update",
      time: dateTimeLabel(updatedAt),
    });
  }
  if (
    incidentStatusDisplay(incident.status).label === "Resolved" ||
    resolvedAt
  ) {
    timeline.push({ title: "Resolved", time: dateTimeLabel(resolvedAt) });
  }

  return {
    incident,
    // Subtitle segment: "Last updated <date>". updatedAt is the freshest
    // field; falls back to createdAt; null when neither exists.
    updatedLabel:
      updatedAt || createdAt ? formatDateLabel(updatedAt || createdAt) : null,
    timeline,
  };
}


// Maps the stats response onto the five design cards. A missing response (not
// loaded or failed) yields all-null fields so every card renders "—", never a
// fabricated 0; a loaded response keeps the endpoint's true zeros. The design
// has five cards but the endpoint only exposes three of them: sosAlerts and
// underInvestigation are always null -> "—" + "Not available yet".
export function mapSafetyStats(
  response: SafetyStatsResponse | null | undefined,
): {
  openIncidents: number | null;
  sosAlerts: number | null;
  criticalCases: number | null;
  underInvestigation: number | null;
  resolvedToday: number | null;
} {
  if (!response || typeof response !== "object") {
    return {
      openIncidents: null,
      sosAlerts: null,
      criticalCases: null,
      underInvestigation: null,
      resolvedToday: null,
    };
  }
  return {
    openIncidents: asNumber(response.open),
    sosAlerts: null, // no such field on /safety/stats
    criticalCases: asNumber(response.critical),
    underInvestigation: null, // no such field on /safety/stats
    resolvedToday: asNumber(response.resolvedToday),
  };
}
