export type RideStatus =
  | "idle"
  | "planning"
  | "selecting"
  | "confirming"
  | "requested"
  | "searching"
  | "driver-assigned"
  | "driver-en-route"
  | "driver-arrived"
  | "verifying"
  | "in-progress"
  | "arrived"
  | "completed"
  | "payment-pending"
  | "paid"
  | "closed"
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

  /**
   * Google Place ID when selected from Google Places.
   */
  placeId?: string;

  /**
   * SurDrive saved-place ID when selected from
   * /riders/saved-places.
   */
  savedPlaceId?: string;

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
  eta?: string;
  image?: string;
  capacity?: number;
  price?: number;
  originalPrice?: number;
}

/**
 * UI representation of a payment method.
 *
 * The backend ride-booking API sends the `type`
 * value ("cash" | "card" | "wallet"), while the UI
 * keeps the full object for labels/details.
 */
export interface PaymentMethod {
  id: string;

  type:
    | "cash"
    | "card"
    | "wallet";

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
  /**
   * Backend ride ID after POST /rides/book succeeds.
   */
  rideId: string | null;

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