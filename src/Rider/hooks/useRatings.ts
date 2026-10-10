import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { rateDriver, type RateDriverPayload } from "../api/ratings";

export function useRateDriver() {
  return useMutation({
    mutationFn: ({
      rideId,
      ...payload
    }: RateDriverPayload & { rideId: string }) => rateDriver(rideId, payload),
  });
}

import {
  canRateRide,
  getRideRatings,
  rateRider,
  type RateRiderPayload,
} from "../api/ratings";

export function useRateRider() {
  return useMutation({
    mutationFn: ({
      rideId,
      ...payload
    }: RateRiderPayload & { rideId: string }) => rateRider(rideId, payload),
  });
}

export const useCanRate = (rideId?: string) =>
  useQuery({
    queryKey: ["can-rate", rideId],
    queryFn: () => canRateRide(rideId as string),
    enabled: !!rideId,
    retry: false,
  });

export const useRideRatings = (rideId?: string) =>
  useQuery({
    queryKey: ["ride-ratings", rideId],
    queryFn: () => getRideRatings(rideId as string),
    enabled: !!rideId,
    retry: false,
  });

/* ------------- Ratings passengers gave THIS driver (Account) ------------- */

import { getDriverRideHistory } from "../api/rides";
import { normalizeRideRatings, type ReceivedRating } from "../lib/ratingsMap";
import { extractRides } from "./useRideHistory";

const RATED_PAGE_SIZE = 10;
const FINISHED = ["ride_completed", "payment_pending", "paid", "closed"];

/**
 * There is no "all my ratings" endpoint, so this walks the driver's finished
 * rides (GET /rides/driver/history) page by page and loads
 * GET /rides/:rideId/ratings for each, keeping what the passenger gave.
 */
export function useReceivedRatings() {
  return useInfiniteQuery({
    queryKey: ["driver-received-ratings"],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const res: any = await getDriverRideHistory({ page: pageParam, limit: RATED_PAGE_SIZE });
      const rides = extractRides(res);
      const finished = rides.filter((r: any) => FINISHED.includes(String(r.status ?? "")));

      const settled = await Promise.allSettled(
        finished.map(async (r: any) => {
          const id = String(r.id ?? r._id ?? r.rideId);
          const p = r.passenger ?? r.rider ?? {};
          const name =
            [p.firstName, p.lastName].filter(Boolean).join(" ") || p.name || r.passengerName || "Passenger";
          const ratings = await getRideRatings(id);
          return normalizeRideRatings(ratings, id, name, r.completedAt ?? r.createdAt ?? "");
        }),
      );

      const items: ReceivedRating[] = settled.flatMap((s) => (s.status === "fulfilled" ? s.value : []));
      const failed = settled.filter((s) => s.status === "rejected").length;
      const totalPages = res?.meta?.totalPages ?? res?.pagination?.totalPages ?? res?.data?.meta?.totalPages;
      const hasMore = totalPages ? pageParam < totalPages : rides.length >= RATED_PAGE_SIZE;
      return { items, failed, scanned: finished.length, hasMore };
    },
    getNextPageParam: (last, pages) => (last.hasMore ? pages.length + 1 : undefined),
    staleTime: 5 * 60_000, // Account + My ratings share this; avoid refetching ~10 rides each visit
    retry: false,
  });
}
