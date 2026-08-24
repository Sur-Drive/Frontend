import { useCallback, useState } from "react";
import type { RecentSearch, SavedPlace } from "../types/savedPlaces";
import {
  MAX_FAVOURITES,
  MAX_RECENT_SEARCHES,
  readFavourites,
  readHome,
  readRecentSearches,
  readWork,
  writeFavourites,
  writeHome,
  writeRecentSearches,
  writeWork,
} from "../lib/savedPlacesStorage";

export interface PickedPlace {
  address: string;
  lat: number;
  lng: number;
  placeId?: string;
}

/**
 * On-device "address book" for the Plan Route search fields: Home, Work,
 * favourite locations, and a rolling list of recent searches. Everything
 * is persisted to localStorage so it survives reloads, but none of it is
 * synced to the backend — it's purely a local convenience layer.
 */
export function useSavedPlaces() {
  const [home, setHomeState] = useState<SavedPlace | null>(readHome);
  const [work, setWorkState] = useState<SavedPlace | null>(readWork);
  const [favourites, setFavouritesState] = useState<SavedPlace[]>(readFavourites);
  const [recentSearches, setRecentSearchesState] = useState<RecentSearch[]>(
    readRecentSearches,
  );

  const setHome = useCallback((picked: PickedPlace) => {
    const place: SavedPlace = {
      id: "home",
      slot: "home",
      label: "Home",
      address: picked.address,
      lat: picked.lat,
      lng: picked.lng,
    };
    setHomeState(place);
    writeHome(place);
  }, []);

  const setWork = useCallback((picked: PickedPlace) => {
    const place: SavedPlace = {
      id: "work",
      slot: "work",
      label: "Work",
      address: picked.address,
      lat: picked.lat,
      lng: picked.lng,
    };
    setWorkState(place);
    writeWork(place);
  }, []);

  const removeHome = useCallback(() => {
    setHomeState(null);
    writeHome(null);
  }, []);

  const removeWork = useCallback(() => {
    setWorkState(null);
    writeWork(null);
  }, []);

  const addFavourite = useCallback((label: string, picked: PickedPlace) => {
    setFavouritesState((prev) => {
      const next: SavedPlace[] = [
        {
          id: `favourite-${Date.now()}`,
          slot: "favourite" as const,
          label: label.trim() || picked.address,
          address: picked.address,
          lat: picked.lat,
          lng: picked.lng,
        },
        ...prev.filter((p) => p.address !== picked.address),
      ].slice(0, MAX_FAVOURITES);
      writeFavourites(next);
      return next;
    });
  }, []);

  const removeFavourite = useCallback((id: string) => {
    setFavouritesState((prev) => {
      const next = prev.filter((p) => p.id !== id);
      writeFavourites(next);
      return next;
    });
  }, []);

  const addRecentSearch = useCallback((picked: PickedPlace) => {
    setRecentSearchesState((prev) => {
      const next: RecentSearch[] = [
        {
          id: `recent-${Date.now()}`,
          address: picked.address,
          lat: picked.lat,
          lng: picked.lng,
          placeId: picked.placeId,
          searchedAt: Date.now(),
        },
        ...prev.filter((r) => r.address !== picked.address),
      ].slice(0, MAX_RECENT_SEARCHES);
      writeRecentSearches(next);
      return next;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearchesState([]);
    writeRecentSearches([]);
  }, []);

  return {
    home,
    work,
    favourites,
    recentSearches,
    setHome,
    setWork,
    removeHome,
    removeWork,
    addFavourite,
    removeFavourite,
    addRecentSearch,
    clearRecentSearches,
  };
}

export type UseSavedPlacesReturn = ReturnType<typeof useSavedPlaces>;
