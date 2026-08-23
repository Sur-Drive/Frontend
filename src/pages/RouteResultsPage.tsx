import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import RouteMapView from '../components/map/RouteMapView'
import StreetViewModal, { StreetViewPegman } from '../components/map/StreetView'
import TurnByTurnCard from '../components/map/TurnByTurnCard'
import VoiceGuidanceControl from '../components/map/VoiceGuidanceControl'
import { getRoutePath, pickDefaultMode } from '../api/route'
import type { RouteModeKey, RoutePlanResponse } from '../types/routePlan'
import { ROUTE_MODE_ORDER } from '../types/routePlan'
import { sampleRoutePlan } from '../fixtures/sampleRoutePlan'
import { useRouteAnimation } from '../hooks/useRouteAnimation'
import { useTurnByTurn } from '../hooks/useTurnByTurn'
import { useVoiceGuidance } from '../hooks/useVoiceGuidance'
import { describeManeuver } from '../components/map/TurnByTurnCard'
import { formatManeuverDistance, maneuverWarnDistance, maneuverWarningLeadIn } from '../lib/maneuvers'

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

// Hazards come back from the backend as `unknown[]` (see RouteOption) —
// this is a defensive, best-effort read of whatever shape actually shows
// up, so the banner reflects the real upcoming hazard instead of a
// hardcoded string.
interface HazardLike {
  type?: string
  description?: string
  title?: string
  location?: { address?: string }
}

const HAZARD_ICON: Record<string, string> = {
  POTHOLE: '🕳️',
  FLOOD: '🌊',
  ACCIDENT: '⚠️',
  DEBRIS: '🪨',
  ROAD_WORKS: '🚜',
  ROAD_CLOSURE: '⛔',
  CHECKPOINT: '🚧',
  DANGER: '⚠️',
  SOS: '🆘',
}

const HAZARD_LABEL: Record<string, string> = {
  POTHOLE: 'Pothole ahead',
  FLOOD: 'Flood risk ahead',
  ACCIDENT: 'Accident reported ahead',
  DEBRIS: 'Debris in the road ahead',
  ROAD_WORKS: 'Road works ahead',
  ROAD_CLOSURE: 'Road closed ahead',
  CHECKPOINT: 'Checkpoint ahead',
  DANGER: 'Hazard ahead',
  SOS: 'Emergency reported ahead',
}

function describeUpcomingHazard(hazards: unknown[] | undefined): { icon: string; title: string; subtitle?: string } | null {
  const first = hazards?.[0] as HazardLike | undefined
  if (!first) return null

  const type = typeof first.type === 'string' ? first.type.toUpperCase() : undefined
  const icon = (type && HAZARD_ICON[type]) || '⚠️'
  const title = (type && HAZARD_LABEL[type]) || first.title || 'Hazard ahead'
  const subtitle = first.description || first.location?.address

  return { icon, title, subtitle }
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
  const destinationPoint = path[path.length - 1]

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

  // ── Turn-by-turn maneuvers + voice guidance ──────────────────────
  const voiceGuidance = useVoiceGuidance()
  const turnByTurn = useTurnByTurn(path, progress, true)

  const upcomingHazard = useMemo(() => describeUpcomingHazard(activeRoute?.hazards), [activeRoute])

  // The hazard alert behaves like Google Maps' incident toast: it slides
  // in, sits for a few seconds (or until dismissed), then slides back out
  // — it never permanently occupies space over the route.
  const [hazardToastVisible, setHazardToastVisible] = useState(false)
  const [tripSheetExpanded, setTripSheetExpanded] = useState(false)
  const [sosArmed, setSosArmed] = useState(false)
  const [sosActive, setSosActive] = useState(false)
  const [streetViewOpen, setStreetViewOpen] = useState(false)

  useEffect(() => {
    if (!upcomingHazard) return
    const showTimer = setTimeout(() => setHazardToastVisible(true), 2000)
    const hideTimer = setTimeout(() => setHazardToastVisible(false), 9000)
    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [upcomingHazard])

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

  // ── Turn-by-turn maneuver call-outs ──────────────────
  // This page loops its demo trip animation, so "arrival" isn't a real
  // end state here — just announce each maneuver once per lap. Sharp
  // turns/roundabouts/highway exits get an earlier, more pointed
  // call-out than ordinary turns — see maneuverWarnDistance/
  // maneuverWarningLeadIn.
  const MANEUVER_NOW_METERS = 30
  const announcedWarnRef = useRef<string | null>(null)
  const announcedNowRef = useRef<string | null>(null)
  const prevProgressRef = useRef(0)

  useEffect(() => {
    // A big backward jump in progress means the loop restarted — reset
    // what's been announced so the next lap calls out maneuvers again.
    if (progress < prevProgressRef.current - 0.5) {
      announcedWarnRef.current = null
      announcedNowRef.current = null
    }
    prevProgressRef.current = progress

    const step = turnByTurn.currentStep
    if (!step || step.type === 'arrive') return
    const distance = turnByTurn.distanceToNextManeuverMeters
    const instruction = describeManeuver(step, turnByTurn.nextRoadName)
    const warnDistance = maneuverWarnDistance(step.type)
    const leadIn = maneuverWarningLeadIn(step.type)

    if (distance <= warnDistance && announcedWarnRef.current !== step.id) {
      announcedWarnRef.current = step.id
      const body = `In ${formatManeuverDistance(distance)}, ${instruction.charAt(0).toLowerCase()}${instruction.slice(1)}.`
      voiceGuidance.speak(leadIn ? `${leadIn}. ${body}` : body)
    }
    if (distance <= MANEUVER_NOW_METERS && announcedNowRef.current !== step.id) {
      announcedNowRef.current = step.id
      voiceGuidance.speak(`${instruction} now.`, { interrupt: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, turnByTurn.currentStep?.id, turnByTurn.distanceToNextManeuverMeters])

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#e4e4e4]">
      {/* Live map — always full-bleed behind every panel below, on any
          screen size, so nothing here can ever crop or block the route. */}
      <div className="absolute inset-0">
        {activeRoute ? (
          <RouteMapView route={activeRoute} zoom={15} progress={progress} className="w-full h-full" />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-sm text-gray-400">
            No route available
          </div>
        )}
      </div>

      {/* Top instruction banner + mode switcher — constrained to a
          phone-card width on mobile, centered as a floating panel on
          larger screens, same pattern used across the rest of the app. */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-4 mx-auto max-w-[430px] lg:max-w-md space-y-2">
        <div className="flex items-center gap-3 px-5 py-4 shadow-lg bg-emerald-500 rounded-2xl">
          <div className="flex items-center justify-center flex-shrink-0 w-9 h-9 bg-white/25 rounded-xl">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold tracking-wide text-white/80">
              {activeRoute ? `${remainingKm.toFixed(1)} KM LEFT` : ''}
            </p>
            <p className="text-[17px] font-bold leading-tight text-white">Head out and follow the route</p>
          </div>
          {voiceGuidance.isSupported && (
            <VoiceGuidanceControl
              muted={voiceGuidance.muted}
              toggleMuted={voiceGuidance.toggleMuted}
              volume={voiceGuidance.volume}
              setVolume={voiceGuidance.setVolume}
              languages={voiceGuidance.languages}
              language={voiceGuidance.language}
              setLanguage={voiceGuidance.setLanguage}
              gender={voiceGuidance.gender}
              setGenderPreference={voiceGuidance.setGenderPreference}
              hasAfricanVoice={voiceGuidance.hasAfricanVoice}
            />
          )}
        </div>

        {turnByTurn.currentStep && (
          <TurnByTurnCard
            step={turnByTurn.currentStep}
            distanceMeters={turnByTurn.distanceToNextManeuverMeters}
            currentRoadName={turnByTurn.currentRoadName}
            nextRoadName={turnByTurn.nextRoadName}
          />
        )}

        {availableModes.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
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
      </div>

      {/* Upcoming hazard toast — floats over the map, auto-dismisses, and
          is swipe/tap dismissible. It never reserves permanent layout
          space, so it can't block the route line underneath it. */}
      <div className="absolute left-0 right-0 z-30 px-4 mx-auto max-w-[430px] lg:max-w-md top-32 pointer-events-none">
        <AnimatePresence>
          {upcomingHazard && hazardToastVisible && (
            <motion.div
              initial={{ y: -24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -24, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0.2, bottom: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.y < -20) setHazardToastVisible(false)
              }}
              className="flex items-center gap-3 px-5 py-3 bg-white shadow-lg pointer-events-auto rounded-2xl"
            >
              <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-full bg-amber-100">
                <span className="text-base leading-none">{upcomingHazard.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold tracking-wide text-gray-400">UPCOMING</p>
                <p className="text-[14px] font-semibold text-gray-900 truncate">
                  {upcomingHazard.title}
                  {upcomingHazard.subtitle ? ` — ${upcomingHazard.subtitle}` : ''}
                </p>
              </div>
              <button
                onClick={() => setHazardToastVisible(false)}
                aria-label="Dismiss"
                className="flex items-center justify-center flex-shrink-0 text-gray-400 rounded-full w-7 h-7 active:bg-gray-100"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Street View pegman — opens Google's own panorama at the
          destination. Placed clear of the SOS button and the trip sheet. */}
      {destinationPoint && (
        <StreetViewPegman
          onClick={() => setStreetViewOpen(true)}
          className="absolute z-30 bottom-[calc(env(safe-area-inset-bottom)+7rem)] left-4 lg:left-6"
        />
      )}

      {/* Bottom trip sheet — collapsible like Google Maps' own bottom
          sheet, so it can be minimized to a slim strip instead of
          permanently covering a chunk of the map. */}
      <div className="absolute left-0 right-0 z-20 px-4 mx-auto max-w-[430px] lg:max-w-md bottom-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="overflow-hidden bg-white shadow-lg rounded-2xl">
          <button
            onClick={() => setTripSheetExpanded((v) => !v)}
            className="flex items-center justify-between w-full px-5 py-3"
          >
            <div className="flex items-center gap-4">
              <MiniStat label="ETA" value={`${etaMin} min`} />
              <MiniStat label="Left" value={`${remainingKm.toFixed(1)} km`} />
              <MiniStat label="Hazards" value={String(hazardCount)} accent />
            </div>
            <svg
              viewBox="0 0 24 24"
              className={`w-5 h-5 text-gray-400 transition-transform ${tripSheetExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <AnimatePresence initial={false}>
            {tripSheetExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="px-5 pb-5">
                  <button
                    onClick={handleEndTrip}
                    className="w-full h-12 font-semibold text-white bg-red-500 rounded-full active:scale-[0.98] transition"
                  >
                    End Trip
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* SOS button */}
      <button
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        className={`absolute z-30 flex flex-col items-center justify-center w-20 h-20 text-white transition rounded-full shadow-lg bottom-[calc(env(safe-area-inset-bottom)+2rem)] right-4 lg:right-6 bg-red-500/90 ring-4 ring-red-300/50 active:scale-95 ${
          sosArmed ? 'scale-105' : ''
        }`}
      >
        <span className="text-sm font-bold">SOS</span>
        <span className="text-[10px] leading-tight">Hold 3 secs</span>
      </button>

      {destinationPoint && (
        <StreetViewModal
          isOpen={streetViewOpen}
          onClose={() => setStreetViewOpen(false)}
          lat={destinationPoint.lat}
          lng={destinationPoint.lng}
          label={destination}
        />
      )}

      {sosActive && <SosActiveOverlay onClose={() => setSosActive(false)} />}
    </div>
  )
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-gray-400">{label}</p>
      <p className={`text-sm font-extrabold ${accent ? 'text-amber-500' : 'text-gray-900'}`}>{value}</p>
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
