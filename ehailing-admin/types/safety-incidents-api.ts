// Safety Incidents backend shapes — observed live (GET only) on 2026-11-11.
// Sample, not exhaustive:
// fields may be absent or null; every consumer reads defensively.
// Sensitive fields (reportedBy.phoneNumber/email, description, location,
// resolutionNotes, accusedUser) are typed here so the mapping layer can
// explicitly EXCLUDE them — they are never rendered, logged or stored.

export interface SafetyStatsResponse {
  // Bare object, no envelope (GET /admin/ride-hailing/safety/stats). The four
  // fields are the only ones the endpoint exposes — there is no SOS-alert or
  // under-investigation counter.
  open?: number | null;
  unassigned?: number | null;
  critical?: number | null;
  resolvedToday?: number | null;
}

export interface SafetyIncidentReportedBy {
  userId?: string | null;
  name?: string | null;
  role?: string | null; // observed enum: admin | rider
}

export interface SafetyIncidentListItem {
  id?: string | null;
  sourceType?: string | null; // observed enum: admin | sos
  incidentType?: string | null;
  rideId?: string | null; // null in every observed sample
  reportedBy?: SafetyIncidentReportedBy | null;
  severity?: string | null;
  assignedOfficer?: unknown; // null in every observed sample; set-shape unobserved
  createdAt?: string | null; // ISO datetime string
  status?: string | null;
  locationAddress?: string | null;
}

export interface SafetyIncidentListResponse {
  items: SafetyIncidentListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// GET /admin/ride-hailing/safety/incidents/{id} — Observed 2026-11-11 (two
// samples: one resolved, one open). Detail adds fields the list does not carry.
export interface SafetyIncidentDetailResponse extends SafetyIncidentListItem {
  sourceId?: string | null;
  // Sensitive free text / identity — excluded by mapIncidentDetail.
  reportedBy?: (SafetyIncidentReportedBy & {
    phoneNumber?: string | null;
    email?: string | null;
  }) | null;
  accusedUser?: unknown; // sensitive identity; null in samples
  description?: string | null; // sensitive free text
  location?: {
    latitude?: number | null;
    longitude?: number | null;
    address?: string | null;
  } | null;
  occurredAt?: string | null; // ISO datetime string
  evidence?: unknown[]; // empty in every observed sample — element shape unobserved
  resolutionNotes?: string | null;
  resolvedAt?: string | null; // ISO datetime string
  resolvedBy?: unknown;
  updatedAt?: string | null; // ISO datetime string
  ride?: unknown;
}

// POST /admin/ride-hailing/safety/incidents — confirmed body fields only.
// Optional fields are included only when the UI
// can carry them: latitude/longitude/evidenceUrls/accusedUserId have no input.
export interface SafetyIncidentCreateBody {
  incidentType: string;
  location: string;
  occurredAt: string; // ISO datetime
  severity: string;
  description: string;
  rideId?: string;
}

// PATCH /admin/ride-hailing/safety/incidents/{id} — the .http documents
// { status }, { severity, status }, { assignedTo: null }, { status,
// resolutionNotes }. Only status/severity/resolutionNotes are wired (assign
// has no officer user-id input).
export interface SafetyIncidentUpdateBody {
  status?: string;
  severity?: string;
  resolutionNotes?: string;
}
