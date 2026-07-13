

import { useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import BottomNav from '../components/BottomNav'
import CreateAccountModal from '../components/CreateAccountModal'
import SignInModal from '../components/SignInModal'
import ForgotPasswordModal from '../components/ForgetPasswordModal'
import OTP from '../components/OTP'
import PersonalInformation from '../components/PersonalInformation'
import CreatePassword from '../components/CreatePassword'
import CreateNewPassword from '../components/Createnewpassword'
import ResetPasswordSuccess from '../components/Resetpasswordsuccess'
import PlanRouteModal from '../components/Planroutemodal'
import TripPanel from '../components/Trippanel'
import type { RouteInfo } from '../components/Trippanel'
import SOSActiveModal from '../components/Sosactivemodal'

type ReportType =
  | 'wave'
  | 'hill'
  | 'pothole'
  | 'hazard'
  | 'sos'
  | 'sign'
  | 'warning'
  | 'tractor'

interface Report {
  id: string
  top: string
  left: string
  color: string
  type: ReportType
  title: string
  streetLabel: string
  subtitle: string
  distance: string
  confirmCount: number
  incorrectCount: number
  photos: string[]
}

const REPORTS: Report[] = [
  { id: 'r1', top: '19.5%', left: '8.3%', color: 'bg-blue-500', type: 'wave', title: 'Flood risk area', streetLabel: 'Chesapeake Avenue', subtitle: 'Flooding reported near Chesapeake Avenue', distance: '1.2 km', confirmCount: 6, incorrectCount: 0, photos: ['https://picsum.photos/seed/flood1/400/300', 'https://picsum.photos/seed/flood2/400/300'] },
  { id: 'r2', top: '21.7%', left: '81.7%', color: 'bg-amber-500', type: 'hill', title: 'Landslide risk', streetLabel: 'Southwood Avenue', subtitle: 'Loose slope near Southwood Avenue', distance: '2.0 km', confirmCount: 4, incorrectCount: 1, photos: ['https://picsum.photos/seed/hill1/400/300', 'https://picsum.photos/seed/hill2/400/300'] },
  { id: 'r3', top: '30.8%', left: '26.5%', color: 'bg-amber-500', type: 'pothole', title: 'Deep pothole', streetLabel: 'Whittier Street', subtitle: 'Deep pothole on 3rd Avenue', distance: '0.4 km', confirmCount: 18, incorrectCount: 1, photos: ['https://picsum.photos/seed/pothole1/400/300', 'https://picsum.photos/seed/pothole2/400/300', 'https://picsum.photos/seed/pothole3/400/300'] },
  { id: 'r4', top: '29.6%', left: '63.6%', color: 'bg-red-500', type: 'hazard', title: 'Road closed', streetLabel: 'Southwood Avenue', subtitle: 'Road works blocking one lane', distance: '1.6 km', confirmCount: 9, incorrectCount: 0, photos: ['https://picsum.photos/seed/hazard1/400/300', 'https://picsum.photos/seed/hazard2/400/300'] },
  { id: 'r5', top: '44%', left: '9.5%', color: 'bg-red-500', type: 'sos', title: 'Emergency reported', streetLabel: 'Dresden Street', subtitle: 'SOS alert near Dresden Street', distance: '0.9 km', confirmCount: 2, incorrectCount: 0, photos: ['https://picsum.photos/seed/sos1/400/300'] },
  { id: 'r6', top: '49.1%', left: '42%', color: 'bg-blue-600', type: 'sign', title: 'Police checkpoint', streetLabel: 'Old Toll Gate', subtitle: 'Police checkpoint near Old Toll Gate', distance: '3.4 km', confirmCount: 5, incorrectCount: 0, photos: ['https://picsum.photos/seed/sign1/400/300', 'https://picsum.photos/seed/sign2/400/300'] },
  { id: 'r7', top: '44.5%', left: '60.6%', color: 'bg-red-500', type: 'warning', title: 'Hazard reported', streetLabel: 'McDowell Street', subtitle: 'Debris in the road near McDowell Street', distance: '1.3 km', confirmCount: 7, incorrectCount: 2, photos: ['https://picsum.photos/seed/warn1/400/300', 'https://picsum.photos/seed/warn2/400/300'] },
  { id: 'r8', top: '46.2%', left: '87.3%', color: 'bg-amber-500', type: 'tractor', title: 'Farm vehicle crossing', streetLabel: 'Southwood Avenue', subtitle: 'Slow-moving vehicles near Southwood Avenue', distance: '2.3 km', confirmCount: 3, incorrectCount: 0, photos: ['https://picsum.photos/seed/tractor1/400/300', 'https://picsum.photos/seed/tractor2/400/300'] },
  { id: 'r9', top: '55.8%', left: '81.2%', color: 'bg-amber-500', type: 'hill', title: 'Landslide risk', streetLabel: 'McDowell Street', subtitle: 'Unstable ground near McDowell Street', distance: '1.8 km', confirmCount: 4, incorrectCount: 0, photos: ['https://picsum.photos/seed/hill3/400/300'] },
  { id: 'r10', top: '62%', left: '32.8%', color: 'bg-amber-500', type: 'pothole', title: 'Deep pothole', streetLabel: 'Dresden Street', subtitle: 'Deep pothole on Dresden Street', distance: '0.7 km', confirmCount: 11, incorrectCount: 0, photos: ['https://picsum.photos/seed/pothole4/400/300', 'https://picsum.photos/seed/pothole5/400/300'] },
  { id: 'r11', top: '64.3%', left: '63.4%', color: 'bg-red-500', type: 'hazard', title: 'Road closed', streetLabel: 'McDowell Street', subtitle: 'Road works near McDowell Street', distance: '1.0 km', confirmCount: 8, incorrectCount: 1, photos: ['https://picsum.photos/seed/hazard3/400/300', 'https://picsum.photos/seed/hazard4/400/300'] },
  { id: 'r12', top: '72.6%', left: '84.7%', color: 'bg-amber-500', type: 'pothole', title: 'Deep pothole', streetLabel: 'Bretton Place', subtitle: 'Deep pothole near Bretton Place', distance: '2.1 km', confirmCount: 6, incorrectCount: 0, photos: ['https://picsum.photos/seed/pothole6/400/300'] },
  { id: 'r13', top: '70.7%', left: '13.5%', color: 'bg-red-500', type: 'sos', title: 'Emergency reported', streetLabel: 'Bretton Place', subtitle: 'SOS alert near Bretton Place', distance: '1.4 km', confirmCount: 1, incorrectCount: 0, photos: ['https://picsum.photos/seed/sos2/400/300'] },
  { id: 'r14', top: '75.5%', left: '50.4%', color: 'bg-amber-500', type: 'tractor', title: 'Farm vehicle crossing', streetLabel: 'Bretton Place', subtitle: 'Slow-moving vehicles near Bretton Place', distance: '0.6 km', confirmCount: 2, incorrectCount: 0, photos: ['https://picsum.photos/seed/tractor2/400/300'] },
  { id: 'r15', top: '83.6%', left: '47.3%', color: 'bg-red-500', type: 'warning', title: 'Hazard reported', streetLabel: 'Bretton Place', subtitle: 'Debris in the road near Bretton Place', distance: '0.3 km', confirmCount: 5, incorrectCount: 1, photos: ['https://picsum.photos/seed/warn3/400/300'] },
]

// Fixed demo "you are here" position used while a route is being planned / driven.
const ROUTE_PATH = 'M96,690 L96,780 L258,780 L258,972 L358,972'
const NAV_MARKER = { top: '77.2%', left: '51.6%' }

export default function HomePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [votes, setVotes] = useState<Record<string, { confirm: number; incorrect: number; voted: 'confirm' | 'incorrect' | null }>>({})

  // ===== ROUTE / NAVIGATION / SOS STATE =====
  const [showPlanRoute, setShowPlanRoute] = useState(false)
  const [tripPhase, setTripPhase] = useState<'idle' | 'preview' | 'navigating'>('idle')
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null)
  const [showUpcomingHazard, setShowUpcomingHazard] = useState(false)

  const [sosActive, setSosActive] = useState(false)
  const [sosProgress, setSosProgress] = useState(0)
  const sosTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ===== AUTH FLOW STATES =====
  const [showCreateAccount, setShowCreateAccount] = useState(false)
  const [showSignIn, setShowSignIn] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showOTP, setShowOTP] = useState(false)
  const [showPersonalInfo, setShowPersonalInfo] = useState(false)
  const [showCreatePassword, setShowCreatePassword] = useState(false)
  const [showCreateNewPassword, setShowCreateNewPassword] = useState(false)
  const [showResetSuccess, setShowResetSuccess] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [profileData, setProfileData] = useState<{
    firstName: string
    lastName: string
    gender: 'male' | 'female' | 'others'
    dateOfBirth: string
    occupation: string
  } | null>(null)

  const [authIntent, setAuthIntent] = useState<'signup' | 'reset' | null>(null)

  const isAuthenticated = false

  const selected = REPORTS.find((r) => r.id === selectedId) || null

  const getCounts = (r: Report) => {
    const v = votes[r.id]
    return {
      confirm: v ? v.confirm : r.confirmCount,
      incorrect: v ? v.incorrect : r.incorrectCount,
      voted: v ? v.voted : null,
    }
  }

  const vote = (r: Report, choice: 'confirm' | 'incorrect') => {
    if (!isAuthenticated) {
      setShowCreateAccount(true)
      return
    }
    setVotes((prev) => {
      const current = prev[r.id] || { confirm: r.confirmCount, incorrect: r.incorrectCount, voted: null }
      if (current.voted === choice) return prev
      const next = { ...current }
      if (current.voted === 'confirm') next.confirm -= 1
      if (current.voted === 'incorrect') next.incorrect -= 1
      if (choice === 'confirm') next.confirm += 1
      else next.incorrect += 1
      next.voted = choice
      return { ...prev, [r.id]: next }
    })
  }

  // ===== ROUTE PLANNING =====

  const handleScanRoute = (from: string, to: string) => {
    // Demo hazard scan result — in a real app this would come from the routing API.
    setRouteInfo({
      from,
      to,
      distanceKm: 9.5,
      etaMin: 23,
      safety: 91,
      hazards: [
        { id: 'h1', icon: 'pothole', title: 'Deep pothole on 3rd Avenue', subtitle: '3rd Ave & Market St', distance: '0.4 km' },
        { id: 'h2', icon: 'checkpoint', title: 'Police checkpoint', subtitle: 'Old Toll Gate', distance: '3.4 km' },
      ],
    })
    setShowPlanRoute(false)
    setTripPhase('preview')
  }

  const handleStartTrip = () => {
    setTripPhase('navigating')
    setShowUpcomingHazard(false)
    // Surface the next hazard warning a few seconds into the trip, like turn-by-turn nav does.
    window.setTimeout(() => setShowUpcomingHazard(true), 4000)
  }

  const handleEndTrip = () => {
    setTripPhase('idle')
    setRouteInfo(null)
    setShowUpcomingHazard(false)
  }

  // ===== SOS HOLD-TO-ACTIVATE (3 seconds) =====

  const startSosHold = () => {
    if (!isAuthenticated) {
      setShowCreateAccount(true)
      return
    }
    setSosProgress(0)
    sosTimerRef.current = setInterval(() => {
      setSosProgress((p) => {
        const next = p + 100 / 30 // ~3s at 100ms ticks
        if (next >= 100) {
          if (sosTimerRef.current) clearInterval(sosTimerRef.current)
          setSosActive(true)
          return 100
        }
        return next
      })
    }, 100)
  }

  const cancelSosHold = () => {
    if (sosTimerRef.current) clearInterval(sosTimerRef.current)
    setSosProgress(0)
  }

  // ===== AUTH HANDLERS (NO API) =====

  const handleSendCode = (fullPhone: string) => {
    console.log('Sending code to:', fullPhone)
  }

  const handleSendCodeSuccess = (fullPhone: string) => {
    setPhoneNumber(fullPhone)
    setAuthIntent('signup')
    setShowCreateAccount(false)
    setShowOTP(true)
  }

  const handleResendOTP = () => {
    console.log('Resending code to:', phoneNumber)
  }

  const handlePersonalInfoContinue = (data: {
    firstName: string
    lastName: string
    gender: 'male' | 'female' | 'others'
    dateOfBirth: string
    occupation: string
  }) => {
    console.log('Profile data:', data)
    setProfileData(data)
    setShowPersonalInfo(false)
    setShowCreatePassword(true)
  }

  const handleCreatePasswordComplete = (password: string) => {
    console.log('Password created:', password)
    console.log('Full signup data:', { phone: phoneNumber, ...profileData, password })
    setShowCreatePassword(false)
    setShowSignIn(true)
  }

  const handleCreateNewPasswordComplete = (password: string) => {
    console.log('Password reset for', phoneNumber, 'to:', password)
    setShowCreateNewPassword(false)
    setShowResetSuccess(true)
  }

  const handleResetSuccessSignIn = () => {
    setShowResetSuccess(false)
    setAuthIntent(null)
    setShowSignIn(true)
  }

  const handleSwitchToSignIn = () => {
    setShowCreateAccount(false)
    setShowForgotPassword(false)
    setShowSignIn(true)
  }

  const handleSwitchToSignUp = () => {
    setShowSignIn(false)
    setShowForgotPassword(false)
    setShowCreateAccount(true)
  }

  const handleSwitchToForgotPassword = () => {
    setShowSignIn(false)
    setShowForgotPassword(true)
  }

  const handleForgotPasswordSendCode = (fullPhone: string) => {
    console.log('Sending reset code to:', fullPhone)
  }

  const handleForgotPasswordSendCodeSuccess = (fullPhone: string) => {
    setPhoneNumber(fullPhone)
    setAuthIntent('reset')
    setShowForgotPassword(false)
    setShowOTP(true)
  }

  const handleSignInSubmit = async (phone: string, password: string) => {
    console.log('Signing in with:', phone, password)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    console.log('Login successful!')
    setShowSignIn(false)
  }

  const showingRouteOverlay = tripPhase !== 'idle'

  return (
    <div className="relative h-[100dvh] w-full max-w-[430px] md:max-w-none mx-auto md:mx-0 bg-[#e4e4e4] overflow-hidden">
      {/* Map background */}
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
        <path d="M-20,970 C120,930 260,1005 500,945" stroke="#8bd3f0" strokeWidth="26" fill="none" />

        <text x="195" y="165" fontSize="24" fill="#4a4a4a" fontWeight="600" transform="rotate(-20 195 165)">Chesapeake Avenue</text>
        <text x="415" y="440" fontSize="24" fill="#4a4a4a" fontWeight="600" transform="rotate(65 415 440)">Southwood Avenue</text>
        <text x="60" y="620" fontSize="24" fill="#4a4a4a" fontWeight="600" transform="rotate(90 60 620)">Dresden Street</text>
        <text x="345" y="590" fontSize="24" fill="#4a4a4a" fontWeight="600">McDowell Street</text>
        <text x="130" y="830" fontSize="24" fill="#4a4a4a" fontWeight="600" transform="rotate(15 130 830)">Bretton Place</text>

        {/* Active route line, shown while previewing or navigating */}
        {showingRouteOverlay && (
          <path d={ROUTE_PATH} stroke="#2f7bf6" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>

      {/* Pins */}
      {REPORTS.map((r) => (
        <Pin
          key={r.id}
          top={r.top}
          left={r.left}
          color={r.color}
          selected={r.id === selectedId}
          label={r.streetLabel}
          onClick={() => setSelectedId(r.id === selectedId ? null : r.id)}
        >
          <ReportIcon type={r.type} />
        </Pin>
      ))}

      {/* Current-position marker while navigating */}
      {tripPhase === 'navigating' && (
        <div
          className="absolute z-[6] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-11 h-11 rounded-full bg-blue-500/25"
          style={{ top: NAV_MARKER.top, left: NAV_MARKER.left }}
        >
          <div className="flex items-center justify-center bg-blue-500 rounded-full shadow w-7 h-7">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="white">
              <path d="M12 3 L21 20 L12 16 L3 20 Z" />
            </svg>
          </div>
        </div>
      )}

      {/* ===== TOP GREETING + SEARCH BAR ===== */}
      {!showingRouteOverlay && (
        <div className="absolute top-3 left-0 right-0 z-20 px-4 space-y-3 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[430px]">
          <div className="flex items-center justify-between px-4 py-3 bg-white rounded-full shadow-md">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 font-bold text-gray-600 bg-gray-200 rounded-full">
                AA
              </div>
              <div>
                <div className="text-[15px] font-bold text-gray-900 leading-tight">Good Afternoon 👋</div>
                <div className="text-[13px] font-semibold text-purple-600 leading-tight">Lagos, Nigeria</div>
              </div>
            </div>
            <button className="relative flex items-center justify-center w-10 h-10 text-gray-700 rounded-full bg-gray-50">
              <BellIcon />
              <span className="absolute w-2 h-2 bg-red-500 rounded-full top-2 right-2" />
            </button>
          </div>

          <button
            onClick={() => setShowPlanRoute(true)}
            className="flex items-center w-full gap-3 px-5 py-4 text-left bg-white rounded-full shadow-md"
          >
            <SearchIcon />
            <span className="text-[15px] text-gray-400">Where are you going?</span>
          </button>
        </div>
      )}

      {/* ===== TRIP PREVIEW / ACTIVE NAVIGATION ===== */}
      <AnimatePresence>
        {tripPhase === 'preview' && routeInfo && (
          <TripPanel
            phase="preview"
            route={routeInfo}
            onStartTrip={handleStartTrip}
            onClose={handleEndTrip}
          />
        )}
        {tripPhase === 'navigating' && routeInfo && (
          <TripPanel
            phase="navigating"
            route={routeInfo}
            remainingKm={7.1}
            etaMin={17}
            hazardsAhead={2}
            upcomingHazard={showUpcomingHazard ? { emoji: '🚧', label: 'Road Works ahead — Independence', distanceKm: 0.9 } : null}
            onEndTrip={handleEndTrip}
          />
        )}
      </AnimatePresence>

      {/* SOS floating button — hold 3 seconds to trigger */}
      {!showingRouteOverlay && (
        <button
          onPointerDown={startSosHold}
          onPointerUp={cancelSosHold}
          onPointerLeave={cancelSosHold}
          className="absolute z-30 flex flex-col items-center justify-center w-20 h-20 text-white transition rounded-full shadow-lg select-none bottom-32 right-4 bg-red-500/90 ring-4 ring-red-300/50 active:scale-95"
          style={{
            backgroundImage:
              sosProgress > 0
                ? `conic-gradient(rgba(255,255,255,0.55) ${sosProgress * 3.6}deg, transparent 0deg)`
                : undefined,
          }}
        >
          <span className="text-sm font-bold">SOS</span>
          <span className="text-[10px] leading-tight">Hold 3 secs</span>
        </button>
      )}

      {/* Report bottom sheet */}
      {selected && !showingRouteOverlay && (
        <div className="absolute bottom-16 left-0 right-0 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[430px] bg-white rounded-t-2xl shadow-2xl z-20 max-h-[60%] flex flex-col">
          <div className="flex justify-center pt-2.5 pb-1">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          <div className="flex items-start justify-between px-5 pt-1 pb-3">
            <h2 className="text-2xl font-extrabold text-gray-900">{selected.title}</h2>
            <div className="flex items-center gap-2">
              <button className="flex items-center justify-center text-gray-600 bg-gray-100 rounded-full w-9 h-9">
                <ShareIcon />
              </button>
              <button
                onClick={() => setSelectedId(null)}
                className="flex items-center justify-center text-gray-600 bg-gray-100 rounded-full w-9 h-9"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 px-5 pb-3 text-sm">
            <span className="font-medium text-purple-600">{selected.subtitle}</span>
            <span className="text-gray-400">·</span>
            <span className="font-medium text-gray-900">{selected.distance}</span>
          </div>

          <div className="flex gap-3 px-5 pb-4">
            <button
              onClick={() => vote(selected, 'confirm')}
              className={`flex-1 h-12 rounded-full flex items-center justify-center gap-2 font-semibold transition ${
                getCounts(selected).voted === 'confirm' ? 'bg-emerald-700 text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              <ThumbUpIcon />
              Confirm ({getCounts(selected).confirm})
            </button>
            <button
              onClick={() => vote(selected, 'incorrect')}
              className={`flex-1 h-12 rounded-full flex items-center justify-center gap-2 font-semibold transition ${
                getCounts(selected).voted === 'incorrect' ? 'bg-gray-200 text-red-600' : 'bg-gray-100 text-red-500'
              }`}
            >
              <ThumbDownIcon />
              Incorrect ({getCounts(selected).incorrect})
            </button>
          </div>

          <div className="px-5 pb-5 flex gap-3 overflow-x-auto snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {selected.photos.map((src, i) => (
              <img key={i} src={src} alt="" className="flex-shrink-0 object-cover w-40 h-32 rounded-xl snap-start" />
            ))}
          </div>
        </div>
      )}

      {/* ===== ROUTE PLANNING MODAL ===== */}
      <AnimatePresence>
        {showPlanRoute && (
          <PlanRouteModal onClose={() => setShowPlanRoute(false)} onScanRoute={handleScanRoute} />
        )}
      </AnimatePresence>

      {/* ===== SOS ACTIVE SCREEN ===== */}
      <AnimatePresence>
        {sosActive && (
          <SOSActiveModal
            onCancel={() => {
              setSosActive(false)
              setSosProgress(0)
            }}
            onCall={() => console.log('Calling 112...')}
          />
        )}
      </AnimatePresence>

      {/* ===== AUTH MODALS (NO API) ===== */}
      <AnimatePresence>
        {showCreateAccount && (
          <CreateAccountModal
            onClose={() => setShowCreateAccount(false)}
            onSendCode={handleSendCode}
            onSendCodeSuccess={handleSendCodeSuccess}
            onGoogleSignIn={() => console.log('google sign in')}
            onSignIn={handleSwitchToSignIn}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSignIn && (
          <SignInModal
            onClose={() => setShowSignIn(false)}
            onSignIn={handleSignInSubmit}
            onGoogleSignIn={() => console.log('google sign in')}
            onForgotPassword={handleSwitchToForgotPassword}
            onSignUp={handleSwitchToSignUp}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForgotPassword && (
          <ForgotPasswordModal
            onClose={() => setShowForgotPassword(false)}
            onBack={handleSwitchToSignIn}
            onSendCode={handleForgotPasswordSendCode}
            onSendCodeSuccess={handleForgotPasswordSendCodeSuccess}
          />
        )}
      </AnimatePresence>

     <AnimatePresence>
  {showOTP && (
    <OTP
      phoneNumber={phoneNumber}
      onBack={() => {
        setShowOTP(false)
        if (authIntent === 'reset') {
          setShowForgotPassword(true)
        } else {
          setShowCreateAccount(true)
        }
      }}
      onVerifySuccess={({ token, user }) => {
        // Store token
        if (token) localStorage.setItem('token', token)
        // Continue flow
        setShowOTP(false)
        if (authIntent === 'reset') {
          setShowCreateNewPassword(true)
        } else {
          setShowPersonalInfo(true)
        }
      }}
      onResend={handleResendOTP}
      onEditPhone={() => {
        setShowOTP(false)
        if (authIntent === 'reset') {
          setShowForgotPassword(true)
        } else {
          setShowCreateAccount(true)
        }
      }}
    />
  )}
</AnimatePresence>

      <AnimatePresence>
        {showPersonalInfo && (
          <PersonalInformation
            onBack={() => {
              setShowPersonalInfo(false)
              setShowOTP(true)
            }}
            onContinue={handlePersonalInfoContinue}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreatePassword && (
          <CreatePassword
            onBack={() => {
              setShowCreatePassword(false)
              setShowPersonalInfo(true)
            }}
            onComplete={handleCreatePasswordComplete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateNewPassword && (
          <CreateNewPassword onComplete={handleCreateNewPasswordComplete} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResetSuccess && (
          <ResetPasswordSuccess onSignIn={handleResetSuccessSignIn} />
        )}
      </AnimatePresence>

      <div className="relative z-30 md:max-w-[430px] md:mx-auto">
        <BottomNav />
      </div>
    </div>
  )
}

function Pin({
  children,
  top,
  left,
  color,
  selected,
  label,
  onClick,
}: {
  children: React.ReactNode
  top: string
  left: string
  color: string
  selected: boolean
  label: string
  onClick: () => void
}) {
  return (
    <div
      style={{ top, left }}
      className={`absolute -translate-x-1/2 flex flex-col items-center cursor-pointer z-[5] ${
        selected ? '-translate-y-full' : '-translate-y-1/2'
      }`}
      onClick={onClick}
    >
      <div
        className={`rounded-full flex items-center justify-center shadow-md transition-all ${color} ${
          selected ? 'w-16 h-16 ring-4 ring-white outline outline-2 outline-gray-700' : 'w-9 h-9'
        }`}
      >
        <div className={selected ? 'scale-125' : ''}>{children}</div>
      </div>
      {selected && (
        <>
          <div className={`w-3 h-3 -mt-1.5 rotate-45 ${color}`} style={{ clipPath: 'polygon(0 0, 100% 0, 0 100%)' }} />
          <span className="mt-1 text-sm font-bold text-gray-900 whitespace-nowrap">{label}</span>
        </>
      )}
    </div>
  )
}

function ReportIcon({ type }: { type: ReportType }) {
  switch (type) {
    case 'wave': return <WaveIcon />
    case 'hill': return <HillIcon />
    case 'pothole': return <PotholeIcon />
    case 'hazard': return <HazardIcon />
    case 'sos': return <SosIcon />
    case 'sign': return <SignIcon />
    case 'warning': return <WarningIcon />
    case 'tractor': return <TractorIcon />
    default: return null
  }
}

function WaveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
      <path d="M2 10c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
      <path d="M2 15c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
    </svg>
  )
}

function HillIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#3a2e1f">
      <path d="M2 18 L9 8 L13 13 L16 9 L22 18 Z" />
    </svg>
  )
}

function PotholeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <ellipse cx="12" cy="12" rx="8" ry="4.5" fill="#1a1a1a" />
    </svg>
  )
}

function HazardIcon() {
  return (
    <div className="w-5 h-4 rounded-[2px]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #f6c400 0 4px, #1a1a1a 4px 8px)' }} />
  )
}

function SosIcon() {
  return (
    <div className="bg-white rounded-[3px] px-1 py-0.5 flex items-center justify-center">
      <span className="text-red-600 font-extrabold text-[8px] leading-none">SOS</span>
    </div>
  )
}

function SignIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14 L14 4" />
      <path d="M9 4 L14 4 L14 9" />
      <path d="M20 10 L10 20" />
      <path d="M15 20 L10 20 L10 15" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
      <path d="M12 3 L22 20 L2 20 Z" fill="white" />
      <rect x="11" y="10" width="2" height="5" fill="#e02424" />
      <rect x="11" y="16" width="2" height="2" fill="#e02424" />
    </svg>
  )
}

function TractorIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#2b2b2b">
      <rect x="8" y="8" width="7" height="5" rx="1" />
      <rect x="4" y="12" width="5" height="4" rx="1" />
      <circle cx="7" cy="18" r="3" fill="none" stroke="#2b2b2b" strokeWidth="2" />
      <circle cx="17" cy="18" r="4" fill="none" stroke="#2b2b2b" strokeWidth="2" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
      <path d="M16 6l-4-4-4 4" />
      <path d="M12 2v14" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

function ThumbUpIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 10v11" />
      <path d="M7 10l3-8a2 2 0 0 1 2 2v5h6a2 2 0 0 1 2 2.3l-1.4 7A2 2 0 0 1 16.6 21H7" />
    </svg>
  )
}

function ThumbDownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 14V3" />
      <path d="M17 14l-3 8a2 2 0 0 1-2-2v-5H6a2 2 0 0 1-2-2.3l1.4-7A2 2 0 0 1 7.4 3H17" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="flex-shrink-0 w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  )
}















