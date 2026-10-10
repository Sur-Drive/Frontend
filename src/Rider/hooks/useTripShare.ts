import { useMutation, useQuery } from "@tanstack/react-query";
import { getSharedTrip, shareRide, stopSharingRide } from "../api/tripShare";

export const useShareRide = () =>
  useMutation({
    mutationFn: ({ rideId, sharedWith }: { rideId: string; sharedWith: string }) =>
      shareRide(rideId, sharedWith),
  });

export const useStopSharingRide = () =>
  useMutation({ mutationFn: (shareId: string) => stopSharingRide(shareId) });

/** Public live view; refreshes every 15s while the page is open. */
export function useSharedTrip(token: string | undefined) {
  return useQuery({
    queryKey: ["shared-trip", token],
    queryFn: () => getSharedTrip(token as string),
    enabled: !!token,
    refetchInterval: 15_000,
    retry: false,
  });
}
