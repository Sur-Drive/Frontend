import {
  Navigate,
  Outlet,
} from "react-router-dom";

import {
  passengerSession,
} from "../../api/passenger/passengerSession";

export default function PassengerProtectedRoute() {
  const isAuthenticated =
    passengerSession.isAuthenticated();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/passenger/signup"
        replace
      />
    );
  }

  return <Outlet />;
}