import { useMutation } from '@tanstack/react-query'
import { planRoute, planRouteOptions } from '../api/route'
import type { PlanRoutePayload } from '../api/route'

export function usePlanRoute() {
  return useMutation({
    mutationFn: (payload: PlanRoutePayload) => planRoute(payload),
  })
}

/**
 * Multi-modal variant — resolves to the real `{ routes, summary }` shape
 * the backend returns (one RouteOption per driving/walking/cycling/
 * motorcycle), for screens that render more than one mode (RouteMapView,
 * a mode switcher) rather than a single flattened result.
 */
export function usePlanRouteOptions() {
  return useMutation({
    mutationFn: (payload: PlanRoutePayload) => planRouteOptions(payload),
  })
}
