// ─── Saved Places & Recent Searches ─────────────────────────────────
// Local, on-device address book used by the Plan Route search fields:
// Home / Work / Favourite locations, plus a rolling list of recent
// searches. Nothing here touches the backend — it's a pure convenience
// layer on top of whatever geocoding result the user already picked.

export type SavedPlaceSlot = "home" | "work" | "favourite";

export interface SavedPlace {
  id: string;
  slot: SavedPlaceSlot;
  /** Display name — "Home", "Work", or a user-chosen favourite name. */
  label: string;
  address: string;
  lat: number;
  lng: number;
}

export interface RecentSearch {
  id: string;
  address: string;
  lat: number;
  lng: number;
  placeId?: string;
  searchedAt: number;
}
