import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  getEarningsDetail,
  getEarningsOverview,
  getEarningsRides,
  getEarningsThisMonth,
  getEarningsThisWeek,
  getEarningsWallet,
} from "../api/earnings";
import {
  buildBars,
  normalizeOverview,
  normalizeSummary,
  normalizeTrips,
  tripDay,
  type Period,
  type RangeType,
} from "../lib/earningsMap";
import { normalizeWallet } from "../lib/financeMap";

export const EARNINGS_RIDES_LIMIT = 10;

export function useEarningsWallet() {
  return useQuery({
    queryKey: ["earnings", "wallet"],
    queryFn: async () => normalizeWallet(await getEarningsWallet()),
    retry: false,
  });
}

export function useEarningsOverview() {
  return useQuery({
    queryKey: ["earnings", "overview"],
    queryFn: async () => normalizeOverview(await getEarningsOverview()),
    retry: false,
  });
}

/**
 * Summary for one period. The current week / month use their dedicated
 * endpoints; every other period (and any day) uses /earnings/detail.
 */
export function useEarningsSummary(range: RangeType, period: Period) {
  const useDedicated = period.isCurrent && range !== "daily";
  return useQuery({
    queryKey: ["earnings", "summary", range, period.startDate, period.endDate],
    queryFn: async () => {
      const res = useDedicated
        ? range === "weekly"
          ? await getEarningsThisWeek()
          : await getEarningsThisMonth()
        : await getEarningsDetail({ startDate: period.startDate, endDate: period.endDate });
      return normalizeSummary(res);
    },
    retry: false,
  });
}

/** Summary + chart bars. Falls back to grouping the period's trips when the response has no breakdown. */
export function useEarningsPeriod(range: RangeType, period: Period) {
  const summary = useEarningsSummary(range, period);
  const needsFallback =
    range !== "daily" && !!summary.data && summary.data.breakdown.length === 0;

  const fallback = useQuery({
    queryKey: ["earnings", "chart-rides", period.startDate, period.endDate],
    queryFn: async () =>
      normalizeTrips(
        await getEarningsRides({ page: 1, limit: 100, startDate: period.startDate, endDate: period.endDate }),
      ),
    enabled: needsFallback,
    retry: false,
  });

  const amounts = summary.data?.breakdown.length
    ? summary.data.breakdown
    : (fallback.data ?? []).map((t) => ({ key: tripDay(t), value: t.amount }));

  const chart = buildBars(range, period, amounts, summary.data?.earning ?? 0);

  return {
    summary: summary.data,
    chart,
    isLoading: summary.isLoading || (needsFallback && fallback.isLoading),
    error: summary.error as Error | null,
    refetch: summary.refetch,
  };
}

/** Paged trips for the Earnings Details screen. */
export function useEarningsRides(period: Period, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["earnings", "rides", period.startDate, period.endDate],
    initialPageParam: 1,
    enabled,
    queryFn: ({ pageParam }) =>
      getEarningsRides({
        page: pageParam,
        limit: EARNINGS_RIDES_LIMIT,
        startDate: period.startDate,
        endDate: period.endDate,
      }),
    getNextPageParam: (last: any, pages) => {
      const totalPages = last?.meta?.totalPages ?? last?.pagination?.totalPages ?? last?.data?.meta?.totalPages;
      if (totalPages) return pages.length < totalPages ? pages.length + 1 : undefined;
      return normalizeTrips(last).length >= EARNINGS_RIDES_LIMIT ? pages.length + 1 : undefined;
    },
    retry: false,
  });
}

/** Detail screen figures: /earnings/detail for the chosen period. */
export function useEarningsDetail(period: Period, enabled = true) {
  return useQuery({
    queryKey: ["earnings", "detail", period.startDate, period.endDate],
    queryFn: async () =>
      normalizeSummary(await getEarningsDetail({ startDate: period.startDate, endDate: period.endDate })),
    enabled,
    retry: false,
  });
}
