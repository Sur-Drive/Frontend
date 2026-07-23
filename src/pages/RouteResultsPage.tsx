import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import RouteMapView from '../components/map/RouteMapView'
import { getRoutePath, pickDefaultMode } from '../api/route'
import type { RouteModeKey, RoutePlanResponse } from '../types/routePlan'
import { ROUTE_MODE_ORDER } from '../types/routePlan'
import { sampleRoutePlan } from '../fixtures/sampleRoutePlan'
import { useRouteAnimation } from '../hooks/useRouteAnimation'

const MODE_LABEL: Record<RouteModeKey, string> = {
  driving: 'Drive',
  motorcycle: 'Ride',
  cycling: 'Cycle',
  walking: 'Walk',
}

const MODE_ICON: Record<RouteModeKey, string> = {
  driving: '🚗',
  motorcycle: '🏍️',
  cycling: '🚴',
  walking: '🚶',
}

interface RouteResultsNavState {
  destination?: string
  routePlan?: RoutePlanResponse
  mode?: RouteModeKey
}

export default function RouteResultsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const navState = (location.state as RouteResultsNavState | null) ?? null

  const destination = navState?.destination ?? 'your destination'
  const routePlan = navState?.routePlan ?? sampleRoutePlan

  const availableModes = useMemo(
    () => ROUTE_MODE_ORDER.filter((m) => routePlan.routes[m]),
    [routePlan]
  )

  const [selectedMode, setSelectedMode] = useState<RouteModeKey | undefined>(
    navState?.mode ?? pickDefaultMode(routePlan)
  )

  const activeRoute = selectedMode ? routePlan.routes[selectedMode] : undefined
  const path = useMemo(() => getRoutePath(activeRoute), [activeRoute])

  // Full loop of the route in ~20s for a visible demo of the moving line;
  // a real trip would drive `progress` from GPS instead of this simulation.
  const simulationDurationMs = useMemo(
    () => Math.max(8000, Math.min(40000, (activeRoute?.durationInSeconds ?? 60) * 40)),
    [activeRoute]
  )

  const { progress } = useRouteAnimation({
    path,
    durationMs: simulationDurationMs,
    autoPlay: true,
    loop: true,
  })

  const [showUpcoming, setShowUpcoming] = useState(false)
  const [sosArmed, setSosArmed] = useState(false)
  const [sosActive, setSosActive] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowUpcoming(true), 3500)
    return () => clearTimeout(t)
  }, [])

  const handleEndTrip = () => navigate('/home')

  let holdTimer: ReturnType<typeof setTimeout>
  const startHold = () => {
    setSosArmed(true)
    holdTimer = setTimeout(() => {
      setSosActive(true)
      setSosArmed(false)
    }, 3000)
  }
  const cancelHold = () => {
    clearTimeout(holdTimer)
    setSosArmed(false)
  }

  const remainingKm = activeRoute ? Math.max(0, activeRoute.distance * (1 - progress)) : 0
  const etaMin = activeRoute ? Math.max(0, Math.round(activeRoute.duration * (1 - progress))) : 0
  const hazardCount = activeRoute?.hazards?.length ?? 0

  return (
    <div className="relative h-[100dvh] w-full max-w-[430px] mx-auto bg-[#e4e4e4] overflow-hidden">
      {/* Live map with the animated route */}
      <div className="absolute inset-0">
        {activeRoute ? (
          <RouteMapView route={activeRoute} zoom={15} progress={progress} className="w-full h-full" />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-sm text-gray-400">
            No route available
          </div>
        )}
      </div>

      {/* Mode switcher — same route plan, any of the modes the backend priced out */}
      {availableModes.length > 1 && (
        <div className="absolute z-20 flex gap-2 px-4 mx-4 mt-24 overflow-x-auto left-0 right-0">
          {availableModes.map((mode) => (
            <button
              key={mode}
              onClick={() => setSelectedMode(mode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md whitespace-nowrap transition ${
                mode === selectedMode ? 'bg-emerald-500 text-white' : 'bg-white text-gray-700'
              }`}
            >
              <span>{MODE_ICON[mode]}</span>
              {MODE_LABEL[mode]}
            </button>
          ))}
        </div>
      )}

      {/* Top instruction banner */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-3 px-5 py-4 mx-4 mt-4 shadow-lg bg-emerald-500 rounded-2xl">
        <div className="flex items-center justify-center flex-shrink-0 w-9 h-9 bg-white/25 rounded-xl">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-white/80">
            {activeRoute ? `${remainingKm.toFixed(1)} KM LEFT` : ''}
          </p>
          <p className="text-[17px] font-bold leading-tight text-white">Head out and follow the route</p>
        </div>
      </div>

      {/* Upcoming hazard + trip card */}
      <div className="absolute left-0 right-0 z-20 mx-4 top-28">
        {showUpcoming && hazardCount > 0 && (
          <div className="flex items-center gap-3 px-5 py-3 mb-3 bg-white shadow-lg rounded-2xl">
            <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-full bg-amber-100">
              <span className="text-base leading-none">🚜</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold tracking-wide text-gray-400">UPCOMING</p>
              <p className="text-[14px] font-semibold text-gray-900 truncate">Road works ahead — {destination}</p>
            </div>
          </div>
        )}

        <div className="px-5 py-4 bg-white shadow-lg rounded-2xl">
          <div className="grid grid-cols-3 text-center">
            <Stat label="ETA" value={`${etaMin} min`} />
            <Stat label="Remaining" value={`${remainingKm.toFixed(1)} km`} />
            <Stat label="Hazards" value={String(hazardCount)} accent />
          </div>
          <button
            onClick={handleEndTrip}
            className="w-full h-12 mt-4 font-semibold text-white bg-red-500 rounded-full active:scale-[0.98] transition"
          >
            End Trip
          </button>
        </div>
      </div>

      {/* SOS button */}
      <button
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        className={`absolute z-30 flex flex-col items-center justify-center w-20 h-20 text-white transition rounded-full shadow-lg bottom-8 right-4 bg-red-500/90 ring-4 ring-red-300/50 active:scale-95 ${
          sosArmed ? 'scale-105' : ''
        }`}
      >
        <span className="text-sm font-bold">SOS</span>
        <span className="text-[10px] leading-tight">Hold 3 secs</span>
      </button>

      {sosActive && <SosActiveOverlay onClose={() => setSosActive(false)} />}
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className={`text-lg font-extrabold ${accent ? 'text-amber-500' : 'text-gray-900'}`}>{value}</p>
    </div>
  )
}

function SosActiveOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-red-500">
      <div className="flex items-start justify-between px-6 pt-8">
        <h1 className="text-3xl font-extrabold text-white">SOS Active</h1>
        <button
          onClick={onClose}
          className="flex items-center justify-center flex-shrink-0 text-white rounded-full w-9 h-9 bg-white/20"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      <p className="px-6 pt-2 text-[15px] text-white/90">
        SOS broadcast, nearby drivers and contacts notified
      </p>

      <div className="flex items-center justify-center flex-1">
        <div className="relative flex items-center justify-center w-40 h-40 rounded-full bg-white/25">
          <div className="flex items-center justify-center bg-white rounded-full w-28 h-28">
            <svg viewBox="0 0 24 24" className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 20v-6a7 7 0 0 1 14 0v6" />
              <path d="M3 20h18" />
              <path d="M12 4v1.5M7 6l1 1M17 6l-1 1" />
            </svg>
          </div>
        </div>
      </div>

      <div className="px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] space-y-3">
        <button className="w-full font-bold text-red-600 bg-white rounded-full h-14">Cancel SOS</button>
        <button className="flex items-center justify-center w-full gap-2 font-bold text-white rounded-full h-14 bg-white/25">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.9 21 3 13.1 3 3.9c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1z" />
          </svg>
          Call 112
        </button>
      </div>
    </div>
  )
}
