// Response types for the Analytics & Dashboard endpoints (all GET). Shapes are
// as observed on 2026-11-14; field-level evidence was verified one by one.

// Shared delta object: relative percent change for counts/durations, but
// PERCENTAGE POINTS for cancellationRate (68 vs 20 reported as +48). The
// backend also emits a third direction, "flat" (observed on a zeroed
// financial city window).
export interface DeltaInfo {
  deltaPercent: number;
  direction: "up" | "down" | "flat";
}

// GET /admin/ride-hailing/dashboard — today's snapshot, no date params.
export interface DashboardWindow {
  date: string;
  city: string | null;
}

export interface DashboardStats {
  totalPassengers: number;
  registeredDrivers: number;
  onlineDrivers: number;
  activeRides: number;
  searchingRides: number;
  completedToday: number;
  pendingDriverApprovals: number;
  grossRevenueToday: number;
  pendingSettlements: {
    amount: number;
    drivers: number;
  };
}

export interface HourBucket {
  hour: number;
  count: number;
}

// Item shape unobserved (the array was empty in every probe, because
// completedToday was 0); lib/analytics validates items against the sibling
// /analytics/rides keys at runtime instead of trusting a guessed shape.
export type DashboardCategoryItem = unknown;

export interface DashboardResponse {
  window: DashboardWindow;
  stats: DashboardStats;
  categoryDistribution: DashboardCategoryItem[];
  hourlyActivity: HourBucket[];
}

// GET /admin/ride-hailing/analytics/rides — from/to REQUIRED (400 without).
export interface AnalyticsWindow {
  from: string;
  to: string;
  city: string | null;
}

export interface RideTotals {
  totalRequests: number;
  totalRequestsDelta: DeltaInfo;
  completedRides: number;
  completedRidesDelta: DeltaInfo;
  cancellationRate: number;
  cancellationRateDelta: DeltaInfo;
  avgTripDurationMin: number;
  avgTripDurationDelta: DeltaInfo;
}

// Counts sum to totals.totalRequests, percents to 100 and completedCounts to
// totals.completedRides (verified against the rides list for the same window).
export interface RideCategorySlice {
  category: string;
  count: number;
  percent: number;
  completedCount: number;
  completionRate: number;
}

// Peak of the same non-cancelled hourly series as /trend (label "H:00 - H+1:00").
export interface PeakHour {
  hour: number;
  label: string;
  count: number;
}

// Verbatim copy of the leading categoryDistribution entry.
export interface CompletionLeader {
  category: string;
  count: number;
  percent: number;
  completedCount: number;
  completionRate: number;
}

export interface RideAnalyticsResponse {
  window: AnalyticsWindow;
  totals: RideTotals;
  categoryDistribution: RideCategorySlice[];
  peakHour: PeakHour;
  completionLeader: CompletionLeader;
}

// GET /admin/ride-hailing/analytics/rides/trend — 24 hour-of-day buckets
// aggregated across the whole window; counts are NON-CANCELLED requests
// (sum equals totals.totalRequests - cancellations, verified 3/3 windows).
export interface RideTrendResponse {
  window: {
    from: string;
    to: string;
  };
  byHour: HourBucket[];
}

// ---------------------------------------------------------------------------
// Safety / report endpoints (observed 2026-11-14)
// ---------------------------------------------------------------------------

// One named bucket of a status distribution: count + share of the total.
export interface StatusBucket {
  count: number;
  percent: number;
}

// GET /admin/ride-hailing/analytics/drivers — a CURRENT-STATE snapshot: the
// empty-window probe (2026-01-01..02) returned a body identical to the
// populated November window, so the echoed range does not change any value.
// acceptanceRate is a 0-1 fraction (1 = 100%), matching the driver
// performance endpoint's unit.
export interface DriverTotals {
  registeredDrivers: number;
  onlineDrivers: number;
  acceptanceRate: number;
  avgRating: number;
}

export interface DriverDistribution {
  total: number;
  active: StatusBucket;
  onboarding: StatusBucket;
  suspended: StatusBucket;
}

export interface DriverAnalyticsResponse {
  window: {
    from: string;
    to: string;
  };
  totals: DriverTotals;
  distribution: DriverDistribution;
}

// GET /admin/ride-hailing/analytics/passengers — registeredPassengers and the
// status distribution are platform totals, while monthlyActive/newPassengers
// are window-scoped; the distribution's "active" bucket also shifts with the
// window (4 vs 3 across probed windows) while still summing to the total.
export interface PassengerTotals {
  registeredPassengers: number;
  monthlyActive: number;
  monthlyActiveDelta: DeltaInfo;
  newPassengers: number;
  repeatRate: number;
}

export interface PassengerDistribution {
  total: number;
  active: StatusBucket;
  new: StatusBucket;
  dormant: StatusBucket;
}

export interface PassengerAnalyticsResponse {
  window: {
    from: string;
    to: string;
  };
  totals: PassengerTotals;
  distribution: PassengerDistribution;
}

// GET /admin/ride-hailing/analytics/financial — money is NAIRA;
// platformCommission + driverEarnings equal grossRevenue exactly in both
// probed snapshots and commission is exactly 20%. The city filter works
// (Lagos zeroed every total) and produced the backend's third direction
// value, "flat". distribution is always null — no category split exists.
export interface FinancialTotals {
  grossRevenue: number;
  grossRevenueDelta: DeltaInfo;
  platformCommission: number;
  driverEarnings: number;
  avgFare: number;
  promoDiscountTotal: number;
}

export interface FinancialAnalyticsResponse {
  window: {
    from: string;
    to: string;
    city: string | null;
  };
  totals: FinancialTotals;
  distribution: null;
}

// GET /admin/ride-hailing/analytics/safety — resolutionRate is
// resolved/total x 100 (2/5 = 40, cross-checked against the incidents list);
// the distribution groups incidentType into behaviour (harassment +
// unsafe_driving), accidents, and routeOther (sos_alert).
export interface SafetyTotals {
  totalIncidents: number;
  criticalIncidents: number;
  resolutionRate: number;
  avgResolutionHours: number;
}

export interface SafetyDistribution {
  total: number;
  behaviour: StatusBucket;
  accidents: StatusBucket;
  routeOther: StatusBucket;
}

export interface SafetyAnalyticsResponse {
  window: {
    from: string;
    to: string;
  };
  totals: SafetyTotals;
  distribution: SafetyDistribution;
}
