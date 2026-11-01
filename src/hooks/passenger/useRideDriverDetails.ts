import { useQuery } from "@tanstack/react-query";

import {
  passengerRideApi,
  type PassengerRideResponse,
} from "../../api/passenger/rides";

import type {
  RideDriver,
} from "../../types/passengerRide";

/* =========================================================
   PICKUP DETAILS RESPONSE
========================================================= */

type PickupDetails = {
  rideId?: string;

  driver?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    profilePicture?: string | null;
    rating?: number | null;
    totalCompletedRides?: number | null;
  } | null;

  vehicle?: {
    make?: string | null;
    model?: string | null;
    color?: string | null;
    plateNumber?: string | null;
    registrationNumber?: string | null;
    category?: string | null;
    capacity?: number | null;
  } | null;
};

/* =========================================================
   HOOK
========================================================= */

export function useRideDriverDetails(
  rideId: string | null | undefined,
  backendRide: PassengerRideResponse | null,
  fallbackDriver?: RideDriver | null,
): {
  driver: RideDriver | null;
  loading: boolean;
  error: boolean;
} {
  const query = useQuery({
    queryKey: [
      "passenger",
      "pickup-details",
      rideId,
    ],

    queryFn: async () => {
      if (!rideId) {
        throw new Error("Ride ID is required.");
      }

      return (
        await passengerRideApi.getPickupDetails(rideId)
      ) as PickupDetails;
    },

    enabled: Boolean(rideId),

    staleTime: 30_000,

    refetchOnMount: "always",

    retry: 2,

    refetchInterval: (query) =>
      query.state.data?.driver
        ? false
        : 5000,
  });

  const details = query.data;

  const profile = details?.driver;

  const vehicle =
    details?.vehicle ??
    backendRide?.vehicle;

  /* =======================================================
     DRIVER NAME
  ======================================================= */

  const name =
    profile?.fullName?.trim() ||
    [
      profile?.firstName,
      profile?.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

  /* =======================================================
     DRIVER ID

     The pickup-details driver.id may represent
     the driver's user profile ID.

     The ride's driverId identifies the assigned
     driver record.

     Prefer the ID attached to the ride.
  ======================================================= */

  const driverId =
    backendRide?.driverId ||
    profile?.id ||
    "";

  /* =======================================================
     NORMALIZE DRIVER
  ======================================================= */

  const driver: RideDriver | null =
    profile && name && driverId
      ? {
          id: driverId,

          firstName: name,

          photo:
            profile.profilePicture ?? "",

          rating:
            profile.rating ?? 0,

          totalTrips:
            profile.totalCompletedRides ?? 0,

          vehicle: {
            make:
              vehicle?.make ?? "",

            model:
              vehicle?.model ?? "",

            color:
              vehicle?.color ?? "",

            plateNumber:
              vehicle?.plateNumber ??
              vehicle?.registrationNumber ??
              "",

              category: vehicle?.category ?? "",
              capacity: vehicle?.capacity ?? 0,
          },
        }
      : fallbackDriver ?? null;

  return {
    driver,
    loading: query.isPending,
    error: query.isError,
  };
}