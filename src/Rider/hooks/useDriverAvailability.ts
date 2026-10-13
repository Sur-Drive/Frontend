

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAvailabilityStatus,
  goOffline,
  goOnline,
  updateDriverLocation,
  isStatusOnline,
} from "../api/driverAvailability";

export const AVAILABILITY_KEY = ["driver-availability"];

export const AVAILABILITY_RAW_KEY = ["driver-availability-raw"];

/** Raw status object from the backend (isOnline, isAvailable, lat, lng ...). */
export function useAvailabilityRaw() {
  return useQuery<any>({
    queryKey: AVAILABILITY_RAW_KEY,
    queryFn: () => null,
    enabled: false,
  });
}

export function useAvailabilityStatus() {
  const qc = useQueryClient();
  return useQuery({
    queryKey: AVAILABILITY_KEY,
    queryFn: async () => {
      try {
        const raw = await getAvailabilityStatus();
        qc.setQueryData(AVAILABILITY_RAW_KEY, raw?.data ?? raw);
        const online = isStatusOnline(raw);
        console.log("[availability] status ->", online, raw);
        return online;
      } catch (e: any) {
        // Previously a failure here was silent (no log, driver just looked offline).
        console.warn(
          "[availability] status request FAILED:",
          e?.status,
          e?.message,
        );
        throw e;
      }
    },
    retry: false,
    // Don't let a background refetch overwrite the state we just set from the
    // Go Online / Go Offline response (that made the toggle flip back).
    staleTime: Infinity,
    // But DO re-check the server every time the driver home page mounts.
    // With staleTime: Infinity the cached value was reused when coming back
    // from /driver/ride etc., so the request (and the console log) never ran.
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

export function useGoOnline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: goOnline,
    onSuccess: () => qc.setQueryData(AVAILABILITY_KEY, true),
  });
}

export function useGoOffline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) => goOffline(reason ? { reason } : {}),
    onSuccess: () => qc.setQueryData(AVAILABILITY_KEY, false),
  });
}

export const useUpdateLocation = () =>
  useMutation({ mutationFn: updateDriverLocation });
