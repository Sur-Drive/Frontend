import type {
  PassengerRideResponse,
} from "../api/passenger/rides";

const ACTIVE_RIDE_KEY =
  "surdrive_active_ride";

const ACTIVE_RIDE_ID_KEY =
  "surdrive_active_ride_id";

export function getStoredActiveRide():
  PassengerRideResponse | null {
  try {
    const raw =
      sessionStorage.getItem(
        ACTIVE_RIDE_KEY,
      );

    if (!raw) {
      return null;
    }

    return JSON.parse(
      raw,
    ) as PassengerRideResponse;
  } catch {
    return null;
  }
}

export function getStoredActiveRideId() {
  return (
    sessionStorage.getItem(
      ACTIVE_RIDE_ID_KEY,
    ) ??
    getStoredActiveRide()?.id ??
    null
  );
}

export function storeActiveRide(
  ride: PassengerRideResponse,
) {
  sessionStorage.setItem(
    ACTIVE_RIDE_ID_KEY,
    ride.id,
  );

  sessionStorage.setItem(
    ACTIVE_RIDE_KEY,
    JSON.stringify(ride),
  );
}

export function clearActiveRide() {
  sessionStorage.removeItem(
    ACTIVE_RIDE_ID_KEY,
  );

  sessionStorage.removeItem(
    ACTIVE_RIDE_KEY,
  );
}