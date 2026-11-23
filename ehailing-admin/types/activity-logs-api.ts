// Observed shapes for GET /admin/ride-hailing/activity-logs{,/stats,
// /filter-options}. Observed 2026-11-12, limit=5
// sample. Every field is optional/nullable on purpose: lib/activity-logs.ts
// reads them defensively so a missing or null value renders "—" and never
// throws.

// SENSITIVE: `metadata.body` is the logged REQUEST BODY union from other
// endpoints (incident/notifications payloads observed; may also carry
// credentials, tokens or national IDs on other endpoints). The mapping layer
// drops `metadata` entirely — no UI model, table cell or client-side CSV ever
// carries it.
export interface ActivityLogMetadata {
  body?: Record<string, unknown> | null;
}

export interface ActivityLogItem {
  id?: string | null;
  userId?: string | null;
  userName?: string | null;
  // SENSITIVE (email): dropped by the mapper, never rendered or exported.
  userEmail?: string | null;
  roleName?: string | null;
  // Observed: create | update (open-ended; .http also documents approve and
  // delete as filter values).
  action?: string | null;
  // Observed: incident | notifications (open-ended).
  entityType?: string | null;
  entityId?: string | null;
  entityLabel?: string | null;
  description?: string | null;
  metadata?: ActivityLogMetadata | null;
  ipAddress?: string | null;
  // Observed: PATCH | POST (open-ended).
  httpMethod?: string | null;
  httpPath?: string | null;
  // Observed: 200 (open-ended).
  statusCode?: number | null;
  success?: boolean | null;
  errorMessage?: string | null;
  createdAt?: string | null;
}

// Standard pagination envelope; items arrive newest-first (createdAt
// descending, observed 2026-11-12).
export interface ActivityLogsListResponse {
  items?: ActivityLogItem[] | null;
  total?: number | null;
  page?: number | null;
  limit?: number | null;
  totalPages?: number | null;
}

// Bare object, no envelope (observed 2026-11-12: total=4, today=0).
export interface ActivityLogsStatsResponse {
  total?: number | null;
  today?: number | null;
}

export interface ActivityLogFilterUser {
  userId?: string | null;
  userName?: string | null;
}

// Bare object for the dropdowns (observed 2026-11-12): users[2] of
// { userId, userName }, roles/actions/entityTypes as plain string arrays.
// Values are open-ended — never treated as a fixed vocabulary.
export interface ActivityLogFilterOptions {
  users?: ActivityLogFilterUser[] | null;
  roles?: string[] | null;
  actions?: string[] | null;
  entityTypes?: string[] | null;
}
