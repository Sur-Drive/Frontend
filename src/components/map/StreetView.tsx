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

      {/* Top chrome — gradient + back button + label, styled like Google's own Street View
          header. z-30: this must stay ABOVE the loading/error/unavailable states below (z-20),
          otherwise the close button is invisible and unclickable for the entire time the panorama
          is loading — which is most of the time this modal is open. */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center gap-3 px-4 pt-[calc(env(safe-area-inset-top,0px)+14px)] pb-10 pointer-events-none bg-gradient-to-b from-black/55 to-transparent">
        <button
          onClick={onClose}
          aria-label="Exit Street View"
          className="flex items-center gap-1.5 flex-shrink-0 text-gray-800 bg-white rounded-full shadow-lg pointer-events-auto h-10 pl-2.5 pr-3.5"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="text-sm font-semibold">Close</span>
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
          <PegmanGlyph size={56} color="#9ca3af" />
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
 * Street View entry point on the map. Styled as a solid brand-color
 * button with a plain panorama glyph — deliberately not the cartoon
 * "pegman" figure Google Maps uses, for a more grown-up look — but the
 * same tap-to-open interaction: opens Street View centered on the map's
 * current position.
 */
export function StreetViewPegman({ onClick, className = '' }: StreetViewPegmanProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Open Street View"
      title="Street View"
      className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg bg-[#6E43A3] active:scale-95 transition ${className}`}
    >
      <PegmanGlyph size={24} />
    </button>
  )
}

function PegmanGlyph({ size = 24, color = 'white' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2.5" y="4.5" width="19" height="15" rx="3" stroke={color} strokeWidth="1.7" />
      <circle cx="8.7" cy="9.6" r="1.5" fill={color} />
      <path
        d="M4.3 16.8 9 11.6l3.3 2.8 3-3.9 4.4 5.4"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
