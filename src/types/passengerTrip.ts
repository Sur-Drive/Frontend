import type {
  PaymentMethod,
  RideDriver,
  RideLocation,
} from "./passengerRide";

export type PassengerTripStatus =
  | "completed"
  | "no_drivers_found"
  | "unavailable"
  | "cancelled"
  | "unknown";

export interface PassengerTripPayment {
  /**
   * Base/final ride fare.
   */
  fare: number;

  /**
   * Optional fees returned by the backend.
   */
  bookingFee?: number;

  cancellationFee?: number;

  /**
   * Final amount charged/payable.
   */
  total: number;

  /**
   * Full UI payment-method object.
   */
  method: PaymentMethod;
}

export interface PassengerTrip {
  id: string;

  status: PassengerTripStatus;

  pickup: RideLocation;

  destination: RideLocation;

  driver: RideDriver;

  /**
   * YYYY-MM-DD
   */
  date: string;

  /**
   * Display time.
   * Example: "4:32 PM"
   */
  time: string;

  distance?: string;

  duration?: string;

  rating?: number;

  payment: PassengerTripPayment;

  /**
   * Actual pickup time when available.
   */
  pickupTime: string;

  /**
   * Actual drop-off time.
   * A cancelled ride may not have one.
   */
  dropoffTime?: string;
}