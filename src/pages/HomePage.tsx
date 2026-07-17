





import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import BottomNav from '../components/BottomNav'
import CreateAccountModal from '../components/CreateAccountModal'
import SignInModal from '../components/SignInModal'
import ForgotPasswordModal from '../components/ForgetPasswordModal'
import OTP from '../components/OTP'
import VerifyResetOtpModal from '../components/VerifyResetOtpModal'
import PersonalInformation from '../components/PersonalInformation'
import CreatePassword from '../components/CreatePassword'
import CreateNewPassword from '../components/Createnewpassword'
import ResetPasswordSuccess from '../components/Resetpasswordsuccess'
import SOSActiveModal from '../components/Sosactivemodal'
import ReportDetailModal from '../components/ReportDetailModal'

// Fix Leaflet default icon
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

// Create custom report pin icons
const createReportIcon = (color: string, isSelected: boolean) => {
  const size = isSelected ? 56 : 36
  return L.divIcon({
    className: 'custom-pin',
    html: `
      <div style="
        background:${color};
        width:${size}px;
        height:${size}px;
        border-radius:50%;
        display:flex;
        align-items:center;
        justify-content:center;
        box-shadow:${isSelected ? '0 4px 16px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.2)'};
        border:3px solid white;
        transition:all 0.2s;
        cursor:pointer;
      ">
        <span style="color:white;font-size:${isSelected ? 18 : 12}px;font-weight:bold;">!</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  })
}

// User location icon (blue dot with pulse)
const userLocationIcon = L.divIcon({
  className: 'user-location',
  html: `
    <div style="position:relative;width:24px;height:24px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:#3b82f6;opacity:0.3;animation:pulse 1.5s infinite;"></div>
      <div style="position:absolute;inset:4px;border-radius:50%;background:#3b82f6;border:2px solid white;"></div>
    </div>
    <style>
      @keyframes pulse {
        0%,100% { transform: scale(1); opacity: 0.3; }
        50% { transform: scale(2); opacity: 0; }
      }
    </style>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

// Pan map to location when ready — only re-fires when center/zoom actually change
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  const hasFlownRef = useRef(false)

  useEffect(() => {
    if (!hasFlownRef.current) {
      // First mount: snap instantly, no animation needed
      map.setView(center, zoom)
      hasFlownRef.current = true
      return
    }
    map.flyTo(center, zoom, { duration: 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1], zoom, map])

  return null
}

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
  lat: number
  lng: number
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
  { id: 'r1', lat: 6.5244, lng: 3.3792, color: '#3b82f6', type: 'wave', title: 'Flood risk area', streetLabel: 'Chesapeake Avenue', subtitle: 'Flooding reported near Chesapeake Avenue', distance: '1.2 km', confirmCount: 6, incorrectCount: 0, photos: ['https://picsum.photos/seed/flood1/400/300', 'https://picsum.photos/seed/flood2/400/300'] },
  { id: 'r2', lat: 6.5350, lng: 3.3680, color: '#f59e0b', type: 'hill', title: 'Landslide risk', streetLabel: 'Southwood Avenue', subtitle: 'Loose slope near Southwood Avenue', distance: '2.0 km', confirmCount: 4, incorrectCount: 1, photos: ['https://picsum.photos/seed/hill1/400/300', 'https://picsum.photos/seed/hill2/400/300'] },
  { id: 'r3', lat: 6.5180, lng: 3.3910, color: '#f59e0b', type: 'pothole', title: 'Deep pothole', streetLabel: 'Whittier Street', subtitle: 'Deep pothole on 3rd Avenue', distance: '0.4 km', confirmCount: 18, incorrectCount: 1, photos: ['https://picsum.photos/seed/pothole1/400/300', 'https://picsum.photos/seed/pothole2/400/300', 'https://picsum.photos/seed/pothole3/400/300'] },
  { id: 'r4', lat: 6.5120, lng: 3.3550, color: '#ef4444', type: 'hazard', title: 'Road closed', streetLabel: 'Southwood Avenue', subtitle: 'Road works blocking one lane', distance: '1.6 km', confirmCount: 9, incorrectCount: 0, photos: ['https://picsum.photos/seed/hazard1/400/300', 'https://picsum.photos/seed/hazard2/400/300'] },
  { id: 'r5', lat: 6.5400, lng: 3.4000, color: '#ef4444', type: 'sos', title: 'Emergency reported', streetLabel: 'Dresden Street', subtitle: 'SOS alert near Dresden Street', distance: '0.9 km', confirmCount: 2, incorrectCount: 0, photos: ['https://picsum.photos/seed/sos1/400/300'] },
  { id: 'r6', lat: 6.5000, lng: 3.3800, color: '#2563eb', type: 'sign', title: 'Road works', streetLabel: 'Bretton Place', subtitle: 'Detour sign near Bretton Place', distance: '1.1 km', confirmCount: 5, incorrectCount: 0, photos: ['https://picsum.photos/seed/sign1/400/300', 'https://picsum.photos/seed/sign2/400/300'] },
  { id: 'r7', lat: 6.5280, lng: 3.3620, color: '#ef4444', type: 'warning', title: 'Hazard reported', streetLabel: 'McDowell Street', subtitle: 'Debris in the road near McDowell Street', distance: '1.3 km', confirmCount: 7, incorrectCount: 2, photos: ['https://picsum.photos/seed/warn1/400/300', 'https://picsum.photos/seed/warn2/400/300'] },
  { id: 'r8', lat: 6.5150, lng: 3.4100, color: '#f59e0b', type: 'tractor', title: 'Farm vehicle crossing', streetLabel: 'Southwood Avenue', subtitle: 'Slow-moving vehicles near Southwood Avenue', distance: '2.3 km', confirmCount: 3, incorrectCount: 0, photos: ['https://picsum.photos/seed/tractor1/400/300', 'https://picsum.photos/seed/tractor2/400/300'] },
  { id: 'r9', lat: 6.5480, lng: 3.3720, color: '#f59e0b', type: 'hill', title: 'Landslide risk', streetLabel: 'McDowell Street', subtitle: 'Unstable ground near McDowell Street', distance: '1.8 km', confirmCount: 4, incorrectCount: 0, photos: ['https://picsum.photos/seed/hill3/400/300'] },
  { id: 'r10', lat: 6.5080, lng: 3.3950, color: '#f59e0b', type: 'pothole', title: 'Deep pothole', streetLabel: 'Dresden Street', subtitle: 'Deep pothole on Dresden Street', distance: '0.7 km', confirmCount: 11, incorrectCount: 0, photos: ['https://picsum.photos/seed/pothole4/400/300', 'https://picsum.photos/seed/pothole5/400/300'] },
  { id: 'r11', lat: 6.5320, lng: 3.3480, color: '#ef4444', type: 'hazard', title: 'Road closed', streetLabel: 'McDowell Street', subtitle: 'Road works near McDowell Street', distance: '1.0 km', confirmCount: 8, incorrectCount: 1, photos: ['https://picsum.photos/seed/hazard3/400/300', 'https://picsum.photos/seed/hazard4/400/300'] },
  { id: 'r12', lat: 6.4950, lng: 3.3850, color: '#f59e0b', type: 'pothole', title: 'Deep pothole', streetLabel: 'Bretton Place', subtitle: 'Deep pothole near Bretton Place', distance: '2.1 km', confirmCount: 6, incorrectCount: 0, photos: ['https://picsum.photos/seed/pothole6/400/300'] },
  { id: 'r13', lat: 6.5220, lng: 3.4050, color: '#ef4444', type: 'sos', title: 'Emergency reported', streetLabel: 'Bretton Place', subtitle: 'SOS alert near Bretton Place', distance: '1.4 km', confirmCount: 1, incorrectCount: 0, photos: ['https://picsum.photos/seed/sos2/400/300'] },
  { id: 'r14', lat: 6.5050, lng: 3.3600, color: '#f59e0b', type: 'tractor', title: 'Farm vehicle crossing', streetLabel: 'Bretton Place', subtitle: 'Slow-moving vehicles near Bretton Place', distance: '0.6 km', confirmCount: 2, incorrectCount: 0, photos: ['https://picsum.photos/seed/tractor2/400/300'] },
  { id: 'r15', lat: 6.5380, lng: 3.3880, color: '#ef4444', type: 'warning', title: 'Hazard reported', streetLabel: 'Bretton Place', subtitle: 'Debris in the road near Bretton Place', distance: '0.3 km', confirmCount: 5, incorrectCount: 1, photos: ['https://picsum.photos/seed/warn3/400/300'] },
]

export default function HomePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [showCreateAccount, setShowCreateAccount] = useState(false)
  const [showSignIn, setShowSignIn] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showOTP, setShowOTP] = useState(false)
  const [showVerifyResetOtp, setShowVerifyResetOtp] = useState(false)
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

  // Location state
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)

  // SOS state
  const [sosActive, setSosActive] = useState(false)
  const [sosProgress, setSosProgress] = useState(0)
  const [isPressing, setIsPressing] = useState(false)
  const sosTimerRef = useRef<ReturnType<typeof window.setInterval> | null>(null)
  const sosStartTimeRef = useRef<number>(0)
  const sosCompletedRef = useRef<boolean>(false)

  const isAuthenticated = false

  const selected = useMemo(
    () => REPORTS.find((r) => r.id === selectedId) || null,
    [selectedId]
  )

  // Get user location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported by your browser')
      setMapReady(true)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude])
        setMapReady(true)
      },
      (error) => {
        setLocationError(
          error.code === 1
            ? 'Location access denied. Please enable location permissions.'
            : error.code === 2
            ? 'Location unavailable.'
            : 'Location request timed out.'
        )
        setUserLocation([REPORTS[0].lat, REPORTS[0].lng])
        setMapReady(true)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [])

  // Prevent page-level bounce/rubber-banding on mobile so the map feels stable
  useEffect(() => {
    const previousOverscroll = document.body.style.overscrollBehavior
    document.body.style.overscrollBehavior = 'none'
    return () => {
      document.body.style.overscrollBehavior = previousOverscroll
    }
  }, [])

  // Clean up any running SOS interval if the component unmounts mid-press
  useEffect(() => {
    return () => {
      if (sosTimerRef.current) {
        window.clearInterval(sosTimerRef.current)
        sosTimerRef.current = null
      }
    }
  }, [])

  // ---- SOS press handlers ----
  const startSosPress = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()

    sosCompletedRef.current = false
    setIsPressing(true)
    sosStartTimeRef.current = Date.now()
    setSosProgress(0)

    if (sosTimerRef.current) {
      window.clearInterval(sosTimerRef.current)
      sosTimerRef.current = null
    }

    sosTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - sosStartTimeRef.current
      const progress = Math.min(elapsed / 3000, 1)
      setSosProgress(progress)

      if (elapsed >= 3000) {
        if (sosTimerRef.current) {
          window.clearInterval(sosTimerRef.current)
          sosTimerRef.current = null
        }
        sosCompletedRef.current = true
        setSosActive(true)
        setSosProgress(0)
        setIsPressing(false)
      }
    }, 16)
  }, [])

  const endSosPress = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault?.()
    e?.stopPropagation?.()

    setIsPressing(false)
    if (sosTimerRef.current) {
      window.clearInterval(sosTimerRef.current)
      sosTimerRef.current = null
    }

    if (!sosCompletedRef.current) {
      setSosProgress(0)
      setShowCreateAccount(true)
    }
  }, [])

  const handleCancelSOS = () => {
    setSosActive(false)
    sosCompletedRef.current = false
  }

  const handleCallEmergency = () => {
    window.location.href = 'tel:112'
  }

  const handleSendCode = (fullPhone: string) => {
    console.log('OTP send triggered for:', fullPhone)
  }

  const handleSendCodeSuccess = (fullPhone: string) => {
    setPhoneNumber(fullPhone)
    setShowCreateAccount(false)
    setShowOTP(true)
  }

  const handleOtpVerifySuccess = (data: { token: string; user: any }) => {
    console.log('OTP verified, token/user received:', data)
    setShowOTP(false)
    setShowPersonalInfo(true)
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

  const handleForgotPasswordSendCode = (fullPhone: string) => {
    console.log('Sending reset code to:', fullPhone)
  }

  const handleForgotPasswordSendCodeSuccess = (fullPhone: string) => {
    console.log('Forgot password code sent to:', fullPhone)
    setPhoneNumber(fullPhone)
    setShowForgotPassword(false)
    setTimeout(() => setShowVerifyResetOtp(true), 50)
  }

  const handleResetOtpVerifySuccess = () => {
    setShowVerifyResetOtp(false)
    setShowCreateNewPassword(true)
  }

  const handleCreateNewPasswordComplete = () => {
    setShowCreateNewPassword(false)
    setShowResetSuccess(true)
  }

  const handleResetSuccessSignIn = () => {
    setShowResetSuccess(false)
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

  const handleSignInSuccess = (user: any) => {
    console.log('Signed in user:', user)
    setShowSignIn(false)
  }

  // Memoize map center so it only changes reference when userLocation actually
  // changes — otherwise every unrelated re-render (SOS progress ticking, modal
  // toggles, marker selection, etc.) created a brand-new array here, which made
  // MapController think the center changed and re-run flyTo, causing the map
  // to visibly jump/re-animate on every render.
  const mapCenter = useMemo<[number, number]>(
    () => userLocation || [REPORTS[0].lat, REPORTS[0].lng],
    [userLocation]
  )

  if (!mapReady) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] w-full max-w-[430px] mx-auto bg-gray-100">
        <div className="w-12 h-12 mb-4 border-4 border-red-500 rounded-full border-t-transparent animate-spin" />
        <p className="font-medium text-gray-600">
          {locationError ? 'Using default location...' : 'Getting your location...'}
        </p>
        {locationError && <p className="px-8 mt-2 text-sm text-center text-red-500">{locationError}</p>}
      </div>
    )
  }

  return (
    <div
      className="relative h-[100dvh] w-full max-w-[430px] mx-auto overflow-hidden bg-gray-100"
      style={{ overscrollBehavior: 'none' }}
    >
      {/* Leaflet Map */}
      <MapContainer
        center={mapCenter}
        zoom={15}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={mapCenter} zoom={15} />

        {/* User location marker */}
        {userLocation && (
          <Marker position={userLocation} icon={userLocationIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {/* Report markers */}
        {REPORTS.map((r) => (
          <Marker
            key={r.id}
            position={[r.lat, r.lng]}
            icon={createReportIcon(r.color, r.id === selectedId)}
            eventHandlers={{
              click: () => setSelectedId(r.id === selectedId ? null : r.id),
            }}
          >
            {r.id === selectedId && (
              <Popup closeButton={false} className="report-popup">
                <div className="text-center">
                  <p className="text-sm font-bold">{r.streetLabel}</p>
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>

      {/* Location error toast */}
      {locationError && (
        <div className="absolute top-4 left-4 right-4 z-[500] bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <div className="text-yellow-600 mt-0.5">⚠️</div>
          <div>
            <p className="text-sm font-medium text-yellow-800">{locationError}</p>
            <p className="mt-1 text-xs text-yellow-600">Showing default area</p>
          </div>
        </div>
      )}

      {/* SOS floating button */}
      <button
        onMouseDown={startSosPress}
        onMouseUp={endSosPress}
        onMouseLeave={endSosPress}
        onTouchStart={startSosPress}
        onTouchEnd={endSosPress}
        onContextMenu={(e) => e.preventDefault()}
        className="absolute z-[999] flex flex-col items-center justify-center w-20 h-20 text-white transition rounded-full shadow-[0_4px_20px_rgba(255,68,68,0.4)] bottom-32 right-4 bg-[#ff4444] overflow-hidden select-none"
        style={{ touchAction: 'none', WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
      >
        {/* Progress ring */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
          style={{ opacity: sosProgress > 0 ? 1 : 0, transition: 'opacity 0.15s' }}
        >
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 36}
            strokeDashoffset={2 * Math.PI * 36 * (1 - sosProgress)}
            style={{ transition: 'stroke-dashoffset 0.05s linear' }}
          />
        </svg>

        {/* Pulse rings when pressing */}
        {isPressing && (
          <>
            <span className="absolute inset-[-4px] rounded-full border-2 border-white/30 animate-ping" />
            <span className="absolute inset-[-4px] rounded-full border-2 border-white/30" />
          </>
        )}

        <span className="text-[15px] font-bold relative z-10 pointer-events-none">SOS</span>
        <span className="text-[10px] opacity-90 relative z-10 pointer-events-none">
          {isPressing ? 'Hold...' : 'Hold 3s'}
        </span>
      </button>

      {/* ============================================ */}
      {/* REPORT DETAIL MODAL - Bottom Sheet           */}
      {/* ============================================ */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-16 left-0 right-0 z-[500] max-h-[70vh] overflow-y-auto"
          >
            <ReportDetailModal
              report={selected}
              onClose={() => setSelectedId(null)}
              isAuthenticated={isAuthenticated}
              onAuthRequired={() => setShowCreateAccount(true)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modals */}
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
            onSignInSuccess={handleSignInSuccess}
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
              setShowCreateAccount(true)
            }}
            onVerifySuccess={handleOtpVerifySuccess}
            onResend={handleResendOTP}
            onEditPhone={() => {
              setShowOTP(false)
              setShowCreateAccount(true)
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVerifyResetOtp && phoneNumber && (
          <VerifyResetOtpModal
            phoneNumber={phoneNumber}
            onClose={() => {
              setShowVerifyResetOtp(false)
              setShowForgotPassword(true)
            }}
            onBack={() => {
              setShowVerifyResetOtp(false)
              setShowForgotPassword(true)
            }}
            onVerifySuccess={handleResetOtpVerifySuccess}
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

      {/* SOS Active Modal */}
      <AnimatePresence>
        {sosActive && (
          <SOSActiveModal
            onCancel={handleCancelSOS}
            onCall={handleCallEmergency}
          />
        )}
      </AnimatePresence>

      <div className="absolute bottom-0 left-0 right-0 z-[500]">
        <BottomNav />
      </div>
    </div>
  )
}