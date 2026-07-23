import { useEffect, useRef } from 'react'
import { useGoogleMaps } from '../../lib/googleMaps'
import {
  createHtmlMapOverlay,
  type HtmlMapOverlayInstance,
} from '../../lib/htmlMapOverlay'

export interface MapMarkerSpec {
  id: string
  lat: number
  lng: number
  html: string
  anchor?: [number, number]
  onClick?: () => void
}

interface GoogleMapViewProps {
  center: {
    lat: number
    lng: number
  }

  zoom: number

  markers?: MapMarkerSpec[]

  onMapClick?: (
    lat: number,
    lng: number
  ) => void

  onReady?: (
    map: google.maps.Map
  ) => void

  className?: string

  loadingFallback?: React.ReactNode

  /**
   * Compass bearing (0-360, 0 = north) to rotate the map to, e.g. from
   * useRouteAnimation's `heading` while a trip is in progress. The
   * standard Maps JS API only rotates 45°-imagery/vector tiles via
   * map.setHeading, which most API keys/map IDs don't have enabled — so
   * instead we rotate the whole map DOM with CSS (see the oversized
   * wrapper below) to get a reliable "heading-up" navigation view
   * regardless of map ID/tile type. Defaults to 0 (north-up).
   */
  heading?: number

  /**
   * When false, disables user pan/zoom/drag gestures on the map. Used
   * while a trip is actively navigating and the camera is being driven
   * programmatically every frame — letting the user drag against that at
   * the same time is how you get map/gesture fights. Defaults to true.
   */
  interactive?: boolean

  /**
   * When true, `center` updates apply immediately via map.setCenter
   * instead of the eased map.panTo. Use this while a parent is already
   * supplying smoothly-interpolated positions every animation frame (e.g.
   * useRouteAnimation) — panTo's own easing on top of that fights it and
   * looks stuttery. Defaults to false (eased panTo), which is right for
   * one-off center changes like "user tapped Use My Location".
   */
  followMode?: boolean
}

export default function GoogleMapView({
  center,
  zoom,
  markers = [],
  onMapClick,
  onReady,
  className,
  loadingFallback,
  heading = 0,
  interactive = true,
  followMode = false,
}: GoogleMapViewProps) {
  const { isLoaded, error } = useGoogleMaps()

  const containerRef = useRef<HTMLDivElement>(null)

  const mapRef = useRef<google.maps.Map | null>(null)

  const overlaysRef = useRef<
    Map<string, HtmlMapOverlayInstance>
  >(new Map())

  const hasCenteredRef = useRef(false)

  const onMapClickRef = useRef(onMapClick)

  onMapClickRef.current = onMapClick

  useEffect(() => {
    if (!isLoaded) return

    if (!containerRef.current) return

    if (mapRef.current) return

    const map = new google.maps.Map(containerRef.current, {
      center,
      zoom,
      disableDefaultUI: true,
      zoomControl: false,
      clickableIcons: false,
      gestureHandling: interactive ? 'greedy' : 'none',
      draggable: interactive,
      disableDoubleClickZoom: !interactive,
      keyboardShortcuts: interactive,
      scrollwheel: interactive,
    })

    mapRef.current = map

    hasCenteredRef.current = true

    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return

      onMapClickRef.current?.(
        e.latLng.lat(),
        e.latLng.lng()
      )
    })

    onReady?.(map)

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded])

  // Keep gesture/drag/zoom options in sync if `interactive` changes after
  // the map's already been created (e.g. trip starts and we want to stop
  // fighting the programmatic camera with user drags).
  useEffect(() => {
    const map = mapRef.current

    if (!map) return

    map.setOptions({
      gestureHandling: interactive ? 'greedy' : 'none',
      draggable: interactive,
      disableDoubleClickZoom: !interactive,
      keyboardShortcuts: interactive,
      scrollwheel: interactive,
    })
  }, [interactive])

  useEffect(() => {
    const map = mapRef.current

    if (!map) return

    if (!hasCenteredRef.current) {
      map.setCenter(center)
      map.setZoom(zoom)

      hasCenteredRef.current = true

      return
    }

    // followMode (live trip tracking): a parent is already supplying
    // smoothly-interpolated positions every animation frame, so snap the
    // center directly — layering panTo's own easing on top makes it lag
    // and stutter instead of tracking smoothly.
    if (followMode) {
      map.setCenter(center)
    } else {
      map.panTo(center)
    }

    if (map.getZoom() !== zoom) {
      map.setZoom(zoom)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng, zoom, followMode])

  useEffect(() => {
    const map = mapRef.current

    if (!map) return

    const existing = overlaysRef.current

    const nextIds = new Set(
      markers.map((m) => m.id)
    )

    existing.forEach((overlay, id) => {
      if (!nextIds.has(id)) {
        overlay.setMap(null)
        existing.delete(id)
      }
    })

    markers.forEach((marker) => {
      const overlay = existing.get(marker.id)

      if (!overlay) {
        const next = createHtmlMapOverlay(
          {
            lat: marker.lat,
            lng: marker.lng,
          },
          marker.html,
          marker.anchor ?? [18, 18],
          marker.onClick
        )

        next.setMap(map)

        existing.set(marker.id, next)

        return
      }

      overlay.updatePosition({
        lat: marker.lat,
        lng: marker.lng,
      })

      overlay.updateHtml(marker.html)
    })
  }, [markers])

  useEffect(() => {
    return () => {
      overlaysRef.current.forEach((overlay) => {
        overlay.setMap(null)
      })

      overlaysRef.current.clear()

      mapRef.current = null
    }
  }, [])

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      {/*
        Oversized (~142% = sqrt(2) of the viewport, so a corner is never
        exposed at any rotation) wrapper that we CSS-rotate opposite the
        current heading. It's centered over the visible area via the
        negative inset, so at heading 0 nothing changes — the visible
        region is exactly the same center/zoom as before. Everything
        google.maps draws (tiles, our marker/route overlays, which live
        inside this same DOM subtree) rotates together, so overlays stay
        correctly pinned to their geo position while the whole view spins
        to face the direction of travel, like Google/Waze turn-by-turn.
      */}
      <div
        style={{
          position: 'absolute',
          inset: '-21%',
          transform: `rotate(${-heading}deg)`,
          transition: 'transform 0.25s linear',
          willChange: 'transform',
        }}
      >
        <div
          ref={containerRef}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </div>

      {/* Fixed "you are here" heading-up puck: centered on screen and
          always pointing straight up, since the map itself rotates
          beneath it to match travel direction (exactly how Google Maps
          nav mode renders the current-location arrow). Only shown while
          actively following a heading so it doesn't appear on the plain
          browsing map. */}
      {followMode && (
        <div
          className="absolute z-10 pointer-events-none"
          style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
        >
          <div style={{ position: 'relative', width: 32, height: 32 }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: '#0ea5e9',
                opacity: 0.25,
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 3,
                borderRadius: '50%',
                background: '#0ea5e9',
                border: '2px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg viewBox="0 0 24 24" width={16} height={16} fill="white">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          {loadingFallback ??
            (error ? (
              <p className="px-8 text-xs text-center text-red-500">
                {error}
              </p>
            ) : (
              <div className="w-10 h-10 border-4 border-red-500 rounded-full animate-spin border-t-transparent" />
            ))}
        </div>
      )}
    </div>
  )
}