// ─── Collision Guard — classification & risk scoring ─────────────────
//
// This is the "extra technology" layer the routing/hazards system
// doesn't cover: real-time object detection off the phone's camera
// feed, turned into a simple forward-collision-warning signal. It's
// deliberately framed as a *driver-assist aid*, not an autonomous
// safety system — it warns, it never acts on the vehicle.
//
// Detection itself (useCollisionGuard.ts) runs a COCO-SSD model
// (via @tensorflow/tfjs + @tensorflow-models/coco-ssd) against video
// frames. This file only classifies what comes back and estimates how
// urgent it is — no camera/model code here, so it's trivially unit
// testable.

export type DetectedCategory =
  | 'vehicle'
  | 'motorcycle'
  | 'bicycle'
  | 'pedestrian'
  | 'obstacle'

export type WarningSeverity = 'low' | 'medium' | 'high'

// COCO-SSD's label set — bucketed into the categories this feature
// asks for. Anything else COCO can detect (bench, fire hydrant, stop
// sign, traffic light, suitcase, etc.) is a generic road "obstacle"
// rather than being dropped, since a static object in the road ahead
// is exactly the kind of thing this feature exists to flag.
const VEHICLE_LABELS = new Set(['car', 'truck', 'bus'])
const OBSTACLE_LABELS = new Set([
  'traffic light',
  'stop sign',
  'fire hydrant',
  'bench',
  'parking meter',
  'suitcase',
  'backpack',
  'chair',
])

export function classifyLabel(label: string): DetectedCategory | null {
  const l = label.toLowerCase()
  if (VEHICLE_LABELS.has(l)) return 'vehicle'
  if (l === 'motorcycle') return 'motorcycle'
  if (l === 'bicycle') return 'bicycle'
  if (l === 'person') return 'pedestrian'
  if (OBSTACLE_LABELS.has(l)) return 'obstacle'
  return null
}

export const CATEGORY_LABEL: Record<DetectedCategory, string> = {
  vehicle: 'Vehicle ahead',
  motorcycle: 'Motorcycle',
  bicycle: 'Bicycle',
  pedestrian: 'Pedestrian',
  obstacle: 'Obstacle',
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export function boxAreaFraction(box: BoundingBox, frameWidth: number, frameHeight: number): number {
  if (!frameWidth || !frameHeight) return 0
  return (box.width * box.height) / (frameWidth * frameHeight)
}

// ── Risk thresholds ────────────────────────────────────────────────
// There's no real depth sensor here, so proximity/closing-speed are
// both *proxies* built from how a detection's bounding box changes
// frame to frame on a 2D image:
//   - areaFraction: how much of the frame the box fills — a stand-in
//     for "how close is it", since a closer object occupies more of
//     the frame.
//   - growthRate: fractional-area-per-second — a stand-in for closing
//     speed, since something we're closing in on grows in the frame
//     faster than something we're keeping pace with.
// These are honest proxies, not a measured time-to-collision — the
// severity labels reflect that (a driver-assist *warning*, not a
// certified ADAS distance reading).
const HIGH_AREA_FRACTION = 0.3
const MEDIUM_AREA_FRACTION = 0.13
const HIGH_GROWTH_RATE = 0.4 // fractional frame-area per second
const MEDIUM_GROWTH_RATE = 0.18

// A box that hasn't moved/resized more than this, for at least
// STOPPED_MIN_MS, is treated as stationary — the "stopped vehicle"
// / static-obstacle case, distinct from "still approaching".
export const STOPPED_POSITION_EPSILON = 0.015 // fraction of frame width/height
export const STOPPED_MIN_MS = 1200

export function computeSeverity(areaFraction: number, growthRate: number): WarningSeverity {
  if (areaFraction >= HIGH_AREA_FRACTION || growthRate >= HIGH_GROWTH_RATE) return 'high'
  if (areaFraction >= MEDIUM_AREA_FRACTION || growthRate >= MEDIUM_GROWTH_RATE) return 'medium'
  return 'low'
}

export function severityRank(s: WarningSeverity): number {
  return s === 'high' ? 2 : s === 'medium' ? 1 : 0
}

export interface TrackedObject {
  id: string
  category: DetectedCategory
  label: string
  box: BoundingBox
  areaFraction: number
  growthRate: number
  isStopped: boolean
  isCollisionHazard: boolean
  severity: WarningSeverity
}

/** Human-readable warning line for a tracked object, for both the
 *  visual banner and the spoken alert. */
export function describeWarning(obj: TrackedObject): string {
  const what = CATEGORY_LABEL[obj.category]

  if (obj.isCollisionHazard) {
    return obj.severity === 'high'
      ? `${what} close ahead — possible collision risk`
      : `${what} ahead, closing distance`
  }
  if (obj.isStopped) {
    return `Stopped ${what.toLowerCase()} ahead`
  }
  return `${what} detected ahead`
}
