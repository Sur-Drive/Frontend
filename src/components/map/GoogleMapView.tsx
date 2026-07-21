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
}

export default function GoogleMapView({
  center,
  zoom,
  markers = [],
  onMapClick,
  onReady,
  className,
  loadingFallback,
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
      gestureHandling: 'greedy',
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

  useEffect(() => {
    const map = mapRef.current

    if (!map) return

    if (!hasCenteredRef.current) {
      map.setCenter(center)
      map.setZoom(zoom)

      hasCenteredRef.current = true

      return
    }

    map.panTo(center)

    if (map.getZoom() !== zoom) {
      map.setZoom(zoom)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng, zoom])

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
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
        }}
      />

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