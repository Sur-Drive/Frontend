import type {
  BackendRideStatus,
} from "../api/passenger/rides";

export type PassengerRideRoute =
  | "/passenger/ride/searching"
  | "/passenger/ride/driver-assigned"
  | "/passenger/ride/driver-en-route"
  | "/passenger/ride/driver-arrived"
  | "/passenger/ride/verify"
  | "/passenger/ride/in-trip"
  | "/passenger/ride/complete"
  | "/passenger/ride/payment"
  | "/passenger/ride/receipt"
  | "/passenger/home";

export function getPassengerRideRoute(
  status: BackendRideStatus,
): PassengerRideRoute {
  switch (status) {
    case "requested":
    case "searching":
    case "no_drivers_found":
      return "/passenger/ride/searching";

    case "driver_assigned":
      return "/passenger/ride/driver-assigned";

    case "driver_en_route":
      return "/passenger/ride/driver-en-route";

    case "driver_arrived":
      return "/passenger/ride/driver-arrived";

    case "ride_started":
    case "ride_in_progress":
      return "/passenger/ride/in-trip";

    case "ride_completed":
      return "/passenger/ride/complete";

    case "payment_pending":
      return "/passenger/ride/payment";

    case "paid":
    case "closed":
      return "/passenger/ride/receipt";

    case "cancelled":
      return "/passenger/home";

    default:
      return "/passenger/home";
  }
}