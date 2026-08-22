// import { api } from '../lib/apiClient'
// import { toLatLngPath, type LatLng as GeoLatLng } from '../lib/geoPath'
// import type { RouteModeKey, RouteOption, RoutePlanResponse, RouteAlternative } from '../types/routePlan'

// export type { RouteModeKey, RouteOption, RoutePlanResponse, RouteAlternative }

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

// function formatHazardLocation(h: any): string {
//   const location = h?.location

//   if (typeof location === 'string') return location
//   if (typeof h?.locationAddress === 'string') return h.locationAddress

//   if (location && typeof location === 'object') {
//     if (typeof location.address === 'string') return location.address
//     if (typeof location.lat === 'number' && typeof location.lng === 'number') {
//       return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
//     }
//     if (typeof location.latitude === 'number' && typeof location.longitude === 'number') {
//       return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
//     }
//   }

//   return ''
// }

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
//     location: formatHazardLocation(h),
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

// // ─── Alternative routes ────────────────────────────────────────────
// // Each mode's RouteOption carries an `alternatives` array alongside its
// // own best path, but the exact field names on each entry aren't pinned
// // down yet — normalize defensively the same way normalizePlanRouteResult
// // does above, so the UI still works whichever shape the backend sends.
// function normalizeRouteAlternative(raw: any): RouteAlternative {
//   const path = raw?.path ?? raw?.geometry?.coordinates ?? []

//   const distance =
//     raw?.distance ??
//     (typeof raw?.distanceMeters === 'number' ? raw.distanceMeters / 1000 : undefined) ??
//     (typeof raw?.distanceKm === 'number' ? raw.distanceKm : undefined) ??
//     0

//   const duration =
//     raw?.duration ??
//     (typeof raw?.durationInSeconds === 'number' ? raw.durationInSeconds / 60 : undefined) ??
//     (typeof raw?.durationSeconds === 'number' ? raw.durationSeconds / 60 : undefined) ??
//     (typeof raw?.durationMinutes === 'number' ? raw.durationMinutes : undefined) ??
//     0

//   return {
//     path,
//     distance,
//     duration,
//     durationFormatted: raw?.durationFormatted,
//     summary: raw?.summary,
//     safetyScore: raw?.safetyScore,
//     safetyLevel: raw?.safetyLevel,
//     raw,
//   }
// }

// /** Up to `limit` alternative routes for a mode's RouteOption (default 2),
//  *  skipping any entry that doesn't actually have a path to draw. */
// export function getRouteAlternatives(route: RouteOption | undefined | null, limit = 2): RouteAlternative[] {
//   const source = Array.isArray(route?.alternatives) ? (route!.alternatives as any[]) : []

//   return source
//     .map(normalizeRouteAlternative)
//     .filter((alt) => alt.path.length > 0)
//     .slice(0, limit)
// }

// // POST /route/plan  { origin: { lat, lng }, destination: { lat, lng } }
// export async function planRoute(payload: PlanRoutePayload): Promise<PlanRouteResult> {
//   const body = await api.post<any>('/route/plan', payload)
//   return normalizePlanRouteResult(body)
// }

// // ─── Multi-modal route plan (real backend shape) ──────────────────────
// // The backend actually answers /route/plan with `{ routes: { driving,
// // walking, cycling, motorcycle }, summary }` — one full RouteOption per
// // mode, not the single flattened result normalizePlanRouteResult above
// // assumes. planRouteOptions/parseRoutePlanResponse expose that shape
// // as-is so route-rendering UI (mode switcher, animated polyline) can
// // work directly off real distances/durations/paths per mode, instead of
// // guessing at one "best" route up front.

// const EMPTY_SUMMARY = {
//   bestRoute: 'driving' as RouteModeKey,
//   fastest: 'driving' as RouteModeKey,
//   shortest: 'driving' as RouteModeKey,
//   safest: 'driving' as RouteModeKey,
// }

// export function parseRoutePlanResponse(body: any): RoutePlanResponse {
//   return {
//     routes: body?.routes ?? {},
//     summary: body?.summary ?? EMPTY_SUMMARY,
//   }
// }

// /** The first mode with a route, preferring the backend's declared best/fastest. */
// export function pickDefaultMode(plan: RoutePlanResponse): RouteModeKey | undefined {
//   const preferred = [plan.summary?.bestRoute, plan.summary?.fastest].filter(Boolean) as RouteModeKey[]
//   const available = Object.keys(plan.routes) as RouteModeKey[]

//   return preferred.find((mode) => plan.routes[mode]) ?? available[0]
// }

// /** Converts a route's raw [lng, lat] path into map-ready {lat, lng} points. */
// export function getRoutePath(route: RouteOption | undefined | null): GeoLatLng[] {
//   if (!route?.path?.length) return []
//   return toLatLngPath(route.path)
// }

// // POST /route/plan — multi-modal variant, see parseRoutePlanResponse above.
// export async function planRouteOptions(payload: PlanRoutePayload): Promise<RoutePlanResponse> {
//   const body = await api.post<any>('/route/plan', payload)
//   return parseRoutePlanResponse(body)
// }

import { api } from "../lib/apiClient";
import { toLatLngPath, type LatLng as GeoLatLng } from "../lib/geoPath";
import type {
  RouteModeKey,
  RouteOption,
  RoutePlanResponse,
  RouteAlternative,
  RawLngLat,
} from "../types/routePlan";

export type { RouteModeKey, RouteOption, RoutePlanResponse, RouteAlternative };

export interface LatLng {
  lat: number;
  lng: number;
}

export interface PlanRoutePayload {
  origin: LatLng;
  destination: LatLng;
}

export interface RouteHazard {
  id: string;
  type: string;
  title: string;
  location: string;
  distanceKm: number;
}

export interface PlanRouteResult {
  distanceKm: number;
  etaMinutes: number;
  safetyScore: number;
  hazards: RouteHazard[];
  polyline?: string;
  raw: unknown;
}

function formatHazardLocation(h: any): string {
  const location = h?.location;

  if (typeof location === "string") return location;
  if (typeof h?.locationAddress === "string") return h.locationAddress;

  if (location && typeof location === "object") {
    if (typeof location.address === "string") return location.address;
    if (typeof location.lat === "number" && typeof location.lng === "number") {
      return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
    }
    if (
      typeof location.latitude === "number" &&
      typeof location.longitude === "number"
    ) {
      return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
    }
  }

  return "";
}

function normalizePlanRouteResult(body: any): PlanRouteResult {
  const distanceKm =
    body?.distanceKm ??
    (typeof body?.distanceMeters === "number"
      ? body.distanceMeters / 1000
      : undefined) ??
    body?.distance ??
    0;

  const etaMinutes =
    body?.etaMinutes ??
    body?.durationMinutes ??
    (typeof body?.durationSeconds === "number"
      ? body.durationSeconds / 60
      : undefined) ??
    0;

  const safetyScore = body?.safetyScore ?? body?.safety ?? 0;

  const hazardsSource: any[] = body?.hazards ?? body?.hazardsOnRoute ?? [];
  const hazards: RouteHazard[] = hazardsSource.map((h: any) => ({
    id: h.id ?? h._id ?? String(Math.random()),
    type: h.type ?? "hazard",
    title: h.title ?? h.description ?? "Reported hazard",
    location: formatHazardLocation(h),
    distanceKm:
      h.distanceKm ??
      (typeof h.distanceMeters === "number" ? h.distanceMeters / 1000 : 0),
  }));

  return {
    distanceKm,
    etaMinutes,
    safetyScore,
    hazards,
    polyline: body?.polyline ?? body?.overviewPolyline,
    raw: body,
  };
}

// ─── Alternative routes ────────────────────────────────────────────
// Each mode's RouteOption carries an `alternatives` array alongside its
// own best path, but the exact field names on each entry aren't pinned
// down yet — normalize defensively the same way normalizePlanRouteResult
// does above, so the UI still works whichever shape the backend sends.
function normalizeRouteAlternative(raw: any): RouteAlternative {
  const path = raw?.path ?? raw?.geometry?.coordinates ?? [];

  const distance =
    raw?.distance ??
    (typeof raw?.distanceMeters === "number"
      ? raw.distanceMeters / 1000
      : undefined) ??
    (typeof raw?.distanceKm === "number" ? raw.distanceKm : undefined) ??
    0;

  const duration =
    raw?.duration ??
    (typeof raw?.durationInSeconds === "number"
      ? raw.durationInSeconds / 60
      : undefined) ??
    (typeof raw?.durationSeconds === "number"
      ? raw.durationSeconds / 60
      : undefined) ??
    (typeof raw?.durationMinutes === "number"
      ? raw.durationMinutes
      : undefined) ??
    0;

  return {
    path,
    distance,
    duration,
    durationFormatted: raw?.durationFormatted,
    summary: raw?.summary,
    safetyScore: raw?.safetyScore,
    safetyLevel: raw?.safetyLevel,
    raw,
  };
}

/** Up to `limit` alternative routes for a mode's RouteOption (default 2),
 *  skipping any entry that doesn't actually have a path to draw. */
export function getRouteAlternatives(
  route: RouteOption | undefined | null,
  limit = 2,
): RouteAlternative[] {
  const source = Array.isArray(route?.alternatives)
    ? (route!.alternatives as any[])
    : [];

  return source
    .map(normalizeRouteAlternative)
    .filter((alt) => alt.path.length > 0)
    .slice(0, limit);
}

// POST /route/plan  { origin: { lat, lng }, destination: { lat, lng } }
export async function planRoute(
  payload: PlanRoutePayload,
): Promise<PlanRouteResult> {
  const body = await api.post<any>("/route/plan", payload);
  return normalizePlanRouteResult(body);
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
  bestRoute: "driving" as RouteModeKey,
  fastest: "driving" as RouteModeKey,
  shortest: "driving" as RouteModeKey,
  safest: "driving" as RouteModeKey,
};

export function parseRoutePlanResponse(body: any): RoutePlanResponse {
  return {
    routes: body?.routes ?? {},
    summary: body?.summary ?? EMPTY_SUMMARY,
  };
}

/** The first mode with a route, preferring the backend's declared best/fastest. */
export function pickDefaultMode(
  plan: RoutePlanResponse,
): RouteModeKey | undefined {
  const preferred = [plan.summary?.bestRoute, plan.summary?.fastest].filter(
    Boolean,
  ) as RouteModeKey[];
  const available = Object.keys(plan.routes) as RouteModeKey[];

  return preferred.find((mode) => plan.routes[mode]) ?? available[0];
}

/** Converts a route's raw [lng, lat] path into map-ready {lat, lng} points. */
export function getRoutePath(
  route: RouteOption | undefined | null,
): GeoLatLng[] {
  if (!route?.path?.length) return [];
  return toLatLngPath(route.path);
}

// POST /route/plan — multi-modal variant, see parseRoutePlanResponse above.
export async function planRouteOptions(
  payload: PlanRoutePayload,
): Promise<RoutePlanResponse> {
  const body = await api.post<any>("/route/plan", payload);
  return parseRoutePlanResponse(body);
}

// ─── Multi-stop routing ────────────────────────────────────────────
// The backend only plans a single origin → destination leg per call, so a
// route with stops is built client-side by planning each leg
// (origin→stop1, stop1→stop2, … lastStop→destination) in parallel and
// stitching the results back into one RouteOption per mode. This is what
// lets the ETA system react to stops being added/removed/reordered the
// same way it reacts to a reroute — the merged route's distance/duration
// simply change.

export interface PlanRoutePayloadMulti extends PlanRoutePayload {
  /** Ordered intermediate stops between origin and destination. */
  stops?: LatLng[];
}

function formatDurationLabel(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h <= 0) return `${m} min`;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

/** Concatenates one mode's per-leg RouteOptions into a single route,
 *  dropping the duplicate joint point between consecutive legs. */
function mergeRouteOptionLegs(legs: RouteOption[]): RouteOption {
  const first = legs[0];
  const last = legs[legs.length - 1];

  const path: RawLngLat[] = legs.flatMap((leg, i) =>
    i === 0 ? leg.path : leg.path.slice(1),
  );
  const distance = legs.reduce((sum, leg) => sum + (leg.distance || 0), 0);
  const duration = legs.reduce((sum, leg) => sum + (leg.duration || 0), 0);
  const durationInSeconds = legs.reduce(
    (sum, leg) => sum + (leg.durationInSeconds || 0),
    0,
  );
  const hazards = legs.flatMap((leg) => leg.hazards || []);
  const co2Emission = legs.reduce(
    (sum, leg) => sum + (leg.co2Emission || 0),
    0,
  );
  const caloriesBurned = legs.reduce(
    (sum, leg) => sum + (leg.caloriesBurned || 0),
    0,
  );
  const safetyScore = Math.round(
    legs.reduce((sum, leg) => sum + (leg.safetyScore || 0), 0) / legs.length,
  );

  return {
    ...first,
    path,
    distance,
    duration,
    durationInSeconds,
    durationFormatted: formatDurationLabel(duration),
    startAddress: first.startAddress,
    endAddress: last.endAddress,
    waypoints: legs.length - 1,
    hazards,
    safetyScore,
    safetyFactors: Array.from(
      new Set(legs.flatMap((leg) => leg.safetyFactors || [])),
    ),
    co2Emission,
    caloriesBurned,
    // Alternatives aren't meaningfully mergeable across legs — the
    // "recommended" multi-stop route is the only choice offered.
    alternatives: [],
  };
}

function combineRoutePlanLegs(
  legResults: RoutePlanResponse[],
): RoutePlanResponse {
  if (legResults.length === 1) return legResults[0];

  const modes: RouteModeKey[] = ["driving", "motorcycle", "cycling", "walking"];
  const routes: Partial<Record<RouteModeKey, RouteOption>> = {};

  for (const mode of modes) {
    const legsForMode = legResults
      .map((leg) => leg.routes[mode])
      .filter(Boolean) as RouteOption[];
    // Only offer this mode for the full trip if every leg had it.
    if (legsForMode.length !== legResults.length) continue;
    routes[mode] = mergeRouteOptionLegs(legsForMode);
  }

  return {
    routes,
    summary: legResults[0]?.summary ?? EMPTY_SUMMARY,
  };
}

/** Same as planRouteOptions, but plans through an ordered list of stops
 *  first (origin → stop1 → stop2 → … → destination) and merges the legs
 *  into a single multi-modal route plan. With no stops this is identical
 *  to planRouteOptions. */
export async function planRouteOptionsMulti(
  payload: PlanRoutePayloadMulti,
): Promise<RoutePlanResponse> {
  const stops = payload.stops ?? [];
  if (stops.length === 0) {
    return planRouteOptions({
      origin: payload.origin,
      destination: payload.destination,
    });
  }

  const waypoints: LatLng[] = [payload.origin, ...stops, payload.destination];
  const legPayloads: PlanRoutePayload[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    legPayloads.push({ origin: waypoints[i], destination: waypoints[i + 1] });
  }

  const legResults = await Promise.all(
    legPayloads.map((leg) => planRouteOptions(leg)),
  );
  return combineRoutePlanLegs(legResults);
}

// import { api } from '../lib/apiClient'
// import { toLatLngPath, type LatLng as GeoLatLng } from '../lib/geoPath'
// import type { RouteModeKey, RouteOption, RoutePlanResponse } from '../types/routePlan'

// export type { RouteModeKey, RouteOption, RoutePlanResponse }

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

// function formatHazardLocation(h: any): string {
//   const location = h?.location

//   if (typeof location === 'string') return location
//   if (typeof h?.locationAddress === 'string') return h.locationAddress

//   if (location && typeof location === 'object') {
//     if (typeof location.address === 'string') return location.address
//     if (typeof location.lat === 'number' && typeof location.lng === 'number') {
//       return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
//     }
//     if (typeof location.latitude === 'number' && typeof location.longitude === 'number') {
//       return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
//     }
//   }

//   return ''
// }

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
//     location: formatHazardLocation(h),
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

// // ─── Multi-modal route plan (real backend shape) ──────────────────────
// // The backend actually answers /route/plan with `{ routes: { driving,
// // walking, cycling, motorcycle }, summary }` — one full RouteOption per
// // mode, not the single flattened result normalizePlanRouteResult above
// // assumes. planRouteOptions/parseRoutePlanResponse expose that shape
// // as-is so route-rendering UI (mode switcher, animated polyline) can
// // work directly off real distances/durations/paths per mode, instead of
// // guessing at one "best" route up front.

// const EMPTY_SUMMARY = {
//   bestRoute: 'driving' as RouteModeKey,
//   fastest: 'driving' as RouteModeKey,
//   shortest: 'driving' as RouteModeKey,
//   safest: 'driving' as RouteModeKey,
// }

// export function parseRoutePlanResponse(body: any): RoutePlanResponse {
//   return {
//     routes: body?.routes ?? {},
//     summary: body?.summary ?? EMPTY_SUMMARY,
//   }
// }

// /** The first mode with a route, preferring the backend's declared best/fastest. */
// export function pickDefaultMode(plan: RoutePlanResponse): RouteModeKey | undefined {
//   const preferred = [plan.summary?.bestRoute, plan.summary?.fastest].filter(Boolean) as RouteModeKey[]
//   const available = Object.keys(plan.routes) as RouteModeKey[]

//   return preferred.find((mode) => plan.routes[mode]) ?? available[0]
// }

// /** Converts a route's raw [lng, lat] path into map-ready {lat, lng} points. */
// export function getRoutePath(route: RouteOption | undefined | null): GeoLatLng[] {
//   if (!route?.path?.length) return []
//   return toLatLngPath(route.path)
// }

// // POST /route/plan — multi-modal variant, see parseRoutePlanResponse above.
// export async function planRouteOptions(payload: PlanRoutePayload): Promise<RoutePlanResponse> {
//   const body = await api.post<any>('/route/plan', payload)
//   return parseRoutePlanResponse(body)
// }
