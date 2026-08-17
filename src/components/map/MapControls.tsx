import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

export type MapTypeId = 'roadmap' | 'satellite' | 'terrain'

interface MapControlsProps {
  /** The live google.maps.Map instance, once GoogleMapView has created it. Zoom buttons are disabled until this is set. */
  map: google.maps.Map | null
  mapTypeId: MapTypeId
  onMapTypeChange: (id: MapTypeId) => void
  /** 0 = flat, 45 = tilted "3D" nav view. */
  tilt: number
  onToggleTilt: () => void
  /** Current compass bearing shown on the map (0 = north-up). */
  heading: number
  onHeadingChange: (heading: number) => void
  /** Whether the compass can be dragged to rotate / tapped to reset. Disable while a live trip is auto-driving the heading. */
  rotatable: boolean
  onRecenter: () => void
  isLocating?: boolean
  /** Element to enter/exit full screen. */
  fullscreenTargetRef: RefObject<HTMLElement>
  /** Extra classes for the outer wrapper — used by the page to offset the stack above other floating UI. */
  className?: string
  /** Whether the live traffic (congestion) layer is currently shown on the map. */
  trafficEnabled: boolean
  onToggleTraffic: () => void
}

export default function MapControls({
  map,
  mapTypeId,
  onMapTypeChange,
  tilt,
  onToggleTilt,
  heading,
  onHeadingChange,
  rotatable,
  onRecenter,
  isLocating = false,
  fullscreenTargetRef,
  className = '',
  trafficEnabled,
  onToggleTraffic,
}: MapControlsProps) {
  return (
    <div
      className={`absolute z-[400] right-4 sm:right-8 flex flex-col items-center gap-2.5 ${className}`}
    >
      <FullscreenButton targetRef={fullscreenTargetRef} />

      <CompassButton
        heading={heading}
        onHeadingChange={onHeadingChange}
        rotatable={rotatable}
        onReset={() => onHeadingChange(0)}
      />

      <MapTypeControl
        mapTypeId={mapTypeId}
        onChange={onMapTypeChange}
        tilt={tilt}
        onToggleTilt={onToggleTilt}
        trafficEnabled={trafficEnabled}
        onToggleTraffic={onToggleTraffic}
      />

      <ZoomButtons map={map} />

      <MyLocationButton onClick={onRecenter} isLocating={isLocating} />
    </div>
  )
}

// ─── Zoom in/out ────────────────────────────────────────
function ZoomButtons({ map }: { map: google.maps.Map | null }) {
  const zoomBy = (delta: number) => {
    if (!map) return
    const current = map.getZoom() ?? 15
    map.setZoom(Math.max(3, Math.min(20, current + delta)))
  }

  return (
    <div className="flex flex-col overflow-hidden bg-white shadow-lg rounded-2xl">
      <button
        onClick={() => zoomBy(1)}
        disabled={!map}
        aria-label="Zoom in"
        title="Zoom in"
        className="flex items-center justify-center w-11 h-11 text-gray-700 active:bg-gray-100 disabled:opacity-40"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <div className="h-px mx-2 bg-gray-200" />
      <button
        onClick={() => zoomBy(-1)}
        disabled={!map}
        aria-label="Zoom out"
        title="Zoom out"
        className="flex items-center justify-center w-11 h-11 text-gray-700 active:bg-gray-100 disabled:opacity-40"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M5 12h14" />
        </svg>
      </button>
    </div>
  )
}

// ─── Map type (layers) — Standard / Satellite / Terrain + 3D toggle ──
const MAP_TYPE_OPTIONS: { id: MapTypeId; label: string }[] = [
  { id: 'roadmap', label: 'Standard' },
  { id: 'satellite', label: 'Satellite' },
  { id: 'terrain', label: 'Terrain' },
]

const TRAFFIC_LEGEND: { color: string; label: string }[] = [
  { color: '#34a853', label: 'Normal traffic' },
  { color: '#fbbc04', label: 'Moderate traffic' },
  { color: '#ea4335', label: 'Heavy traffic' },
  { color: '#a50e0e', label: 'Severe congestion' },
]

function MapTypeControl({
  mapTypeId,
  onChange,
  tilt,
  onToggleTilt,
  trafficEnabled,
  onToggleTraffic,
}: {
  mapTypeId: MapTypeId
  onChange: (id: MapTypeId) => void
  tilt: number
  onToggleTilt: () => void
  trafficEnabled: boolean
  onToggleTraffic: () => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Map layers"
        title="Map layers"
        className={`flex items-center justify-center w-11 h-11 rounded-2xl shadow-lg transition ${
          open || trafficEnabled ? 'bg-purple-700 text-white' : 'bg-white text-gray-700'
        }`}
      >
        <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2 2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop to close on outside tap */}
          <div className="fixed inset-0 z-[1]" onClick={() => setOpen(false)} />

          <div className="absolute right-full top-0 z-[2] mr-2 w-48 overflow-hidden bg-white shadow-xl rounded-xl py-1">
            {MAP_TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => {
                  onChange(opt.id)
                  setOpen(false)
                }}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs font-medium ${
                  mapTypeId === opt.id ? 'bg-purple-50 text-purple-700' : 'text-gray-700 active:bg-gray-50'
                }`}
              >
                {opt.label}
                {mapTypeId === opt.id && (
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </button>
            ))}

            <div className="h-px my-1 bg-gray-100" />

            <button
              onClick={() => {
                onToggleTilt()
              }}
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-left text-gray-700 active:bg-gray-50"
            >
              3D view
              <span
                className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition ${
                  tilt > 0 ? 'bg-purple-700' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition ${
                    tilt > 0 ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </span>
            </button>

            <div className="h-px my-1 bg-gray-100" />

            <button
              onClick={() => {
                onToggleTraffic()
              }}
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-left text-gray-700 active:bg-gray-50"
            >
              Live traffic
              <span
                className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition ${
                  trafficEnabled ? 'bg-purple-700' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition ${
                    trafficEnabled ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </span>
            </button>

            {trafficEnabled && (
              <div className="px-3 pt-1.5 pb-2 space-y-1">
                {TRAFFIC_LEGEND.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <span
                      className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[10.5px] text-gray-500">{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Compass — shows bearing, drag to rotate, tap to reset north ────
function CompassButton({
  heading,
  onHeadingChange,
  rotatable,
  onReset,
}: {
  heading: number
  onHeadingChange: (heading: number) => void
  rotatable: boolean
  onReset: () => void
}) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const draggingRef = useRef(false)
  const movedRef = useRef(false)

  const angleFromPointer = (clientX: number, clientY: number) => {
    const el = btnRef.current
    if (!el) return heading
    const rect = el.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = clientX - cx
    const dy = clientY - cy
    let deg = Math.atan2(dx, -dy) * (180 / Math.PI)
    if (deg < 0) deg += 360
    return deg
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!rotatable) return
    draggingRef.current = true
    movedRef.current = false
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!draggingRef.current) return
    movedRef.current = true
    onHeadingChange(angleFromPointer(e.clientX, e.clientY))
  }

  const handlePointerUp = () => {
    if (draggingRef.current && !movedRef.current) {
      onReset()
    }
    draggingRef.current = false
  }

  return (
    <button
      ref={btnRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        draggingRef.current = false
      }}
      aria-label="Compass — drag to rotate the map, tap to reset north"
      title="Compass"
      className="relative flex items-center justify-center bg-white rounded-full shadow-lg w-11 h-11 touch-none active:bg-gray-50"
    >
      <svg
        viewBox="0 0 24 24"
        width="22"
        height="22"
        style={{ transform: `rotate(${-heading}deg)` }}
      >
        <path d="M12 2 L15 12 L12 10.3 L9 12 Z" fill="#ef4444" />
        <path d="M12 22 L15 12 L12 13.7 L9 12 Z" fill="#9ca3af" />
      </svg>
    </button>
  )
}

// ─── My location (recenter) ──────────────────────────────
function MyLocationButton({
  onClick,
  isLocating,
}: {
  onClick: () => void
  isLocating: boolean
}) {
  return (
    <button
      onClick={onClick}
      aria-label="Center on my location"
      title="My location"
      className="flex items-center justify-center bg-white rounded-full shadow-lg w-11 h-11 text-purple-700 active:bg-gray-50"
    >
      {isLocating ? (
        <div className="w-4 h-4 border-2 border-purple-600 rounded-full border-t-transparent animate-spin" />
      ) : (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
        </svg>
      )}
    </button>
  )
}

// ─── Full screen ──────────────────────────────────────────
function FullscreenButton({ targetRef }: { targetRef: RefObject<HTMLElement> }) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggle = async () => {
    try {
      if (!document.fullscreenElement) {
        await targetRef.current?.requestFullscreen?.()
      } else {
        await document.exitFullscreen()
      }
    } catch {
      // Full screen isn't supported/permitted in this browser — no-op
    }
  }

  return (
    <button
      onClick={toggle}
      aria-label={isFullscreen ? 'Exit full screen' : 'Full screen'}
      title={isFullscreen ? 'Exit full screen' : 'Full screen'}
      className="flex items-center justify-center bg-white shadow-lg w-11 h-11 rounded-2xl text-gray-700 active:bg-gray-100"
    >
      {isFullscreen ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 3v4a2 2 0 0 1-2 2H3M21 9h-4a2 2 0 0 1-2-2V3M3 15h4a2 2 0 0 1 2 2v4M15 21v-4a2 2 0 0 1 2-2h4" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
      )}
    </button>
  )
}
