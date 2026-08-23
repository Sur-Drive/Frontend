import { useEffect, useRef } from 'react'
import { useGoogleMaps } from '../../lib/googleMaps'
import {
  createHtmlMapOverlay,
  type HtmlMapOverlayInstance,
} from '../../lib/htmlMapOverlay'
import { MAP_STYLE_BY_THEME, type MapThemeId } from '../../lib/mapThemes'

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
  onMapClick?: (lat: number, lng: number) => void
  onReady?: (map: google.maps.Map) => void
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

  /**
   * Standard/Satellite/Terrain — passed straight through to
   * map.setMapTypeId. Defaults to 'roadmap' (the standard view).
   */
  mapTypeId?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid'

  /**
   * Simulated 3D/tilted navigation view. The Maps JS API's real building
   * tilt only kicks in for vector maps with a Map ID (which this app
   * doesn't configure), so instead we fake the "tilted, looking ahead"
   * nav-app look with a CSS perspective/rotateX applied to the same
   * wrapper that already handles heading rotation below — 0 = flat
   * top-down (default), ~45 = tilted. Purely cosmetic, never affects
   * real lat/lng math.
   */
  tilt?: number

  /**
   * Live traffic layer (Google's own congestion tiles — green/orange/
   * red/dark-red road coloring, updated by Google in the background).
   * Toggled on/off by mounting or unmounting a google.maps.TrafficLayer;
   * no polling or extra requests on our side, Google's tiles refresh
   * themselves. Defaults to false.
   */
  showTraffic?: boolean

  /**
   * Light (default, standard Google Maps look) or dark (dimmed "night
   * navigation") tile styling — applied via map.setOptions({ styles })
   * so switching themes restyles the existing map in place rather than
   * re-creating it. Defaults to 'light'.
   */
  theme?: MapThemeId
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
  mapTypeId = 'roadmap',
  tilt = 0,
  showTraffic = false,
  theme = 'light',
}: GoogleMapViewProps) {
  const { isLoaded, error } = useGoogleMaps()

  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const overlaysRef = useRef<Map<string, HtmlMapOverlayInstance>>(new Map())
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
      mapTypeId,
      styles: MAP_STYLE_BY_THEME[theme],
      disableDefaultUI: true,
      zoomControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false,
      rotateControl: false,
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
      onMapClickRef.current?.(e.latLng.lat(), e.latLng.lng())
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
      hasCenteredRef.current = true
      return
    }

    // followMode (live trip tracking): a parent is already supplying
    // smoothly-interpolated positions every animation frame, so snap the
    // center directly — layering panTo's own easing on top makes it lag
    // and stutter instead of tracking smoothly. Otherwise (a one-off
    // center change like "user tapped Use My Location" or picked a
    // search result) panTo eases the camera over instead of jump-cutting.
    if (followMode) {
      map.setCenter(center)
    } else {
      map.panTo(center)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng, followMode])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!hasCenteredRef.current) return

    if (map.getZoom() !== zoom) {
      map.setZoom(zoom)
    }
  }, [zoom])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.setMapTypeId(mapTypeId)
  }, [mapTypeId])

  // Dark/light styling — restyles the existing tiles in place, no
  // re-creation, so this is as cheap and instant as a CSS theme swap.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.setOptions({ styles: MAP_STYLE_BY_THEME[theme] })
  }, [theme])

  // Live traffic layer — a plain google.maps.TrafficLayer bound/unbound
  // to the map. Google owns the tile refresh cadence entirely, so this
  // is just an on/off mount, not a data fetch we manage ourselves.
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null)

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    if (showTraffic) {
      if (!trafficLayerRef.current) {
        trafficLayerRef.current = new google.maps.TrafficLayer()
      }
      trafficLayerRef.current.setMap(map)
    } else {
      trafficLayerRef.current?.setMap(null)
    }
  }, [showTraffic, isLoaded])

  useEffect(() => {
    return () => {
      trafficLayerRef.current?.setMap(null)
      trafficLayerRef.current = null
    }
  }, [])

  // Best-effort: ask the native API for real 45° tilt too, in case this
  // location/zoom has imagery that supports it. Harmless no-op otherwise
  // — the CSS tilt below is what actually guarantees the visual on every
  // map/location.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    try {
      map.setTilt(tilt)
    } catch {
      // setTilt can throw on some map configurations — ignore, CSS covers it
    }
  }, [tilt])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const existing = overlaysRef.current
    const nextIds = new Set(markers.map((m) => m.id))

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
          { lat: marker.lat, lng: marker.lng },
          marker.html,
          marker.anchor ?? [18, 18],
          marker.onClick
        )
        next.setMap(map)
        existing.set(marker.id, next)
        return
      }

      // Updating in place (instead of remove+recreate) is what makes a
      // marker's position/heading changes (e.g. the live GPS puck every
      // animation frame) read as a smooth glide rather than a flicker.
      overlay.updatePosition({ lat: marker.lat, lng: marker.lng })
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
        overflow: 'hidden',
        perspective: tilt ? '900px' : undefined,
        // Matches the tile background behind the loading/error state to
        // the active theme, so there's no light-gray flash under a dark
        // theme while the script/tiles are still loading.
        background: theme === 'dark' ? '#242f3e' : '#f3f4f6',
      }}
    >
      {/*
        Tilt wrapper: rotateX fakes the "looking ahead" nav-app tilt on
        top of a plain raster map (real building tilt needs a vector
        Map ID, which we don't configure). transform-origin at the
        bottom keeps the near edge anchored so tilting reads as leaning
        the horizon back, not sliding the whole view. The scale-up
        compensates for the extra empty space rotateX exposes at the
        top so the tilted view still fills the container.
      */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformStyle: 'preserve-3d',
          transform: tilt ? `rotateX(${tilt}deg) scale(1.35)` : undefined,
          transformOrigin: 'center bottom',
          transition: 'transform 0.3s ease',
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
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        </div>
      </div>

      {/* Fixed "you are here" heading-up puck: since the map itself
          rotates/re-centers beneath it, this stays fixed on screen,
          always pointing straight up. Positioned in the lower third
          (not screen-center) so more of the road ahead is visible —
          RouteMapView compensates by centering the map slightly ahead
          of the driver's real position, the same "look-ahead" trick
          Google/Waze use, so this still lines up with the real GPS
          point once the map settles. Only shown while actively
          following a heading so it doesn't appear on the plain
          browsing map. */}
      {followMode && (
        <div
          className="absolute z-10 pointer-events-none"
          style={{ left: '50%', top: '68%', transform: 'translate(-50%, -50%)' }}
        >
          {/* Ground shadow, offset slightly below the car so it reads as
              sitting on the road rather than floating flat on the tiles. */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '84%',
              width: 24,
              height: 10,
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.3)',
              filter: 'blur(2px)',
            }}
          />
          {/* Heading-up mode: the map rotates under this puck, so it
              stays fixed pointing straight up — a top-down car
              silhouette (body, windshield, mirrors, lights), same
              shape as navCarPuckHtml() used elsewhere for consistency. */}
          <svg
            width={32}
            height={32}
            viewBox="0 0 30 30"
            style={{
              position: 'relative',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
            }}
          >
            <rect x="8" y="4" width="14" height="23" rx="5" fill="#f3f4f6" stroke="#1f2937" strokeWidth="1.4" />
            <path d="M10.5 10.5 Q15 7.5 19.5 10.5 L18.3 14 L11.7 14 Z" fill="#4285F4" opacity="0.85" />
            <rect x="11.5" y="20" width="7" height="4" rx="1.2" fill="#4285F4" opacity="0.55" />
            <rect x="5.5" y="11" width="2.4" height="2" rx="0.8" fill="#1f2937" />
            <rect x="22.1" y="11" width="2.4" height="2" rx="0.8" fill="#1f2937" />
            <circle cx="11" cy="6" r="1" fill="#fde68a" />
            <circle cx="19" cy="6" r="1" fill="#fde68a" />
            <circle cx="11" cy="25.5" r="1" fill="#ef4444" />
            <circle cx="19" cy="25.5" r="1" fill="#ef4444" />
          </svg>
        </div>
      )}

      {!isLoaded && (
        <div
          className="absolute inset-0 flex items-center justify-center px-8"
          style={{ background: theme === 'dark' ? '#242f3e' : '#f3f4f6' }}
        >
          {loadingFallback ??
            (error ? (
              <div className="flex flex-col items-center max-w-xs gap-3 text-center">
                <div
                  className={`flex items-center justify-center w-11 h-11 rounded-full ${
                    theme === 'dark' ? 'bg-red-500/10' : 'bg-red-50'
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 9v4M12 17h.01M10.29 3.86l-8.18 14.18A2 2 0 0 0 3.82 21h16.36a2 2 0 0 0 1.71-2.96L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  </svg>
                </div>
                <p
                  className={`text-xs leading-5 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  Map unavailable. {error}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-10 h-10 border-4 rounded-full animate-spin"
                  style={{
                    borderColor:
                      theme === 'dark'
                        ? 'rgba(212,175,55,0.25)'
                        : 'rgba(74,20,140,0.15)',
                    borderTopColor: theme === 'dark' ? '#d4af37' : '#4a148c',
                  }}
                />
                <p
                  className={`text-xs font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  Loading map…
                </p>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
