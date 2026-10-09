import type {
  BackendRideStatus,
} from "../api/passenger/rides";

export function getPassengerRideRoute(
  status: BackendRideStatus,
) {
  switch (status) {
    case "requested":
    case "searching":
      return "/passenger/ride/searching";

    case "driver_assigned":
      return "/passenger/ride/driver-assigned";

    case "driver_en_route":
      return "/passenger/ride/driver-en-route";

    case "driver_arrived":
      return "/passenger/ride/driver-arrived";

    case "ride_started":
    case "ride_in_progress":
      return "/passenger/ride/trip";

    case "ride_completed":
    case "payment_pending":
    case "paid":
    case "closed":
      return "/passenger/ride/complete";

    case "cancelled":
      return "/passenger/home";

    default:
      return "/passenger/home";
  }
}