import { useEffect, useRef, useState } from 'react'
import { useGoogleMaps } from '../../lib/googleMaps'

interface StreetViewModalProps {
  isOpen: boolean
  onClose: () => void
  lat: number
  lng: number
  /** Shown in the header, e.g. the destination name or a reverse-geocoded address */
  label?: string
}

type PanoState = 'checking' | 'available' | 'unavailable'

/**
 * Full-screen Street View — built directly on google.maps.StreetViewPanorama,
 * so the imagery, navigation chevrons, drag-to-look-around and zoom all
 * behave exactly like Google Maps itself (it IS Google's own renderer).
 * We only skin the chrome around it: header, close button, loading and
 * "not available" states.
 */
export default function StreetViewModal({ isOpen, onClose, lat, lng, label }: StreetViewModalProps) {
  const { isLoaded, error: loadError } = useGoogleMaps()
  const containerRef = useRef<HTMLDivElement>(null)
  const panoramaRef = useRef<google.maps.StreetViewPanorama | null>(null)
  const [panoState, setPanoState] = useState<PanoState>('checking')

  // Look for the nearest panorama within ~75m of the requested point every
  // time the modal opens at a new location.
  useEffect(() => {
    if (!isOpen || !isLoaded) return
    let cancelled = false
    setPanoState('checking')

    const svc = new google.maps.StreetViewService()
    svc.getPanorama(
      { location: { lat, lng }, radius: 75, source: google.maps.StreetViewSource.OUTDOOR },
      (data, status) => {
        if (cancelled) return
        if (status === google.maps.StreetViewStatus.OK && data?.location?.latLng) {
          setPanoState('available')
        } else {
          setPanoState('unavailable')
        }
      }
    )

    return () => {
      cancelled = true
    }
  }, [isOpen, isLoaded, lat, lng])

  // Mount the panorama once we know imagery exists nearby.
  useEffect(() => {
    if (!isOpen || panoState !== 'available' || !containerRef.current) return

    const panorama = new google.maps.StreetViewPanorama(containerRef.current, {
      position: { lat, lng },
      pov: { heading: 0, pitch: 0 },
      zoom: 1,
      addressControl: true,
      addressControlOptions: { position: google.maps.ControlPosition.TOP_LEFT },
      linksControl: true,
      panControl: true,
      zoomControl: true,
      fullscreenControl: false,
      motionTracking: false,
      motionTrackingControl: false,
      enableCloseButton: false,
      showRoadLabels: true,
      clickToGo: true,
    })

    panoramaRef.current = panorama

    return () => {
      panoramaRef.current = null
    }
  }, [isOpen, panoState, lat, lng])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[1000] bg-black">
      {/* Panorama fills the screen */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Top chrome — gradient + back button + label, styled like Google's own Street View header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-4 pt-[calc(env(safe-area-inset-top,0px)+14px)] pb-10 pointer-events-none bg-gradient-to-b from-black/55 to-transparent">
        <button
          onClick={onClose}
          aria-label="Exit Street View"
          className="flex items-center justify-center flex-shrink-0 text-gray-800 bg-white rounded-full shadow-lg pointer-events-auto w-10 h-10"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="min-w-0 pointer-events-none">
          <p className="text-[11px] font-semibold tracking-wide text-white/70">STREET VIEW</p>
          <p className="text-sm font-semibold text-white truncate">{label ?? 'Current location'}</p>
        </div>
      </div>

      {/* Loading state */}
      {(!isLoaded || panoState === 'checking') && !loadError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black">
          <div className="w-10 h-10 border-4 border-white rounded-full border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-white/80">Loading Street View…</p>
        </div>
      )}

      {/* Failed to load Maps script at all */}
      {loadError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 px-8 text-center bg-black">
          <p className="text-sm font-medium text-white/80">Couldn&apos;t load Street View.</p>
          <p className="text-xs text-white/50">{loadError}</p>
        </div>
      )}

      {/* No imagery near this point — mirrors Google's own "no imagery" empty state */}
      {isLoaded && !loadError && panoState === 'unavailable' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 px-8 text-center bg-[#1a1a1a]">
          <PegmanGlyph size={56} muted />
          <div>
            <p className="text-base font-semibold text-white">Street View isn&apos;t available here</p>
            <p className="mt-1 text-sm text-white/50">Try a spot closer to a mapped road.</p>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 mt-2 text-sm font-semibold text-gray-900 bg-white rounded-full active:scale-[0.98] transition"
          >
            Back to map
          </button>
        </div>
      )}
    </div>
  )
}

interface StreetViewPegmanProps {
  onClick: () => void
  className?: string
}

/**
 * The little draggable-orange-man toggle from Google Maps. Here it's a tap
 * target (not drag-and-drop onto the map) that opens Street View centered
 * on the map's current position — same entry point, simpler interaction.
 */
export function StreetViewPegman({ onClick, className = '' }: StreetViewPegmanProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Open Street View"
      title="Street View"
      className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg bg-white active:scale-95 transition ${className}`}
    >
      <PegmanGlyph size={26} />
    </button>
  )
}

function PegmanGlyph({ size = 24, muted = false }: { size?: number; muted?: boolean }) {
  const body = muted ? '#9ca3af' : '#f6ac00'
  const shoe = muted ? '#6b7280' : '#3a3a3a'
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="4.6" r="2.3" fill={body} />
      <path
        d="M8.2 8.2c.5-.9 1.4-1.4 2.4-1.4h2.8c1 0 1.9.5 2.4 1.4l1.6 2.9c.3.6-.1 1.3-.8 1.3-.4 0-.8-.2-1-.6l-1-1.7v3.6l2 6.1c.2.6-.2 1.2-.9 1.2-.4 0-.8-.3-.9-.7l-1.6-4.9h-.8l-1.6 4.9c-.1.4-.5.7-.9.7-.7 0-1.1-.6-.9-1.2l2-6.1V9.5l-1 1.7c-.2.4-.6.6-1 .6-.7 0-1.1-.7-.8-1.3l1.6-2.9z"
        fill={body}
      />
      <ellipse cx="9.3" cy="21.2" rx="1.5" ry="0.6" fill={shoe} />
      <ellipse cx="14.7" cy="21.2" rx="1.5" ry="0.6" fill={shoe} />
    </svg>
  )
}
