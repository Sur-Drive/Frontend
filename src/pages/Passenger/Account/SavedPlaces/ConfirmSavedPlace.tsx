import { Navigate, useLocation } from "react-router-dom";

import type { RideLocation } from "../../../../types/passengerRide";

interface ConfirmState {
  mode: "home" | "work" | "new";
  location: RideLocation;
  editId?: string;
  existingName?: string;
}

export default function ConfirmSavedPlace() {
  const routerLocation = useLocation();

  const state =
    routerLocation.state as ConfirmState | undefined;

  if (!state?.location?.coordinates) {
    return (
      <Navigate
        to="/passenger/account/saved-places"
        replace
      />
    );
  }

  /*
   * New custom places still need a name.
   */
  if (state.mode === "new") {
    return (
      <Navigate
        to="/passenger/account/saved-places/name"
        replace
        state={state}
      />
    );
  }

  /*
   * Home / Work should already have been
   * saved by SavedPlaceMap before reaching
   * this route.
   */
  return (
    <Navigate
      to="/passenger/account/saved-places"
      replace
    />
  );
}