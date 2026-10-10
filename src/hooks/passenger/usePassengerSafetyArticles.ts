import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import {
  passengerSafetyArticlesApi,
} from "../../api/passenger/passengerSafetyArticles.api";

import type {
  SOSPayload,
} from "../../api/passenger/passengerSafetyArticles.api";

export const safetyArticleKeys = {
  faqs: (q: string) =>
    ["passenger", "faqs", q] as const,
};

export function usePassengerFAQs(q: string) {
  return useQuery({
    queryKey: safetyArticleKeys.faqs(q),
    queryFn: () =>
      passengerSafetyArticlesApi.getFAQs(q),
    staleTime: 60_000,
  });
}

export function usePassengerSOS() {
  return useMutation({
    mutationFn: (payload: SOSPayload) =>
      passengerSafetyArticlesApi.sendSOS(payload),
  });
}

export function usePassengerShareTrip() {
  return useMutation({
    mutationFn: ({
      rideId,
      sharedWith,
    }: {
      rideId: string;
      sharedWith: string;
    }) =>
      passengerSafetyArticlesApi.shareTrip(
        rideId,
        sharedWith,
      ),
  });
}

export function usePassengerRevokeShare() {
  return useMutation({
    mutationFn: (shareId: string) =>
      passengerSafetyArticlesApi.revokeShare(
        shareId,
      ),
  });
}

