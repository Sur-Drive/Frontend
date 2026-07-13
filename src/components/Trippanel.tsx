


import { motion } from 'framer-motion'

export interface RouteHazard {
  id: string
  icon: 'pothole' | 'checkpoint' | 'roadworks' | 'warning'
  title: string
  subtitle: string
  distance: string
}

export interface RouteInfo {
  from: string
  to: string
  distanceKm: number
  etaMin: number
  safety: number
  hazards: RouteHazard[]
}

interface PreviewPanelProps {
  phase: 'preview'
  route: RouteInfo
  onEditFrom?: () => void
  onStartTrip: () => void
  onClose: () => void
}

interface NavigatingPanelProps {
  phase: 'navigating'
  route: RouteInfo
  remainingKm: number
  etaMin: number
  hazardsAhead: number
  upcomingHazard?: { emoji: string; label: string; distanceKm: number } | null
  onEndTrip: () => void
}

type TripPanelProps = PreviewPanelProps | NavigatingPanelProps

export default function TripPanel(props: TripPanelProps) {
  if (props.phase === 'preview') return <PreviewPanel {...props} />
  return <NavigatingPanel {...props} />
}

function PreviewPanel({ route, onEditFrom, onStartTrip, onClose }: PreviewPanelProps) {
  return (
    <>
      {/* From / To card, pinned near the top */}
      <motion.div
        className="absolute left-0 right-0 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[430px] z-30 px-4"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 68px)' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <div className="relative px-4 py-4 bg-white shadow-lg rounded-2xl">
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center pt-1">
              <div className="flex items-center justify-center rounded-full w-7 h-7 bg-emerald-100">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold tracking-wide text-gray-400">FROM</div>
              <div className="text-[17px] font-semibold text-gray-900 truncate">{route.from}</div>
            </div>
            <button onClick={onEditFrom} className="pt-1 text-gray-400">
              <DotsIcon />
            </button>
          </div>

          <div className="flex items-start gap-3 mt-3">
            <div className="flex items-center justify-center flex-shrink-0 rounded-full w-7 h-7 bg-emerald-100">
              <FlagIcon />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold tracking-wide text-gray-400">TO</div>
              <div className="text-[17px] font-semibold text-gray-900 truncate">{route.to}</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute flex items-center justify-center w-8 h-8 text-gray-600 bg-white rounded-full shadow -top-3 -right-3"
          >
            <CloseIcon />
          </button>
        </div>
      </motion.div>

      {/* Bottom sheet with stats + hazards, pinned to the bottom of the screen */}
      <motion.div
        className="absolute bottom-16 left-0 right-0 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[430px] z-30 bg-white rounded-t-2xl shadow-2xl max-h-[65%] flex flex-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
      >
        <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="grid grid-cols-3 gap-3 px-4 pt-3">
            <Stat label="Distance" value={`${route.distanceKm} km`} />
            <Stat label="ETA" value={`${route.etaMin} min`} />
            <Stat label="Safety" value={`${route.safety}`} valueClass="text-emerald-500" />
          </div>

          {route.hazards.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-3 mx-4 mt-4 text-sm font-semibold text-amber-800 rounded-xl bg-amber-100/80">
              <ShieldIcon />
              {route.hazards.length} hazard{route.hazards.length > 1 ? 's' : ''} reported on this route. Drive carefully.
            </div>
          )}

          <div className="px-4 pt-3 pb-4 space-y-2">
            {route.hazards.map((h) => (
              <div key={h.id} className="flex items-center gap-3 px-3 py-3 bg-gray-50 rounded-xl">
                <HazardGlyph icon={h.icon} />
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-bold text-gray-900 truncate">{h.title}</div>
                  <div className="text-[13px] text-gray-500 truncate">{h.subtitle}</div>
                </div>
                <span className="flex-shrink-0 px-3 py-1 text-sm font-semibold text-gray-700 bg-gray-200 rounded-full">
                  {h.distance}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-shrink-0 px-4 pt-3 pb-6">
          <button
            onClick={onStartTrip}
            className="flex items-center justify-center w-full gap-2 font-bold text-white bg-purple-700 h-14 rounded-full active:scale-[0.98] transition"
          >
            Start trip
            <ArrowIcon />
          </button>
        </div>
      </motion.div>
    </>
  )
}

function NavigatingPanel({ remainingKm, etaMin, hazardsAhead, upcomingHazard, onEndTrip }: NavigatingPanelProps) {
  return (
    <div
      className="absolute left-0 right-0 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[430px] z-30 px-4 space-y-3"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-4 py-4 shadow-lg rounded-2xl bg-emerald-500"
      >
        <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-xl bg-white/25">
          <ArrowUpIcon />
        </div>
        <div>
          <div className="text-xs font-bold tracking-wide text-white/80">IN 3.6 KM</div>
          <div className="text-lg font-extrabold leading-tight text-white">Head out and follow the route</div>
        </div>
      </motion.div>

      {upcomingHazard && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 bg-white shadow-lg rounded-2xl"
        >
          <div className="flex items-center justify-center flex-shrink-0 rounded-full w-9 h-9 bg-amber-100">
            <ArrowUpIcon color="#b45309" small />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold tracking-wide text-gray-400">
              UPCOMING · {upcomingHazard.distanceKm} KM
            </div>
            <div className="text-[15px] font-bold text-gray-900 truncate">
              {upcomingHazard.emoji} {upcomingHazard.label}
            </div>
          </div>
        </motion.div>
      )}

      <div className="p-4 bg-white shadow-lg rounded-2xl">
        <div className="grid grid-cols-3 gap-3">
          <Stat label="ETA" value={`${etaMin} min`} />
          <Stat label="Remaining" value={`${remainingKm} km`} />
          <Stat label="Hazards" value={`${hazardsAhead}`} valueClass="text-amber-500" />
        </div>
        <button
          onClick={onEndTrip}
          className="w-full h-14 mt-4 font-bold text-white bg-red-500 rounded-full active:scale-[0.98] transition"
        >
          End Trip
        </button>
      </div>
    </div>
  )
}

function Stat({ label, value, valueClass = 'text-gray-900' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-2 border border-gray-100 rounded-xl">
      <div className={`text-xl font-extrabold ${valueClass}`}>{value}</div>
      <div className="text-[13px] text-gray-500">{label}</div>
    </div>
  )
}

function HazardGlyph({ icon }: { icon: RouteHazard['icon'] }) {
  if (icon === 'pothole') {
    return (
      <div className="flex items-center justify-center flex-shrink-0 bg-gray-900 rounded-full w-9 h-9">
        <svg viewBox="0 0 24 24" className="w-4 h-4">
          <ellipse cx="12" cy="12" rx="8" ry="4.5" fill="#fff" />
        </svg>
      </div>
    )
  }
  if (icon === 'checkpoint') {
    return (
      <div className="flex items-center justify-center flex-shrink-0 bg-blue-600 rounded-lg w-9 h-9">
        <span className="text-[9px] font-extrabold text-white">✓</span>
      </div>
    )
  }
  if (icon === 'roadworks') {
    return (
      <div
        className="flex-shrink-0 rounded-lg w-9 h-9"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, #f6c400 0 4px, #1a1a1a 4px 8px)' }}
      />
    )
  }
  return (
    <div className="flex items-center justify-center flex-shrink-0 bg-red-500 rounded-full w-9 h-9">
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="white">
        <path d="M12 3 L22 20 L2 20 Z" />
      </svg>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  )
}

function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="#e02424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3v18" />
      <path d="M5 4h11l-2.5 4L16 12H5" fill="#e02424" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="flex-shrink-0 w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

function ArrowUpIcon({ color = '#fff', small = false }: { color?: string; small?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={small ? 'w-4 h-4' : 'w-5 h-5'} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  )
}