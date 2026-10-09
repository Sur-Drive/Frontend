import {
  keepPreviousData,
  useQuery,
} from "@tanstack/react-query";

import {
  passengerRideApi,
  type RideHistoryParams,
} from "../../api/passenger/rides";

const PASSENGER_RIDES_KEY = [
  "passenger",
  "rides",
] as const;

export const passengerRideHistoryKeys = {
  all: PASSENGER_RIDES_KEY,

  history: (
    params: RideHistoryParams,
  ) =>
    [
      ...PASSENGER_RIDES_KEY,
      "history",
      params,
    ] as const,

  detail: (
    rideId: string,
  ) =>
    [
      ...PASSENGER_RIDES_KEY,
      "detail",
      rideId,
    ] as const,
};

export function usePassengerRideHistory(
  params: RideHistoryParams = {},
) {
  return useQuery({
    queryKey:
      passengerRideHistoryKeys.history(
        params,
      ),

    queryFn: () =>
      passengerRideApi.getRideHistory(
        params,
      ),

    staleTime: 30_000,

    placeholderData:
      keepPreviousData,

    refetchOnWindowFocus: true,
  });
}

export function usePassengerRideHistoryItem(
  rideId: string | undefined,
) {
  return useQuery({
    queryKey:
      passengerRideHistoryKeys.detail(
        rideId ?? "",
      ),

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

    staleTime: 30_000,

    refetchOnWindowFocus: true,
  });
}

// import {
//   keepPreviousData,
//   useQuery,
// } from "@tanstack/react-query";

// import {
//   passengerRideApi,
//   type RideHistoryParams,
// } from "../../api/passenger/rides";

// const PASSENGER_RIDES_KEY = [
//   "passenger",
//   "rides",
// ] as const;

// export const passengerRideHistoryKeys = {
//   all: PASSENGER_RIDES_KEY,

//   history: (
//     params: RideHistoryParams,
//   ) =>
//     [
//       ...PASSENGER_RIDES_KEY,
//       "history",
//       params,
//     ] as const,

//   detail: (
//     rideId: string,
//   ) =>
//     [
//       ...PASSENGER_RIDES_KEY,
//       "detail",
//       rideId,
//     ] as const,
// };

// export function usePassengerRideHistory(
//   params: RideHistoryParams = {},
// ) {
//   return useQuery({
//     queryKey:
//       passengerRideHistoryKeys.history(
//         params,
//       ),

//     queryFn: () =>
//       passengerRideApi.getRideHistory(
//         params,
//       ),

//     staleTime: 30_000,

//     placeholderData:
//       keepPreviousData,

//     refetchOnWindowFocus: true,
//   });
// }

// export function usePassengerRideHistoryItem(
//   rideId: string | undefined,
// ) {
//   return useQuery({
//     queryKey:
//       passengerRideHistoryKeys.detail(
//         rideId ?? "",
//       ),

//     queryFn: () => {
//       if (!rideId) {
//         throw new Error(
//           "Ride ID is required.",
//         );
//       }

//       return passengerRideApi.getRide(
//         rideId,
//       );
//     },

//     enabled: Boolean(rideId),

//     staleTime: 30_000,
//   });
// }