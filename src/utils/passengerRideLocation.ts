import type {
  PassengerLocation,
} from "../api/passenger/location";
import type { PlaceDetails } from "../api/passenger/placeSearch";

import type {
  RideLocation,
} from "../types/passengerRide";

export function passengerLocationToRideLocation(
  location: PassengerLocation,
): RideLocation | null {
  if (
    !location.locationEnabled ||
    location.lat === null ||
    location.lng === null
  ) {
    return null;
  }

  return {
    label:
      location.address?.trim() ||
      "Current location",

    address:
      location.address?.trim() ||
      undefined,

    coordinates: {
      lat: location.lat,
      lng: location.lng,
    },
  };
}

export function placeDetailsToRideLocation(
  place: PlaceDetails,
): RideLocation {
  return {
    id: place.id,
    placeId: place.placeId,
    label: place.label,
    address: place.address,
    coordinates: place.coordinates,
  };
}