import { useEffect, useRef } from 'react'
import { cumulativeDistances, splitPathAtFraction, type LatLng } from '../../lib/geoPath'
import { createHtmlMapOverlay, type HtmlMapOverlayInstance } from '../../lib/htmlMapOverlay'
import { navHeadingArrowHtml, NAV_ARROW_ANCHOR } from './mapMarkerIcons'

// Google's classic "moving arrows" flow effect: a transparent polyline
// whose repeating arrow icon has its `offset` nudged forward every frame,
// which reads as the line itself flowing in the direction of travel.
const FLOW_ICON = {
  icon: {
    path: 'M 0,-1 0,1',
    strokeOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 3,
    scale: 3,
  },
  repeat: '18px',
}

export interface AnimatedRoutePolylineProps {
  map: google.maps.Map | null
  /** ready-to-render {lat,lng} vertices — see getRoutePath() in api/route.ts */
  path: LatLng[]
  /**
   * 0-1 progress along the route. When provided, the line is split into a
   * muted "traveled" segment and a bright "remaining" segment, and the
   * position marker moves/rotates to match. Omit for a static full-route
   * preview (still gets the flowing-arrow animation unless `flowing` is
   * false).
   */
  progress?: number
  traveledColor?: string
  remainingColor?: string
  strokeWeight?: number
  /** continuous marching-arrow animation along the full route */
  flowing?: boolean
  /** fraction of the route the arrows travel per second */
  flowSpeed?: number
  showPositionMarker?: boolean
  markerColor?: string
  zIndex?: number
}

export default function AnimatedRoutePolyline({
  map,
  path,
  progress,
  traveledColor = '#94a3b8',
  remainingColor = '#3b82f6',
  strokeWeight = 6,
  flowing = true,
  flowSpeed = 0.05,
  showPositionMarker = true,
  markerColor = '#0ea5e9',
  zIndex = 10,
}: AnimatedRoutePolylineProps) {
  const traveledLineRef = useRef<google.maps.Polyline | null>(null)
  const remainingLineRef = useRef<google.maps.Polyline | null>(null)
  const flowLineRef = useRef<google.maps.Polyline | null>(null)
  const markerRef = useRef<HtmlMapOverlayInstance | null>(null)
  const cumRef = useRef<number[]>([])

  const hasPath = path.length >= 2

  // Create/destroy the polyline objects whenever the map or route identity
  // changes. Path styling (color/weight) is applied here too, so callers
  // can re-theme without needing a fresh path array.
  useEffect(() => {
    if (!map || !hasPath) return

    cumRef.current = cumulativeDistances(path)

    const remaining = new google.maps.Polyline({
      path,
      strokeColor: remainingColor,
      strokeOpacity: 0.95,
      strokeWeight,
      zIndex,
      map,
    })

    const traveled = new google.maps.Polyline({
      path: [],
      strokeColor: traveledColor,
      strokeOpacity: 0.9,
      strokeWeight,
      zIndex: zIndex + 1,
      map,
    })

    remainingLineRef.current = remaining
    traveledLineRef.current = traveled

    let flow: google.maps.Polyline | null = null

    if (flowing) {
      flow = new google.maps.Polyline({
        path,
        strokeOpacity: 0,
        zIndex: zIndex + 2,
        map,
        icons: [{ ...FLOW_ICON, offset: '0%' }],
      })
      flowLineRef.current = flow
    }

    return () => {
      remaining.setMap(null)
      traveled.setMap(null)
      flow?.setMap(null)
      remainingLineRef.current = null
      traveledLineRef.current = null
      flowLineRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, path, flowing, remainingColor, traveledColor, strokeWeight, zIndex])

  // Position marker lifecycle, independent of the polylines above so
  // toggling `showPositionMarker` doesn't tear down the route lines.
  useEffect(() => {
    if (!map || !showPositionMarker || !hasPath) return

    const overlay = createHtmlMapOverlay(path[0], navHeadingArrowHtml(0, markerColor), NAV_ARROW_ANCHOR)
    overlay.setMap(map)
    markerRef.current = overlay

    return () => {
      overlay.setMap(null)
      markerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, showPositionMarker, path])

  // Apply the current progress: split the base line and move the marker.
  useEffect(() => {
    if (progress == null || !hasPath) return

    const { traveled, remaining, sample } = splitPathAtFraction(path, cumRef.current, progress)

    traveledLineRef.current?.setPath(traveled)
    remainingLineRef.current?.setPath(remaining)

    markerRef.current?.updatePosition(sample.position)
    markerRef.current?.updateHtml(navHeadingArrowHtml(sample.heading, markerColor))
  }, [progress, path, markerColor, hasPath])

  // Continuous "flowing" animation, decoupled from `progress` — runs
  // independently via its own rAF loop for as long as this component is
  // mounted and `flowing` is true.
  useEffect(() => {
    if (!flowing || !hasPath) return

    let raf: number | null = null
    let offsetPercent = 0
    let last: number | null = null

    const tick = (now: number) => {
      if (last == null) last = now
      const dtSeconds = (now - last) / 1000
      last = now

      offsetPercent = (offsetPercent + flowSpeed * dtSeconds * 100) % 100

      flowLineRef.current?.set('icons', [{ ...FLOW_ICON, offset: `${offsetPercent}%` }])

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    return () => {
      if (raf != null) cancelAnimationFrame(raf)
    }
  }, [flowing, flowSpeed, path, hasPath])

  return null
}
