import { useQuery } from "@tanstack/react-query";
import { getDriverRide } from "../api/driverRides";
import { getDriverRideHistory } from "../api/rides";
import { ACTIVE_STATUSES, mapRide, unwrapRide } from "../lib/rideMap";

async function fetchRide(rideId: string) {
  const raw = await getDriverRide(rideId);
  console.log("[ride] raw", raw);
  return raw;
}

export const useDriverRideDetails = (rideId?: string) =>
  useQuery({
    queryKey: ["driver-ride", rideId],
    queryFn: () => fetchRide(rideId as string),
    enabled: !!rideId,
    refetchInterval: 5000, // picks up cancellations / status changes
    retry: false,
    select: mapRide,
  });

/**
 * While the driver is online, looks for a ride that is already assigned to
 * them (new offer, or one in progress after a refresh). Returns its id so the
 * home screen can show the real request instead of a static one.
 */
export const useActiveDriverRide = (enabled: boolean) =>
  useQuery({
    queryKey: ["driver-active-ride"],
    enabled,
    refetchInterval: 20000,
    retry: false,
    queryFn: async () => {
      for (const status of ACTIVE_STATUSES) {
        const res = await getDriverRideHistory({ limit: 1, status });
        const list = res?.data?.items ?? res?.data?.rides ?? res?.data ?? res?.items ?? res?.rides ?? [];
        const first = Array.isArray(list) ? list[0] : undefined;
        if (first) {
          const v = mapRide(first);
          if (v.id) return { rideId: v.id, status: v.status ?? status };
        }
      }
      return null;
    },
  });

export { unwrapRide };
