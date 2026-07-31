// import { api } from '../lib/apiClient'

// // Frontend never computes routes locally — planning, hazard-scanning along
// // the path, ETA, and safety scoring all live on the backend.

// export interface LatLng {
//   lat: number
//   lng: number
// }

// export interface PlanRoutePayload {
//   origin: LatLng
//   destination: LatLng
// }

// export interface RouteHazard {
//   id: string
//   type: string
//   title: string
//   location: string
//   distanceKm: number
// }

// export interface PlanRouteResult {
//   distanceKm: number
//   etaMinutes: number
//   safetyScore: number
//   hazards: RouteHazard[]
//   polyline?: string
//   raw: unknown
// }

// // Response field names are our best guess from the confirmed request shape
// // (origin/destination lat-lng) — if the backend returns different keys
// // (e.g. distanceMeters, durationMinutes, hazardsOnRoute), adjust this
// // normalizer; every caller goes through it so there's one place to fix.
// function normalizePlanRouteResult(body: any): PlanRouteResult {
//   const distanceKm =
//     body?.distanceKm ??
//     (typeof body?.distanceMeters === 'number' ? body.distanceMeters / 1000 : undefined) ??
//     body?.distance ??
//     0

//   const etaMinutes =
//     body?.etaMinutes ??
//     body?.durationMinutes ??
//     (typeof body?.durationSeconds === 'number' ? body.durationSeconds / 60 : undefined) ??
//     0

//   const safetyScore = body?.safetyScore ?? body?.safety ?? 0

//   const hazardsSource: any[] = body?.hazards ?? body?.hazardsOnRoute ?? []
//   const hazards: RouteHazard[] = hazardsSource.map((h: any) => ({
//     id: h.id ?? h._id ?? String(Math.random()),
//     type: h.type ?? 'hazard',
//     title: h.title ?? h.description ?? 'Reported hazard',
//     location: h.location?.address ?? h.locationAddress ?? h.location ?? '',
//     distanceKm: h.distanceKm ?? (typeof h.distanceMeters === 'number' ? h.distanceMeters / 1000 : 0),
//   }))

//   return {
//     distanceKm,
//     etaMinutes,
//     safetyScore,
//     hazards,
//     polyline: body?.polyline ?? body?.overviewPolyline,
//     raw: body,
//   }
// }

// // POST /route/plan  { origin: { lat, lng }, destination: { lat, lng } }
// export async function planRoute(payload: PlanRoutePayload): Promise<PlanRouteResult> {
//   const body = await api.post<any>('/route/plan', payload)
//   return normalizePlanRouteResult(body)
// }





import { api } from '../lib/apiClient'
import { toLatLngPath, type LatLng as GeoLatLng } from '../lib/geoPath'
import type { RouteModeKey, RouteOption, RoutePlanResponse } from '../types/routePlan'

export type { RouteModeKey, RouteOption, RoutePlanResponse }



export interface LatLng {
  lat: number
  lng: number
}

export interface PlanRoutePayload {
  origin: LatLng
  destination: LatLng
}

export interface RouteHazard {
  id: string
  type: string
  title: string
  location: string
  distanceKm: number
}

export interface PlanRouteResult {
  distanceKm: number
  etaMinutes: number
  safetyScore: number
  hazards: RouteHazard[]
  polyline?: string
  raw: unknown
}


function formatHazardLocation(h: any): string {
  const location = h?.location

  if (typeof location === 'string') return location
  if (typeof h?.locationAddress === 'string') return h.locationAddress

  if (location && typeof location === 'object') {
    if (typeof location.address === 'string') return location.address
    if (typeof location.lat === 'number' && typeof location.lng === 'number') {
      return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
    }
    if (typeof location.latitude === 'number' && typeof location.longitude === 'number') {
      return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
    }
  }

  return ''
}


function normalizePlanRouteResult(body: any): PlanRouteResult {
  const distanceKm =
    body?.distanceKm ??
    (typeof body?.distanceMeters === 'number' ? body.distanceMeters / 1000 : undefined) ??
    body?.distance ??
    0

  const etaMinutes =
    body?.etaMinutes ??
    body?.durationMinutes ??
    (typeof body?.durationSeconds === 'number' ? body.durationSeconds / 60 : undefined) ??
    0

  const safetyScore = body?.safetyScore ?? body?.safety ?? 0

  const hazardsSource: any[] = body?.hazards ?? body?.hazardsOnRoute ?? []
  const hazards: RouteHazard[] = hazardsSource.map((h: any) => ({
    id: h.id ?? h._id ?? String(Math.random()),
    type: h.type ?? 'hazard',
    title: h.title ?? h.description ?? 'Reported hazard',
    location: formatHazardLocation(h),
    distanceKm: h.distanceKm ?? (typeof h.distanceMeters === 'number' ? h.distanceMeters / 1000 : 0),
  }))

  return {
    distanceKm,
    etaMinutes,
    safetyScore,
    hazards,
    polyline: body?.polyline ?? body?.overviewPolyline,
    raw: body,
  }
}

// POST /route/plan  { origin: { lat, lng }, destination: { lat, lng } }
export async function planRoute(payload: PlanRoutePayload): Promise<PlanRouteResult> {
  const body = await api.post<any>('/route/plan', payload)
  return normalizePlanRouteResult(body)
}

// ─── Multi-modal route plan (real backend shape) ──────────────────────
// The backend actually answers /route/plan with `{ routes: { driving,
// walking, cycling, motorcycle }, summary }` — one full RouteOption per
// mode, not the single flattened result normalizePlanRouteResult above
// assumes. planRouteOptions/parseRoutePlanResponse expose that shape
// as-is so route-rendering UI (mode switcher, animated polyline) can
// work directly off real distances/durations/paths per mode, instead of
// guessing at one "best" route up front.

const EMPTY_SUMMARY = {
  bestRoute: 'driving' as RouteModeKey,
  fastest: 'driving' as RouteModeKey,
  shortest: 'driving' as RouteModeKey,
  safest: 'driving' as RouteModeKey,
}

export function parseRoutePlanResponse(body: any): RoutePlanResponse {
  return {
    routes: body?.routes ?? {},
    summary: body?.summary ?? EMPTY_SUMMARY,
  }
}

/** The first mode with a route, preferring the backend's declared best/fastest. */
export function pickDefaultMode(plan: RoutePlanResponse): RouteModeKey | undefined {
  const preferred = [plan.summary?.bestRoute, plan.summary?.fastest].filter(Boolean) as RouteModeKey[]
  const available = Object.keys(plan.routes) as RouteModeKey[]

  return preferred.find((mode) => plan.routes[mode]) ?? available[0]
}

/** Converts a route's raw [lng, lat] path into map-ready {lat, lng} points. */
export function getRoutePath(route: RouteOption | undefined | null): GeoLatLng[] {
  if (!route?.path?.length) return []
  return toLatLngPath(route.path)
}

// POST /route/plan — multi-modal variant, see parseRoutePlanResponse above.
export async function planRouteOptions(payload: PlanRoutePayload): Promise<RoutePlanResponse> {
  const body = await api.post<any>('/route/plan', payload)
  return parseRoutePlanResponse(body)
}
