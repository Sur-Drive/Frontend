// Fraud & Risk data layer: confirmed apiFetch calls (GET stats/list) and the
// mapping/display layer from backend records to the design's RiskCase rows.
//
// Confirmed endpoints (observed 2026-11-15):
//   GET /admin/ride-hailing/fraud/stats  bare { openCases, criticalOpen,
//         highRiskAccounts, highRiskAccountsToday, paymentSignals24h }
//         (preventedLossMonth documented but absent from the payload)
//   GET /admin/ride-hailing/fraud/cases  envelope { items, total, page,
//         limit, totalPages } — status/riskLevel are enum-validated (400 on
//         unknown values); patternType/assignedTo/from/to are documented but
//         have no design control, so they are never sent here.
//
// NOT wired (by design):
//   - PATCH /fraud/cases/{id}/assign: no officers endpoint exists to source
//     candidate ids, so Assign stays
//     disabled with "Not available yet" (CaseAssignBody is exported for the
//     day that changes).
//
// Detail + actions:
//   - GET /fraud/cases/{id} (case detail + event timeline) and four actions
//     (POST notes, PATCH escalate/resolve/dismiss) — the detail/timeline
//     shape is UNVERIFIED (the cases table is empty; only a bogus-id 404 was
//     observable), so the mapper treats every field as unknown and renders
//     an em dash for anything unrecognized.
//   - the case table was EMPTY at wire-up time, so list item field names are
//     unverified (see types/fraud-api.ts) — the mapper treats every field as
//     optional and renders an em dash when absent.
import { apiFetch } from "@/lib/api";
import {
  EM_DASH,
  formatDateLabel,
  formatNumber,
  formatNairaCompact,
  formatTimeLabel,
  humanize,
} from "@/lib/format";
import type { Person } from "@/types/rides";
import type { StatusTone } from "@/components/ui/StatusPill";
import type {
  CaseEscalateBody,
  CaseNoteBody,
  CaseResolutionBody,
  FraudCaseDetailResponse,
  FraudCaseListItem,
  FraudCaseListResponse,
  FraudStatsResponse,
} from "@/types/fraud-api";
import type { RiskCase, RiskSummary } from "@/types/trust";

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

// Sentinel meaning "no restriction" (shared with useRecordsQuery).
const ALL_SENTINEL = "all";

export interface FraudCasesPageQuery {
  page: number;
  limit: number;
  // Confirmed query params only: status (open | under_review | escalated |
  // resolved | dismissed), riskLevel (low | medium | high | critical) and
  // search ("signal or reference"). The "all" sentinel is dropped by the
  // fetcher so it can never leak into a request.
  status?: string;
  riskLevel?: string;
  search?: string;
}

// GET /admin/ride-hailing/fraud/cases — observed envelope
// { items, total, page, limit, totalPages } (default limit=20).
export async function fetchFraudCasesPage(
  query: FraudCasesPageQuery,
  signal?: AbortSignal,
): Promise<FraudCaseListResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });
  // User input: trim so whitespace-only search never becomes a query param.
  const search = query.search?.trim();
  if (search) params.set("search", search);
  // "all" is the no-restriction sentinel shared with useRecordsQuery — the
  // fetcher drops it itself so it can never leak into a request.
  if (query.status && query.status !== ALL_SENTINEL) {
    params.set("status", query.status);
  }
  if (query.riskLevel && query.riskLevel !== ALL_SENTINEL) {
    params.set("riskLevel", query.riskLevel);
  }
  return apiFetch<FraudCaseListResponse>(
    `/admin/ride-hailing/fraud/cases?${params.toString()}`,
    { signal },
  );
}

// GET /admin/ride-hailing/fraud/stats — bare object; always fetched
// unfiltered (the endpoint takes no query params).
export async function fetchFraudStats(
  signal?: AbortSignal,
): Promise<FraudStatsResponse> {
  return apiFetch<FraudStatsResponse>("/admin/ride-hailing/fraud/stats", {
    signal,
  });
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function asInt(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

// Backend stats -> design summary. null = not loaded / failed / field absent
// -> the cards render "—"; a loaded true zero stays "0".
export function mapFraudSummary(raw: FraudStatsResponse | null): RiskSummary {
  // preventedLossMonth is documented but absent from the observed payload.
  // Unit UNVERIFIED (never observed) — formatted as naira only if a number
  // ever appears; re-verify the unit before trusting it.
  const preventedLoss =
    typeof raw?.preventedLossMonth === "number" &&
    Number.isFinite(raw.preventedLossMonth)
      ? formatNairaCompact(raw.preventedLossMonth)
      : null;
  return {
    openRiskCases: asInt(raw?.openCases),
    openRiskCasesCritical: asInt(raw?.criticalOpen),
    highRiskAccounts: asInt(raw?.highRiskAccounts),
    highRiskAccountsToday: asInt(raw?.highRiskAccountsToday),
    paymentSignals: asInt(raw?.paymentSignals24h),
    preventedLoss,
  };
}

const AVATAR_TONES: Person["tone"][] = ["brand", "success", "warning", "info"];

// Deterministic avatar from the name (same input -> same output on server
// and client, so hydration never mismatches). Same shape as lib/drivers.ts.
function makePerson(name: string | null | undefined): Person {
  const safeName =
    typeof name === "string" && name.trim() ? name.trim() : EM_DASH;
  const words = safeName
    .split(/\s+/)
    .filter((word) => /^[A-Za-z0-9]/.test(word));
  const initials = words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
  let hash = 0;
  for (let index = 0; index < safeName.length; index += 1) {
    hash = (hash + safeName.charCodeAt(index)) % AVATAR_TONES.length;
  }
  return {
    name: safeName,
    initials: initials || EM_DASH,
    tone: AVATAR_TONES[hash],
  };
}

// Subject name from the unverified subject shape: an object with a name-like
// string, or a bare string. Values that look like ids/phones/emails map to
// null so the row renders an em-dash avatar instead of personal data (the
// design only ever shows a display name here).
function subjectName(subject: FraudCaseListItem["subject"]): string | null {
  if (typeof subject === "string") {
    const value = subject.trim();
    // A bare string is only trusted as a display name when it looks like one:
    // it must contain a space, a real word (2+ letters) and no @ so ids,
    // device strings and phone numbers never render.
    if (!value.includes(" ") || value.includes("@")) return null;
    if (!value.split(/\s+/).some((word) => /^[A-Za-z]{2,}$/.test(word))) {
      return null;
    }
    return value;
  }
  return asString(
    subject && typeof subject === "object"
      ? (subject as { name?: unknown }).name
      : null,
  );
}

// Backend list item -> design RiskCase. The row key prefers the human-readable
// reference over the record id and is used as a React key only (never
// rendered — the row's sensitive subject fields never reach the UI).
export function mapFraudCaseListItem(
  item: FraudCaseListItem,
  fallbackKey: string,
): RiskCase {
  const name = subjectName(item.subject);
  const detected = asString(item.createdAt) ?? asString(item.detectedAt);
  return {
    id: asString(item.reference) ?? asString(item.id) ?? fallbackKey,
    // The raw record id drives the detail/action URLs; never rendered.
    recordId: asString(item.id) ?? "",
    subject: name ? makePerson(name) : null,
    // patternType is the filter param name, pattern the detail-description
    // word — the mapper accepts either.
    pattern: asString(item.patternType) ?? asString(item.pattern),
    signal: asString(item.signal),
    riskLevel: asString(item.riskLevel),
    riskScore: asInt(item.riskScore) ?? asInt(item.score),
    detectedLabel: detected ? formatDateLabel(detected) : EM_DASH,
    status: asString(item.status),
  };
}

// ---------------------------------------------------------------------------
// Display helpers — raw backend vocabulary in, { label, tone } out. Unknown
// values fall back to a humanised label on a neutral chip; observed values are
// never treated as exhaustive.
// ---------------------------------------------------------------------------

export interface RiskDisplay {
  label: string;
  tone: StatusTone;
}

// Backend status -> design chip. The design's single terminal "Reviewed"
// state became the backend's resolved + dismissed pair, so both get their own
// labels; the Reviewed TAB maps to status=resolved (its closest single
// param). Observed/validated enum (2026-11-15): open | under_review |
// escalated | resolved | dismissed.
const STATUS_LABELS: Record<string, RiskDisplay> = {
  open: { label: "Open", tone: "info" },
  under_review: { label: "Under Review", tone: "warning" },
  escalated: { label: "Escalated", tone: "danger" },
  resolved: { label: "Resolved", tone: "success" },
  dismissed: { label: "Dismissed", tone: "neutral" },
};

export function riskStatusDisplay(raw: string | null | undefined): RiskDisplay {
  const value = (raw ?? "").trim();
  if (!value) return { label: EM_DASH, tone: "neutral" };
  const match = STATUS_LABELS[value.toLowerCase()];
  if (match) return match;
  return { label: humanize(value), tone: "neutral" };
}

// Backend riskLevel -> the shared Severity chip. Documented/validated enum:
// low | medium | high | critical.
const LEVEL_LABELS: Record<string, RiskDisplay> = {
  critical: { label: "Critical", tone: "danger" },
  high: { label: "High", tone: "warning" },
  medium: { label: "Medium", tone: "info" },
  low: { label: "Low", tone: "neutral" },
};

export function riskLevelDisplay(raw: string | null | undefined): RiskDisplay {
  const value = (raw ?? "").trim();
  if (!value) return { label: EM_DASH, tone: "neutral" };
  const match = LEVEL_LABELS[value.toLowerCase()];
  if (match) return match;
  return { label: humanize(value), tone: "neutral" };
}

// Backend patternType -> the design's pattern wording (sentence case).
// Documented enum: repeated_failed_payments, suspicious_ride_activity,
// multiple_accounts, repeated_cancellations, chargeback. Unknown values
// humanise ("payment_dispute" -> "Payment Dispute").
const PATTERN_LABELS: Record<string, string> = {
  repeated_failed_payments: "Repeated failed payments",
  suspicious_ride_activity: "Suspicious ride activity",
  multiple_accounts: "Multiple accounts",
  repeated_cancellations: "Repeated cancellations",
  chargeback: "Chargeback",
};

export function riskPatternDisplay(raw: string | null | undefined): string {
  const value = (raw ?? "").trim();
  if (!value) return EM_DASH;
  return PATTERN_LABELS[value.toLowerCase()] ?? humanize(value);
}

// "94/100" per the design; "—" when the score is missing. The /100 unit is
// the design's assumption (no rows were observable at wire-up time).
export function riskScoreLabel(score: number | null | undefined): string {
  return score === null || score === undefined ? EM_DASH : `${score}/100`;
}

// Raw backend status -> the query param for the status dropdown/tab.
export const STATUS_PARAMS: Record<string, string> = {
  Open: "open",
  "Under Review": "under_review",
  Escalated: "escalated",
  Resolved: "resolved",
  Dismissed: "dismissed",
};

// Raw backend risk level -> the query param for the risk-level filter.
export const LEVEL_PARAMS: Record<string, string> = {
  Critical: "critical",
  High: "high",
  Medium: "medium",
  Low: "low",
};

// Stat card label: null/undefined (not loaded, failed, missing field) is
// "—"; a loaded true zero stays "0".
export function statLabel(value: number | null | undefined): string {
  return value === null || value === undefined ? EM_DASH : formatNumber(value);
}

// ---------------------------------------------------------------------------
// Case detail — UNVERIFIED shape, mapped defensively
// ---------------------------------------------------------------------------

// GET /admin/ride-hailing/fraud/cases/{id}. The happy-path shape is
// unverified (the cases table is empty — only a bogus-id 404 was observable,
// 2026-11-15); the response type keeps every field optional/unknown and the
// mapper below renders an em dash for anything unrecognized.
export async function fetchFraudCaseDetail(
  caseId: string,
  signal?: AbortSignal,
): Promise<FraudCaseDetailResponse> {
  return apiFetch<FraudCaseDetailResponse>(
    `/admin/ride-hailing/fraud/cases/${encodeURIComponent(caseId)}`,
    { signal },
  );
}

// "05 May 2023, 14:30" for an ISO datetime; "—" for missing/invalid. Same
// combined format as the incident detail timeline.
function formatDateTimeLabel(value: string | null | undefined): string {
  const dateLabel = formatDateLabel(value);
  if (dateLabel === EM_DASH) return EM_DASH;
  const timeLabel = formatTimeLabel(value);
  return timeLabel === EM_DASH ? dateLabel : `${dateLabel}, ${timeLabel}`;
}

// One event in the case timeline as rendered by the drawer. Every field can
// be "—"/null: the detail shape is unverified, so unrecognized events must
// never fabricate content.
export interface CaseTimelineEvent {
  label: string;
  timeLabel: string;
  // Note text carried by note events, or null. Only rendered inside the
  // drawer (never in the list, CSV or any store).
  text: string | null;
}

// Defensively extracts the case timeline from the unverified detail shape.
// Recognized container keys: timeline | events (export description: "the
// full event timeline (created, notes, escalations, assignments,
// resolution)"). Recognized event keys: type/kind/title/event for the label,
// at/createdAt/timestamp/occurredAt for the time, note/message/text for note
// text. Anything else maps to "—"/null. Returns null when no array is found
// under either key (the drawer then shows its empty state).
export function mapCaseTimeline(
  detail: FraudCaseDetailResponse | null | undefined,
): CaseTimelineEvent[] | null {
  const raw = detail?.timeline ?? detail?.events;
  if (!Array.isArray(raw)) return null;
  return raw.map((entry): CaseTimelineEvent => {
    const item =
      entry && typeof entry === "object"
        ? (entry as Record<string, unknown>)
        : {};
    const label =
      asString(item.type) ??
      asString(item.kind) ??
      asString(item.title) ??
      asString(item.event);
    const at =
      asString(item.at) ??
      asString(item.createdAt) ??
      asString(item.timestamp) ??
      asString(item.occurredAt);
    const text =
      asString(item.note) ?? asString(item.message) ?? asString(item.text);
    return {
      label: label ? humanize(label) : EM_DASH,
      timeLabel: formatDateTimeLabel(at),
      text,
    };
  });
}

// ---------------------------------------------------------------------------
// Mutations (stub-harness verified; never called from the terminal)
// ---------------------------------------------------------------------------

// One case mutation at a time: a second confirm fired while a request is
// still in flight rejects instead of double-submitting (the dialog also
// disables its confirm button while `loading`).
let mutationInFlight = false;

export type CaseActionId = "add-note" | "escalate" | "resolve" | "dismiss";

export interface CaseActionRequest {
  caseId: string;
  action: CaseActionId;
  // Confirm-dialog / notes-tab text. resolve/dismiss REQUIRE it (documented
  // "Note is required"); escalate's note is optional (omitted when empty);
  // add-note requires text by nature. Empty required notes reject BEFORE any
  // request is issued.
  note: string;
  // Invoked ONLY after the backend confirms — the view's single refetch
  // point (list + stats + detail). On failure it never runs, so the
  // displayed state stays untouched and the dialog keeps the backend
  // message.
  onConfirmed: () => void;
}

// NOTE FOR REVIEWERS: escalate may notify staff and resolve/dismiss may
// change the case subject's account standing — the backend does not document
// who is notified or what standing changes; the confirm dialogs say exactly
// that and no more. Failures rethrow with the backend message untouched.
export async function runCaseAction(
  request: CaseActionRequest,
): Promise<void> {
  if (mutationInFlight) {
    throw new Error("A case update is already in progress.");
  }
  const note = request.note.trim();
  const noteRequired =
    request.action === "add-note" ||
    request.action === "resolve" ||
    request.action === "dismiss";
  if (noteRequired && !note) {
    throw new Error("A note is required for this action.");
  }
  mutationInFlight = true;
  try {
    const base = `/admin/ride-hailing/fraud/cases/${encodeURIComponent(request.caseId)}`;
    if (request.action === "add-note") {
      const body: CaseNoteBody = { note };
      await apiFetch<unknown>(`${base}/notes`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      request.onConfirmed();
      return;
    }
    if (request.action === "escalate") {
      // Note is optional on escalate: omitted (not sent as "") when empty.
      const body: CaseEscalateBody = note ? { note } : {};
      await apiFetch<unknown>(`${base}/escalate`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      request.onConfirmed();
      return;
    }
    const body: CaseResolutionBody = { note };
    await apiFetch<unknown>(
      `${base}/${request.action === "resolve" ? "resolve" : "dismiss"}`,
      { method: "PATCH", body: JSON.stringify(body) },
    );
    request.onConfirmed();
  } finally {
    mutationInFlight = false;
  }
}



