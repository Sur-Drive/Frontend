// Backend response types for GET /admin/ride-hailing/passengers, transcribed
// from the observed response shapes. Mapping
// code must treat every field as optional at runtime.

// Observed envelope: { items, total, page, limit, totalPages }. `total` is the
// collection total, not the page size (observed: total 24 with 20 items at
// limit 20) — the same envelope every passenger sub-resource uses.
export interface PassengerListResponse {
  items: PassengerListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PassengerListItem {
  profileId: string;
  userId: string;
  name: string;
  phoneNumber: string | null;
  // Observed as both null and a string (2026-11-10 sample).
  email: string | null;
  totalRides: number;
  // Observed as a float (e.g. 140758.11), not an int.
  totalSpend: number;
  // Observed as both null and a number, including floats (4.33). Every
  // zero-ride passenger in the sample carried the backend default 5.
  rating: number | null;
  registeredAt: string | null;
  accountStatus: string | null;
  // Observed as both null and a string URL.
  profilePicture: string | null;
}

// Observed on GET /admin/ride-hailing/passengers/{profileId}/overview.
export interface PassengerOverviewResponse {
  profileId: string;
  userId: string;
  personal: {
    fullName: string;
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
    email: string | null;
    profilePicture: string | null;
    joinedAt: string | null;
    accountStatus: string | null;
    lastActiveAt: string | null;
  };
  stats: {
    totalRides: number | null;
    rating: number | null;
    ratingCount: number | null;
    totalSpend: number | null;
    currency: string | null;
  };
  recentActivity: OverviewActivityItem[];
}

// Observed on the passenger overview; reused for validating driver activity
// items at runtime (the driver overview returned an empty array).
export interface OverviewActivityItem {
  id: string;
  source: string;
  type: string;
  description: string;
  amount: number | null;
  at: string;
}

// Paginated sub-resource envelope shared by the per-passenger list endpoints
// ({ items, total, page, limit, totalPages }). `total` is the collection total
// for the query, not the size of `items`.
export interface PassengerPage<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// GET /admin/ride-hailing/passengers/{passengerId}/rides
// Item keys observed 2026-11-10 (limit=5 sample; names/types only).
export interface PassengerRideItem {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  status: string;
  finalFare: number | null;
  requestedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
}

export interface PassengerRidesResponse {
  summary: {
    completedRides: number;
    cancellationRate: number;
    averageFare: number;
  };
  recentRides: PassengerPage<PassengerRideItem>;
}

// GET /admin/ride-hailing/passengers/{passengerId}/payments
// Item keys observed 2026-11-10 (names/types only).
export interface PassengerTransactionItem {
  id: string;
  reference: string;
  description: string;
  status: string;
  amount: number;
  currency: string;
  paidAt: string;
  createdAt: string;
}

export interface PassengerPaymentsResponse {
  summary: {
    totalSpend: number;
    refunds: number;
    walletBalance: number | null;
    failedLast90Days: number;
    lastPaymentAt: string | null;
    currency: string;
  };
  paymentMethod: {
    primaryCard: string | null;
    cardExpiry: string | null;
    billingEmail: string | null;
  };
  recentTransactions: PassengerPage<PassengerTransactionItem>;
}

// GET /admin/ride-hailing/passengers/{passengerId}/ratings
// Item keys observed 2026-11-10 (names/types only).
export interface PassengerRatingItem {
  id: string;
  rideId: string;
  stars: number;
  comment: string | null;
  // Only the array length was observed for `tags` (element type unknown), so
  // it is never rendered.
  tags: unknown[];
  isLowRating: boolean;
  reportedIssue: string | null;
  driverId: string;
  createdAt: string;
}

export interface PassengerRatingsResponse {
  summary: {
    averageRating: number;
    total: number;
    complaintsResolved: number | null;
    distribution: { stars: number; count: number; percent: number }[];
  };
  recent: PassengerPage<PassengerRatingItem>;
}

// ---- Drawer tab payloads -------------------------------------------------
// Each tab stores its endpoint summary (the only allowed source of truth for
// tab stats) plus the mapped list items. Fields are normalized to `null` when
// missing so a bad payload renders "—", never a fabricated 0.

export interface PassengerRidesPayload {
  summary: {
    completedRides: number | null;
    cancellationRate: number | null;
    averageFare: number | null;
  } | null;
  // recentRides.total — the envelope's collection total (= total rides for
  // this passenger), not the size of the returned page.
  totalRides: number | null;
  items: PassengerRideItem[];
}

export interface PassengerPaymentsPayload {
  summary: {
    totalSpend: number | null;
    refunds: number | null;
    walletBalance: number | null;
    failedLast90Days: number | null;
    lastPaymentAt: string | null;
    currency: string | null;
  } | null;
  paymentMethod: {
    primaryCard: string | null;
    cardExpiry: string | null;
    billingEmail: string | null;
  } | null;
  items: PassengerTransactionItem[];
}

export interface PassengerRatingsPayload {
  summary: {
    averageRating: number | null;
    total: number | null;
    complaintsResolved: number | null;
    distribution: { stars: number; count: number; percent: number }[];
  } | null;
  items: PassengerRatingItem[];
}

// One entry of the drawer's `tabData` record. `loaded` is set only after a
// successful fetch and is deliberately separate from the payload arrays: an
// empty array can be a true zero, so it must never imply "not fetched yet".
// An unloaded or failed tab has no payload (or loaded=false), and its stats
// render "—".
export interface PassengerTabData {
  loaded: boolean;
  rides?: PassengerRidesPayload | null;
  payments?: PassengerPaymentsPayload | null;
  ratings?: PassengerRatingsPayload | null;
}
