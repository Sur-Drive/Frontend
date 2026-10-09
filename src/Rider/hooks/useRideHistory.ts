import { useInfiniteQuery } from "@tanstack/react-query";
import {
  getDriverRideHistory,
  type DriverRideStatus,
} from "../api/rides";

export const RIDE_HISTORY_LIMIT = 10;

export function useDriverRideHistory(filters: {
  status?: DriverRideStatus;
  startDate?: string;
  endDate?: string;
}) {
  return useInfiniteQuery({
    queryKey: ["driver-ride-history", filters],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getDriverRideHistory({
        page: pageParam,
        limit: RIDE_HISTORY_LIMIT,
        ...filters,
      }),
    getNextPageParam: (last: any, pages) => {
      const list = extractRides(last);
      const totalPages = last?.meta?.totalPages ?? last?.pagination?.totalPages;
      if (totalPages) return pages.length < totalPages ? pages.length + 1 : undefined;
      return list.length >= RIDE_HISTORY_LIMIT ? pages.length + 1 : undefined;
    },
    retry: false,
  });
}

/** The list can arrive as an array or under data / rides / items / history. */
export function extractRides(res: any): any[] {
  if (Array.isArray(res)) return res;
  const c = [res?.data, res?.rides, res?.items, res?.history, res?.data?.rides, res?.data?.items];
  return c.find(Array.isArray) ?? [];
}
