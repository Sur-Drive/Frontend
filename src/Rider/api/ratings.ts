import { driverFetch, type MessageResponse } from "./account";

/** Exact tag strings the backend accepts. */
export const DRIVER_RATING_TAGS = [
  "Clean Car",
  "Professional",
  "Smooth Driving",
  "On Time",
  "Great Conversation",
  "Friendly",
  "Driver Asked For Extra Fee",
  "Unsafe Driving",
  "Rude Behaviour",
] as const;

export type DriverRatingTag = (typeof DRIVER_RATING_TAGS)[number];

/** Tags that describe a bad experience (styled red in the UI). */
export const NEGATIVE_DRIVER_RATING_TAGS: readonly DriverRatingTag[] = [
  "Driver Asked For Extra Fee",
  "Unsafe Driving",
  "Rude Behaviour",
];

export interface RateDriverPayload {
  /** 1-5 */
  stars: number;
  /** optional */
  comment?: string;
  /** optional */
  tags?: DriverRatingTag[];
}

/** POST /rides/:rideId/ratings/driver */
export const rateDriver = (rideId: string, payload: RateDriverPayload) =>
  driverFetch(
    `/rides/${encodeURIComponent(rideId)}/ratings/driver`,
    "POST",
    "Failed to submit rating",
    payload,
  ) as Promise<MessageResponse>;

/* ----------------------- Driver rates the passenger ---------------------- */

/** Exact tag strings the backend accepts for POST /rides/:rideId/ratings/rider. */
export const RIDER_RATING_TAGS = [
  "Pleasant Ride",
  "Respectful",
  "Professional",
  "Great Conversation",
  "No Issues",
  "On Time",
  "Friendly",
  "Polite",
  "Damaged The Vehicle",
  "Aggressive Behaviour",
  "Payment Issue",
] as const;

export type RiderRatingTag = (typeof RIDER_RATING_TAGS)[number];

export const NEGATIVE_RIDER_RATING_TAGS: readonly RiderRatingTag[] = [
  "Damaged The Vehicle",
  "Aggressive Behaviour",
  "Payment Issue",
];

export interface RateRiderPayload {
  /** 1-5 */
  stars: number;
  comment?: string;
  tags?: RiderRatingTag[];
}

/** GET /rides/:rideId/ratings/can-rate */
export const canRateRide = (rideId: string) =>
  driverFetch(
    `/rides/${encodeURIComponent(rideId)}/ratings/can-rate`,
    "GET",
    "Failed to check rating status",
  );

/** POST /rides/:rideId/ratings/rider */
export const rateRider = (rideId: string, payload: RateRiderPayload) =>
  driverFetch(
    `/rides/${encodeURIComponent(rideId)}/ratings/rider`,
    "POST",
    "Failed to submit rating",
    payload,
  ) as Promise<MessageResponse>;

/** GET /rides/:rideId/ratings */
export const getRideRatings = (rideId: string) =>
  driverFetch(
    `/rides/${encodeURIComponent(rideId)}/ratings`,
    "GET",
    "Failed to load ratings",
  );
