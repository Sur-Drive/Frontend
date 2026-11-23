// Observed shapes for GET /admin/ride-hailing/live-operations
// (2026-11-12, limit=5 sample): standard
// pagination envelope { total, page, limit, totalPages } PLUS a stats object.
// Every field is optional/nullable on purpose: lib/live-operations.ts reads
// them defensively so a missing or null value renders "—" and never throws.

export interface LiveOperationsStats {
  // Rides awaiting a driver (0 in every observed response).
  matchingRides?: number | null;
  inProgress?: number | null;
  delayed?: number | null;
  categories?: number | null;
}

export interface LiveRidePerson {
  userId?: string | null;
  name?: string | null;
  // SENSITIVE: phone numbers are never rendered, logged or stored by the UI;
  // the mapping layer only ever reads `name`.
  phoneNumber?: string | null;
}

export interface LiveOperationsItem {
  id?: string | null;
  passenger?: LiveRidePerson | null;
  // null when no driver is assigned (not observed in samples; handled anyway).
  driver?: LiveRidePerson | null;
  pickupAddress?: string | null;
  dropoffAddress?: string | null;
  category?: string | null;
  // Raw status. Observed: ride_in_progress, driver_en_route. Documented as
  // well: requested, searching, driver_assigned,
  // driver_en_route, driver_arrived, ride_started, ride_in_progress.
  status?: string | null;
  isDelayed?: boolean | null;
  requestedAt?: string | null;
}

export interface LiveOperationsResponse {
  stats?: LiveOperationsStats | null;
  items?: LiveOperationsItem[] | null;
  total?: number | null;
  page?: number | null;
  limit?: number | null;
  totalPages?: number | null;
}
