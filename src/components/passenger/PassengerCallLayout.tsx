import { Outlet } from "react-router-dom";

import { RideCallProvider } from "../../hooks/passenger/useRideCall";
import RideCall from "../../pages/Passenger/Ride/RideCall";

export default function PassengerCallLayout() {
  return (
    <RideCallProvider>
      <Outlet />

      {/* Global incoming/outgoing call screen */}
      <RideCall />
    </RideCallProvider>
  );
}