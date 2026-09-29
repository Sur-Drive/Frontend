import { useQuery } from "@tanstack/react-query";
import { getRideDriverProfile } from "../api/profile";

export const RIDE_DRIVER_PROFILE_KEY = ["ride-driver", "profile"] as const;

export function useRideDriverProfile() {
  return useQuery({
    queryKey: RIDE_DRIVER_PROFILE_KEY,
    queryFn: getRideDriverProfile,
    enabled: !!localStorage.getItem("token"),
    staleTime: 60_000,
    retry: false,
  });
}
