import { useMemo, useState } from 'react'
import GoogleMapView, { type MapMarkerSpec } from './GoogleMapView'
import AnimatedRoutePolyline from './AnimatedRoutePolyline'
import { getRoutePath } from '../../api/route'
import { cumulativeDistances, pointAtFraction } from '../../lib/geoPath'
import type { RouteOption } from '../../types/routePlan'

export interface RouteMapViewProps {
  route: RouteOption
  markers?: MapMarkerSpec[]
  className?: string
  zoom?: number
  /**
   * 0-1 progress along the route. Pass this from a parent (e.g. driven by
   * useRouteAnimation, or by real GPS progress later) to get the
   * traveled/remaining split + moving marker. Omit for a static preview
   * that still shows the flowing directional animation.
   */
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
}: RouteMapViewProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null)

  const path = useMemo(() => getRoutePath(route), [route])

  const cum = useMemo(() => cumulativeDistances(path), [path])

  // In follow mode the camera should track the animated position along
  // the route (what a live trip is doing right now), not stay parked on
  // the route's midpoint — that midpoint framing is only right for the
  // static "here's the whole route" preview.
  const previewCenter = useMemo(() => path[Math.floor(path.length / 2)] ?? path[0] ?? { lat: 0, lng: 0 }, [path])
  const liveSample = useMemo(
    () => (followMode && progress != null ? pointAtFraction(path, cum, progress) : null),
    [followMode, progress, path, cum]
  )
  const center = liveSample?.position ?? previewCenter

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <GoogleMapView
        center={center}
        zoom={zoom}
        markers={markers}
        onReady={setMap}
        className="absolute inset-0"
        loadingFallback={loadingFallback}
        heading={followMode ? heading : 0}
        interactive={interactive}
        followMode={followMode}
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
