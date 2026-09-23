export type RideStatus =
  | "idle"
  | "planning"
  | "selecting"
  | "confirming"
  | "searching"
  | "driver-assigned"
  | "driver-en-route"
  | "driver-arriving"
  | "driver-arrived"
  | "verifying"
  | "in-progress"
  | "arrived"
  | "completed"
  | "cancelled";

export type RideCategory =
  | "economy"
  | "comfort"
  | "suv";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RideLocation {
  id?: string;
  label: string;
  address?: string;
  coordinates: Coordinates | null;
}

export interface RideStop extends RideLocation {
  id: string;
}

export interface RideOption {
  id: RideCategory;
  name: string;
  description?: string;
  seats: number;
  eta: string;
  image?: string;
  capacity?: number;
  price: number;
  originalPrice?: number;
}

export interface PaymentMethod {
  id: string;
  type: "cash" | "card" | "wallet";
  label: string;
  detail?: string;
}

export interface RideDriver {
  id: string;
  firstName: string;
  rating: number;
  totalTrips: number;
  phone?: string;

  vehicle: {
    make: string;
    model: string;
    color: string;
    plateNumber: string;
  };

  photo?: string;
}

export interface PassengerRideState {
  status: RideStatus;

  pickup: RideLocation | null;
  destination: RideLocation | null;

  stops: RideStop[];

  selectedRide: RideCategory | null;
  paymentMethod: PaymentMethod;

  promoCode: string | null;

  driver: RideDriver | null;

  estimatedFare: number | null;
  finalFare: number | null;

  distance: string | null;
  duration: string | null;

  verificationCode: string | null;
}