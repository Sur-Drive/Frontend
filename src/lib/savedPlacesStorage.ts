import type { RecentSearch, SavedPlace } from "../types/savedPlaces";

// Mirrors the `surdrive:places:` prefix used by addressCache.ts.
const HOME_KEY = "surdrive:places:home";
const WORK_KEY = "surdrive:places:work";
const FAVOURITES_KEY = "surdrive:places:favourites";
const RECENT_KEY = "surdrive:places:recent";

export const MAX_RECENT_SEARCHES = 8;
export const MAX_FAVOURITES = 12;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    // Corrupt entry, private-browsing mode, storage disabled — this is a
    // convenience layer, never let it break address search.
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full/unavailable — safe to ignore.
  }
}

export function readHome(): SavedPlace | null {
  return read<SavedPlace | null>(HOME_KEY, null);
}
export function writeHome(place: SavedPlace | null): void {
  write(HOME_KEY, place);
}

export function readWork(): SavedPlace | null {
  return read<SavedPlace | null>(WORK_KEY, null);
}
export function writeWork(place: SavedPlace | null): void {
  write(WORK_KEY, place);
}

export function readFavourites(): SavedPlace[] {
  return read<SavedPlace[]>(FAVOURITES_KEY, []);
}
export function writeFavourites(places: SavedPlace[]): void {
  write(FAVOURITES_KEY, places);
}

export function readRecentSearches(): RecentSearch[] {
  return read<RecentSearch[]>(RECENT_KEY, []);
}
export function writeRecentSearches(entries: RecentSearch[]): void {
  write(RECENT_KEY, entries);
}
