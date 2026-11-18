import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  passengerRideApi,
  type BookRideRequest,
  type EstimateRideRequest,
  type PassengerRideResponse,
} from "../../api/passenger/rides";

/* ============================================
   QUERY KEYS
============================================ */

export const passengerRideKeys = {
  all: ["passenger", "ride"] as const,

  detail: (rideId: string) =>
    ["passenger", "ride", rideId] as const,
};

/* ============================================
   BOOK RIDE
============================================ */

export function useBookPassengerRide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BookRideRequest) =>
      passengerRideApi.bookRide(payload),

    onSuccess: (response) => {
      queryClient.setQueryData(
        passengerRideKeys.detail(response.id),
        response,
      );
    },
  });
}

/* ============================================
   GET RIDE DETAILS
============================================ */

export function usePassengerRideDetails(
  rideId: string | null,
) {
  return useQuery({
    queryKey: passengerRideKeys.detail(
      rideId ?? "",
    ),

    queryFn: async (): Promise<PassengerRideResponse> => {
      if (!rideId) {
        throw new Error("Ride ID is required.");
      }

      return passengerRideApi.getRide(rideId);
    },

    enabled: Boolean(rideId),

    staleTime: 2_000,

    refetchOnWindowFocus: true,

    refetchOnReconnect: true,

    retry: 2,

    // Safety fallback while Socket.IO is being integrated.
    // Keep polling payment_pending until payment is confirmed.
    refetchInterval: (query) => {
      const ride = query.state.data;

      if (!ride) {
        return 5_000;
      }

      switch (ride.status) {
        case "cancelled":
        case "paid":
        case "closed":
          return false;

        case "payment_pending":
        case "ride_completed":
          return 3_000;

        default:
          return 5_000;
      }
    },
  });
}

/* ============================================
   ESTIMATE RIDE
============================================ */

export function useEstimatePassengerRide() {
  return useMutation({
    mutationFn: (payload: EstimateRideRequest) =>
      passengerRideApi.estimateRide(payload),
  });
}

/* ============================================
   INVALIDATE RIDE
   Call after receiving a socket event.
============================================ */

export function useRefreshPassengerRide() {
  const queryClient = useQueryClient();

  return async (rideId: string) => {
    await queryClient.invalidateQueries({
      queryKey: passengerRideKeys.detail(rideId),
    });
  };
}