import {
  passengerApi,
} from "./passengerClient";

import type {
  PassengerProfile,
  PassengerRecentDestination,
  PassengerSavedPlace,
} from "../../types/passengerHome";

export const passengerHomeApi = {
  getProfile: () =>
    passengerApi.get<PassengerProfile>(
      "/riders/profile",
      {
        authMode: "access",
      },
    ),

  getSavedPlaces: () =>
    passengerApi.get<
      PassengerSavedPlace[]
    >(
      "/riders/saved-places",
      {
        authMode: "access",
      },
    ),

  getRecentDestinations: () =>
    passengerApi.get<
      PassengerRecentDestination[]
    >(
      "/riders/recent-destinations",
      {
        authMode: "access",
      },
    ),
};