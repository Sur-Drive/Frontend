import type { StatusTone } from "@/components/ui/StatusPill";
import type { Person } from "@/types/rides";

// Shared Trust & Support domain types and tone maps. Reused by Safety &
// Incidents, Support Centre, Ratings & Reviews and Fraud & Risk so every page
// colours severity and status the same way.

// Severity scale shared across incidents, tickets and risk cases.
export type Severity = "Critical" | "High" | "Medium" | "Low";

// Single source of truth for severity chip colours (kept in one place).
export const SEVERITY_TONE: Record<Severity, StatusTone> = {
  Critical: "danger",
  High: "warning",
  Medium: "info",
  Low: "neutral",
};

export const SEVERITIES: Severity[] = ["Critical", "High", "Medium", "Low"];

// Incident lifecycle statuses.
export type IncidentStatus =
  | "Open"
  | "Under Investigation"
  | "Evidence Review"
  | "Resolved";

export const INCIDENT_STATUS_TONE: Record<IncidentStatus, StatusTone> = {
  Open: "info",
  "Under Investigation": "warning",
  "Evidence Review": "warning",
  Resolved: "success",
};

export const INCIDENT_STATUSES: IncidentStatus[] = [
  "Open",
  "Under Investigation",
  "Evidence Review",
  "Resolved",
];

export type IncidentType =
  | "SOS Alert"
  | "Driver Behaviour"
  | "Vehicle Accident"
  | "Route Deviation"
  | "Other";

export const INCIDENT_TYPES: IncidentType[] = [
  "SOS Alert",
  "Driver Behaviour",
  "Vehicle Accident",
  "Route Deviation",
  "Other",
];

// Officers selectable when assigning an incident.
export const INCIDENT_OFFICERS = [
  "Femi Adebayo",
  "Tola Bello",
  "Sarah Okon",
] as const;

// A single safety incident as rendered by the Safety & Incidents screen.
// severity/status/type hold the RAW backend values (observed 2026-11-11:
// severity low|medium|high|critical, status open|under_investigation|resolved|
// dismissed, incidentType harassment|sos_alert|unsafe_driving|...) — render
// through incidentStatusDisplay / incidentSeverityDisplay / incidentTypeDisplay
// in lib/safety-incidents.ts, which fall back to a humanised label on a
// neutral chip for values outside the design's sets.
export interface Incident {
  id: string;
  // Raw backend incidentType value.
  type: string;
  // Ride id, or "—" when the backend value is null.
  rideId: string;
  // The person who reported the incident (avatar + bold name in the table).
  reporter: Person;
  // Raw backend severity value.
  severity: string;
  // Assigned officer display name, or null when unassigned.
  officer: string | null;
  dateLabel: string;
  // Raw backend status value.
  status: string;
}

// Five header stat cards. Each value comes from /safety/stats summary fields
// only: null = not loaded / failed / no such field on the endpoint -> the
// card renders "—"; a loaded true zero stays "0". The stats endpoint exposes
// open/critical/resolvedToday (and unassigned, which has no card), so
// sosAlerts and underInvestigation are always null.
export interface IncidentSummary {
  openIncidents: number | null;
  sosAlerts: number | null;
  criticalCases: number | null;
  underInvestigation: number | null;
  resolvedToday: number | null;
}

// Risk lifecycle statuses (Fraud & Risk) — the design's display set, one
// entry per backend status (observed/validated 2026-11-15: open |
// under_review | escalated | resolved | dismissed; the endpoint 400s on
// unknown values). The design's single terminal "Reviewed" state became the
// backend's resolved + dismissed pair. Rendered through riskStatusDisplay in
// lib/fraud.ts, which falls back to a humanised label on a neutral chip for
// values outside this set.
export type RiskStatus =
  | "Open"
  | "Under Review"
  | "Escalated"
  | "Resolved"
  | "Dismissed";

export const RISK_STATUS_TONE: Record<RiskStatus, StatusTone> = {
  Open: "info",
  "Under Review": "warning",
  Escalated: "danger",
  Resolved: "success",
  Dismissed: "neutral",
};

export const RISK_STATUSES: RiskStatus[] = [
  "Open",
  "Under Review",
  "Escalated",
  "Resolved",
  "Dismissed",
];

// A single fraud/risk case as rendered by the Fraud & Risk screen. status,
// riskLevel and pattern hold the RAW backend values (documented enums: status
// open|under_review|escalated|resolved|dismissed, riskLevel
// low|medium|high|critical, patternType repeated_failed_payments|... — the
// cases table was EMPTY at wire-up time, so row field names come from the
// export's documented vocabulary) — render through riskStatusDisplay /
// riskLevelDisplay / riskPatternDisplay in lib/fraud.ts, which fall back to a
// humanised label on a neutral chip for unknown values.
export interface RiskCase {
  // Human-readable case reference when the backend provides one, else the
  // record id — used as the row key and the drawer's "Risk ID" card.
  id: string;
  // The backend record id used for detail/action URLs — empty string when the
  // row carried none (id-dependent actions then disable). Never rendered.
  recordId: string;
  // The flagged subject (display name only), or null when the row carries no
  // name-like value — PersonCell then renders an em-dash avatar.
  subject: Person | null;
  // Raw backend patternType value.
  pattern: string | null;
  signal: string | null;
  // Raw backend riskLevel value.
  riskLevel: string | null;
  // Rendered "N/100" per the design; the unit is unverified (no rows were
  // observable at wire-up time).
  riskScore: number | null;
  // "05 May 2023" style label derived from createdAt at map time (absolute
  // date, no Date.now, so server and client renders match).
  detectedLabel: string;
  // Raw backend status value.
  status: string | null;
}

// Four header stat cards. null = not loaded / failed / field absent -> the
// card renders "—"; a loaded true zero stays "0". Values come from
// /fraud/stats summary fields only, never array length. preventedLoss is
// always null today: the export documents preventedLossMonth but the
// observed payload has no such key (2026-11-15).
export interface RiskSummary {
  openRiskCases: number | null;
  openRiskCasesCritical: number | null;
  highRiskAccounts: number | null;
  highRiskAccountsToday: number | null;
  paymentSignals: number | null;
  // Formatted currency string (e.g. "₦4.82M"), or null when the endpoint has
  // no preventedLossMonth.
  preventedLoss: string | null;
}


// Support ticket priorities. Urgent=danger, High=warning; Medium and Low share
// the neutral chip.
export type TicketPriority = "Urgent" | "High" | "Medium" | "Low";

export const TICKET_PRIORITY_TONE: Record<TicketPriority, StatusTone> = {
  Urgent: "danger",
  High: "warning",
  Medium: "neutral",
  Low: "neutral",
};

export const TICKET_PRIORITIES: TicketPriority[] = [
  "Urgent",
  "High",
  "Medium",
  "Low",
];

// Support ticket lifecycle statuses. Resolved is terminal: the ticket leaves
// the Open tab and all header actions are disabled.
export type TicketStatus = "Open" | "Resolved";

export const TICKET_STATUS_TONE: Record<TicketStatus, StatusTone> = {
  Open: "info",
  Resolved: "success",
};

// Officers/agents selectable when assigning a support ticket.
export const TICKET_AGENTS = [
  "Sarah Okon",
  "Tola Bello",
  "Femi Adebayo",
] as const;

export type TicketCategory =
  | "Payment Issue"
  | "Ride Issue"
  | "Account Access"
  | "Lost Item"
  | "Other";

export const TICKET_CATEGORIES: TicketCategory[] = [
  "Payment Issue",
  "Ride Issue",
  "Account Access",
  "Lost Item",
  "Other",
];

export type RequesterType = "Passenger" | "Driver";

// One message in a support conversation. `from: "agent"` renders the purple
// right-aligned bubble; `from: "customer"` the white left bubble; "note" the
// full-width amber internal-note banner. Times are static strings.
export interface TicketMessage {
  id: string;
  from: "customer" | "agent" | "note" | "system";
  sender: string;
  text: string;
  timeLabel: string;
}

// A single support ticket. `timeAgo` and `openedLabel` are static strings so
// the first render is identical on server and client.
export interface SupportTicket {
  id: string;
  subject: string;
  category: TicketCategory;
  requester: Person;
  requesterType: RequesterType;
  // e.g. "Passenger • 142 rides • ★ 4.9".
  requesterMeta: string;
  // Related ride id, or null when the ticket has none.
  rideId: string | null;
  timeAgo: string;
  openedLabel: string;
  priority: TicketPriority;
  status: TicketStatus;
  // True once escalated. Escalate is disabled when set.
  escalated: boolean;
  // Assigned agent name, or null when unassigned.
  assignee: string | null;
  messages: TicketMessage[];
}

export interface SupportTicketsData {
  tickets: SupportTicket[];
}

// A single review as rendered by Ratings & Reviews. `status` holds the RAW
// backend moderationStatus (observed 2026-11-14: none | approved; the .http
// documents none | under_review | approved | hidden) — render through
// reviewStatusDisplay in lib/ratings.ts, which falls back to a humanised label
// on a neutral chip for values outside that set. `rating` is the raw stars
// value (integer 1-5 observed); null renders as "—". `timeLabel` is derived
// from createdAt at map time (absolute date, no Date.now, so server and client
// renders match).
export interface Review {
  id: string;
  // Author of the review (backend rater { userId, name, role }).
  reviewer: Person;
  // Display words for the author and the rated party, derived from their
  // backend role at map time ("Passenger"/"Driver", humanised otherwise).
  reviewerLabel: string;
  // The rated party (backend ratee { userId, name, role }).
  rated: Person;
  ratedLabel: string;
  // Raw backend raterRole: rider = rider reviewing driver.
  raterRole: string;
  rating: number | null;
  // Backend comment; "—" when null (null in 14 of 17 observed rows).
  text: string;
  rideId: string;
  timeLabel: string;
  // Raw backend moderationStatus.
  status: string;
}

// Four header stat cards. null = not loaded / failed / no such field on the
// endpoint -> the card renders "—"; a loaded true zero stays "0". Notes are
// strings built from endpoint count fields, or null when the endpoint has no
// counterpart (the note line is then omitted rather than fabricated).
export interface ReviewsSummary {
  // 1-5 double scale, rendered with 2 decimals.
  platformAverage: number | null;
  platformAverageNote: string | null;
  driverRating: number | null;
  driverRatingNote: string | null;
  passengerRating: number | null;
  passengerRatingNote: string | null;
  lowRatedRides: number | null;
  // No trend/delta field exists on /ratings/stats, so this stays null.
  lowRatedRidesNote: string | null;
}
