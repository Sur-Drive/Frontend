import {
  useQuery,
} from "@tanstack/react-query";

import {
  passengerHomeApi,
} from "../../api/passenger/home.api";

export const passengerHomeKeys = {
  all: ["passenger", "home"] as const,

  profile: [
    "passenger",
    "profile",
  ] as const,

  savedPlaces: [
    "passenger",
    "saved-places",
  ] as const,

  recentDestinations: [
    "passenger",
    "recent-destinations",
  ] as const,
};

export function usePassengerProfile() {
  return useQuery({
    queryKey:
      passengerHomeKeys.profile,

    queryFn:
      passengerHomeApi.getProfile,

    staleTime: 30_000,
  });
}

export function usePassengerSavedPlaces() {
  return useQuery({
    queryKey:
      passengerHomeKeys.savedPlaces,

    queryFn:
      passengerHomeApi.getSavedPlaces,

    staleTime: 30_000,
  });
}

export function usePassengerRecentDestinations() {
  return useQuery({
    queryKey:
      passengerHomeKeys.recentDestinations,

    queryFn:
      passengerHomeApi.getRecentDestinations,

    staleTime: 30_000,
  });
}