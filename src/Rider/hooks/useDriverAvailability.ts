import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAvailabilityStatus,
  goOffline,
  goOnline,
  updateDriverLocation,
  isStatusOnline,
} from "../api/driverAvailability";

export const AVAILABILITY_KEY = ["driver-availability"];

export function useAvailabilityStatus() {
  return useQuery({
    queryKey: AVAILABILITY_KEY,
    queryFn: async () => isStatusOnline(await getAvailabilityStatus()),
    retry: false,
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
