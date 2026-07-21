import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import LazyGoogleMap from '../components/map/LazyGoogleMap'
import type { MapMarkerSpec } from '../components/map/GoogleMapView'
import {
  reportPinHtml,
  REPORT_PIN_ANCHOR,
  REPORT_PIN_SELECTED_ANCHOR,
  userLocationPinHtml,
  USER_LOCATION_ANCHOR,
} from '../components/map/mapMarkerIcons'
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
import { useHazardFeed, useConfirmHazard } from '../hooks/useHazards'
import { hazardToReport } from '../lib/hazardToReport'

const DEFAULT_COORDS: [number, number] = [6.5244, 3.3792]
const FEED_RADIUS_KM = 10

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

  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)

  const [sosActive, setSosActive] = useState(false)
  const [sosProgress, setSosProgress] = useState(0)
  const [isPressing, setIsPressing] = useState(false)
  const sosTimerRef = useRef<ReturnType<typeof window.setInterval> | null>(null)
  const sosStartTimeRef = useRef<number>(0)
  const sosCompletedRef = useRef<boolean>(false)

  // FIX: this was hardcoded to `false`, which meant Confirm/Incorrect always
  // short-circuited into the create-account modal and never reached the
  // API — regardless of whether the user was actually logged in. Derive it
  // from the real auth token, same as every other page in the app does.
  const isAuthenticated = typeof window !== 'undefined' && !!localStorage.getItem('token')

  const feedParams = mapReady
    ? {
        latitude: (userLocation ?? DEFAULT_COORDS)[0],
        longitude: (userLocation ?? DEFAULT_COORDS)[1],
        radius: FEED_RADIUS_KM,
      }
    : null

  const { data: hazards = [] } = useHazardFeed(feedParams)
  const confirmMutation = useConfirmHazard()

  const reports = useMemo(
    () => hazards.map((h) => hazardToReport(h, userLocation)),
    [hazards, userLocation]
  )

  const isAnyModalOpen =
    showCreateAccount ||
    showSignIn ||
    showForgotPassword ||
    showOTP ||
    showVerifyResetOtp ||
    showPersonalInfo ||
    showCreatePassword ||
    showCreateNewPassword ||
    showResetSuccess ||
    sosActive ||
    selectedId !== null

  const selected = useMemo(
    () => reports.find((r) => r.id === selectedId) || null,
    [reports, selectedId]
  )

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
        setUserLocation(DEFAULT_COORDS)
        setMapReady(true)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }, [])

  useEffect(() => {
    const previousOverscroll = document.body.style.overscrollBehavior
    document.body.style.overscrollBehavior = 'none'
    return () => {
      document.body.style.overscrollBehavior = previousOverscroll
    }
  }, [])

  useEffect(() => {
    return () => {
      if (sosTimerRef.current) {
        window.clearInterval(sosTimerRef.current)
        sosTimerRef.current = null
      }
    }
  }, [])

  const startSosPress = useCallback((e: React.MouseEvent | React.TouchEvent) => {
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

  const handleConfirm = async (hazardId: string) => {
    if (!isAuthenticated) {
      setShowCreateAccount(true)
      return
    }
    try {
      await confirmMutation.mutateAsync({ hazardId, type: 'CONFIRM' })
    } catch (err) {
      console.error('Failed to confirm hazard', err)
    }
  }

  const handleIncorrect = async (hazardId: string) => {
    if (!isAuthenticated) {
      setShowCreateAccount(true)
      return
    }
    try {
      await confirmMutation.mutateAsync({ hazardId, type: 'INCORRECT' })
    } catch (err) {
      console.error('Failed to mark hazard incorrect', err)
    }
  }

  const mapCenter = useMemo<[number, number]>(
    () => userLocation || DEFAULT_COORDS,
    [userLocation]
  )

  const mapMarkers = useMemo<MapMarkerSpec[]>(() => {
    const markers: MapMarkerSpec[] = reports.map((r) => ({
      id: r.id,
      lat: r.lat,
      lng: r.lng,
      html: reportPinHtml(r.color, r.id === selectedId),
      anchor: r.id === selectedId ? REPORT_PIN_SELECTED_ANCHOR : REPORT_PIN_ANCHOR,
      onClick: () => setSelectedId(r.id === selectedId ? null : r.id),
    }))

    if (userLocation) {
      markers.push({
        id: '__user_location__',
        lat: userLocation[0],
        lng: userLocation[1],
        html: userLocationPinHtml,
        anchor: USER_LOCATION_ANCHOR,
      })
    }

    return markers
  }, [reports, selectedId, userLocation])

  if (!mapReady) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] w-full bg-gray-100">
        <div className="w-10 h-10 mb-4 border-4 border-red-500 rounded-full border-t-transparent animate-spin" />
        <p className="text-[13px] font-medium text-gray-600">
          {locationError ? 'Using default location...' : 'Getting your location...'}
        </p>
        {locationError && <p className="px-8 mt-2 text-[12px] text-center text-red-500 max-w-xs">{locationError}</p>}
      </div>
    )
  }

  return (
    <div
      className="relative h-[100dvh] w-full overflow-hidden bg-gray-100"
      style={{ overscrollBehavior: 'none' }}
    >
      {/* Google Map — fills full viewport on every screen size. The map
          script + component chunk are both lazy-loaded on demand. */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <LazyGoogleMap
          center={{ lat: mapCenter[0], lng: mapCenter[1] }}
          zoom={15}
          markers={mapMarkers}
        />
      </div>

      {/* Location error toast — capped width so it doesn't stretch full-bleed on desktop */}
      {locationError && (
        <div className="absolute z-[500] flex items-start gap-3 px-4 py-3 border border-yellow-200 top-4 left-4 right-4 sm:right-auto sm:w-80 lg:top-6 lg:left-6 bg-yellow-50 rounded-xl">
          <div className="text-yellow-600 mt-0.5 text-sm">⚠️</div>
          <div>
            <p className="text-[12px] font-medium text-yellow-800">{locationError}</p>
            <p className="mt-1 text-[11px] text-yellow-600">Showing default area</p>
          </div>
        </div>
      )}

      {/* SOS floating button — pulled further from the edge on larger screens */}
      <button
        onMouseDown={startSosPress}
        onMouseUp={endSosPress}
        onMouseLeave={endSosPress}
        onTouchStart={startSosPress}
        onTouchEnd={endSosPress}
        onContextMenu={(e) => e.preventDefault()}
        className="absolute z-[999] flex flex-col items-center justify-center w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 text-white transition rounded-full shadow-[0_4px_20px_rgba(255,68,68,0.4)] bottom-28 right-4 lg:bottom-10 lg:right-10 bg-[#ff4444] overflow-hidden select-none"
        style={{ touchAction: 'none', WebkitTouchCallout: 'none', WebkitUserSelect: 'none', userSelect: 'none' }}
      >
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

        {isPressing && (
          <>
            <span className="absolute inset-[-4px] rounded-full border-2 border-white/30 animate-ping" />
            <span className="absolute inset-[-4px] rounded-full border-2 border-white/30" />
          </>
        )}

        <span className="text-[13px] font-bold relative z-10 pointer-events-none">SOS</span>
        <span className="text-[9px] opacity-90 relative z-10 pointer-events-none">
          {isPressing ? 'Hold...' : 'Hold 3s'}
        </span>
      </button>

      {/* REPORT DETAIL — bottom sheet on mobile, floating right-side panel on desktop */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute z-[500] bottom-16 left-0 right-0 max-h-[70dvh] overflow-y-auto
                       lg:bottom-auto lg:left-auto lg:top-6 lg:right-6 lg:w-96 lg:max-h-[85dvh] lg:rounded-3xl lg:shadow-2xl"
          >
            <ReportDetailModal
              report={selected}
              onClose={() => setSelectedId(null)}
              isAuthenticated={isAuthenticated}
              onAuthRequired={() => setShowCreateAccount(true)}
              onConfirm={() => handleConfirm(selected.id)}
              onIncorrect={() => handleIncorrect(selected.id)}
              isVoting={confirmMutation.isPending}
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

      <AnimatePresence>
        {sosActive && (
          <SOSActiveModal
            onCancel={handleCancelSOS}
            onCall={handleCallEmergency}
          />
        )}
      </AnimatePresence>

      {/* BottomNav — mobile-style bar centered/narrowed on desktop instead of full-bleed */}
      {!isAnyModalOpen && (
        <div className="absolute bottom-0 left-0 right-0 z-[500] lg:flex lg:justify-center lg:pb-4">
          <div className="lg:max-w-md lg:w-full lg:rounded-2xl lg:overflow-hidden lg:shadow-lg">
            <BottomNav />
          </div>
        </div>
      )}
    </div>
  )
}


