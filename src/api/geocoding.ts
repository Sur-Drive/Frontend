import { api } from '../lib/apiClient'

// Frontend never calls Google's Geocoding API directly — every address <->
// coordinate conversion goes through the backend, which geocodes, caches,
// and rate-limits.

export interface GeocodeResult {
  lat: number
  lng: number
  address: string
}

export interface ReverseGeocodeResult {
  address: string
}

export interface GeocodeCacheStats {
  [key: string]: unknown
}

// Response field names below (lat/lng/address) are our best guess from the
// confirmed request shapes — if the backend actually returns different
// keys (e.g. latitude/longitude, formattedAddress), adjust the two
// `normalize*` helpers below; every caller in the app goes through them.

function normalizeGeocodeResult(body: any, fallbackAddress: string): GeocodeResult {
  return {
    lat: body?.lat ?? body?.latitude,
    lng: body?.lng ?? body?.longitude,
    address: body?.address ?? body?.formattedAddress ?? fallbackAddress,
  }
}

function normalizeReverseResult(body: any, lat: number, lng: number): ReverseGeocodeResult {
  return {
    address: body?.address ?? body?.formattedAddress ?? `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
  }
}

// POST /geocode  { address }  →  coordinates for a free-typed address that
// wasn't picked from the Places Autocomplete dropdown (that path already
// gets lat/lng straight from Place Details and never needs this).
export async function forwardGeocode(address: string): Promise<GeocodeResult> {
  const body = await api.post<any>('/geocode', { address })
  return normalizeGeocodeResult(body, address)
}

// GET /geocode/reverse?lat=&lng=
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  const body = await api.get<any>('/geocode/reverse', {
    params: { lat, lng },
  })
  return normalizeReverseResult(body, lat, lng)
}

// GET /geocode/cache/stats — backend cache monitoring, useful for an admin
// dashboard; not consumed by any end-user screen.
export function getGeocodeCacheStats(): Promise<GeocodeCacheStats> {
  return api.get<GeocodeCacheStats>('/geocode/cache/stats')
}
