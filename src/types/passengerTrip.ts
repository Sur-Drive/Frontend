import type {
  PaymentMethod,
  RideDriver,
  RideLocation,
} from "./passengerRide";

export type PassengerTripStatus =
  | "completed"
  | "cancelled";

export interface PassengerTripPayment {
  fare: number;
  bookingFee?: number;
  cancellationFee?: number;
  total: number;
  method: PaymentMethod;
}

export interface PassengerTrip {
  id: string;

  status: PassengerTripStatus;

  pickup: RideLocation;
  destination: RideLocation;

  driver: RideDriver;

  date: string;
  time: string;

  distance?: string;
  duration?: string;

  rating?: number;

  payment: PassengerTripPayment;

  pickupTime: string;
dropoffTime?: string;
}