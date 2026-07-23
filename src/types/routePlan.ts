// ─── Route-plan response types ───────────────────────────────────────
// Mirrors the backend's /route/plan response shape exactly: one
// RouteOption per travel mode, keyed under `routes`, plus a `summary`
// naming which mode wins on which criterion. Keeping this as its own
// module (rather than folding it into api/route.ts) means both the API
// layer and any UI component can import the shape without a dependency
// on how the request is actually fetched.

export type RouteModeKey = 'driving' | 'walking' | 'cycling' | 'motorcycle'

/** [longitude, latitude] — GeoJSON order, as returned by OpenRouteService. */
export type RawLngLat = [number, number]

export type SafetyLevel = 'high' | 'medium' | 'low' | (string & {})

export interface RouteOption {
  mode: RouteModeKey
  icon: string
  label: string
  /** kilometers */
  distance: number
  /** minutes */
  duration: number
  durationInSeconds: number
  durationFormatted: string
  /** ordered [lng, lat] vertices describing the road/path geometry */
  path: RawLngLat[]
  /** same vertex list, pre-serialized as a JSON string (provider artifact) */
  polyline: string
  source: string
  summary: string
  startAddress: string
  endAddress: string
  waypoints: number
  avoidFeatures: string[]
  hazards: unknown[]
  safetyScore: number
  safetyLevel: SafetyLevel
  safetyFactors: string[]
  alternatives: unknown[]
  co2Emission: number
  caloriesBurned: number
}

export interface RoutePlanSummary {
  bestRoute: RouteModeKey
  fastest: RouteModeKey
  shortest: RouteModeKey
  safest: RouteModeKey
}

export interface RoutePlanResponse {
  routes: Partial<Record<RouteModeKey, RouteOption>>
  summary: RoutePlanSummary
}

export const ROUTE_MODE_ORDER: RouteModeKey[] = ['driving', 'motorcycle', 'cycling', 'walking']
