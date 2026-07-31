import type { RoutePlanResponse, RawLngLat } from '../types/routePlan'

// A trimmed-down (but realistic and structurally identical) stand-in for
// the backend's /route/plan response, used by RouteResultsPage when no
// real routePlan is passed via navigation state. Coordinates are a
// down-sampled subset of an actual driving route so the animated
// polyline still has real turns to follow, without carrying the full
// ~250-point path from the live response into the bundle.
const DRIVING_PATH: RawLngLat[] = [
  [3.96496, 7.466268],
  [3.963047, 7.466143],
  [3.958099, 7.46759],
  [3.951804, 7.456855],
  [3.943158, 7.461594],
  [3.929506, 7.469063],
  [3.918977, 7.471024],
  [3.9167, 7.470717],
  [3.913163, 7.471246],
  [3.911107, 7.461317],
  [3.906797, 7.450989],
  [3.90677, 7.443695],
  [3.908512, 7.43859],
  [3.911997, 7.433439],
  [3.912123, 7.429867],
  [3.90951, 7.426188],
  [3.910153, 7.421448],
  [3.911259, 7.414672],
  [3.9117, 7.411871],
  [3.907894, 7.409597],
  [3.906707, 7.408061],
]

export const sampleRoutePlan: RoutePlanResponse = {
  routes: {
    driving: {
      mode: 'driving',
      icon: 'car',
      label: 'Driving',
      distance: 15.94,
      duration: 18.64,
      durationInSeconds: 1118.6,
      durationFormatted: '18 minutes 39 seconds',
      path: DRIVING_PATH,
      polyline: JSON.stringify(DRIVING_PATH),
      source: 'OpenRouteService',
      summary: 'Driving: 19 min, 15.9 km',
      startAddress: 'Origin',
      endAddress: 'Destination',
      waypoints: 0,
      avoidFeatures: ['highways'],
      hazards: [],
      safetyScore: 100,
      safetyLevel: 'high',
      safetyFactors: ['No hazards detected along the route'],
      alternatives: [],
      co2Emission: 3.35,
      caloriesBurned: 0,
    },
  },
  summary: {
    bestRoute: 'driving',
    fastest: 'driving',
    shortest: 'driving',
    safest: 'driving',
  },
}
