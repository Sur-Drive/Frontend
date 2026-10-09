import type {
  Coordinates,
} from "./passengerRide";

export type SavedPlaceType =
  | "home"
  | "work"
  | "custom";

export interface SavedPlace {
  id: string;

  type: SavedPlaceType;

  name: string;

  address: string;

  coordinates: Coordinates;
}