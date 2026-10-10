import {
  passengerApi,
} from "./passengerClient";

import type {
  PaymentMethod,
  RideCategory,
  RideLocation,
  RideStop,
} from "../../types/passengerRide";

/* =========================================================
   BACKEND REQUEST TYPES
========================================================= */

export type BackendRidePoint =
  | {
      lat: number;
      lng: number;
    }
  | {
      address: string;
    }
  | {
      savedPlaceId: string;
    };

export type BackendRideStatus =
  | "requested"
  | "searching"
  | "driver_assigned"
  | "driver_en_route"
  | "driver_arrived"
  | "ride_started"
  | "ride_in_progress"
  | "ride_completed"
  | "payment_pending"
  | "paid"
  | "closed"
  | "cancelled";

export interface RideHistoryParams {
  page?: number;
  limit?: number;
  status?: BackendRideStatus;
  startDate?: string;
  endDate?: string;
}

/* =========================================================
   BACKEND LOCATION
========================================================= */

export interface BackendRideLocation {
  lat: number;
  lng: number;
  address: string;
}

/* =========================================================
   BACKEND DRIVER
========================================================= */

/**
 * We know a ride may eventually contain driver information,
 * but the exact assigned-driver response has not yet been
 * captured.
 *
 * Keep these fields optional until we see the real response
 * after status becomes "driver_assigned".
 */
export interface BackendDriver {
  id?: string;

  fullName?: string;
  firstName?: string;
  lastName?: string;

  phoneNumber?: string;

  profilePicture?: string | null;

  rating?: number;

  currentLat?: number | null;
  currentLng?: number | null;
}

/* =========================================================
   BACKEND VEHICLE
========================================================= */

/**
 * Vehicle is null while searching in the real response.
 *
 * The exact populated vehicle shape should be tightened once
 * we capture GET /rides/:rideId after driver assignment.
 */
export interface BackendVehicle {
  id?: string;

  make?: string;
  model?: string;
  color?: string;

  plateNumber?: string;
  registrationNumber?: string;
}

/* =========================================================
   FARE BREAKDOWN
========================================================= */

export interface FareBreakdown {
  baseFare: number;

  distanceCharge: number;

  timeCharge: number;

  bookingFee: number;

  surgeMultiplier: number;

  surgeCharge: number;

  waitingFee: number;

  waitingMinutes: number;

  waitingGraceMin: number;

  cancellationFee: number;

  approvedFees: number;

  discount: number;

  promoDiscount: number;

  subtotal: number;

  total: number;

  isEstimate: boolean;
}

/* =========================================================
   RIDE TIMESTAMPS
========================================================= */

export interface RideTimestamps {
  requestedAt: string | null;

  searchingAt: string | null;

  driverAssignedAt: string | null;

  driverArrivedAt: string | null;

  rideStartedAt: string | null;

  rideCompletedAt: string | null;

  paidAt: string | null;

  cancelledAt: string | null;
}

/* =========================================================
   MAIN RIDE RESPONSE

   This is based on the real responses we now have from:

   POST /rides/book
   GET  /rides/:rideId
========================================================= */

export interface PassengerRideResponse {
  id: string;

  riderId: string;

  driverId: string | null;

  status: BackendRideStatus;

  rideType:
    | "economy"
    | "comfort"
    | "suv";

  paymentMethod:
    | "cash"
    | "card"
    | "wallet";

  pickup: BackendRideLocation;

  dropoff: BackendRideLocation;

  stops: BackendRideLocation[];

  /*
   * The searching response returned:
   *
   * vehicle: null
   *
   * We have not yet captured a populated
   * vehicle/driver response.
   */
  driver?: BackendDriver | null;

  vehicle: BackendVehicle | null;

  estimatedDistanceKm: number;

  estimatedDurationMin: number;

  actualDistanceKm: number | null;

  actualDurationMin: number | null;

  estimatedFare: number;

  finalFare: number | null;

  cancellationFee: number;

  cancellationReason: string | null;

  cancelledBy: string | null;

  promoCode: string | null;

  promoDiscount: number;

  pricingVersion: string;

  fareBreakdown: FareBreakdown;

  timestamps: RideTimestamps;

  createdAt: string;

  updatedAt: string;
}

/* =========================================================
   BOOK RIDE
========================================================= */

export interface BookRideRequest {
  pickup: BackendRidePoint;

  dropoff: BackendRidePoint;

  stops?: BackendRidePoint[];

  rideType: RideCategory;

  paymentMethod:
    PaymentMethod["type"];
}

/**
 * We now have a real successful booking response.
 *
 * Therefore this should no longer be `unknown`.
 */
export type BookRideResponse =
  PassengerRideResponse;

/**
 * GET /rides/:rideId returned the same ride structure.
 */
export type GetRideResponse =
  PassengerRideResponse;

/* =========================================================
   PICKUP DETAILS
========================================================= */

/**
 * We know this endpoint exists:
 *
 * GET /rides/:rideId/pickup-details
 *
 * but we still have not captured its actual successful
 * response.
 *
 * Keep it unknown/permissive rather than inventing
 * a pickup-code property.
 */
export type PickupDetailsResponse =
  Record<string, unknown>;

/* =========================================================
   RIDE HISTORY
========================================================= */

/**
 * We have not yet captured the real GET /rides/history
 * response body.
 *
 * Do not invent pagination/results fields until we see it.
 */
export type RideHistoryResponse =
  unknown;

/* =========================================================
   LOCATION CONVERSION
========================================================= */

/**
 * Converts our frontend RideLocation into one of the
 * location formats accepted by the backend.
 *
 * Priority:
 *
 * 1. savedPlaceId
 * 2. coordinates
 * 3. address
 */
export function locationToBackendPoint(
  location: RideLocation,
): BackendRidePoint {
  if (location.savedPlaceId) {
    return {
      savedPlaceId:
        location.savedPlaceId,
    };
  }

  if (location.coordinates) {
    return {
      lat:
        location.coordinates.lat,

      lng:
        location.coordinates.lng,
    };
  }

  const address =
    location.address?.trim();

  if (address) {
    return {
      address,
    };
  }

  throw new Error(
    "Ride location does not contain usable coordinates, an address, or a saved-place ID.",
  );
}

/**
 * Stops use the same backend location format
 * as pickup/dropoff.
 */
export function stopToBackendPoint(
  stop: RideStop,
): BackendRidePoint {
  return locationToBackendPoint(
    stop,
  );
}

/* =========================================================
   PASSENGER RIDE API
========================================================= */

export const passengerRideApi = {
  /* -------------------------------------------------------
     BOOK RIDE
  ------------------------------------------------------- */

  bookRide(
    payload: BookRideRequest,
  ) {
    return passengerApi.post<BookRideResponse>(
      "/rides/book",
      payload,
      {
        authMode: "access",
      },
    );
  },

  /* -------------------------------------------------------
     GET SINGLE RIDE
  ------------------------------------------------------- */

  getRide(
    rideId: string,
  ) {
    return passengerApi.get<GetRideResponse>(
      `/rides/${encodeURIComponent(
        rideId,
      )}`,
      {
        authMode: "access",
      },
    );
  },

  /* -------------------------------------------------------
     GET PICKUP DETAILS

     This becomes useful once the driver has arrived.
  ------------------------------------------------------- */

  getPickupDetails(
    rideId: string,
  ) {
    return passengerApi.get<PickupDetailsResponse>(
      `/rides/${encodeURIComponent(
        rideId,
      )}/pickup-details`,
      {
        authMode: "access",
      },
    );
  },

  /* -------------------------------------------------------
     REGENERATE PICKUP CODE
  ------------------------------------------------------- */

  regeneratePickupCode(
    rideId: string,
  ) {
    return passengerApi.post<PickupDetailsResponse>(
      `/rides/${encodeURIComponent(
        rideId,
      )}/regenerate-pickup-code`,
      {},
      {
        authMode: "access",
      },
    );
  },

  /* -------------------------------------------------------
     CANCEL RIDE
  ------------------------------------------------------- */

  cancelRide(
    rideId: string,
    reason: string,
  ) {
    return passengerApi.post<PassengerRideResponse>(
      `/rides/${encodeURIComponent(
        rideId,
      )}/cancel`,
      {
        reason,
      },
      {
        authMode: "access",
      },
    );
  },

  /* -------------------------------------------------------
     RIDE HISTORY
  ------------------------------------------------------- */

  getRideHistory(
    params: RideHistoryParams = {},
  ) {
    const searchParams =
      new URLSearchParams();

    if (
      params.page !== undefined
    ) {
      searchParams.set(
        "page",
        String(params.page),
      );
    }

    if (
      params.limit !== undefined
    ) {
      searchParams.set(
        "limit",
        String(params.limit),
      );
    }

    if (params.status) {
      searchParams.set(
        "status",
        params.status,
      );
    }

    if (params.startDate) {
      searchParams.set(
        "startDate",
        params.startDate,
      );
    }

    if (params.endDate) {
      searchParams.set(
        "endDate",
        params.endDate,
      );
    }

    const query =
      searchParams.toString();

    return passengerApi.get<RideHistoryResponse>(
      query
        ? `/rides/history?${query}`
        : "/rides/history",
      {
        authMode: "access",
      },
    );
  },
};

