import { useEffect, useMemo, useState } from 'react'
import { cumulativeDistances, totalLength, type LatLng } from '../lib/geoPath'
import {
  buildManeuvers,
  pointAtDistance,
  MANEUVER_INSTRUCTIONS,
  type ManeuverStep,
  type ManeuverType,
} from '../lib/maneuvers'
import { reverseGeocode } from '../api/geocoding'

const HIGHWAY_PATTERN = /express\s?way|highway|freeway|motorway|interstate/i

// A road name only needs the first comma-segment of the full formatted
// address ("Whittier Street, Lekki, Lagos" → "Whittier Street").
function roadNameFromAddress(address: string | undefined): string | undefined {
  const first = address?.split(',')[0]?.trim()
  return first || undefined
}

// The neighborhood/area name is the *second* comma-segment of the same
// formatted address ("12 Whittier Street, Baruwa, Lagos" → "Baruwa") —
// used for the "You are now in <area>" callouts as opposed to the
// street-level "Turn left onto <road>" ones above.
export function areaNameFromAddress(address: string | undefined): string | undefined {
  const parts = address?.split(',').map((p) => p.trim()).filter(Boolean)
  if (!parts || parts.length < 2) return undefined
  return parts[1] || undefined
}

// Session-only cache, keyed to ~11m precision — plenty for "which road is
// this", and keeps repeated lookups near the same maneuver off the network.
const roadNameCache = new Map<string, string | undefined>()
function cacheKeyFor(p: LatLng): string {
  return `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`
}

async function lookupRoadName(p: LatLng): Promise<string | undefined> {
  const key = cacheKeyFor(p)
  if (roadNameCache.has(key)) return roadNameCache.get(key)
  try {
    const res = await reverseGeocode(p.lat, p.lng)
    const name = roadNameFromAddress(res.address)
    roadNameCache.set(key, name)
    return name
  } catch {
    roadNameCache.set(key, undefined)
    return undefined
  }
}

export interface TurnByTurnState {
  /** the full derived maneuver list for the route, in order */
  steps: ManeuverStep[]
  /** the maneuver the driver is currently approaching (upgraded to highway-enter/exit once road names resolve) */
  currentStep: ManeuverStep | null
  /** the maneuver after that, if any — used for "then …" lookahead */
  nextStep: ManeuverStep | null
  /** meters remaining to currentStep, along the route */
  distanceToNextManeuverMeters: number
  /** the road the driver is currently on, once resolved */
  currentRoadName: string | null
  /** the road the upcoming maneuver leads onto, once resolved */
  nextRoadName: string | null
}

/**
 * Tracks which maneuver is "next" as `progress` (0-1 along `path`)
 * advances, and resolves real street names for the current maneuver via
 * reverse geocoding — only for the maneuver actually being approached, so
 * a long route doesn't fire a geocode call per turn up front.
 */
export function useTurnByTurn(path: LatLng[], progress: number, enabled: boolean): TurnByTurnState {
  const cum = useMemo(() => cumulativeDistances(path), [path])
  const total = totalLength(cum)

  const steps = useMemo(() => (path.length > 1 ? buildManeuvers(path, cum) : []), [path, cum])

  const distanceAlongRoute = Math.max(0, Math.min(total, progress * total))

  const nextIndex = useMemo(() => {
    const i = steps.findIndex((s) => s.distanceAlongRoute > distanceAlongRoute + 1)
    return i === -1 ? Math.max(0, steps.length - 1) : i
  }, [steps, distanceAlongRoute])

  const baseStep = steps[nextIndex] ?? null
  const nextStep = steps[nextIndex + 1] ?? null

  const [roadNames, setRoadNames] = useState<Record<string, { from?: string; to?: string }>>({})

  useEffect(() => {
    if (!enabled || !baseStep || baseStep.type === 'arrive') return
    if (roadNames[baseStep.id]) return

    let cancelled = false
    const fromPoint = pointAtDistance(path, cum, Math.max(0, baseStep.distanceAlongRoute - 20))
    const toPoint = baseStep.position

    ;(async () => {
      const [from, to] = await Promise.all([lookupRoadName(fromPoint), lookupRoadName(toPoint)])
      if (cancelled) return
      setRoadNames((prev) => ({ ...prev, [baseStep.id]: { from, to } }))
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, baseStep?.id])

  const names = baseStep ? roadNames[baseStep.id] : undefined
  const currentRoadName = names?.from ?? null
  const nextRoadName = names?.to ?? null

  // Once both road names are known, a plain turn/straight that crosses
  // from a non-highway road onto a highway (or vice versa) is really a
  // highway on/off-ramp — upgrade the maneuver so the UI/voice say that
  // instead of just "turn right".
  const currentStep = useMemo<ManeuverStep | null>(() => {
    if (!baseStep) return null
    if (baseStep.type === 'arrive' || baseStep.type === 'roundabout' || baseStep.type === 'uturn') return baseStep
    if (!currentRoadName || !nextRoadName) return baseStep

    const wasHighway = HIGHWAY_PATTERN.test(currentRoadName)
    const isHighway = HIGHWAY_PATTERN.test(nextRoadName)

    let type: ManeuverType | null = null
    if (!wasHighway && isHighway) type = 'highway-enter'
    else if (wasHighway && !isHighway) type = 'highway-exit'

    if (!type) return baseStep
    return { ...baseStep, type, instruction: MANEUVER_INSTRUCTIONS[type] }
  }, [baseStep, currentRoadName, nextRoadName])

  return {
    steps,
    currentStep,
    nextStep,
    distanceToNextManeuverMeters: currentStep ? Math.max(0, currentStep.distanceAlongRoute - distanceAlongRoute) : 0,
    currentRoadName,
    nextRoadName,
  }
}
