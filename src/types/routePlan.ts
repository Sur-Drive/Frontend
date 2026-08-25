export type RouteModeKey = 'driving' | 'walking' | 'cycling' | 'motorcycle'

export type RawLngLat = [number, number]

export type SafetyLevel = 'high' | 'medium' | 'low' | (string & {})

export interface RouteOption {
  mode: RouteModeKey
  icon: string
  label: string
  distance: number
  duration: number
  durationInSeconds: number
  durationFormatted: string
  path: RawLngLat[]
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

// The backend's exact field names for each entry in `RouteOption.alternatives`
// aren't pinned down yet, so this is deliberately loose — see
// normalizeRouteAlternative() in api/route.ts, which fills this in
// defensively from whatever shape actually comes back.
export interface RouteAlternative {
  path: RawLngLat[]
  distance: number
  duration: number
  durationFormatted?: string
  summary?: string
  safetyScore?: number
  safetyLevel?: SafetyLevel
  raw: unknown
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

