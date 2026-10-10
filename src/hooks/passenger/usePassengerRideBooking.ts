import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";

import {
  passengerRideApi,
  type BookRideRequest,
} from "../../api/passenger/rides";

export function useBookPassengerRide() {
  return useMutation({
    mutationFn: (
      payload: BookRideRequest,
    ) =>
      passengerRideApi.bookRide(
        payload,
      ),
  });
}

export function usePassengerRideDetails(
  rideId: string | null,
) {
  return useQuery({
    queryKey: [
      "passenger",
      "ride",
      rideId,
    ],

    queryFn: () => {
      if (!rideId) {
        throw new Error(
          "Ride ID is required.",
        );
      }

      return passengerRideApi.getRide(
        rideId,
      );
    },

    enabled: Boolean(rideId),

    refetchInterval: 5_000,
  });
}