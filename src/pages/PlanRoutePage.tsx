
import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

// ─── Types ─────────────────────────────────────────────
type ReportType = 'wave' | 'hill' | 'pothole' | 'hazard' | 'sos' | 'sign' | 'warning' | 'tractor'

interface Report {
  id: string
  top: string
  left: string
  color: string
  type: ReportType
  label: string
}

interface RoutePoint {
  x: number
  y: number
}

// ─── Data ──────────────────────────────────────────────
const reports: Report[] = [
  { id: 'r1', top: '19.5%', left: '8.3%', color: 'bg-blue-500', type: 'wave', label: 'Chesapeake Avenue' },
  { id: 'r2', top: '21.7%', left: '81.7%', color: 'bg-amber-500', type: 'hill', label: 'Southwood Avenue' },
  { id: 'r3', top: '30.8%', left: '26.5%', color: 'bg-amber-500', type: 'pothole', label: 'Whittier Street' },
  { id: 'r4', top: '29.6%', left: '63.6%', color: 'bg-red-500', type: 'hazard', label: 'Southwood Avenue' },
  { id: 'r5', top: '44%', left: '9.5%', color: 'bg-red-500', type: 'sos', label: 'Dresden Street' },
  { id: 'r6', top: '49.1%', left: '42%', color: 'bg-blue-600', type: 'sign', label: 'Bretton Place' },
  { id: 'r7', top: '44.5%', left: '60.6%', color: 'bg-red-500', type: 'warning', label: 'McDowell Street' },
  { id: 'r8', top: '46.2%', left: '87.3%', color: 'bg-amber-500', type: 'tractor', label: 'Southwood Avenue' },
  { id: 'r9', top: '55.8%', left: '81.2%', color: 'bg-amber-500', type: 'hill', label: 'McDowell Street' },
  { id: 'r10', top: '62%', left: '32.8%', color: 'bg-amber-500', type: 'pothole', label: 'Dresden Street' },
  { id: 'r11', top: '64.3%', left: '63.4%', color: 'bg-red-500', type: 'hazard', label: 'McDowell Street' },
  { id: 'r12', top: '72.6%', left: '84.7%', color: 'bg-amber-500', type: 'pothole', label: 'Bretton Place' },
  { id: 'r13', top: '70.7%', left: '13.5%', color: 'bg-red-500', type: 'sos', label: 'Bretton Place' },
  { id: 'r14', top: '75.5%', left: '50.4%', color: 'bg-amber-500', type: 'tractor', label: 'Bretton Place' },
  { id: 'r15', top: '83.6%', left: '47.3%', color: 'bg-red-500', type: 'warning', label: 'Bretton Place' },
]

// Route path coordinates (SVG space 500x1000)
const routePath: RoutePoint[] = [
  { x: 70, y: 420 },
  { x: 70, y: 520 },
  { x: 70, y: 620 },
  { x: 180, y: 620 },
  { x: 180, y: 720 },
  { x: 280, y: 720 },
  { x: 280, y: 820 },
]

// ─── ReportIcon Component ──────────────────────────────
function ReportIcon({ type }: { type: ReportType }) {
  switch (type) {
    case 'wave':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
          <path d="M2 10c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
          <path d="M2 15c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
        </svg>
      )
    case 'hill':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#3a2e1f">
          <path d="M2 18 L9 8 L13 13 L16 9 L22 18 Z" />
        </svg>
      )
    case 'pothole':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <ellipse cx="12" cy="12" rx="8" ry="4.5" fill="#1a1a1a" />
        </svg>
      )
    case 'hazard':
      return (
        <div
          className="w-5 h-4 rounded-[2px]"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #f6c400 0 4px, #1a1a1a 4px 8px)' }}
        />
      )
    case 'sos':
      return (
        <div className="bg-white rounded-[3px] px-1 py-0.5 flex items-center justify-center">
          <span className="text-red-600 font-extrabold text-[8px] leading-none">SOS</span>
        </div>
      )
    case 'sign':
      return (
        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 14 L14 4" />
          <path d="M9 4 L14 4 L14 9" />
          <path d="M20 10 L10 20" />
          <path d="M15 20 L10 20 L10 15" />
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

// ─── Main Component ────────────────────────────────────
export default function PlanRoutePage() {
  const navigate = useNavigate()

  // ── State ───────────────────────────────────────────
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [showSOS, setShowSOS] = useState(false)
  const [sosHolding, setSosHolding] = useState(false)
  const [sosProgress, setSosProgress] = useState(0)
  const [showUpcomingAlert, setShowUpcomingAlert] = useState(false)

  const [startPoint, setStartPoint] = useState('')
  const [destination, setDestination] = useState('')

  const sosTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sosProgressRef = useRef(0)

  // ── SOS Hold Logic ──────────────────────────────────
  const startSOSHold = useCallback(() => {
    setSosHolding(true)
    sosProgressRef.current = 0
    setSosProgress(0)

    sosTimerRef.current = setInterval(() => {
      sosProgressRef.current += 10
      setSosProgress(sosProgressRef.current)
      if (sosProgressRef.current >= 100) {
        if (sosTimerRef.current) clearInterval(sosTimerRef.current)
        setSosHolding(false)
        setShowSOS(true)
        setSosProgress(0)
      }
    }, 30) // ~3 seconds total
  }, [])

  const endSOSHold = useCallback(() => {
    if (sosTimerRef.current) clearInterval(sosTimerRef.current)
    setSosHolding(false)
    setSosProgress(0)
    sosProgressRef.current = 0
  }, [])

  useEffect(() => {
    return () => {
      if (sosTimerRef.current) clearInterval(sosTimerRef.current)
    }
  }, [])

  // ── Route Logic ─────────────────────────────────────
  const handleScanRoute = () => {
    if (!startPoint || !destination) return
    setShowPlanModal(false)
    setIsNavigating(true)
    // Show upcoming alert after a delay
    setTimeout(() => setShowUpcomingAlert(true), 2000)
  }

  const handleEndTrip = () => {
    setIsNavigating(false)
    setShowUpcomingAlert(false)
    setStartPoint('')
    setDestination('')
  }

  // ── Route SVG Path ──────────────────────────────────
  const routeD = routePath.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ')

  // ── Upcoming hazard (mock) ──────────────────────────
  const upcomingHazard = {
    type: 'tractor' as ReportType,
    label: 'Road Works ahead — Independence',
    distance: '0.9 KM',
  }

  return (
    <div className="relative h-[100dvh] w-full max-w-[430px] md:max-w-none mx-auto md:mx-0 bg-[#e4e4e4] overflow-hidden">
      {/* ═══════════════════════════════════════════════════
          MAP BACKGROUND
      ═══════════════════════════════════════════════════ */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 1000" preserveAspectRatio="none">
        <rect x="0" y="0" width="500" height="1000" fill="#e4e4e4" />

        {/* Roads */}
        {[70, 150, 230, 310, 390, 460].map((x) => (
          <rect key={`v${x}`} x={x - 6} y="0" width="12" height="1000" fill="#fafafa" />
        ))}
        {[130, 260, 390, 520, 650, 780, 910].map((y) => (
          <rect key={`h${y}`} x="0" y={y - 6} width="500" height="12" fill="#fafafa" />
        ))}

        {/* Diagonal roads */}
        <g stroke="#fafafa" strokeWidth="16" fill="none" strokeLinecap="round">
          <path d="M10,110 L460,300" />
          <path d="M340,260 L475,620" />
          <path d="M10,960 L400,1075" />
        </g>

        {/* Parks */}
        <rect x="378" y="330" width="38" height="90" rx="10" fill="#bfe3c8" />
        <rect x="330" y="590" width="95" height="26" rx="8" fill="#bfe3c8" />
        <rect x="55" y="655" width="20" height="90" rx="8" fill="#bfe3c8" />
        <rect x="35" y="1050" width="70" height="60" rx="10" fill="#bfe3c8" />

        {/* Water */}
        <path d="M-20,970 C120,930 260,1005 500,945 L500,1000 L-20,1000 Z" fill="#8bd3f0" />
        <path d="M-20,970 C120,930 260,1005 500,945" stroke="#8bd3f0" strokeWidth="26" fill="none" />

        {/* Route line (only when navigating) */}
        {isNavigating && (
          <>
            <path d={routeD} stroke="#0ea5e9" strokeWidth="12" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
            <path d={routeD} stroke="#0ea5e9" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}

        {/* Street labels */}
        <text x="195" y="165" fontSize="24" fill="#4a4a4a" fontWeight="600" transform="rotate(-20 195 165)">Chesapeake Avenue</text>
        <text x="415" y="440" fontSize="24" fill="#4a4a4a" fontWeight="600" transform="rotate(65 415 440)">Southwood Avenue</text>
        <text x="60" y="620" fontSize="24" fill="#4a4a4a" fontWeight="600" transform="rotate(90 60 620)">Dresden Street</text>
        <text x="345" y="590" fontSize="24" fill="#4a4a4a" fontWeight="600">McDowell Street</text>
        <text x="130" y="830" fontSize="24" fill="#4a4a4a" fontWeight="600" transform="rotate(15 130 830)">Bretton Place</text>
      </svg>

      {/* ═══════════════════════════════════════════════════
          PINS
      ═══════════════════════════════════════════════════ */}
      {reports.map((r) => (
        <div
          key={r.id}
          style={{ top: r.top, left: r.left }}
          className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer z-[5]"
        >
          <div className={`rounded-full flex items-center justify-center shadow-md w-9 h-9 ${r.color}`}>
            <ReportIcon type={r.type} />
          </div>
        </div>
      ))}

      {/* ═══════════════════════════════════════════════════
          HOME HEADER (when not navigating)
      ═══════════════════════════════════════════════════ */}
      {!isNavigating && (
        <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-12 pb-2">
          {/* Profile bar */}
          <div className="flex items-center justify-between px-4 py-3 mb-3 bg-white shadow-sm rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 text-sm font-bold text-gray-500 bg-gray-300 rounded-full">
                AA
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Good Afternoon 👋</p>
                <p className="text-xs text-purple-600">Lagos, Nigeria</p>
              </div>
            </div>
            <button className="relative flex items-center justify-center w-10 h-10">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-gray-700" fill="currentColor">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
              </svg>
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </button>
          </div>

          {/* Search bar */}
          <button
            onClick={() => setShowPlanModal(true)}
            className="w-full flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-sm text-left"
          >
            <svg viewBox="0 0 24 24" className="flex-shrink-0 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <span className="flex-1 text-sm text-gray-400">Where are you going?</span>
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          NAVIGATION HEADER (when navigating)
      ═══════════════════════════════════════════════════ */}
      {isNavigating && (
        <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-12 pb-2 space-y-2">
          {/* Green direction banner */}
          <div className="flex items-center gap-3 px-4 py-3 shadow-sm bg-emerald-500 rounded-2xl">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-medium tracking-wide uppercase text-white/80">In 3.6 KM</p>
              <p className="text-sm font-semibold text-white">Head out and follow the route</p>
            </div>
          </div>

          {/* Upcoming hazard alert */}
          {showUpcomingAlert && (
            <div className="flex items-center gap-3 px-4 py-3 bg-white shadow-sm rounded-xl animate-in slide-in-from-top-2">
              <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Upcoming</p>
                <p className="text-sm font-medium text-gray-900 truncate">🚜 {upcomingHazard.label}</p>
              </div>
              <span className="text-xs font-medium text-gray-500">{upcomingHazard.distance}</span>
            </div>
          )}

          {/* Trip stats card */}
          <div className="px-5 py-4 bg-white shadow-sm rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-0.5">ETA</p>
                <p className="text-xl font-bold text-gray-900">17 min</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-0.5">Remaining</p>
                <p className="text-xl font-bold text-gray-900">7.1 km</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-0.5">Hazards</p>
                <p className="text-xl font-bold text-amber-500">2</p>
              </div>
            </div>
            <button
              onClick={handleEndTrip}
              className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition active:scale-[0.98]"
            >
              End Trip
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          NAVIGATION USER LOCATION PULSE
      ═══════════════════════════════════════════════════ */}
      {isNavigating && (
        <div
          className="absolute z-[6] -translate-x-1/2 -translate-y-1/2"
          style={{ top: '72%', left: '56%' }}
        >
          <div className="relative">
            <div className="absolute inset-0 -m-1 rounded-full w-14 h-14 bg-sky-400/30 animate-ping" />
            <div className="absolute inset-0 w-12 h-12 rounded-full bg-sky-400/20" />
            <div className="relative flex items-center justify-center w-10 h-10 border-2 border-white rounded-full shadow-lg bg-sky-500">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          SOS FLOATING BUTTON
      ═══════════════════════════════════════════════════ */}
      {!showSOS && (
        <button
          onMouseDown={startSOSHold}
          onMouseUp={endSOSHold}
          onMouseLeave={endSOSHold}
          onTouchStart={startSOSHold}
          onTouchEnd={endSOSHold}
          className="absolute z-30 flex flex-col items-center justify-center w-20 h-20 text-white transition rounded-full shadow-lg select-none bottom-32 right-4 bg-red-500/90 ring-4 ring-red-300/50 active:scale-95 touch-none"
          style={{
            background: sosHolding
              ? `conic-gradient(white ${sosProgress}%, rgba(239,68,68,0.9) ${sosProgress}%)`
              : undefined,
          }}
        >
          <span className="relative z-10 text-sm font-bold">SOS</span>
          <span className="text-[10px] leading-tight relative z-10">Hold 3 secs</span>
        </button>
      )}

      {/* ═══════════════════════════════════════════════════
          PLAN ROUTE MODAL
      ═══════════════════════════════════════════════════ */}
      {showPlanModal && (
        <div className="absolute inset-0 z-40 flex flex-col duration-300 bg-white animate-in slide-in-from-bottom">
          {/* Header */}
          <div className="px-5 pt-6 pb-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">Plan a route</h2>
                <p className="mt-1 text-sm text-gray-500">We\'ll scan reported hazards along the way before you drive.</p>
              </div>
              <button
                onClick={() => setShowPlanModal(false)}
                className="flex items-center justify-center text-gray-500 transition bg-gray-100 rounded-full w-9 h-9 hover:bg-gray-200"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Inputs */}
          <div className="flex-1 px-5 space-y-5">
            {/* Point A */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center w-5 h-5 border-2 rounded-full border-emerald-500">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <span className="text-sm font-medium text-gray-900">Point A — Start</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl">
                <input
                  type="text"
                  placeholder="Search a place or Address"
                  value={startPoint}
                  onChange={(e) => setStartPoint(e.target.value)}
                  className="flex-1 text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none"
                />
                <button className="text-sm font-medium text-purple-600 whitespace-nowrap hover:text-purple-700">
                  Use my location
                </button>
              </div>
            </div>

            {/* Point B */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
                <span className="text-sm font-medium text-gray-900">Point B — Destination</span>
              </div>
              <div className="px-4 py-3 bg-gray-50 rounded-xl">
                <input
                  type="text"
                  placeholder="Where to?"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full text-sm text-gray-900 placeholder-gray-400 bg-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Scan button */}
          <div className="px-5 pt-4 pb-8">
            <button
              onClick={handleScanRoute}
              disabled={!startPoint || !destination}
              className="w-full h-14 bg-purple-700 hover:bg-purple-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold text-lg rounded-2xl transition active:scale-[0.98]"
            >
              Scan route
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          SOS ACTIVE SCREEN
      ═══════════════════════════════════════════════════ */}
      {showSOS && (
        <div className="absolute inset-0 z-50 flex flex-col duration-300 bg-red-500 animate-in fade-in">
          {/* Header */}
          <div className="flex items-start justify-between px-5 pt-14">
            <div>
              <h2 className="text-3xl font-extrabold text-white">SOS Active</h2>
              <p className="mt-1 text-sm text-white/80">SOS broadcast, nearby drivers and contacts notified</p>
            </div>
            <button
              onClick={() => setShowSOS(false)}
              className="flex items-center justify-center text-white transition rounded-full w-9 h-9 bg-white/20 hover:bg-white/30"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Siren */}
          <div className="flex items-center justify-center flex-1">
            <div className="relative">
              <div className="absolute inset-0 w-48 h-48 -m-6 rounded-full bg-white/10 animate-ping" />
              <div className="absolute inset-0 w-40 h-40 -m-2 rounded-full bg-white/15" />
              <div className="relative flex items-center justify-center bg-white rounded-full shadow-2xl w-36 h-36">
                <svg viewBox="0 0 24 24" className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v1" />
                  <path d="M12 20v1" />
                  <path d="M4.2 7.2l.7.7" />
                  <path d="M19.1 16.1l.7.7" />
                  <path d="M3 12h1" />
                  <path d="M20 12h1" />
                  <path d="M4.2 16.8l.7-.7" />
                  <path d="M19.1 7.9l.7-.7" />
                  <path d="M12 8a4 4 0 0 1 4 4v3H8v-3a4 4 0 0 1 4-4z" />
                  <path d="M8 15v2a4 4 0 0 0 8 0v-2" />
                </svg>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 pb-10 space-y-3">
            <button
              onClick={() => setShowSOS(false)}
              className="w-full h-14 bg-white text-red-500 font-semibold text-lg rounded-xl hover:bg-gray-50 transition active:scale-[0.98]"
            >
              Cancel SOS
            </button>
            <a
              href="tel:112"
              className="w-full h-14 bg-white/20 text-white font-semibold text-lg rounded-xl flex items-center justify-center gap-2 hover:bg-white/30 transition active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              Call 112
            </a>
          </div>
        </div>
      )}
    </div>
  )
}