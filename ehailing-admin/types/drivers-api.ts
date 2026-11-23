// Backend response types for GET /admin/ride-hailing/drivers, transcribed from
// the observed response shape. Fields marked
// nullable were observed null in some or all samples; mapping code must treat
// every field as optional at runtime.

// Observed envelope: { items, total, page, limit, totalPages }.
export interface DriverListResponse {
  items: DriverListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DriverListItem {
  profileId: string;
  userId: string;
  name: string;
  phoneNumber: string | null;
  vehicle: {
    model: string | null;
    plateNumber: string | null;
  } | null;
  category: string | null;
  totalRides: number;
  rating: number | null;
  verificationStatus: string | null;
  onlineStatus: string | null;
  accountStatus: string | null;
  profilePicture: string | null;
}

// Observed on GET /admin/ride-hailing/drivers/{profileId}/overview.
export interface DriverOverviewResponse {
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
    lowRatingCount: number | null;
    totalEarnings: number | null;
    currency: string | null;
  };
  // Observed 2026-11-10: one driver's wallet had balances 0 with status
  // "active", another was all null. Not rendered anywhere.
  wallet: {
    walletId: string | null;
    availableBalance: number | null;
    pendingBalance: number | null;
    lockedBalance: number | null;
    currency: string | null;
    status: string | null;
  };
  vehicle: {
    makeModel: string | null;
    plateNumber: string | null;
    category: string | null;
  } | null;
  verification: {
    status: string | null;
  } | null;
  online: {
    status: string | null;
    activeRideId: string | null;
    lat: number | null;
    lng: number | null;
    lastUpdated: string | null;
  } | null;
  // Observed as an empty array; item shape not yet observed, so entries are
  // validated at runtime before use.
  recentActivity: unknown[];
}

// GET /admin/ride-hailing/drivers/{profileId}/documents
export interface DriverDocument {
  key: string;
  name: string;
  type: string;
  url: string | null;
  reference: string | null;
  expiryDate: string | null;
  daysUntilExpiry: number | null;
  status: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  actionable: boolean;
}

export interface DriverDocumentsResponse {
  counts: {
    verified: number;
    expiringSoon: number;
    pending: number;
    rejected: number;
    compliancePercent: number;
  };
  documents: DriverDocument[];
}

// GET /admin/ride-hailing/drivers/{profileId}/performance
export interface DriverPerformanceResponse {
  window: string;
  acceptanceRate: number;
  completionRate: number;
  rating: number;
  ratingCount: number;
  lowRatingCount: number;
  completedRides: number;
  cancelledRides: number;
  averagePickupSeconds: number | null;
  feedback: {
    totalRatings: number;
    totalMentions: number;
    // Item keys observed 2026-11-10 (limit=5 sample): { tag, count,
    // percentOfRatings }. Not rendered yet; typed for completeness.
    byTag: { tag: string; count: number; percentOfRatings: number }[];
  };
}

// GET /admin/ride-hailing/drivers/{profileId}/rides
// Ride item keys observed 2026-11-10 (limit=5 sample, names/types only).
// finalFare/driverEarnings are naira — settled 2026-11-10: summary.averageFare
// equals the exact mean of the non-null finalFares (854462.39 / 8 = 106807.8),
// and the typical fares (1414.7–2527.28) are plausible naira but not kobo.
export interface DriverRideItem {
  id: string;
  pickupAddress: string;
  dropoffAddress: string;
  status: string;
  finalFare: number | null;
  driverEarnings: number | null;
  requestedAt: string;
  completedAt: string | null;
  cancelledAt: string | null;
}

export interface DriverRidePage<T = unknown> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DriverRidesResponse {
  summary: {
    completedRides: number;
    // Percent 0–100 (observed 57.89 = 11/19 x 100).
    cancellationRate: number;
    // Naira (see DriverRideItem unit note above).
    averageFare: number;
  };
  recentRides: DriverRidePage<DriverRideItem>;
}

// GET /admin/ride-hailing/drivers/{profileId}/activity
export interface DriverActivityResponse {
  items: unknown[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// GET /admin/ride-hailing/drivers/{profileId}/ratings
export interface DriverRatingsResponse {
  summary: {
    averageRating: number;
    total: number;
    lowRatingCount: number;
    distribution: { stars: number; count: number; percent: number }[];
  };
  recent: DriverRidePage;
}

// GET /admin/ride-hailing/drivers/{profileId}/financials
// Observed 2026-11-10: thisWeekEarnings/lifetimeEarnings were 0 in every
// sample and recentTransactions was empty, so the naira-vs-kobo unit of the
// money fields is UNRESOLVED (rendered as-is until a non-zero sample exists).
export interface DriverFinancialsResponse {
  currency: string;
  wallet: {
    walletId: string | null;
    availableBalance: number | null;
    pendingBalance: number | null;
    lockedBalance: number | null;
    status: string | null;
    allowNegative: boolean | null;
  };
  thisWeekEarnings: number;
  lifetimeEarnings: number;
  // Percent 0–100 (observed 20).
  commissionPercent: number | null;
  // Item keys NOT observed (empty in every sample): only the count is used.
  recentTransactions: unknown[];
}

// GET /admin/ride-hailing/vehicles/{driverProfileId}
export interface DriverVehicleResponse {
  profileId: string;
  userId: string;
  vehicle: {
    makeModel: string | null;
    make: string | null;
    model: string | null;
    registrationNumber: string | null;
    category: string | null;
    capacity: number | null;
    plateNumber: string | null;
  } | null;
  driver: {
    userId: string;
    name: string;
    email: string | null;
    phoneNumber: string | null;
    profilePicture: string | null;
    gender: string | null;
    dateOfBirth: string | null;
    accountStatus: string | null;
  } | null;
  approval: {
    status: string | null;
    approvedAt: string | null;
    approvedBy: string | null;
    rejectionReason: string | null;
    onboardingStep: string | null;
  } | null;
  documents: unknown[];
}

// ---- Drawer tab payloads -------------------------------------------------
// Each payload is what the drawer renders for one tab. Fields are normalized
// to `null` when missing so a bad payload renders "—", never a fabricated 0.

export interface DriverDocumentCounts {
  verified: number | null;
  expiringSoon: number | null;
  pending: number | null;
  rejected: number | null;
  compliancePercent: number | null;
}

export interface DriverPerformancePayload {
  window: string | null;
  // Fraction 0–1 (observed 1 for a driver with 8 completed rides in the same
  // window — a 1% value could not produce them), rendered as x100%.
  acceptanceRate: number | null;
  // Percent 0–100 (observed 42.11 = 8/19 x 100).
  completionRate: number | null;
  rating: number | null;
  ratingCount: number | null;
  lowRatingCount: number | null;
  completedRides: number | null;
  cancelledRides: number | null;
  averagePickupSeconds: number | null;
  feedback: { totalRatings: number | null; totalMentions: number | null } | null;
}

export interface DriverFinancialsPayload {
  currency: string | null;
  wallet: {
    availableBalance: number | null;
    pendingBalance: number | null;
    lockedBalance: number | null;
    status: string | null;
  } | null;
  // Money unit UNRESOLVED (every observed value is 0) — rendered as-is.
  thisWeekEarnings: number | null;
  lifetimeEarnings: number | null;
  // Percent 0–100 (observed 20).
  commissionPercent: number | null;
  // recentTransactions.length — the item keys were not observed (empty in
  // every sample), so only the count is shown, never fabricated rows.
  recentTransactionsCount: number | null;
}

export interface DriverRidesPayload {
  // The summary is the only allowed source of truth for the tab's stats.
  summary: {
    completedRides: number | null;
    // Percent 0–100 (observed 57.89 = 11/19 x 100).
    cancellationRate: number | null;
    // Naira (see the DriverRideItem unit note).
    averageFare: number | null;
  } | null;
  // recentRides.total — the envelope's collection total, not the page size.
  total: number | null;
  items: DriverRideItem[];
}
