import type { LucideIcon } from "lucide-react";
import { Car, ChartLine, IdCard, ShieldCheck, Users, Wallet } from "lucide-react";
import type { Tone } from "@/types/overview";

export type CategoryId = "ride" | "driver" | "passenger" | "financial" | "safety";

export const CATEGORY_IDS: CategoryId[] = [
  "ride",
  "driver",
  "passenger",
  "financial",
  "safety",
];

export type PeriodId = "today" | "week" | "month" | "custom";

// Order matters: it is the segmented-control order and the URL default order.
export const PERIOD_IDS: PeriodId[] = ["today", "week", "month", "custom"];

export const PERIOD_LABELS: Record<PeriodId, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  custom: "Custom Date",
};

// No shared cities constant exists in the app (Overview only offers a single
// "All cities" option), so the filter list lives here. PROVISIONAL until an
// endpoint/constant is confirmed.
export const CITIES = [
  "All cities",
  "Lagos",
  "Abuja",
  "Port Harcourt",
  "Ibadan",
] as const;

export type CityId = (typeof CITIES)[number];

// Server-safe type guards (no "use client" here, so route files can validate
// search params with them).
export function isCategory(value: string | undefined): value is CategoryId {
  return value !== undefined && (CATEGORY_IDS as string[]).includes(value);
}

export function isPeriod(value: string | undefined): value is PeriodId {
  return value !== undefined && (PERIOD_IDS as string[]).includes(value);
}

export function isCity(value: string | undefined): value is CityId {
  return value !== undefined && (CITIES as readonly string[]).includes(value);
}

export interface CategoryMeta {
  id: CategoryId;
  /** Tab label, e.g. "Ride Analytics". */
  label: string;
  /** Short name used in trend titles and CSV filenames. */
  short: string;
  icon: LucideIcon;
  /** Trend series colour: brand purple, or the accent yellow for Financial. */
  accent: "brand" | "accent";
  /** Donut centre caption, e.g. "Rides". */
  caption: string;
}

export const CATEGORY_META: Record<CategoryId, CategoryMeta> = {
  ride: {
    id: "ride",
    label: "Ride Analytics",
    short: "Ride",
    icon: Car,
    accent: "brand",
    caption: "Rides",
  },
  driver: {
    id: "driver",
    label: "Driver Analytics",
    short: "Driver",
    icon: IdCard,
    accent: "brand",
    caption: "Drivers",
  },
  passenger: {
    id: "passenger",
    label: "Passenger Analytics",
    short: "Passenger",
    icon: Users,
    accent: "brand",
    caption: "Riders",
  },
  financial: {
    id: "financial",
    label: "Financial Analytics",
    short: "Financial",
    icon: Wallet,
    accent: "accent",
    caption: "Revenue",
  },
  safety: {
    id: "safety",
    label: "Safety Analytics",
    short: "Safety",
    icon: ShieldCheck,
    accent: "brand",
    caption: "Incidents",
  },
};

// Every stat tile keeps the design's chart icon in a purple/green/yellow/blue
// tile; only the tone changes per card.
export const STAT_ICON = ChartLine;
// ---------------------------------------------------------------------------
// Stat definitions
// ---------------------------------------------------------------------------

type StatFormat = "count" | "percent" | "naira" | "minutes" | "hours" | "rating";

export interface StatSpec {
  key: string;
  label: string;
  /** Value for Today / All cities; other views derive from it. */
  base: number;
  format: StatFormat;
  delta: string;
  /** +1 for an increase, -1 for a decrease. */
  direction: 1 | -1;
  /** Which direction is an improvement, so the delta colours correctly. */
  goodDirection: "up" | "down";
  tone: Tone;
  /** "volume" scales with period length and city; "rate" barely moves. */
  scale: "volume" | "rate";
}

export const STAT_SPECS: Record<CategoryId, StatSpec[]> = {
  ride: [
    { key: "requests", label: "Total Requests", base: 42840, format: "count", delta: "+12.4%", direction: 1, goodDirection: "up", tone: "brand", scale: "volume" },
    { key: "completed", label: "Completed Rides", base: 38214, format: "count", delta: "+14.1%", direction: 1, goodDirection: "up", tone: "success", scale: "volume" },
    { key: "cancellation", label: "Cancellation Rate", base: 6.8, format: "percent", delta: "−1.2%", direction: -1, goodDirection: "down", tone: "warning", scale: "rate" },
    { key: "duration", label: "Avg. Trip Duration", base: 28, format: "minutes", delta: "−2 min", direction: -1, goodDirection: "down", tone: "info", scale: "rate" },
  ],
  driver: [
    { key: "active", label: "Active Drivers", base: 8642, format: "count", delta: "+8.2%", direction: 1, goodDirection: "up", tone: "brand", scale: "volume" },
    { key: "online", label: "Online Hours", base: 6.4, format: "hours", delta: "+0.3 hrs", direction: 1, goodDirection: "up", tone: "success", scale: "rate" },
    { key: "acceptance", label: "Acceptance Rate", base: 91.5, format: "percent", delta: "+2.1%", direction: 1, goodDirection: "up", tone: "warning", scale: "rate" },
    { key: "rating", label: "Avg. Driver Rating", base: 4.82, format: "rating", delta: "+0.06", direction: 1, goodDirection: "up", tone: "info", scale: "rate" },
  ],
  passenger: [
    { key: "new", label: "New Riders", base: 3180, format: "count", delta: "+18.7%", direction: 1, goodDirection: "up", tone: "brand", scale: "volume" },
    { key: "active", label: "Active Passengers", base: 48290, format: "count", delta: "+12.5%", direction: 1, goodDirection: "up", tone: "success", scale: "volume" },
    { key: "repeat", label: "Repeat Rate", base: 58.4, format: "percent", delta: "+3.2%", direction: 1, goodDirection: "up", tone: "warning", scale: "rate" },
    { key: "rating", label: "Avg. Passenger Rating", base: 4.79, format: "rating", delta: "+0.04", direction: 1, goodDirection: "up", tone: "info", scale: "rate" },
  ],
  financial: [
    { key: "gross", label: "Gross Revenue", base: 18420000, format: "naira", delta: "+14.6%", direction: 1, goodDirection: "up", tone: "brand", scale: "volume" },
    { key: "commission", label: "Platform Commission", base: 2763000, format: "naira", delta: "+13.2%", direction: 1, goodDirection: "up", tone: "success", scale: "volume" },
    { key: "payouts", label: "Driver Payouts", base: 15100000, format: "naira", delta: "+12.8%", direction: 1, goodDirection: "up", tone: "warning", scale: "volume" },
    { key: "refunds", label: "Refunds", base: 214000, format: "naira", delta: "−8.4%", direction: -1, goodDirection: "down", tone: "info", scale: "volume" },
  ],
  safety: [
    { key: "open", label: "Open Incidents", base: 342, format: "count", delta: "−11.3%", direction: -1, goodDirection: "down", tone: "brand", scale: "volume" },
    { key: "sos", label: "SOS Alerts", base: 128, format: "count", delta: "−6.4%", direction: -1, goodDirection: "down", tone: "success", scale: "volume" },
    { key: "resolution", label: "Avg. Resolution", base: 3.8, format: "hours", delta: "−0.4 hrs", direction: -1, goodDirection: "down", tone: "warning", scale: "rate" },
    { key: "rate", label: "Resolution Rate", base: 94.8, format: "percent", delta: "+2.1%", direction: 1, goodDirection: "up", tone: "info", scale: "rate" },
  ],
};
// ---------------------------------------------------------------------------
// Deterministic multipliers
// ---------------------------------------------------------------------------

// Fixed multipliers only: the same inputs always produce the same output, on
// the server and on every client render. No Math.random / Date.now anywhere.
export const PERIOD_VOLUME: Record<PeriodId, number> = {
  today: 1,
  week: 7,
  month: 30,
  custom: 14,
};

export const PERIOD_RATE: Record<PeriodId, number> = {
  today: 1,
  week: 1.01,
  month: 1.03,
  custom: 1.02,
};

// Share of platform volume per city; the four cities sum to 1.
export const CITY_FACTOR: Record<CityId, number> = {
  "All cities": 1,
  Lagos: 0.42,
  Abuja: 0.24,
  "Port Harcourt": 0.18,
  Ibadan: 0.16,
};

// Relative shapes shared by every category so each period only needs labels.
const HOUR_SHAPE = [0.22, 0.46, 0.63, 0.78, 0.89, 1];
const WEEK_SHAPE = [0.82, 0.88, 0.94, 1, 1.18, 1.08, 0.76];
const MONTH_SHAPE = [0.86, 0.93, 0.97, 1, 1.06];
const CUSTOM_SHAPE = [
  0.55, 0.62, 0.7, 0.66, 0.74, 0.81, 0.9, 0.86, 0.68, 0.72, 0.79, 0.85, 0.93, 1,
];

export const TREND_SHAPES: Record<PeriodId, number[]> = {
  today: HOUR_SHAPE,
  week: WEEK_SHAPE,
  month: MONTH_SHAPE,
  custom: CUSTOM_SHAPE,
};

export const TREND_LABELS: Record<PeriodId, string[]> = {
  today: ["6 AM", "9 AM", "12 PM", "3 PM", "6 PM", "9 PM"],
  week: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  month: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
  custom: Array.from({ length: 14 }, (_, i) => `Day ${i + 1}`),
};

// Peak trend magnitude for Today / All cities. Financial is in millions of
// naira so its axis can read ₦2M / ₦4M / ₦6M.
export const TREND_BASE: Record<CategoryId, number> = {
  ride: 505,
  driver: 1180,
  passenger: 1420,
  financial: 6,
  safety: 42,
};

// Donut centre total for Today / All cities.
export const DISTRIBUTION_TOTAL: Record<CategoryId, number> = {
  ride: 42840,
  driver: 8642,
  passenger: 48290,
  financial: 18420000,
  safety: 1124,
};

export const DISTRIBUTION_SLICES: Record<
  CategoryId,
  { name: string; percent: number }[]
> = {
  ride: [
    { name: "Economy", percent: 54 },
    { name: "Comfort", percent: 31 },
    { name: "SUV & others", percent: 15 },
  ],
  driver: [
    { name: "Full-time", percent: 48 },
    { name: "Part-time", percent: 31 },
    { name: "Fleet partners", percent: 21 },
  ],
  passenger: [
    { name: "First ride", percent: 36 },
    { name: "Occasional", percent: 41 },
    { name: "Frequent", percent: 23 },
  ],
  financial: [
    { name: "Economy", percent: 47 },
    { name: "Comfort", percent: 34 },
    { name: "SUV & others", percent: 19 },
  ],
  safety: [
    { name: "Ride dispute", percent: 41 },
    { name: "Driver conduct", percent: 33 },
    { name: "Account & fraud", percent: 26 },
  ],
};


// ---------------------------------------------------------------------------
// View model
// ---------------------------------------------------------------------------

export interface AnalyticsStat {
  key: string;
  label: string;
  value: string;
  delta: string;
  /** True when the delta is an improvement for this metric. */
  improving: boolean;
  tone: Tone;
  icon: LucideIcon;
}

// Stat as mapped from the backend; the view attaches the shared design icon,
// keeping lib mappers free of component imports. `flat` marks the backend's
// third delta direction ("flat", observed on a zeroed financial window) so
// the note renders muted instead of success/danger.
export type AnalyticsStatData = Omit<AnalyticsStat, "icon"> & { flat?: boolean };

export interface TrendDatum {
  label: string;
  value: number;
}

export interface AnalyticsTrend {
  title: string;
  subtitle: string;
  data: TrendDatum[];
  accent: "brand" | "accent";
  yDomain: [number, number];
  yTicks: number[];
  /** Axis tick label, e.g. "₦2M". */
  formatTick: (value: number) => string;
  /** Full value label for tooltips, e.g. "₦2.4M". */
  formatValue: (value: number) => string;
  /** Screen-reader summary for the chart's aria-label. */
  summary: string;
}

export interface DistributionSlice {
  name: string;
  percent: number;
  value: string;
}

export interface AnalyticsDistribution {
  title: string;
  total: string;
  caption: string;
  slices: DistributionSlice[];
  summary: string;
}

export interface Insight {
  title: string;
  detail: string;
}

export interface WeeklyRow {
  label: string;
  /** This week's value (purple bar, the percentage shown). */
  thisWeek: number;
  lastWeek: number;
}

export interface AnalyticsView {
  category: CategoryMeta;
  period: PeriodId;
  /** Display label for the period; custom shows the actual date range. */
  periodLabel: string;
  city: CityId;
  stats: AnalyticsStat[];
  trend: AnalyticsTrend;
  distribution: AnalyticsDistribution;
  insights: Insight[];
  weekly: WeeklyRow[];
}

// Insights are copy, not metrics, so they read the same for every period/city.
export const INSIGHTS: Record<CategoryId, Insight[]> = {
  ride: [
    { title: "Peak demand", detail: "5:00 PM – 8:00 PM" },
    { title: "Top city", detail: "Lagos • 72% of rides" },
    { title: "Completion leader", detail: "Comfort • 94.8%" },
    { title: "Avg. resolution", detail: "3.8 hours" },
  ],
  driver: [
    { title: "Peak online", detail: "7:00 AM – 9:00 AM" },
    { title: "Top city", detail: "Lagos • 64% of drivers" },
    { title: "Acceptance leader", detail: "Comfort • 93.2%" },
    { title: "Avg. online", detail: "6.4 hours per driver" },
  ],
  passenger: [
    { title: "Peak signups", detail: "6:00 PM – 9:00 PM" },
    { title: "Top city", detail: "Lagos • 58% of riders" },
    { title: "Repeat leader", detail: "Comfort • 71.5%" },
    { title: "Avg. trips", detail: "4.2 rides per rider" },
  ],
  financial: [
    { title: "Peak revenue", detail: "5:00 PM – 8:00 PM" },
    { title: "Top city", detail: "Lagos • 76% of revenue" },
    { title: "Commission rate", detail: "15% of gross revenue" },
    { title: "Avg. ticket", detail: "₦4,820 per ride" },
  ],
  safety: [
    { title: "Peak incidents", detail: "8:00 PM – 11:00 PM" },
    { title: "Top city", detail: "Lagos • 61% of incidents" },
    { title: "Safest category", detail: "Economy • 0.4% of rides" },
    { title: "Avg. resolution", detail: "3.8 hours" },
  ],
};

// This week vs last week. A weekly comparison is period- and city-independent,
// so these stay fixed (deterministic) for a given category.
export const WEEKLY: Record<
  CategoryId,
  { label: string; thisWeek: number; lastWeek: number }[]
> = {
  ride: [
    { label: "Requests", thisWeek: 86, lastWeek: 79 },
    { label: "Completed", thisWeek: 78, lastWeek: 74 },
    { label: "Revenue", thisWeek: 92, lastWeek: 88 },
    { label: "New riders", thisWeek: 64, lastWeek: 58 },
    { label: "Online hours", thisWeek: 74, lastWeek: 70 },
  ],
  driver: [
    { label: "Acceptance", thisWeek: 91, lastWeek: 87 },
    { label: "Online hours", thisWeek: 74, lastWeek: 70 },
    { label: "Trips per driver", thisWeek: 68, lastWeek: 65 },
    { label: "Retention", thisWeek: 82, lastWeek: 78 },
    { label: "New drivers", thisWeek: 57, lastWeek: 61 },
  ],
  passenger: [
    { label: "Active", thisWeek: 71, lastWeek: 66 },
    { label: "New riders", thisWeek: 64, lastWeek: 58 },
    { label: "Repeat rate", thisWeek: 58, lastWeek: 54 },
    { label: "Trips per rider", thisWeek: 66, lastWeek: 62 },
    { label: "Satisfaction", thisWeek: 88, lastWeek: 85 },
  ],
  financial: [
    { label: "Gross revenue", thisWeek: 92, lastWeek: 88 },
    { label: "Commission", thisWeek: 89, lastWeek: 85 },
    { label: "Payouts", thisWeek: 87, lastWeek: 84 },
    { label: "Refunds", thisWeek: 34, lastWeek: 41 },
    { label: "Settlements", thisWeek: 79, lastWeek: 76 },
  ],
  safety: [
    { label: "Reports", thisWeek: 42, lastWeek: 49 },
    { label: "Resolved", thisWeek: 88, lastWeek: 84 },
    { label: "SOS response", thisWeek: 91, lastWeek: 89 },
    { label: "Escalations", thisWeek: 27, lastWeek: 31 },
    { label: "Resolution rate", thisWeek: 94, lastWeek: 92 },
  ],
};

// ---------------------------------------------------------------------------
// Custom range (URL-driven)
// ---------------------------------------------------------------------------

export interface AnalyticsRange {
  from: string; // ISO yyyy-mm-dd, inclusive
  to: string; // ISO yyyy-mm-dd, inclusive
  days: number; // inclusive day count, >= 1
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Strict ISO check: shape plus a real calendar date, so "2026-02-31" fails.
export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

// Calendar arithmetic on ISO strings via UTC dates, so no timezone drift.
export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

const MONTH_ABBRS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// "2026-10-03" -> "3 Oct". Fixed English month names (never toLocaleDateString)
// so the label is identical on the server and every client.
export function formatIsoDay(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTH_ABBRS[m - 1]}`;
}

// Parses ?from/?to for period=custom. Invalid, missing or reversed dates fall
// back to the last 14 days ending today. "Today" is resolved when this runs on
// the server; the resolved dates flow down as props, so hydration stays
// deterministic.
export function parseAnalyticsRange(
  from?: string,
  to?: string,
): AnalyticsRange {
  if (from && to && isIsoDate(from) && isIsoDate(to) && from <= to) {
    const [fy, fm, fd] = from.split("-").map(Number);
    const [ty, tm, td] = to.split("-").map(Number);
    const days =
      Math.round(
        (Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000,
      ) + 1;
    return { from, to, days };
  }
  const today = new Date().toISOString().slice(0, 10);
  return { from: addDaysIso(today, -13), to: today, days: 14 };
}

