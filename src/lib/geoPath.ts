// ─── Geo/path math ───────────────────────────────────────────────────
// Pure, framework-agnostic helpers for working with a route's polyline.
// Nothing here touches the Google Maps SDK — that's intentional, so the
// same math can drive a Google Maps polyline, a Mapbox layer, or a plain
// SVG/canvas renderer without change. Route-rendering components (e.g.
// AnimatedRoutePolyline) only import from here for position/heading math.

export interface LatLng {
  lat: number
  lng: number
}

const EARTH_RADIUS_METERS = 6371000

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI
}

/**
 * Converts raw [lng, lat] coordinate pairs — the GeoJSON-style order our
 * routing provider (OpenRouteService) returns in `route.path` — into
 * {lat, lng} points, dropping consecutive exact duplicates so animation
 * math never divides by a zero-length segment.
 */
export function toLatLngPath(raw: ReadonlyArray<readonly [number, number]>): LatLng[] {
  const out: LatLng[] = []

  for (const [lng, lat] of raw) {
    const prev = out[out.length - 1]
    if (prev && prev.lat === lat && prev.lng === lng) continue
    out.push({ lat, lng })
  }

  return out
}

export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function bearingBetween(a: LatLng, b: LatLng): number {
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const dLng = toRad(b.lng - a.lng)

  const y = Math.sin(dLng) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)

  return (toDeg(Math.atan2(y, x)) + 360) % 360
}

/** Cumulative distance in meters at each vertex of `path`. cum[0] === 0. */
export function cumulativeDistances(path: LatLng[]): number[] {
  const cum = [0]

  for (let i = 1; i < path.length; i++) {
    cum.push(cum[i - 1] + haversineMeters(path[i - 1], path[i]))
  }

  return cum
}

export function totalLength(cum: number[]): number {
  return cum[cum.length - 1] ?? 0
}

export interface PathSample {
  position: LatLng
  /** compass heading in degrees (0 = north), for rotating a direction marker */
  heading: number
  /** index of the path vertex at or immediately before this sample */
  index: number
}

/**
 * Samples a point on `path` at `fraction` (0-1) of its total distance.
 * Pass the `cum` array from cumulativeDistances(path) rather than
 * recomputing it — this function is called every animation frame, so the
 * caller should memoize `cum` once per `path` and reuse it here.
 *
 * Runs a binary search over cumulative distance, so it stays cheap even
 * on long, densely-sampled routes (hundreds of vertices) called at 60fps.
 */
export function pointAtFraction(path: LatLng[], cum: number[], fraction: number): PathSample {
  const clamped = Math.min(1, Math.max(0, fraction))

  if (path.length === 0) {
    return { position: { lat: 0, lng: 0 }, heading: 0, index: 0 }
  }

  if (path.length === 1) {
    return { position: path[0], heading: 0, index: 0 }
  }

  const target = clamped * totalLength(cum)

  let lo = 0
  let hi = cum.length - 1

  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (cum[mid] < target) lo = mid + 1
    else hi = mid
  }

  const upperIndex = Math.max(1, lo)
  const lowerIndex = upperIndex - 1

  const segStart = cum[lowerIndex]
  const segEnd = cum[upperIndex]
  const segLength = segEnd - segStart
  const t = segLength > 0 ? (target - segStart) / segLength : 0

  const a = path[lowerIndex]
  const b = path[upperIndex]

  const position: LatLng = {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  }

  return {
    position,
    heading: bearingBetween(a, b),
    index: lowerIndex,
  }
}

export interface PathProjection {
  /** the nearest point on the path to the raw GPS fix */
  point: LatLng
  /** 0-1 progress along the path at that nearest point */
  fraction: number
  /** how far the raw GPS fix is from the path itself, in meters — a large
   *  value means the user has wandered off-route, not just moved along it */
  distanceMeters: number
  /** index of the path vertex at or immediately before the projected point */
  index: number
}

/**
 * Snaps a raw lat/lng (e.g. a live GPS fix) onto the nearest point of
 * `path` and reports how far along the route that is. This is the
 * GPS → progress counterpart to pointAtFraction()'s progress → GPS: feed
 * its `fraction` into splitPathAtFraction/AnimatedRoutePolyline exactly
 * like the simulated animation's progress, and the traveled/remaining
 * line + marker now track the user's real position instead.
 *
 * Walking forward along the route increases `fraction`; doubling back
 * decreases it — callers can compare successive calls to detect that, or
 * watch `distanceMeters` growing to detect the user leaving the route
 * entirely (missed turn, different street, etc).
 *
 * Uses a local equirectangular (flat-earth) approximation centered on the
 * raw point to find the closest point on each segment — accurate at the
 * scale of a walking/driving route, and far cheaper than true geodesic
 * point-to-segment distance. Only the final reported distance uses the
 * exact haversine formula. O(path.length) — fine for GPS update rates
 * (~once per second), not meant for 60fps per-frame use like
 * pointAtFraction.
 */
export function projectPointOntoPath(path: LatLng[], cum: number[], raw: LatLng): PathProjection {
  if (path.length === 0) {
    return { point: raw, fraction: 0, distanceMeters: 0, index: 0 }
  }

  if (path.length === 1) {
    return { point: path[0], fraction: 0, distanceMeters: haversineMeters(raw, path[0]), index: 0 }
  }

  // Project every vertex into local meters, centered on `raw`, so ordinary
  // planar point-to-segment math can be used instead of geodesic math.
  const latRad = toRad(raw.lat)
  const metersPerDegLat = (Math.PI / 180) * EARTH_RADIUS_METERS
  const metersPerDegLng = metersPerDegLat * Math.cos(latRad)

  const toXY = (p: LatLng) => ({
    x: (p.lng - raw.lng) * metersPerDegLng,
    y: (p.lat - raw.lat) * metersPerDegLat,
  })

  let bestDistSq = Infinity
  let bestIndex = 0
  let bestT = 0
  let bestPoint: LatLng = path[0]

  for (let i = 0; i < path.length - 1; i++) {
    const a = toXY(path[i])
    const b = toXY(path[i + 1])

    const abx = b.x - a.x
    const aby = b.y - a.y
    const lenSq = abx * abx + aby * aby

    let t = 0
    if (lenSq > 0) {
      t = (-a.x * abx + -a.y * aby) / lenSq
      t = Math.min(1, Math.max(0, t))
    }

    const projX = a.x + abx * t
    const projY = a.y + aby * t
    const distSq = projX * projX + projY * projY

    if (distSq < bestDistSq) {
      bestDistSq = distSq
      bestIndex = i
      bestT = t
      bestPoint = {
        lat: path[i].lat + (path[i + 1].lat - path[i].lat) * t,
        lng: path[i].lng + (path[i + 1].lng - path[i].lng) * t,
      }
    }
  }

  const segStart = cum[bestIndex]
  const segLength = cum[bestIndex + 1] - segStart
  const distanceAlong = segStart + segLength * bestT
  const total = totalLength(cum)

  return {
    point: bestPoint,
    fraction: total > 0 ? distanceAlong / total : 0,
    distanceMeters: haversineMeters(raw, bestPoint),
    index: bestIndex,
  }
}

/**
 * Splits `path` at `fraction` into a "traveled" segment (start → point)
 * and a "remaining" segment (point → end) — the two-tone look Google Maps
 * uses for an in-progress trip (muted line behind you, bright line ahead).
 */
export function splitPathAtFraction(
  path: LatLng[],
  cum: number[],
  fraction: number
): { traveled: LatLng[]; remaining: LatLng[]; sample: PathSample } {
  const sample = pointAtFraction(path, cum, fraction)

  const traveled = [...path.slice(0, sample.index + 1), sample.position]
  const remaining = [sample.position, ...path.slice(sample.index + 1)]

  return { traveled, remaining, sample }
}
