import { asList } from "./financeMap";

/**
 * Response shapes for /ride-drivers/earnings/* weren't specified, so every
 * field is read defensively (several likely names each). Check the
 * "[account] GET /ride-drivers/earnings/..." console logs once and tighten.
 */

/* ------------------------------- dates -------------------------------- */

export const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export type RangeType = "daily" | "weekly" | "monthly";

export interface Period {
  start: Date;
  end: Date;
  startDate: string;
  endDate: string;
  /** true when this period is the current day / week / month */
  isCurrent: boolean;
  label: string; // "9 Sep – 15 Sep"
}

const short = (d: Date) => d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });

export const TABS: Record<RangeType, string[]> = {
  daily: ["Yesterday", "Today"],
  weekly: ["Two Weeks Ago", "Last Week", "Current Week"],
  monthly: ["Two Months Ago", "Last Month", "Current Month"],
};

/** `tabIndex` is the position in TABS[range]; the last tab is the current period. */
export function getPeriod(range: RangeType, tabIndex: number, now = new Date()): Period {
  const back = TABS[range].length - 1 - tabIndex; // 0 = current
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let start: Date;
  let end: Date;

  if (range === "daily") {
    start = end = addDays(today, -back);
  } else if (range === "weekly") {
    const mondayOffset = (today.getDay() + 6) % 7; // Monday-based week
    start = addDays(today, -mondayOffset - back * 7);
    end = addDays(start, 6);
  } else {
    start = new Date(today.getFullYear(), today.getMonth() - back, 1);
    end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  }

  return {
    start,
    end,
    startDate: ymd(start),
    endDate: ymd(end),
    isCurrent: back === 0,
    label:
      range === "daily"
        ? start.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" })
        : `${short(start)} – ${short(end)}`,
  };
}

/* ------------------------------ helpers ------------------------------- */

const body = (res: any) => res?.data ?? res ?? {};
const num = (...v: any[]) => {
  for (const x of v) {
    const n = Number(x);
    if (x !== undefined && x !== null && x !== "" && !isNaN(n)) return n;
  }
  return undefined;
};

/** Formats minutes as "12h 29m". */
export const fmtMinutes = (m?: number) =>
  m === undefined ? "—" : `${Math.floor(m / 60)}h ${Math.round(m % 60)}m`;

function onlineTime(s: any): string {
  if (typeof s.onlineTime === "string") return s.onlineTime;
  const mins = num(
    s.onlineMinutes,
    s.onlineTimeMinutes,
    s.onlineSeconds !== undefined ? Number(s.onlineSeconds) / 60 : undefined,
    s.onlineHours !== undefined ? Number(s.onlineHours) * 60 : undefined,
    s.onlineTime, // bare number: assumed minutes
  );
  return fmtMinutes(mins);
}

/* ------------------------------ summary ------------------------------- */

export interface Bar {
  label: string;
  value: number;
  tooltip?: string;
  date?: string;
}

export interface EarningsSummary {
  earning: number;
  trips: number;
  onlineTime: string;
  avgPerTrip: number;
  distance: string;
  tripFares: number;
  commission: number;
  commissionRate?: number;
  /** [date or label, amount] pairs from the response, if it has a breakdown */
  breakdown: { key: string; value: number }[];
}

export function normalizeSummary(res: any): EarningsSummary {
  const s = body(res);
  const t = s.summary ?? s.totals ?? s;
  const earning = num(t.netEarnings, t.net, t.totalEarnings, t.earnings, t.earning, t.total, t.amount) ?? 0;
  const trips = num(t.totalTrips, t.trips, t.completedTrips, t.totalRides, t.rides, t.ridesCount) ?? 0;
  const km = num(t.distanceKm, t.totalDistanceKm, t.distance, t.totalDistance);

  const list = asList(
    s,
    "daily",
    "dailyBreakdown",
    "breakdown",
    "days",
    "chart",
    "series",
    "byDay",
  );

  return {
    earning,
    trips,
    onlineTime: onlineTime(t),
    avgPerTrip: num(t.avgPerTrip, t.averagePerTrip, t.averageFare, t.avgFare) ?? (trips ? earning / trips : 0),
    distance: km === undefined ? "—" : `${Math.round(km).toLocaleString("en-NG")} km`,
    tripFares: num(t.grossEarnings, t.grossFare, t.gross, t.totalFares, t.tripFares, t.totalFare) ?? earning,
    commission: Math.abs(num(t.commission, t.commissionAmount, t.platformFee, t.appCommission) ?? 0),
    commissionRate: num(t.commissionRate, t.commissionPercent, t.commissionPercentage),
    breakdown: list.map((d: any, i: number) => ({
      key: String(d.date ?? d.day ?? d.label ?? d.period ?? i),
      value: num(d.netEarnings, d.net, d.earnings, d.earning, d.amount, d.total, d.value) ?? 0,
    })),
  };
}

/* ----------------------------- chart bars ----------------------------- */

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

/**
 * Builds a full set of bars for the period (7 for a week, one per day for a
 * month, 1 for a day) from date-keyed amounts.
 */
export function buildBars(
  range: RangeType,
  period: Period,
  amounts: { key: string; value: number }[],
  dayTotal: number,
): { bars: Bar[]; highlightIndex: number; axisLabels?: string[] } {
  if (range === "daily") {
    return {
      bars: [
        {
          label: period.start.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "numeric" }),
          value: dayTotal,
          tooltip: naira(dayTotal),
          date: period.startDate,
        },
      ],
      highlightIndex: 0,
    };
  }

  const byDate = new Map<string, number>();
  amounts.forEach((a) => {
    const k = /^\d{4}-\d{2}-\d{2}/.test(a.key) ? a.key.slice(0, 10) : a.key;
    byDate.set(k, (byDate.get(k) ?? 0) + a.value);
  });

  const days = Math.round((period.end.getTime() - period.start.getTime()) / 86_400_000) + 1;
  const bars: Bar[] = Array.from({ length: days }, (_, i) => {
    const d = addDays(period.start, i);
    const date = ymd(d);
    const value = byDate.get(date) ?? 0;
    return {
      date,
      value,
      tooltip: naira(value),
      label: range === "weekly" ? d.toLocaleDateString("en-US", { weekday: "narrow" }) : String(d.getDate()),
    };
  });

  let highlightIndex: number;
  if (period.isCurrent) {
    highlightIndex = Math.min(bars.length - 1, Math.max(0, Math.round((Date.now() - period.start.getTime()) / 86_400_000 - 0.5)));
  } else {
    highlightIndex = bars.reduce((best, b, i) => (b.value > bars[best].value ? i : best), 0);
  }

  return {
    bars,
    highlightIndex,
    axisLabels:
      range === "monthly"
        ? [1, 6, 11, 16, 21, 26, days].map(String).filter((v, i, a) => a.indexOf(v) === i)
        : undefined,
  };
}

/* ------------------------------ overview ------------------------------ */

export interface EarningsOverview {
  withdrawable?: number;
  nextPayout?: string;
}

export function normalizeOverview(res: any): EarningsOverview {
  const o = body(res);
  const raw = o.nextPayoutDate ?? o.nextPayout ?? o.nextAutoPayout ?? o.nextPayoutAt;
  const d = raw ? new Date(raw) : null;
  return {
    withdrawable: num(o.availableToWithdraw, o.withdrawable, o.availableBalance, o.available, o.balance),
    nextPayout:
      d && !isNaN(d.getTime())
        ? d.toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "short" })
        : typeof raw === "string"
          ? raw
          : undefined,
  };
}

/* ------------------------------- trips -------------------------------- */

export interface EarningsTrip {
  id: string;
  from: string;
  to: string;
  date: string;
  person: string;
  paymentMethod: string;
  amount: number;
  /** ISO date used for grouping into chart bars */
  dateRaw: string;
}

const addr = (v: any) => (typeof v === "string" ? v : v?.address || v?.name || "—");

export function normalizeTrip(r: any): EarningsTrip {
  const raw = r.completedAt ?? r.endedAt ?? r.createdAt ?? r.requestedAt ?? r.date ?? "";
  const d = raw ? new Date(raw) : null;
  const p = r.passenger ?? r.rider ?? {};
  const first = p.firstName ? `${p.firstName}${p.lastName ? ` ${String(p.lastName)[0]}.` : ""}` : "";
  return {
    id: String(r.id ?? r._id ?? r.rideId ?? Math.random()),
    from: addr(r.pickupAddress ?? r.pickup ?? r.pickupLocation ?? r.origin),
    to: addr(r.dropoffAddress ?? r.dropoff ?? r.dropoffLocation ?? r.destination),
    date:
      d && !isNaN(d.getTime())
        ? `${d.toLocaleDateString("en-NG", { day: "numeric", month: "short" })}, ${d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: false })}`
        : "—",
    person: first || p.name || r.passengerName || "Passenger",
    paymentMethod: String(r.paymentMethod ?? r.paymentType ?? "—"),
    amount: num(r.netEarnings, r.earnings, r.driverEarning, r.earning, r.netAmount, r.amount, r.totalFare, r.fare) ?? 0,
    dateRaw: raw,
  };
}

export const normalizeTrips = (res: any): EarningsTrip[] =>
  asList(res, "rides", "trips").map(normalizeTrip);

/** Local YYYY-MM-DD for grouping trips into chart bars. */
export const tripDay = (t: EarningsTrip) => {
  const d = t.dateRaw ? new Date(t.dateRaw) : null;
  return d && !isNaN(d.getTime()) ? ymd(d) : "";
};
