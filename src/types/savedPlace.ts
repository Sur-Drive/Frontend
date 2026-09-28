export type SavedPlaceType =
  | "home"
  | "work"
  | "custom";

export interface SavedPlaceCoordinates {
  lat: number;
  lng: number;
}

export interface SavedPlace {
  id: string;
  type: SavedPlaceType;
  name: string;
  address: string;
  coordinates: SavedPlaceCoordinates;
}