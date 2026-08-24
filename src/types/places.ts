// ─── Places Along the Route ─────────────────────────────────────────
// Types for the "find useful places near my route" feature — petrol
// stations, restaurants, hotels, hospitals, etc. Results come from the
// Google Places JS SDK (nearbySearch), sampled at points along the
// active route, so nothing here is backend-specific.

export type PlaceCategoryId =
  | 'fuel'
  | 'restaurant'
  | 'hotel'
  | 'hospital'
  | 'pharmacy'
  | 'atm'
  | 'bank'
  | 'parking'
  | 'supermarket'
  | 'police'
  | 'charging'
  | 'school'
  | 'worship'
  | 'other'

export interface PlaceCategory {
  id: PlaceCategoryId
  label: string
  /** short emoji glyph — matches the app's existing hazard-icon style */
  icon: string
  /** pin/accent color for map markers and chips */
  color: string
  /** Google Places `type` value(s). nearbySearch is called once per type
   *  per sample point and the results are merged + deduped. */
  types: string[]
}

export interface NearbyPlace {
  id: string
  name: string
  category: PlaceCategoryId
  lat: number
  lng: number
  vicinity?: string
  rating?: number
  userRatingsTotal?: number
  openNow?: boolean
  /** straight-line distance from the place to the nearest point on the route */
  distanceFromRouteMeters: number
  /** distance along the route to that nearest point — used to sort results
   *  "next up the road" instead of by raw straight-line proximity */
  distanceAlongRouteMeters: number
}
