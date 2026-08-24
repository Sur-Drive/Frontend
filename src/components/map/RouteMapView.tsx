

import { useEffect, useMemo, useState } from 'react'
import GoogleMapView, { type MapMarkerSpec } from './GoogleMapView'
import AnimatedRoutePolyline from './AnimatedRoutePolyline'
import { getRoutePath } from '../../api/route'
import { cumulativeDistances, pointAtFraction, projectPointOntoPath, subPathAroundFraction, totalLength, type LatLng } from '../../lib/geoPath'
import type { RouteOption } from '../../types/routePlan'

// Defensively pulls {lat, lng} out of a hazard object of unknown shape —
// same logic as extractHazardLatLng() in PlanRoutePage.tsx, duplicated
// here so this component doesn't need to import from the page.
function extractHazardLatLng(h: unknown): { lat: number; lng: number } | null {
  const obj = h as any
  if (!obj) return null

  const tryPair = (latRaw: unknown, lngRaw: unknown) => {
    const lat = typeof latRaw === 'string' ? parseFloat(latRaw) : latRaw
    const lng = typeof lngRaw === 'string' ? parseFloat(lngRaw) : lngRaw
    if (typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng)) {
      return { lat, lng }
    }
    return null
  }

  return (
    tryPair(obj.latitude, obj.longitude) ??
    tryPair(obj.lat, obj.lng) ??
    tryPair(obj.location?.latitude, obj.location?.longitude) ??
    tryPair(obj.location?.lat, obj.location?.lng) ??
    null
  )
}

// Severity → overlay color for the highlighted stretch of route near a
// hazard. Not live per-meter traffic data — Google's own app colors its
// route line from a private, real-time congestion feed that isn't
// exposed through the public Maps API, so there's no way to reproduce
// that exactly. What this app *does* have is real driver-submitted
// hazard reports (including TRAFFIC-type ones), so this draws attention
// to the parts of *your own* route nearest a reported hazard, using the
// same color language Google's app uses (green=fine/default route
// color, amber=moderate, red=heavy) so it reads the same way at a
// glance even though the underlying data source is different.
function hazardHighlightColor(severity: unknown): string {
  const s = typeof severity === 'string' ? severity.toUpperCase() : ''
  if (s === 'HIGH') return '#ea4335' // matches TRAFFIC_LEGEND "Heavy traffic" in MapControls.tsx
  if (s === 'LOW') return '#fbbc04' // matches TRAFFIC_LEGEND "Moderate traffic"
  return '#fbbc04'
}

// Point-in-time hazards (pothole, accident, checkpoint, etc.) get a
// short highlight right at the reported spot. TRAFFIC-type reports
// describe a *stretch* of slow road rather than a single point, so they
// get a much longer highlight window — this is what actually produces
// the "thick colored band along the route" look, similar in spirit to
// how Google's app colors a whole congested stretch rather than one
// pixel.
const HAZARD_HIGHLIGHT_WINDOW_METERS = 35
const TRAFFIC_HIGHLIGHT_WINDOW_METERS = 220

export interface SecondaryRoute {
  /** ready-to-render {lat,lng} vertices for one alternative route */
  path: LatLng[]
  /** called when the user taps this alternative's line on the map */
  onClick?: () => void
}

export interface RouteMapViewProps {
  route: RouteOption
  markers?: MapMarkerSpec[]
  className?: string
  zoom?: number
  
  progress?: number
  /** continuous marching-arrow "flow" animation along the route line */
  flowing?: boolean
  loadingFallback?: React.ReactNode
  /** compass bearing to rotate the map to (heading-up nav view). See GoogleMapView. */
  heading?: number
  /** disable user pan/zoom while the camera is being driven programmatically */
  interactive?: boolean
  /**
   * Live turn-by-turn mode: camera snaps (no easing) to `center` every
   * update and GoogleMapView renders its own fixed, screen-centered
   * "you are here" puck instead of AnimatedRoutePolyline's projected
   * marker (which would otherwise double up / drift once the map itself
   * starts rotating under it).
   */
  followMode?: boolean
  /**
   * Other route options (e.g. 1-2 alternatives) drawn as thin muted
   * lines alongside the highlighted `route`. Tap one to select it —
   * typically wired to swap which route is passed in as `route`.
   * Omit or leave empty (e.g. during live navigation) to hide these.
   */
  secondaryRoutes?: SecondaryRoute[]
  /** Standard/Satellite/Terrain — forwarded to GoogleMapView. */
  mapTypeId?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid'
  /** Simulated 3D/tilted view — forwarded to GoogleMapView. */
  tilt?: number
  /** Live traffic (green/orange/red/dark-red congestion) — forwarded to GoogleMapView. */
  showTraffic?: boolean
  /** Light or dark map styling — forwarded to GoogleMapView. */
  theme?: 'light' | 'dark'
  /** Exposes the underlying google.maps.Map once it's created, so a parent can drive zoom/recenter/etc. directly. */
  onReady?: (map: google.maps.Map) => void
}

/**
 * Thin composition layer: GoogleMapView stays a generic map primitive
 * (center/zoom/markers only, no route concept), AnimatedRoutePolyline
 * stays a generic "draw this path with this progress" primitive, and this
 * component is the only place that knows about RouteOption. Swapping in a
 * different route source, or reusing AnimatedRoutePolyline on a totally
 * different map (e.g. a live-share view), doesn't require touching either
 * of those two.
 */
const NO_MARKERS: MapMarkerSpec[] = []
const NO_SECONDARY_ROUTES: SecondaryRoute[] = []

export default function RouteMapView({
  route,
  markers = NO_MARKERS,
  className,
  zoom = 15,
  progress,
  flowing = true,
  loadingFallback,
  heading = 0,
  interactive = true,
  followMode = false,
  secondaryRoutes = NO_SECONDARY_ROUTES,
  mapTypeId = 'roadmap',
  tilt = 0,
  showTraffic = false,
  theme = 'light',
  onReady,
}: RouteMapViewProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null)

  const handleReady = (m: google.maps.Map) => {
    setMap(m)
    onReady?.(m)
  }

  const path = useMemo(() => getRoutePath(route), [route])

  const cum = useMemo(() => cumulativeDistances(path), [path])

  // In follow mode the camera should track the animated position along
  // the route (what a live trip is doing right now), not stay parked on
  // the route's midpoint — that midpoint framing is only right for the
  // static "here's the whole route" preview.
  const previewCenter = useMemo(() => path[Math.floor(path.length / 2)] ?? path[0] ?? { lat: 0, lng: 0 }, [path])

  // The on-screen car puck (see GoogleMapView) sits in the lower third of
  // the screen rather than dead-center, so more of the road ahead is
  // visible — the same "look-ahead" framing Google/Waze use. To make that
  // actually line up (rather than just visually nudging the icon while
  // the real GPS point stays at true screen-center), the map is centered
  // slightly *ahead* of the driver along the route: once heading-up
  // rotation puts "ahead" at the top of the screen, centering on a point
  // further down the route pushes the driver's real position down and
  // behind that center — down into the lower third where the puck is
  // drawn. This is an approximation (the offset distance isn't derived
  // from the live meters-per-pixel at the current zoom), tuned to roughly
  // match the puck's screen position at the zoom level used while
  // navigating.
  // Tuned for zoom 17 (tight city-street framing); each zoom level out
  // roughly doubles meters-per-pixel, so this scales the same way to
  // keep the puck sitting in the same on-screen spot (lower third) as
  // `zoom` pulls back for speed-adaptive look-ahead — see PlanRoutePage's
  // navZoom. Without this, zooming out for highway speed would leave the
  // puck drifting toward screen-center instead of staying anchored low
  // with more road visible above it.
  const BASE_LOOK_AHEAD_METERS = 45
  const BASE_LOOK_AHEAD_ZOOM = 17
  const lookAheadMeters = BASE_LOOK_AHEAD_METERS * Math.pow(2, BASE_LOOK_AHEAD_ZOOM - zoom)
  const total = useMemo(() => totalLength(cum), [cum])
  const liveSample = useMemo(() => {
    if (!followMode || progress == null) return null
    const lookAheadFraction = total > 0 ? lookAheadMeters / total : 0
    return pointAtFraction(path, cum, progress + lookAheadFraction)
  }, [followMode, progress, path, cum, total, lookAheadMeters])
  const center = liveSample?.position ?? previewCenter

  // Draw each alternative as a thin muted line beneath the highlighted
  // route (AnimatedRoutePolyline renders above these). Tapping one calls
  // its onClick — parents typically use that to swap which route is
  // passed in as the primary `route` prop.
  useEffect(() => {
    if (!map || !secondaryRoutes.length) return

    const polylines = secondaryRoutes.map(({ path: altPath, onClick }) => {
      const polyline = new google.maps.Polyline({
        path: altPath,
        strokeColor: '#9CA3AF',
        strokeOpacity: 0.9,
        strokeWeight: 5,
        zIndex: 5,
        map,
      })
      if (onClick) {
        polyline.addListener('click', onClick)
      }
      return polyline
    })

    return () => {
      polylines.forEach((p) => p.setMap(null))
    }
  }, [map, secondaryRoutes])

  // Hazard highlight strips — a short, thicker, severity-colored overlay
  // laid on top of the route line right where one of the route's own
  // reported hazards sits. This is deliberately NOT live traffic-congestion
  // coloring (this app has no per-segment traffic data source); it's just
  // making the parts of the route your own hazard reports already flagged
  // visually stand out, the same way a driver would want a red patch to
  // mean "something's actually known to be wrong here."
  const hazardHighlights = useMemo(() => {
    if (path.length < 2) return []
    const hazards = (route?.hazards ?? []) as unknown[]
    if (!hazards.length) return []

    return hazards
      .map((h) => {
        const latLng = extractHazardLatLng(h)
        if (!latLng) return null
        const isTraffic = String((h as any)?.type ?? '').toUpperCase() === 'TRAFFIC'
        const projection = projectPointOntoPath(path, cum, latLng)
        const segment = subPathAroundFraction(
          path,
          cum,
          projection.fraction,
          isTraffic ? TRAFFIC_HIGHLIGHT_WINDOW_METERS : HAZARD_HIGHLIGHT_WINDOW_METERS,
        )
        if (segment.length < 2) return null
        return { segment, color: hazardHighlightColor((h as any)?.severity), isTraffic }
      })
      .filter((entry): entry is { segment: LatLng[]; color: string; isTraffic: boolean } => entry != null)
  }, [path, cum, route?.hazards])

  useEffect(() => {
    if (!map || !hazardHighlights.length) return

    // A light casing polyline underneath each colored highlight, same
    // trick AnimatedRoutePolyline uses, so the traffic-colored stretch
    // reads as a rounded, soft-edged band sitting on top of the route
    // rather than a flat stripe.
    const polylines = hazardHighlights.flatMap(({ segment, color, isTraffic }) => {
      const weight = isTraffic ? 11 : 9
      const casing = new google.maps.Polyline({
        path: segment,
        strokeColor: '#ffffff',
        strokeOpacity: 1,
        strokeWeight: weight + 4,
        zIndex: 19,
        map,
      })
      const line = new google.maps.Polyline({
        path: segment,
        strokeColor: color,
        strokeOpacity: 1,
        strokeWeight: weight,
        zIndex: 20,
        map,
      })
      return [casing, line]
    })

    return () => {
      polylines.forEach((p) => p.setMap(null))
    }
  }, [map, hazardHighlights])

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <GoogleMapView
        center={center}
        zoom={zoom}
        markers={markers}
        onReady={handleReady}
        className="absolute inset-0"
        loadingFallback={loadingFallback}
        heading={heading}
        interactive={interactive}
        followMode={followMode}
        mapTypeId={mapTypeId}
        tilt={tilt}
        showTraffic={showTraffic}
        theme={theme}
      />

      <AnimatedRoutePolyline
        map={map}
        path={path}
        progress={progress}
        flowing={flowing}
        showPositionMarker={!followMode}
      />
    </div>
  )
}
