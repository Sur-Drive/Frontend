// Fraud & Risk backend shapes — observed live (GET only) on 2026-11-15.
// Sample, not exhaustive: fields may be
// absent or null; every consumer reads defensively.
//
// IMPORTANT: the fraud_cases table was EMPTY at wire-up time (total=0 for
// every filter variant), so the LIST ITEM field names are UNVERIFIED. They
// come from the export's documented vocabulary (detail description: subject,
// pattern, signal, score, detectionDetails, assignedTo, resolved info,
// timeline; search targets "signal or reference"; filter params status /
// riskLevel / patternType / assignedTo). Every field below is optional and
// the mapper renders an em dash when absent — re-verify against live rows
// before trusting any display, and flag any new field.

// GET /admin/ride-hailing/fraud/stats — bare object, no envelope. Observed
// keys (2026-11-15, all integer 0): openCases, criticalOpen,
// highRiskAccounts, highRiskAccountsToday, paymentSignals24h. The export's
// description also documents preventedLossMonth but the observed payload has
// no such key — kept optional so the summary renders "—", never a fake 0.
export interface FraudStatsResponse {
  openCases?: number | null;
  criticalOpen?: number | null;
  highRiskAccounts?: number | null;
  highRiskAccountsToday?: number | null;
  paymentSignals24h?: number | null;
  // Documented in the export, never observed. Unit UNVERIFIED — if it ever
  // appears, settle naira vs kobo before trusting the rendering.
  preventedLossMonth?: number | null;
}

// One row of GET /admin/ride-hailing/fraud/cases. UNVERIFIED shape (empty
// table) — see the file header. Aliases exist because the export uses two
// words for some fields (pattern vs patternType, score vs riskScore).
export interface FraudCaseSubject {
  // Display name of the flagged account. Never a phone/email/id: the mapper
  // only copies a name-like string and renders "—" otherwise.
  name?: string | null;
  [key: string]: unknown;
}

export interface FraudCaseListItem {
  // Record id (UUID expected). Used as the row key fallback only — the UI
  // never renders it.
  id?: string | null;
  // Human-readable case reference (the export's search targets "signal or
  // reference"). Preferred over id for the row key.
  reference?: string | null;
  // The flagged subject. Shape unobserved: object with a name, or a bare
  // string. Anything else maps to null (em-dash avatar).
  subject?: FraudCaseSubject | string | null;
  // Raw pattern value. patternType is the filter param name; pattern the
  // detail-description word — the mapper accepts either.
  pattern?: string | null;
  patternType?: string | null;
  // Human-readable signal summary (e.g. "12 failures in 24 hours" in the
  // design copy). Search target.
  signal?: string | null;
  // Raw risk level; documented enum low | medium | high | critical (the
  // endpoint 400s on unknown values, observed 2026-11-15).
  riskLevel?: string | null;
  // Risk score. The design renders "N/100"; the unit is UNVERIFIED (no rows
  // observed) — the mapper passes the raw number through.
  riskScore?: number | null;
  score?: number | null;
  // Raw status; documented enum open | under_review | escalated | resolved |
  // dismissed (the endpoint 400s on unknown values, observed 2026-11-15).
  status?: string | null;
  // Assigned admin user id (never rendered).
  assignedTo?: string | null;
  // Detection timestamp (ISO datetime expected). detectedAt kept as an alias.
  createdAt?: string | null;
  detectedAt?: string | null;
}

// GET /admin/ride-hailing/fraud/cases — observed envelope (2026-11-15).
export interface FraudCaseListResponse {
  items: FraudCaseListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// GET /admin/ride-hailing/fraud/cases/{id} — UNVERIFIED SHAPE. The cases
// table was empty at wire-up time, so the detail could only be probed with a
// bogus id (observed 2026-11-15: HTTP 404 {message, error, statusCode} — the
// endpoint exists and errors carry a `message`, which ApiError surfaces).
// The export's description names: subject, pattern, signal, score,
// detectionDetails, assignedTo, resolved info, and the full event timeline
// (created, notes, escalations, assignments, resolution). Fields below are
// the documented vocabulary typed as optional/unknown — the mapper reads
// defensively and the drawer renders an em dash for anything unrecognized.
// NEVER guess a stricter shape without a live row to verify against.
export interface FraudCaseDetailResponse {
  id?: string | null;
  reference?: string | null;
  subject?: FraudCaseSubject | string | null;
  pattern?: string | null;
  patternType?: string | null;
  signal?: string | null;
  riskLevel?: string | null;
  riskScore?: number | null;
  score?: number | null;
  status?: string | null;
  // Assigned admin user id (or object) — never rendered.
  assignedTo?: unknown;
  // Export-described blocks whose inner shape is unverified.
  detectionDetails?: unknown;
  resolved?: unknown; // resolved info — key/shape unverified
  resolution?: unknown; // alternate resolved-info key — unverified
  resolvedAt?: string | null;
  resolvedBy?: unknown; // admin user id or object — never rendered
  // The event timeline. Container key unverified (timeline | events), item
  // shape unverified — mapped defensively, unrecognized events render "—".
  timeline?: unknown;
  events?: unknown;
  // Timestamps (ISO datetime strings expected).
  createdAt?: string | null;
  detectedAt?: string | null;
  updatedAt?: string | null;
}

// POST /admin/ride-hailing/fraud/cases/{id}/notes — the only documented body
// field; never send anything else.
export interface CaseNoteBody {
  note: string;
}

// PATCH /admin/ride-hailing/fraud/cases/{id}/escalate — note is optional
// (documented "Optional note is recommended"); omitted when empty.
export interface CaseEscalateBody {
  note?: string;
}

// PATCH /admin/ride-hailing/fraud/cases/{id}/assign — documented but NOT
// wired: no officers endpoint exists to source
// candidate ids, so the admin keeps Assign disabled ("Not available yet").
export interface CaseAssignBody {
  assignedTo: string;
}

// PATCH /admin/ride-hailing/fraud/cases/{id}/resolve and /dismiss — note is
// required for both (documented "Note is required").
export interface CaseResolutionBody {
  note: string;
}

