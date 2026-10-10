export interface PassengerProfile {
  id: string;
  userId: string;

  fullName: string;
  phoneNumber: string | null;
  email: string | null;

  dateOfBirth: string | null;
  gender: string | null;
  profilePicture: string | null;

  rating: number;
  totalRides: number;
  totalSpent: number;
  cancellationCount: number;

  status: string;

  locationEnabled: boolean;
  currentLat: number | null;
  currentLng: number | null;
  currentAddress: string | null;
  lastLocationAt: string | null;

  homeAddress: string | null;
  homeLat: number | null;
  homeLng: number | null;

  workAddress: string | null;
  workLat: number | null;
  workLng: number | null;

  primaryEmergencyContact: unknown | null;
  emergencyContactsCount: number;

  shareTripWithContacts: boolean;

  preferredPaymentMethod:
    | "wallet"
    | "cash"
    | "card"
    | string;

  pickupCodeEnabled: boolean;

  isOnRide: boolean;

  defaultPickupAddress: string | null;
  defaultPickupLat: number | null;
  defaultPickupLng: number | null;
  defaultPickupUseCurrentLocation: boolean;
  defaultPickupPlaceId: string | null;

  recentDestinations: unknown[];

  createdAt: string;
}

export type SavedPlaceType =
  | "home"
  | "work"
  | "custom";

export interface PassengerSavedPlace {
  id: string;
  name: string;
  type: SavedPlaceType;
  address: string;
  lat: number;
  lng: number;

  createdAt?: string;
  updatedAt?: string;
}

/*
 * We have not yet observed a non-empty response
 * from /riders/recent-destinations.
 *
 * Keep fields defensive until we see an actual
 * backend item.
 */
export interface PassengerRecentDestination {
  id: string;

  name?: string | null;
  address: string;

  lat?: number | null;
  lng?: number | null;

  createdAt?: string | null;
}