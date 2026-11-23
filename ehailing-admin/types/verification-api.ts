// Backend response types for GET /admin/ride-hailing/verification/*,
// transcribed from the observed response shapes (re-observed 2026-11-11:
// limit=5 samples on all three list tabs plus the stats endpoint; field
// names matched the recorded blocks exactly). Fields marked nullable were
// observed null in some or all samples; mapping code must treat every field
// as optional at runtime.

// Observed envelope on all three list endpoints (driver, vehicle, expiring):
// { items, total, page, limit, totalPages }.
export interface VerificationListResponse {
  items: VerificationListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface VerificationListItem {
  id: string;
  applicant: {
    profileId: string;
    userId: string;
    // PII: rendered only as the applicant's name / avatar initials.
    name: string;
    email: string;
    phoneNumber: string;
    // Observed null|string (driver tab), string (vehicle tab), string|null
    // (expiring tab).
    profilePicture: string | null;
    // Observed string on driver/vehicle rows, string|null on expiring rows.
    vehiclePlate: string | null;
  };
  // Observed rows: driver | vehicle. Open string, not treated as exhaustive.
  submissionType: string;
  document: {
    // Observed rows: driversLicense | facePhoto (driver tab),
    // ownershipDocument | roadworthiness | vehicleLicense (vehicle tab).
    // The key doubles as the PATCH path segment for document decisions.
    key: string;
    name: string;
    url: string;
  };
  submissionDate: string;
  expiryDate: string | null;
  // Observed rows: pending (driver/vehicle tabs), expired (expiring tab).
  // Also used as a query param and, with "verified", as a decision value —
  // open string, not treated as exhaustive.
  status: string;
  daysUntilExpiry: number | null;
  // Observed null in every 2026-11-08 and 2026-11-11 sample.
  verifiedAt: string | null;
  verifiedBy: string | null;
}

// GET /admin/ride-hailing/verification/stats — bare object, no envelope.
// Observed 2026-11-11 (counts only; pendingReviews = byTab.driver.pending +
// byTab.vehicle.pending in the observed sample: 8 + 48 = 56).
export interface VerificationStatsResponse {
  pendingReviews: number;
  approvedToday: number;
  expiringSoon: number;
  expiringSoonWindowDays: number;
  byTab: {
    driver: { pending: number };
    vehicle: { pending: number };
    expiring: { expiringSoon: number; expired: number };
  };
}
