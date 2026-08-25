// ─── Turn-by-turn maneuver detection ───────────────────────────────────
// The routing backend only gives us a path (lat/lng vertices) + overall
// distance/duration — no street-level maneuver list (no "turn left onto
// X"). This module derives one anyway, purely from the route geometry:
// it walks the polyline, measures how much the bearing changes at each
// vertex (smoothed over a short look-ahead/look-behind window so dense
// vertex clusters don't read as noise), and turns sustained bearing
// changes into a list of maneuvers (turn left/right, keep left/right,
// U-turn, roundabout, arrive).
//
// This is intentionally synchronous and network-free — road names and
// highway-enter/exit upgrades are layered on top by useTurnByTurn, which
// has to hit the geocoder and therefore has to be async.

import { bearingBetween, haversineMeters, type LatLng } from './geoPath'

export type ManeuverType =
  | 'straight'
  | 'slight-left'
  | 'slight-right'
  | 'left'
  | 'right'
  | 'sharp-left'
  | 'sharp-right'
  | 'uturn'
  | 'roundabout'
  | 'highway-enter'
  | 'highway-exit'
  | 'arrive'

export interface ManeuverStep {
  id: string
  type: ManeuverType
  /** distance in meters from the start of the route to this maneuver */
  distanceAlongRoute: number
  /** index into the source path this maneuver is anchored to */
  pathIndex: number
  position: LatLng
  /** signed turn angle in degrees: negative = left, positive = right */
  angle: number
  instruction: string
}

export const MANEUVER_INSTRUCTIONS: Record<ManeuverType, string> = {
  straight: 'Continue straight',
  'slight-left': 'Keep left',
  'slight-right': 'Keep right',
  left: 'Turn left',
  right: 'Turn right',
  'sharp-left': 'Make a sharp left',
  'sharp-right': 'Make a sharp right',
  uturn: 'Make a U-turn',
  roundabout: 'Enter the roundabout',
  'highway-enter': 'Merge onto the highway',
  'highway-exit': 'Take the highway exit',
  arrive: "You've arrived at your destination",
}

// How far to look back/forward of a vertex when measuring its turn angle.
// Smooths over GPS/routing-vertex noise without washing out real turns.
const LOOK_METERS = 25
// Minimum spacing between two announced maneuvers — avoids machine-gunning
// several "turn" callouts for one physically continuous bend in the road.
const MIN_GAP_METERS = 40
// |angle| below this isn't worth mentioning at all.
const STRAIGHT_THRESHOLD = 12
const SLIGHT_MAX = 40
const NORMAL_MAX = 100
const SHARP_MAX = 150
// Roundabouts show up as a burst of rotation packed into a short distance —
// well beyond what any single ordinary turn or bend produces.
const ROUNDABOUT_WINDOW_METERS = 70
const ROUNDABOUT_MIN_ROTATION = 210

function normalizeAngle(deg: number): number {
  let a = deg % 360
  if (a > 180) a -= 360
  if (a < -180) a += 360
  return a
}

function classify(angle: number): Exclude<ManeuverType, 'straight' | 'roundabout' | 'highway-enter' | 'highway-exit' | 'arrive'> | 'straight' {
  const abs = Math.abs(angle)
  if (abs >= SHARP_MAX) return 'uturn'
  if (abs >= NORMAL_MAX) return angle > 0 ? 'sharp-right' : 'sharp-left'
  if (abs >= SLIGHT_MAX) return angle > 0 ? 'right' : 'left'
  if (abs >= STRAIGHT_THRESHOLD) return angle > 0 ? 'slight-right' : 'slight-left'
  return 'straight'
}

/** Point at an absolute distance (meters) along `path`, given its cumulative-distance table. */
export function pointAtDistance(path: LatLng[], cum: number[], distanceMeters: number): LatLng {
  if (path.length === 0) return { lat: 0, lng: 0 }
  if (path.length === 1) return path[0]

  const total = cum[cum.length - 1] ?? 0
  const target = Math.min(total, Math.max(0, distanceMeters))

  let lo = 0
  let hi = cum.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (cum[mid] < target) lo = mid + 1
    else hi = mid
  }

  const upper = Math.max(1, lo)
  const lower = upper - 1
  const segStart = cum[lower]
  const segEnd = cum[upper]
  const segLen = segEnd - segStart
  const t = segLen > 0 ? (target - segStart) / segLen : 0

  const a = path[lower]
  const b = path[upper]
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t }
}

interface RoundaboutWindow {
  startDistance: number
  endDistance: number
}

/** Windows of the route where accumulated rotation is way past what a normal turn produces. */
function findRoundabouts(path: LatLng[], cum: number[]): RoundaboutWindow[] {
  const windows: RoundaboutWindow[] = []
  if (path.length < 4) return windows

  // Signed bearing delta between each consecutive pair of segments.
  const segBearings: number[] = []
  for (let i = 0; i < path.length - 1; i++) segBearings.push(bearingBetween(path[i], path[i + 1]))

  let windowStartIdx = 0
  for (let i = 1; i < segBearings.length; i++) {
    // Slide windowStartIdx forward until the window fits ROUNDABOUT_WINDOW_METERS.
    while (cum[i] - cum[windowStartIdx] > ROUNDABOUT_WINDOW_METERS && windowStartIdx < i) {
      windowStartIdx++
    }

    let rotation = 0
    for (let j = windowStartIdx; j < i; j++) {
      rotation += Math.abs(normalizeAngle(segBearings[j + 1] - segBearings[j]))
    }

    if (rotation >= ROUNDABOUT_MIN_ROTATION) {
      const last = windows[windows.length - 1]
      const startDistance = cum[windowStartIdx]
      const endDistance = cum[Math.min(i + 1, cum.length - 1)]
      if (last && startDistance <= last.endDistance + MIN_GAP_METERS) {
        last.endDistance = Math.max(last.endDistance, endDistance)
      } else {
        windows.push({ startDistance, endDistance })
      }
    }
  }

  return windows
}

function inRoundabout(distance: number, windows: RoundaboutWindow[]): RoundaboutWindow | undefined {
  return windows.find((w) => distance >= w.startDistance && distance <= w.endDistance)
}

/**
 * Derives a turn-by-turn maneuver list from a route's geometry. Pure
 * function of the path — same output every time for the same route, so
 * callers can safely useMemo() on `path`.
 */
export function buildManeuvers(path: LatLng[], cum: number[]): ManeuverStep[] {
  const steps: ManeuverStep[] = []
  if (path.length < 3) {
    if (path.length === 2) {
      steps.push({
        id: 'arrive',
        type: 'arrive',
        distanceAlongRoute: cum[cum.length - 1] ?? 0,
        pathIndex: path.length - 1,
        position: path[path.length - 1],
        angle: 0,
        instruction: MANEUVER_INSTRUCTIONS.arrive,
      })
    }
    return steps
  }

  const total = cum[cum.length - 1] ?? 0
  const roundabouts = findRoundabouts(path, cum)

  let lastAcceptedDistance = -Infinity
  let seq = 0

  for (let i = 1; i < path.length - 1; i++) {
    const d = cum[i]
    const roundabout = inRoundabout(d, roundabouts)

    if (roundabout) {
      // Only emit once per roundabout window, at its entry.
      if (Math.abs(d - roundabout.startDistance) < 1 && d - lastAcceptedDistance >= MIN_GAP_METERS) {
        steps.push({
          id: `m${seq++}`,
          type: 'roundabout',
          distanceAlongRoute: d,
          pathIndex: i,
          position: path[i],
          angle: 0,
          instruction: MANEUVER_INSTRUCTIONS.roundabout,
        })
        lastAcceptedDistance = d
      }
      continue
    }

    const back = pointAtDistance(path, cum, d - LOOK_METERS)
    const fwd = pointAtDistance(path, cum, d + LOOK_METERS)
    const bIn = bearingBetween(back, path[i])
    const bOut = bearingBetween(path[i], fwd)
    const angle = normalizeAngle(bOut - bIn)
    const type = classify(angle)

    if (type === 'straight') continue
    if (d - lastAcceptedDistance < MIN_GAP_METERS) continue

    // Look ahead a little further to find the true local peak of this
    // turn (the sharpest point of the bend), rather than the first vertex
    // that crosses the threshold — keeps the announced position close to
    // the actual apex of the turn.
    let peakIndex = i
    let peakAngle = angle
    for (let j = i + 1; j < path.length - 1 && cum[j] - d < MIN_GAP_METERS; j++) {
      const jd = cum[j]
      const jBack = pointAtDistance(path, cum, jd - LOOK_METERS)
      const jFwd = pointAtDistance(path, cum, jd + LOOK_METERS)
      const jAngle = normalizeAngle(bearingBetween(path[j], jFwd) - bearingBetween(jBack, path[j]))
      if (Math.sign(jAngle) === Math.sign(peakAngle) && Math.abs(jAngle) > Math.abs(peakAngle)) {
        peakIndex = j
        peakAngle = jAngle
      }
    }

    const peakType = classify(peakAngle)
    if (peakType === 'straight') continue

    steps.push({
      id: `m${seq++}`,
      type: peakType,
      distanceAlongRoute: cum[peakIndex],
      pathIndex: peakIndex,
      position: path[peakIndex],
      angle: peakAngle,
      instruction: MANEUVER_INSTRUCTIONS[peakType],
    })
    lastAcceptedDistance = cum[peakIndex]
  }

  steps.push({
    id: 'arrive',
    type: 'arrive',
    distanceAlongRoute: total,
    pathIndex: path.length - 1,
    position: path[path.length - 1],
    angle: 0,
    instruction: MANEUVER_INSTRUCTIONS.arrive,
  })

  return steps
}

/** "150 m" below 1km, "1.2 km" at/above it — matches how the rest of the app formats distance. */
export function formatManeuverDistance(meters: number): string {
  if (meters < 1000) return `${Math.max(0, Math.round(meters / 10) * 10)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

export { haversineMeters }
