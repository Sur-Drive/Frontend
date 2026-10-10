import {
  passengerApi,
} from "./passengerClient";

export interface PassengerLocation {
  locationEnabled: boolean;
  lat: number | null;
  lng: number | null;
  address: string | null;
  lastLocationAt: string | null;
}

export interface UpdatePassengerLocationRequest {
  lat: number;
  lng: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  address?: string;
}

export const passengerLocationApi = {
  getLocation: () =>
    passengerApi.get<PassengerLocation>(
      "/riders/location",
      {
        authMode: "access",
      },
    ),

  setLocationEnabled: (
    enabled: boolean,
  ) =>
    passengerApi.patch<PassengerLocation>(
      "/riders/location",
      {
        enabled,
      },
      {
        authMode: "access",
      },
    ),

  updateLocation: (
    payload: UpdatePassengerLocationRequest,
  ) =>
    passengerApi.post<PassengerLocation>(
      "/riders/location",
      payload,
      {
        authMode: "access",
      },
    ),
};