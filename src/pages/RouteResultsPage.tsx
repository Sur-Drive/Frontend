import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

type RouteHazard = {
  id: string
  top: string
  left: string
  color: string
  icon: 'pothole' | 'hazard' | 'sos' | 'warning' | 'tractor' | 'hill' | 'wave'
}

const ROUTE_HAZARDS: RouteHazard[] = [
  { id: 'h1', top: '19.5%', left: '8.3%', color: 'bg-red-500', icon: 'sos' },
  { id: 'h2', top: '30.8%', left: '26.5%', color: 'bg-amber-500', icon: 'pothole' },
  { id: 'h3', top: '29.6%', left: '63.6%', color: 'bg-red-500', icon: 'hazard' },
  { id: 'h4', top: '21.7%', left: '81.7%', color: 'bg-amber-500', icon: 'hill' },
  { id: 'h5', top: '44.5%', left: '60.6%', color: 'bg-red-500', icon: 'warning' },
  { id: 'h6', top: '46.2%', left: '87.3%', color: 'bg-amber-500', icon: 'tractor' },
  { id: 'h7', top: '62%', left: '32.8%', color: 'bg-amber-500', icon: 'pothole' },
  { id: 'h8', top: '70.7%', left: '13.5%', color: 'bg-red-500', icon: 'sos' },
  { id: 'h9', top: '83.6%', left: '47.3%', color: 'bg-red-500', icon: 'warning' },
]

export default function RouteResultsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const destination = (location.state as { destination?: string })?.destination ?? 'your destination'

  const [showUpcoming, setShowUpcoming] = useState(false)
  const [sosArmed, setSosArmed] = useState(false)
  const [sosActive, setSosActive] = useState(false)

  // After a few seconds on the road, surface the next hazard ahead —
  // mirrors the "Road works ahead" callout in the walkthrough.
  useEffect(() => {
    const t = setTimeout(() => setShowUpcoming(true), 3500)
    return () => clearTimeout(t)
  }, [])

  const handleEndTrip = () => navigate('/home')

  // Press-and-hold SOS, matching the "Hold 3 secs" affordance.
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

  return (
    <div className="relative h-[100dvh] w-full max-w-[430px] mx-auto bg-[#e4e4e4] overflow-hidden">
      {/* Map */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 1000" preserveAspectRatio="none">
        <rect x="0" y="0" width="500" height="1000" fill="#e4e4e4" />
        {[70, 150, 230, 310, 390, 460].map((x) => (
          <rect key={`v${x}`} x={x - 6} y="0" width="12" height="1000" fill="#fafafa" />
        ))}
        {[130, 260, 390, 520, 650, 780, 910].map((y) => (
          <rect key={`h${y}`} x="0" y={y - 6} width="500" height="12" fill="#fafafa" />
        ))}
        <g stroke="#fafafa" strokeWidth="16" fill="none" strokeLinecap="round">
          <path d="M10,110 L460,300" />
          <path d="M340,260 L475,620" />
          <path d="M10,960 L400,1075" />
        </g>
        <rect x="378" y="330" width="38" height="90" rx="10" fill="#bfe3c8" />
        <rect x="330" y="590" width="95" height="26" rx="8" fill="#bfe3c8" />
        <rect x="55" y="655" width="20" height="90" rx="8" fill="#bfe3c8" />
        <rect x="35" y="1050" width="70" height="60" rx="10" fill="#bfe3c8" />
        <path d="M-20,970 C120,930 260,1005 500,945 L500,1000 L-20,1000 Z" fill="#8bd3f0" />

        {/* Turn-by-turn route */}
        <path
          d="M60,398 L164,398 L164,561 L251,561 L251,682 L326,682"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Hazard pins along the route */}
      {ROUTE_HAZARDS.map((h) => (
        <div
          key={h.id}
          style={{ top: h.top, left: h.left }}
          className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-full shadow-md z-[5] ${h.color}`}
        >
          <HazardIcon type={h.icon} />
        </div>
      ))}

      {/* Live position marker */}
      <div className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ top: '65%', left: '65.2%' }}>
        <div className="absolute inset-0 -m-3 rounded-full bg-blue-400/40 animate-ping" />
        <div className="relative flex items-center justify-center w-10 h-10 bg-blue-500 border-2 border-white rounded-full shadow-lg">
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
            <path d="M4 4l16 8-16 8 4-8z" />
          </svg>
        </div>
      </div>

      {/* Top instruction banner */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-3 px-5 py-4 mx-4 mt-4 shadow-lg bg-emerald-500 rounded-2xl">
        <div className="flex items-center justify-center flex-shrink-0 w-9 h-9 bg-white/25 rounded-xl">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-white/80">IN 3.6 KM</p>
          <p className="text-[17px] font-bold leading-tight text-white">Head out and follow the route</p>
        </div>
      </div>

      {/* Upcoming hazard + trip card */}
      <div className="absolute left-0 right-0 z-20 mx-4 top-28">
        {showUpcoming && (
          <div className="flex items-center gap-3 px-5 py-3 mb-3 bg-white shadow-lg rounded-2xl">
            <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-full bg-amber-100">
              <span className="text-base leading-none">🚜</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold tracking-wide text-gray-400">UPCOMING</p>
              <p className="text-[14px] font-semibold text-gray-900 truncate">Road works ahead — {destination}</p>
            </div>
            <span className="text-[13px] font-semibold text-gray-500 flex-shrink-0">0.9 km</span>
          </div>
        )}

        <div className="px-5 py-4 bg-white shadow-lg rounded-2xl">
          <div className="grid grid-cols-3 text-center">
            <Stat label="ETA" value="17 min" />
            <Stat label="Remaining" value="7.1 km" />
            <Stat label="Hazards" value="2" accent />
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

      {sosActive && (
        <SosActiveOverlay onClose={() => setSosActive(false)} />
      )}
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

function HazardIcon({ type }: { type: RouteHazard['icon'] }) {
  switch (type) {
    case 'sos':
      return (
        <div className="bg-white rounded-[3px] px-1 py-0.5 flex items-center justify-center">
          <span className="text-red-600 font-extrabold text-[8px] leading-none">SOS</span>
        </div>
      )
    case 'pothole':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <ellipse cx="12" cy="12" rx="8" ry="4.5" fill="#1a1a1a" />
        </svg>
      )
    case 'hazard':
      return <div className="w-5 h-4 rounded-[2px]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #f6c400 0 4px, #1a1a1a 4px 8px)' }} />
    case 'hill':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#3a2e1f">
          <path d="M2 18 L9 8 L13 13 L16 9 L22 18 Z" />
        </svg>
      )
    case 'warning':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
          <path d="M12 3 L22 20 L2 20 Z" fill="white" />
          <rect x="11" y="10" width="2" height="5" fill="#e02424" />
          <rect x="11" y="16" width="2" height="2" fill="#e02424" />
        </svg>
      )
    case 'tractor':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#2b2b2b">
          <rect x="8" y="8" width="7" height="5" rx="1" />
          <rect x="4" y="12" width="5" height="4" rx="1" />
          <circle cx="7" cy="18" r="3" fill="none" stroke="#2b2b2b" strokeWidth="2" />
          <circle cx="17" cy="18" r="4" fill="none" stroke="#2b2b2b" strokeWidth="2" />
        </svg>
      )
    default:
      return null
  }
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