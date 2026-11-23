import { apiFetch } from "@/lib/api";
import { toCsv } from "@/lib/csv";
import { EM_DASH, formatNairaCompact, formatNumber, humanize, niceAxisScale } from "@/lib/format";
import type {
  AnalyticsDistribution,
  AnalyticsTrend,
  DistributionSlice,
  Insight,
} from "@/types/analytics";
import type { AnalyticsStatData } from "@/types/analytics";
import type {
  DashboardResponse,
  DeltaInfo,
  DriverAnalyticsResponse,
  FinancialAnalyticsResponse,
  HourBucket,
  PassengerAnalyticsResponse,
  RideAnalyticsResponse,
  RideCategorySlice,
  RideTrendResponse,
  SafetyAnalyticsResponse,
  StatusBucket,
} from "@/types/analytics-api";
import type { CategorySlice, HourPoint, KpiData } from "@/types/overview";

// Analytics & Dashboard data access (GET only). Every mapper is pure so the
// exact code the views render with stays testable in isolation. Units
// settled by probe on 2026-11-14:
//   - money is NAIRA (analytics/financial grossRevenue equals the exact naira
//     sum of paid fares; dashboard pendingSettlements.amount carries cents,
//     which kobo amounts cannot),
//   - cancellationRate/completionRate/percent are 0-100,
//   - count/duration deltas are relative %, cancellationRate deltas are
//     percentage points, and a zero previous period reports ±100.

const DASHBOARD_PATH = "/admin/ride-hailing/dashboard";
const RIDES_PATH = "/admin/ride-hailing/analytics/rides";
const DRIVERS_PATH = "/admin/ride-hailing/analytics/drivers";
const PASSENGERS_PATH = "/admin/ride-hailing/analytics/passengers";
const FINANCIAL_PATH = "/admin/ride-hailing/analytics/financial";
const SAFETY_PATH = "/admin/ride-hailing/analytics/safety";

// Backend message (ApiError) or friendly network text.
export function failureMessage(cause: unknown): string {
  return cause instanceof Error && cause.message
    ? cause.message
    : "Request failed. Please try again.";
}

// GET /admin/ride-hailing/dashboard — window is always today; city is optional
// (echoed into window.city and applied to hourlyActivity; the stats ignore it).
export function fetchDashboard(
  city: string | null,
  signal?: AbortSignal,
): Promise<DashboardResponse> {
  const query = city ? `?city=${encodeURIComponent(city)}` : "";
  return apiFetch<DashboardResponse>(`${DASHBOARD_PATH}${query}`, { signal });
}

export interface DateRange {
  from: string;
  to: string;
}

// from/to are REQUIRED on the analytics endpoints (400 without them); city is
// optional and "All cities" means omit it.
function rangeQuery(range: DateRange, city: string | null): string {
  const params = new URLSearchParams({ from: range.from, to: range.to });
  if (city) params.set("city", city);
  return params.toString();
}

export function fetchRideAnalytics(
  range: DateRange,
  city: string | null,
  signal?: AbortSignal,
): Promise<RideAnalyticsResponse> {
  return apiFetch<RideAnalyticsResponse>(
    `${RIDES_PATH}?${rangeQuery(range, city)}`,
    { signal },
  );
}

export function fetchRideTrend(
  range: DateRange,
  city: string | null,
  signal?: AbortSignal,
): Promise<RideTrendResponse> {
  return apiFetch<RideTrendResponse>(
    `${RIDES_PATH}/trend?${rangeQuery(range, city)}`,
    { signal },
  );
}

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

// Bucket hours are the hour component of the backend's Z timestamps (a ride
// requested 19:36Z landed in bucket 19, not the Lagos wall-clock hour 20).
export function hourLabel(hour: number): string {
  const suffix = hour < 12 ? "AM" : "PM";
  const base = hour % 12 === 0 ? 12 : hour % 12;
  return `${base} ${suffix}`;
}

const ALL_HOURS = Array.from({ length: 24 }, (_, hour) => hour);

// Percentages arrive 0-100 and already rounded by the backend (68, 33.33);
// they render verbatim so no display rounding can contradict the totals.
export function formatPercent(value: number): string {
  return `${value}%`;
}

// Counts/durations: relative percent ("+14.3%", "−85.1%"); the cancellation
// rate: percentage points ("+48 pts"), because 68 vs 20 is +48 points, not
// +48% relative (which would be +240%).
export function formatDelta(
  delta: DeltaInfo,
  unit: "percent" | "points",
): string {
  const sign =
    delta.deltaPercent > 0 ? "+" : delta.deltaPercent < 0 ? "−" : "";
  return `${sign}${Math.abs(delta.deltaPercent)}${
    unit === "percent" ? "%" : " pts"
  }`;
}

export function isImproving(
  delta: DeltaInfo,
  goodDirection: "up" | "down",
): boolean {
  return delta.direction === goodDirection;
}

// Ride categories observed so far (economy/comfort/suv); unknown values get
// the neutral humanised label instead of a guessed name.
const RIDE_CATEGORY_LABELS: Record<string, string> = {
  economy: "Economy",
  comfort: "Comfort",
  suv: "SUV",
};

export function rideCategoryLabel(value: string): string {
  return RIDE_CATEGORY_LABELS[value] ?? humanize(value);
}

// ---------------------------------------------------------------------------
// Dashboard overview (GET /admin/ride-hailing/dashboard)
// ---------------------------------------------------------------------------

// KPI cards. The endpoint exposes no period deltas, so notes carry only
// backend-backed context (settlement driver count) or static copy — the mock
// deltas (+12.5% …) were never backed by an endpoint and are gone.
export function mapDashboardKpis(raw: DashboardResponse): KpiData[] {
  const stats = raw.stats;
  return [
    {
      key: "passengers",
      label: "Total Passengers",
      value: formatNumber(stats.totalPassengers),
      tone: "brand",
    },
    {
      key: "drivers",
      label: "Registered Drivers",
      value: formatNumber(stats.registeredDrivers),
      tone: "warning",
    },
    {
      key: "online-drivers",
      label: "Online Drivers",
      value: formatNumber(stats.onlineDrivers),
      tone: "success",
    },
    {
      key: "active-rides",
      label: "Active Rides",
      value: formatNumber(stats.activeRides),
      tone: "info",
    },
    {
      key: "completed-rides",
      label: "Completed Today",
      value: formatNumber(stats.completedToday),
      tone: "brand",
    },
    {
      key: "pending-approvals",
      label: "Pending Driver Approvals",
      value: formatNumber(stats.pendingDriverApprovals),
      note: "Needs review",
      noteTone: "muted",
      tone: "warning",
    },
    {
      key: "gross-revenue",
      label: "Gross Revenue Today",
      value: formatNairaCompact(stats.grossRevenueToday),
      tone: "success",
    },
    {
      key: "pending-settlements",
      label: "Pending Settlements",
      value: formatNairaCompact(stats.pendingSettlements?.amount ?? 0),
      note: `${formatNumber(stats.pendingSettlements?.drivers ?? 0)} drivers`,
      noteTone: "muted",
      tone: "warning",
    },
  ];
}

// hourlyActivity: today's ride requests per UTC hour across all statuses
// (observed: the day's single cancelled request was counted while
// completedToday was 0, so the series is request-based, not completions).
// Missing buckets are zero-filled — an absent hour means no requests in it.
export function mapHourBuckets(buckets: HourBucket[] | undefined): HourPoint[] {
  const byHour = new Map<number, number>();
  for (const bucket of buckets ?? []) {
    if (
      bucket &&
      typeof bucket.hour === "number" &&
      typeof bucket.count === "number"
    ) {
      byHour.set(bucket.hour, bucket.count);
    }
  }
  return ALL_HOURS.map((hour) => ({
    label: hourLabel(hour),
    count: byHour.get(hour) ?? 0,
  }));
}

export function mapHourlyActivity(raw: DashboardResponse): HourPoint[] {
  return mapHourBuckets(raw.hourlyActivity);
}

export interface DashboardCategories {
  slices: CategorySlice[];
  // False when items exist but do not carry the validated keys — the donut
  // then renders "Not available yet" instead of a guessed shape.
  shapeKnown: boolean;
}

// categoryDistribution was [] in every probe (completedToday was 0), so its
// item shape is unobserved. Items are accepted only with the sibling
// /analytics/rides keys (category/count/percent); anything else is unavailable.
export function mapDashboardCategories(
  raw: DashboardResponse,
): DashboardCategories {
  const items = raw.categoryDistribution;
  if (!Array.isArray(items) || items.length === 0) {
    return { slices: [], shapeKnown: true };
  }
  const slices: CategorySlice[] = [];
  for (const item of items) {
    const record = item as Record<string, unknown> | null;
    if (
      !record ||
      typeof record.category !== "string" ||
      typeof record.count !== "number" ||
      typeof record.percent !== "number"
    ) {
      return { slices: [], shapeKnown: false };
    }
    slices.push({
      name: rideCategoryLabel(record.category),
      count: record.count,
      percent: record.percent,
    });
  }
  return { slices, shapeKnown: true };
}

// ---------------------------------------------------------------------------
// Ride analytics (GET /admin/ride-hailing/analytics/rides[/trend])
// ---------------------------------------------------------------------------

export function mapRideStats(raw: RideAnalyticsResponse): AnalyticsStatData[] {
  const totals = raw.totals;
  // avgTripDurationMin is 0 whenever the window has no completed rides
  // (observed on two windows) — a backend default for empty data, so it
  // renders as "—" along with its delta rather than "0 min".
  const noCompleted = totals.completedRides === 0;
  return [
    {
      key: "requests",
      label: "Total Requests",
      value: formatNumber(totals.totalRequests),
      delta: formatDelta(totals.totalRequestsDelta, "percent"),
      improving: isImproving(totals.totalRequestsDelta, "up"),
      flat: totals.totalRequestsDelta.direction === "flat",
      tone: "brand",
    },
    {
      key: "completed",
      label: "Completed Rides",
      value: formatNumber(totals.completedRides),
      delta: formatDelta(totals.completedRidesDelta, "percent"),
      improving: isImproving(totals.completedRidesDelta, "up"),
      flat: totals.completedRidesDelta.direction === "flat",
      tone: "success",
    },
    {
      key: "cancellation",
      label: "Cancellation Rate",
      value: formatPercent(totals.cancellationRate),
      delta: formatDelta(totals.cancellationRateDelta, "points"),
      improving: isImproving(totals.cancellationRateDelta, "down"),
      flat: totals.cancellationRateDelta.direction === "flat",
      tone: "warning",
    },
    {
      key: "duration",
      label: "Avg. Trip Duration",
      value: noCompleted ? EM_DASH : `${totals.avgTripDurationMin} min`,
      delta: noCompleted
        ? ""
        : formatDelta(totals.avgTripDurationDelta, "percent"),
      improving: isImproving(totals.avgTripDurationDelta, "down"),
      flat: totals.avgTripDurationDelta.direction === "flat",
      tone: "info",
    },
  ];
}

// byHour aggregates NON-CANCELLED requests by hour of day across the whole
// window (sum equals totalRequests minus cancellations in three probed
// windows) — it is neither the request total nor the completed count, so the
// card copy says so explicitly.
export function mapRideTrend(
  raw: RideAnalyticsResponse,
  trendRaw: RideTrendResponse,
  city: string | null,
): AnalyticsTrend {
  const points = mapHourBuckets(trendRaw?.byHour);
  const peak = points.reduce(
    (best, point) => (point.count > best.count ? point : best),
    points[0],
  );
  const axis = niceAxisScale(Math.max(...points.map((point) => point.count)));
  const rangeLabel = `${raw.window.from} to ${raw.window.to}`;
  return {
    title: "Ride demand by hour",
    subtitle: city
      ? `${city} · ${rangeLabel} · excludes cancelled`
      : `${rangeLabel} · excludes cancelled`,
    data: points.map((point) => ({ label: point.label, value: point.count })),
    accent: "brand",
    yDomain: [0, axis.max],
    yTicks: axis.ticks,
    formatTick: (value) => formatNumber(value),
    formatValue: (value) => `${formatNumber(value)} requests`,
    summary: `Requests by hour of day from ${rangeLabel}${
      city ? ` in ${city}` : ""
    }, peaking at ${formatNumber(peak.count)} in the ${peak.label} hour.`,
  };
}

function isRideCategorySlice(value: unknown): value is RideCategorySlice {
  const record = value as Record<string, unknown> | null;
  return (
    !!record &&
    typeof record.category === "string" &&
    typeof record.count === "number" &&
    typeof record.percent === "number" &&
    typeof record.completedCount === "number" &&
    typeof record.completionRate === "number"
  );
}

// categoryDistribution counts REQUESTS per category (counts sum to
// totals.totalRequests, percents to 100) — not completed rides.
export function mapRideDistribution(
  raw: RideAnalyticsResponse,
): AnalyticsDistribution {
  const slices: DistributionSlice[] = (raw.categoryDistribution ?? [])
    .filter(isRideCategorySlice)
    .map((slice) => ({
      name: rideCategoryLabel(slice.category),
      percent: slice.percent,
      value: formatNumber(slice.count),
    }));
  return {
    title: "Category distribution",
    total: formatNumber(raw.totals.totalRequests),
    caption: "Requests",
    slices,
    summary:
      slices.length > 0
        ? `Request distribution: ${slices
            .map((slice) => `${slice.name} ${slice.percent}%`)
            .join(", ")}.`
        : "No requests in this range.",
  };
}

// Two of the design's four insights are backed by the endpoint (peak hour and
// completion leader); "Top city" and "Avg. resolution" have no source and are
// left out instead of copied from the mock.
export function mapRideInsights(raw: RideAnalyticsResponse): Insight[] {
  const rows: Insight[] = [];
  const peak = raw.peakHour;
  if (peak && typeof peak.label === "string" && typeof peak.count === "number") {
    rows.push({
      title: "Peak demand",
      detail: `${peak.label} · ${formatNumber(peak.count)} requests`,
    });
  }
  const leader = raw.completionLeader;
  if (
    leader &&
    typeof leader.category === "string" &&
    typeof leader.completionRate === "number"
  ) {
    rows.push({
      title: "Completion leader",
      detail: `${rideCategoryLabel(leader.category)} · ${leader.completionRate}%`,
    });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Driver analytics (GET /admin/ride-hailing/analytics/drivers) — a CURRENT-
// STATE snapshot: the empty-window probe returned a body identical to the
// populated window, so no date controls change these values. The endpoint
// documents no city param, so none is sent.
// ---------------------------------------------------------------------------

export function fetchDriverAnalytics(
  range: DateRange,
  signal?: AbortSignal,
): Promise<DriverAnalyticsResponse> {
  return apiFetch<DriverAnalyticsResponse>(
    `${DRIVERS_PATH}?${rangeQuery(range, null)}`,
    { signal },
  );
}

// Fractions 0-1 render as 0-100 percents with float noise trimmed
// (0.55 * 100 -> "55%", 1 -> "100%").
export function formatFractionPercent(fraction: number): string {
  const fixed = (fraction * 100).toFixed(2);
  const trimmed = fixed.includes(".") ? fixed.replace(/\.?0+$/, "") : fixed;
  return `${trimmed}%`;
}

export function mapDriverStats(
  raw: DriverAnalyticsResponse | null,
): AnalyticsStatData[] {
  const totals = raw?.totals;
  return [
    {
      key: "registered",
      label: "Registered Drivers",
      value: totals ? formatNumber(totals.registeredDrivers) : EM_DASH,
      delta: "",
      improving: true,
      tone: "brand",
    },
    {
      key: "online",
      label: "Online Drivers",
      value: totals ? formatNumber(totals.onlineDrivers) : EM_DASH,
      delta: "",
      improving: true,
      tone: "success",
    },
    {
      key: "acceptance",
      label: "Acceptance Rate",
      value: totals ? formatFractionPercent(totals.acceptanceRate) : EM_DASH,
      delta: "",
      improving: true,
      tone: "warning",
    },
    {
      key: "rating",
      label: "Avg. Driver Rating",
      value: totals ? `${totals.avgRating}` : EM_DASH,
      delta: "",
      improving: true,
      tone: "info",
    },
  ];
}

// Shared status-distribution labels (observed enum keys only; the mappers
// validate each bucket's shape before it reaches the donut).
const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  onboarding: "Onboarding",
  suspended: "Suspended",
  new: "New",
  dormant: "Dormant",
  behaviour: "Behaviour",
  accidents: "Accidents",
  routeOther: "Route & other",
};

function mapStatusDistribution(
  raw: unknown,
  keys: string[],
  title: string,
  caption: string,
): AnalyticsDistribution | null {
  const record = raw as Record<string, unknown> | null;
  if (!record || typeof record.total !== "number") return null;
  const slices: DistributionSlice[] = [];
  for (const key of keys) {
    const bucket = record[key] as StatusBucket | undefined;
    if (
      !bucket ||
      typeof bucket.count !== "number" ||
      typeof bucket.percent !== "number"
    ) {
      return null;
    }
    slices.push({
      name: STATUS_LABELS[key] ?? humanize(key),
      percent: bucket.percent,
      value: formatNumber(bucket.count),
    });
  }
  return {
    title,
    total: formatNumber(record.total),
    caption,
    slices,
    summary: `${title}: ${slices
      .map((slice) => `${slice.name} ${slice.percent}%`)
      .join(", ")}.`,
  };
}

export function mapDriverDistribution(
  raw: DriverAnalyticsResponse | null,
): AnalyticsDistribution | null {
  return mapStatusDistribution(
    raw?.distribution,
    ["active", "onboarding", "suspended"],
    "Driver status distribution",
    "Drivers",
  );
}

// ---------------------------------------------------------------------------
// Passenger analytics (GET /admin/ride-hailing/analytics/passengers) — no
// city param is documented, so none is sent. monthlyActive is the only
// delta-backed field (relative %, verified 10 vs 5 -> +100).
// ---------------------------------------------------------------------------

export function fetchPassengerAnalytics(
  range: DateRange,
  signal?: AbortSignal,
): Promise<PassengerAnalyticsResponse> {
  return apiFetch<PassengerAnalyticsResponse>(
    `${PASSENGERS_PATH}?${rangeQuery(range, null)}`,
    { signal },
  );
}

export function mapPassengerStats(
  raw: PassengerAnalyticsResponse | null,
): AnalyticsStatData[] {
  const totals = raw?.totals;
  return [
    {
      key: "registered",
      label: "Registered Passengers",
      value: totals ? formatNumber(totals.registeredPassengers) : EM_DASH,
      delta: "",
      improving: true,
      tone: "brand",
    },
    {
      key: "monthly-active",
      label: "Monthly Active",
      value: totals ? formatNumber(totals.monthlyActive) : EM_DASH,
      delta: totals ? formatDelta(totals.monthlyActiveDelta, "percent") : "",
      improving: totals ? isImproving(totals.monthlyActiveDelta, "up") : true,
      flat: totals ? totals.monthlyActiveDelta.direction === "flat" : false,
      tone: "success",
    },
    {
      key: "new",
      label: "New Passengers",
      value: totals ? formatNumber(totals.newPassengers) : EM_DASH,
      delta: "",
      improving: true,
      tone: "info",
    },
    {
      key: "repeat",
      label: "Repeat Rate",
      value: totals ? formatPercent(totals.repeatRate) : EM_DASH,
      delta: "",
      improving: true,
      tone: "warning",
    },
  ];
}

export function mapPassengerDistribution(
  raw: PassengerAnalyticsResponse | null,
): AnalyticsDistribution | null {
  return mapStatusDistribution(
    raw?.distribution,
    ["active", "new", "dormant"],
    "Passenger status distribution",
    "Riders",
  );
}

// ---------------------------------------------------------------------------
// Financial analytics (GET /admin/ride-hailing/analytics/financial) — the
// only task-2 endpoint with a documented city filter. distribution is always
// null, so the tab's donut slot renders "Not available yet".
// ---------------------------------------------------------------------------

export function fetchFinancialAnalytics(
  range: DateRange,
  city: string | null,
  signal?: AbortSignal,
): Promise<FinancialAnalyticsResponse> {
  return apiFetch<FinancialAnalyticsResponse>(
    `${FINANCIAL_PATH}?${rangeQuery(range, city)}`,
    { signal },
  );
}

export function mapFinancialStats(
  raw: FinancialAnalyticsResponse | null,
): AnalyticsStatData[] {
  const totals = raw?.totals;
  // avgFare 0 with no completed fares is an average-of-nothing default
  // (observed on the zeroed Lagos window) — renders "—" like
  // avgTripDurationMin, while the money totals stay true zeros ("₦0").
  const noFares = totals ? totals.avgFare === 0 : false;
  return [
    {
      key: "gross",
      label: "Gross Revenue",
      value: totals ? formatNairaCompact(totals.grossRevenue) : EM_DASH,
      delta: totals ? formatDelta(totals.grossRevenueDelta, "percent") : "",
      improving: totals ? isImproving(totals.grossRevenueDelta, "up") : true,
      flat: totals ? totals.grossRevenueDelta.direction === "flat" : false,
      tone: "brand",
    },
    {
      key: "commission",
      label: "Platform Commission",
      value: totals ? formatNairaCompact(totals.platformCommission) : EM_DASH,
      delta: "",
      improving: true,
      tone: "success",
    },
    {
      key: "earnings",
      label: "Driver Earnings",
      value: totals ? formatNairaCompact(totals.driverEarnings) : EM_DASH,
      delta: "",
      improving: true,
      tone: "warning",
    },
    {
      key: "avg-fare",
      label: "Avg. Fare",
      value: totals && !noFares ? formatNairaCompact(totals.avgFare) : EM_DASH,
      delta: "",
      improving: true,
      tone: "info",
    },
  ];
}

// The only endpoint-backed insight beyond the stat cards: the promo total.
export function mapFinancialInsights(
  raw: FinancialAnalyticsResponse | null,
): Insight[] {
  const totals = raw?.totals;
  if (!totals || typeof totals.promoDiscountTotal !== "number") return [];
  return [
    {
      title: "Promo discounts",
      detail: `${formatNairaCompact(totals.promoDiscountTotal)} in the range`,
    },
  ];
}

// ---------------------------------------------------------------------------
// Safety analytics (GET /admin/ride-hailing/analytics/safety) — no city param
// is documented, so none is sent. resolutionRate is resolved/total x 100
// (cross-checked against the incidents list: 2 resolved of 5 = 40).
// ---------------------------------------------------------------------------

export function fetchSafetyAnalytics(
  range: DateRange,
  signal?: AbortSignal,
): Promise<SafetyAnalyticsResponse> {
  return apiFetch<SafetyAnalyticsResponse>(
    `${SAFETY_PATH}?${rangeQuery(range, null)}`,
    { signal },
  );
}

export function mapSafetyStats(
  raw: SafetyAnalyticsResponse | null,
): AnalyticsStatData[] {
  const totals = raw?.totals;
  // avgResolutionHours 0 mirrors avgTripDurationMin: an average over no
  // resolutions renders "—" (pattern applied from the rides endpoint; a
  // safety empty window was not probed directly).
  const noResolutionBase = totals ? totals.avgResolutionHours === 0 : false;
  return [
    {
      key: "total",
      label: "Total Incidents",
      value: totals ? formatNumber(totals.totalIncidents) : EM_DASH,
      delta: "",
      improving: true,
      tone: "brand",
    },
    {
      key: "critical",
      label: "Critical Incidents",
      value: totals ? formatNumber(totals.criticalIncidents) : EM_DASH,
      delta: "",
      improving: true,
      tone: "danger",
    },
    {
      key: "resolution",
      label: "Resolution Rate",
      value: totals ? formatPercent(totals.resolutionRate) : EM_DASH,
      delta: "",
      improving: true,
      tone: "success",
    },
    {
      key: "duration",
      label: "Avg. Resolution Time",
      value:
        totals && !noResolutionBase
          ? `${totals.avgResolutionHours} hrs`
          : EM_DASH,
      delta: "",
      improving: true,
      tone: "info",
    },
  ];
}

export function mapSafetyDistribution(
  raw: SafetyAnalyticsResponse | null,
): AnalyticsDistribution | null {
  return mapStatusDistribution(
    raw?.distribution,
    ["behaviour", "accidents", "routeOther"],
    "Incident type distribution",
    "Incidents",
  );
}

// CSV of exactly what the ride panel shows (no weekly section — that card has
// no endpoint). Keeps the shared confirm-export flow honest: the file carries
// the same numbers as the screen.
export function buildRideViewCsv(
  raw: RideAnalyticsResponse,
  trendRaw: RideTrendResponse,
  city: string | null,
): string {
  const stats = mapRideStats(raw);
  const points = mapHourBuckets(trendRaw?.byHour);
  const rows: (string | number)[][] = [
    ["Range", `${raw.window.from} to ${raw.window.to}`],
    ["City", city ?? "All cities"],
    [],
    ["Stats", "Metric", "Value / delta"],
    ...stats.map((stat) => [
      "Stats",
      stat.label,
      stat.delta ? `${stat.value} (${stat.delta})` : stat.value,
    ]),
    [],
    ["Trend", "Hour", "Requests"],
    ...points.map((point) => ["Trend", point.label, point.count]),
    [],
    ["Distribution", "Category", "Share / requests"],
    ...(raw.categoryDistribution ?? [])
      .filter(isRideCategorySlice)
      .map((slice) => [
        "Distribution",
        rideCategoryLabel(slice.category),
        `${slice.percent}% (${formatNumber(slice.count)})`,
      ]),
    [],
    ["Insights", "Insight", "Detail"],
    ...mapRideInsights(raw).map((insight) => [
      "Insights",
      insight.title,
      insight.detail,
    ]),
  ];
  return toCsv(["Section", "Metric", "Value"], rows);
}

// ---------------------------------------------------------------------------
// Task-2 CSV builders — each mirrors exactly what its tab renders (no trend
// section: only the ride endpoint has one; no fabricated rows).
// ---------------------------------------------------------------------------

function statCsvRows(
  stats: AnalyticsStatData[],
): (string | number)[][] {
  return stats.map((stat) => [
    "Stats",
    stat.label,
    stat.delta ? `${stat.value} (${stat.delta})` : stat.value,
  ]);
}

function distributionCsvRows(
  distribution: AnalyticsDistribution | null,
): (string | number)[][] {
  if (!distribution || distribution.slices.length === 0) return [];
  return distribution.slices.map((slice) => [
    "Distribution",
    slice.name,
    `${slice.percent}% (${slice.value})`,
  ]);
}

function insightsCsvRows(insights: Insight[]): (string | number)[][] {
  return insights.map((insight) => [
    "Insights",
    insight.title,
    insight.detail,
  ]);
}

function statValue(stat: AnalyticsStatData): string {
  return stat.delta ? `${stat.value} (${stat.delta})` : stat.value;
}

function categoryRows(
  label: string,
  window: { from: string; to: string },
  city: string | null,
  stats: AnalyticsStatData[],
  distribution: AnalyticsDistribution | null,
  insights: Insight[],
): (string | number)[][] {
  const cityColumn = city ?? "All cities";
  const range = `${window.from} to ${window.to}`;
  return [
    ...stats.map(
      (stat): (string | number)[] => [
        label,
        range,
        cityColumn,
        "Stats",
        stat.label,
        statValue(stat),
      ],
    ),
    ...(distribution
      ? distribution.slices.map(
          (slice): (string | number)[] => [
            label,
            range,
            cityColumn,
            "Distribution",
            slice.name,
            `${slice.percent}% (${slice.value})`,
          ],
        )
      : []),
    ...insights.map(
      (insight): (string | number)[] => [
        label,
        range,
        cityColumn,
        "Insights",
        insight.title,
        insight.detail,
      ],
    ),
  ];
}

export function buildDriverViewCsv(raw: DriverAnalyticsResponse): string {
  return toCsv(
    ["Section", "Metric", "Value"],
    [
      ["Range", `${raw.window.from} to ${raw.window.to}`],
      ["City", "All cities"],
      [],
      ...statCsvRows(mapDriverStats(raw)),
      [],
      ...distributionCsvRows(mapDriverDistribution(raw)),
    ],
  );
}

export function buildPassengerViewCsv(raw: PassengerAnalyticsResponse): string {
  return toCsv(
    ["Section", "Metric", "Value"],
    [
      ["Range", `${raw.window.from} to ${raw.window.to}`],
      ["City", "All cities"],
      [],
      ...statCsvRows(mapPassengerStats(raw)),
      [],
      ...distributionCsvRows(mapPassengerDistribution(raw)),
    ],
  );
}

export function buildFinancialViewCsv(raw: FinancialAnalyticsResponse): string {
  return toCsv(
    ["Section", "Metric", "Value"],
    [
      ["Range", `${raw.window.from} to ${raw.window.to}`],
      ["City", raw.window.city ?? "All cities"],
      [],
      ...statCsvRows(mapFinancialStats(raw)),
      [],
      ...insightsCsvRows(mapFinancialInsights(raw)),
    ],
  );
}

export function buildSafetyViewCsv(raw: SafetyAnalyticsResponse): string {
  return toCsv(
    ["Section", "Metric", "Value"],
    [
      ["Range", `${raw.window.from} to ${raw.window.to}`],
      ["City", "All cities"],
      [],
      ...statCsvRows(mapSafetyStats(raw)),
      [],
      ...distributionCsvRows(mapSafetyDistribution(raw)),
    ],
  );
}

// One CSV across all five categories for the confirmed export. The ride rows
// additionally carry the hourly demand series (the only trend endpoint).
// City applies only where the endpoint documents the param: driver,
// passenger and safety rows always read "All cities".
export interface ReportPayloads {
  ride: { raw: RideAnalyticsResponse; trendRaw: RideTrendResponse };
  driver: DriverAnalyticsResponse;
  passenger: PassengerAnalyticsResponse;
  financial: FinancialAnalyticsResponse;
  safety: SafetyAnalyticsResponse;
}

export function buildReportCsv(
  payloads: ReportPayloads,
  city: string | null,
): string {
  const rows: (string | number)[][] = [
    ...categoryRows(
      "Ride Analytics",
      payloads.ride.raw.window,
      city,
      mapRideStats(payloads.ride.raw),
      mapRideDistribution(payloads.ride.raw),
      mapRideInsights(payloads.ride.raw),
    ),
    ...mapHourBuckets(payloads.ride.trendRaw?.byHour).map(
      (point): (string | number)[] => [
        "Ride Analytics",
        `${payloads.ride.raw.window.from} to ${payloads.ride.raw.window.to}`,
        city ?? "All cities",
        "Trend",
        point.label,
        point.count,
      ],
    ),
    ...categoryRows(
      "Driver Analytics",
      payloads.driver.window,
      null,
      mapDriverStats(payloads.driver),
      mapDriverDistribution(payloads.driver),
      [],
    ),
    ...categoryRows(
      "Passenger Analytics",
      payloads.passenger.window,
      null,
      mapPassengerStats(payloads.passenger),
      mapPassengerDistribution(payloads.passenger),
      [],
    ),
    ...categoryRows(
      "Financial Analytics",
      payloads.financial.window,
      payloads.financial.window.city ?? city,
      mapFinancialStats(payloads.financial),
      null,
      mapFinancialInsights(payloads.financial),
    ),
    ...categoryRows(
      "Safety Analytics",
      payloads.safety.window,
      null,
      mapSafetyStats(payloads.safety),
      mapSafetyDistribution(payloads.safety),
      [],
    ),
  ];
  return toCsv(["Category", "Range", "City", "Section", "Metric", "Value"], rows);
}

// All five endpoints for the confirmed report export; the city filter applies
// only to the two endpoints that document it.
export async function fetchReportPayloads(
  range: DateRange,
  city: string | null,
  signal?: AbortSignal,
): Promise<ReportPayloads> {
  const [raw, trendRaw, driver, passenger, financial, safety] =
    await Promise.all([
      fetchRideAnalytics(range, city, signal),
      fetchRideTrend(range, city, signal),
      fetchDriverAnalytics(range, signal),
      fetchPassengerAnalytics(range, signal),
      fetchFinancialAnalytics(range, city, signal),
      fetchSafetyAnalytics(range, signal),
    ]);
  return { ride: { raw, trendRaw }, driver, passenger, financial, safety };
}