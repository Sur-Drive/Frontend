// Recently-visited destinations, shown on the home page the way Google
// Maps shows your recent searches/trips. Purely local (localStorage) —
// there's no backend endpoint for trip history yet, so this is per
// device/browser rather than synced to the account.

export interface PlaceHistoryEntry {
  /** Stable id so re-visiting the same spot updates it instead of duplicating it. */
  id: string;
  /** What to show — place name if we have one, else the typed address. */
  label: string;
  address?: string;
  lat: number;
  lng: number;
  visitedAt: number;
}

const STORAGE_KEY = "roadHistory.recentPlaces";
const MAX_ENTRIES = 12;

function readAll(): PlaceHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(entries: PlaceHistoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage full/unavailable (private browsing etc.) — history just
    // won't persist this time; nothing else in the app depends on it.
  }
}

/** Rounded coord pair as a stable id when the caller doesn't have a place id. */
function coordId(lat: number, lng: number) {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}

export function getRecentPlaces(): PlaceHistoryEntry[] {
  return readAll();
}

export function recordVisitedPlace(entry: {
  id?: string;
  label: string;
  address?: string;
  lat: number;
  lng: number;
}): PlaceHistoryEntry[] {
  if (!entry.label || !Number.isFinite(entry.lat) || !Number.isFinite(entry.lng)) {
    return readAll();
  }
  const id = entry.id ?? coordId(entry.lat, entry.lng);
  const withoutDupe = readAll().filter((existing) => existing.id !== id);
  const next: PlaceHistoryEntry[] = [
    {
      id,
      label: entry.label,
      address: entry.address,
      lat: entry.lat,
      lng: entry.lng,
      visitedAt: Date.now(),
    },
    ...withoutDupe,
  ].slice(0, MAX_ENTRIES);
  writeAll(next);
  return next;
}

export function clearRecentPlaces() {
  writeAll([]);
}
