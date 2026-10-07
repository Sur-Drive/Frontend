import {
  passengerApi,
} from "./passengerClient";

export type SavedPlaceType =
  | "home"
  | "work"
  | "custom";

export interface SavedPlaceApiItem {
  id: string;
  name: string;
  type: SavedPlaceType;
  address: string;

  lat?: number | null;
  lng?: number | null;

  latitude?: number | null;
  longitude?: number | null;

  createdAt?: string;
  updatedAt?: string;

  [key: string]: unknown;
}

export interface SavedPlacePayload {
  name: string;
  type: SavedPlaceType;
  address: string;
  lat: number;
  lng: number;
}

export type SavedPlacesResponse =
  | SavedPlaceApiItem[]
  | {
      data?: SavedPlaceApiItem[];
      savedPlaces?: SavedPlaceApiItem[];
      places?: SavedPlaceApiItem[];
      [key: string]: unknown;
    };

export type SavedPlaceMutationResponse =
  | SavedPlaceApiItem
  | {
      data?: SavedPlaceApiItem;
      savedPlace?: SavedPlaceApiItem;
      place?: SavedPlaceApiItem;
      [key: string]: unknown;
    };

export const passengerSavedPlacesApi = {
  getAll: () =>
    passengerApi.get<SavedPlacesResponse>(
      "/riders/saved-places",
      {
        authMode: "access",
      },
    ),

  create: (
    payload: SavedPlacePayload,
  ) =>
    passengerApi.post<SavedPlaceMutationResponse>(
      "/riders/saved-places",
      payload,
      {
        authMode: "access",
      },
    ),

  update: (
    id: string,
    payload: SavedPlacePayload,
  ) =>
    passengerApi.patch<SavedPlaceMutationResponse>(
      `/riders/saved-places/${id}`,
      payload,
      {
        authMode: "access",
      },
    ),

  remove: (
    id: string,
  ) =>
    passengerApi.delete<unknown>(
      `/riders/saved-places/${id}`,
      {
        authMode: "access",
      },
    ),
};

export function extractSavedPlaces(
  response: SavedPlacesResponse,
): SavedPlaceApiItem[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (
    Array.isArray(response.data)
  ) {
    return response.data;
  }

  if (
    Array.isArray(
      response.savedPlaces,
    )
  ) {
    return response.savedPlaces;
  }

  if (
    Array.isArray(response.places)
  ) {
    return response.places;
  }

  return [];
}