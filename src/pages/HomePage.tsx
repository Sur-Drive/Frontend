import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
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
  { id: 'r1', top: '19.5%', left: '8.3%', color: '#3b82f6', type: 'wave', title: 'Flood risk area', streetLabel: 'Chesapeake Avenue', subtitle: 'Flooding reported near Chesapeake Avenue', distance: '1.2 km', confirmCount: 6, incorrectCount: 0, photos: ['https://picsum.photos/seed/flood1/400/300', 'https://picsum.photos/seed/flood2/400/300'] },
  { id: 'r2', top: '21.7%', left: '81.7%', color: '#f59e0b', type: 'hill', title: 'Landslide risk', streetLabel: 'Southwood Avenue', subtitle: 'Loose slope near Southwood Avenue', distance: '2.0 km', confirmCount: 4, incorrectCount: 1, photos: ['https://picsum.photos/seed/hill1/400/300', 'https://picsum.photos/seed/hill2/400/300'] },
  { id: 'r3', top: '30.8%', left: '26.5%', color: '#f59e0b', type: 'pothole', title: 'Deep pothole', streetLabel: 'Whittier Street', subtitle: 'Deep pothole on 3rd Avenue', distance: '0.4 km', confirmCount: 18, incorrectCount: 1, photos: ['https://picsum.photos/seed/pothole1/400/300', 'https://picsum.photos/seed/pothole2/400/300', 'https://picsum.photos/seed/pothole3/400/300'] },
  { id: 'r4', top: '29.6%', left: '63.6%', color: '#ef4444', type: 'hazard', title: 'Road closed', streetLabel: 'Southwood Avenue', subtitle: 'Road works blocking one lane', distance: '1.6 km', confirmCount: 9, incorrectCount: 0, photos: ['https://picsum.photos/seed/hazard1/400/300', 'https://picsum.photos/seed/hazard2/400/300'] },
  { id: 'r5', top: '44%', left: '9.5%', color: '#ef4444', type: 'sos', title: 'Emergency reported', streetLabel: 'Dresden Street', subtitle: 'SOS alert near Dresden Street', distance: '0.9 km', confirmCount: 2, incorrectCount: 0, photos: ['https://picsum.photos/seed/sos1/400/300'] },
  { id: 'r6', top: '49.1%', left: '42%', color: '#2563eb', type: 'sign', title: 'Road works', streetLabel: 'Bretton Place', subtitle: 'Detour sign near Bretton Place', distance: '1.1 km', confirmCount: 5, incorrectCount: 0, photos: ['https://picsum.photos/seed/sign1/400/300', 'https://picsum.photos/seed/sign2/400/300'] },
  { id: 'r7', top: '44.5%', left: '60.6%', color: '#ef4444', type: 'warning', title: 'Hazard reported', streetLabel: 'McDowell Street', subtitle: 'Debris in the road near McDowell Street', distance: '1.3 km', confirmCount: 7, incorrectCount: 2, photos: ['https://picsum.photos/seed/warn1/400/300', 'https://picsum.photos/seed/warn2/400/300'] },
  { id: 'r8', top: '46.2%', left: '87.3%', color: '#f59e0b', type: 'tractor', title: 'Farm vehicle crossing', streetLabel: 'Southwood Avenue', subtitle: 'Slow-moving vehicles near Southwood Avenue', distance: '2.3 km', confirmCount: 3, incorrectCount: 0, photos: ['https://picsum.photos/seed/tractor1/400/300', 'https://picsum.photos/seed/tractor2/400/300'] },
  { id: 'r9', top: '55.8%', left: '81.2%', color: '#f59e0b', type: 'hill', title: 'Landslide risk', streetLabel: 'McDowell Street', subtitle: 'Unstable ground near McDowell Street', distance: '1.8 km', confirmCount: 4, incorrectCount: 0, photos: ['https://picsum.photos/seed/hill3/400/300'] },
  { id: 'r10', top: '62%', left: '32.8%', color: '#f59e0b', type: 'pothole', title: 'Deep pothole', streetLabel: 'Dresden Street', subtitle: 'Deep pothole on Dresden Street', distance: '0.7 km', confirmCount: 11, incorrectCount: 0, photos: ['https://picsum.photos/seed/pothole4/400/300', 'https://picsum.photos/seed/pothole5/400/300'] },
  { id: 'r11', top: '64.3%', left: '63.4%', color: '#ef4444', type: 'hazard', title: 'Road closed', streetLabel: 'McDowell Street', subtitle: 'Road works near McDowell Street', distance: '1.0 km', confirmCount: 8, incorrectCount: 1, photos: ['https://picsum.photos/seed/hazard3/400/300', 'https://picsum.photos/seed/hazard4/400/300'] },
  { id: 'r12', top: '72.6%', left: '84.7%', color: '#f59e0b', type: 'pothole', title: 'Deep pothole', streetLabel: 'Bretton Place', subtitle: 'Deep pothole near Bretton Place', distance: '2.1 km', confirmCount: 6, incorrectCount: 0, photos: ['https://picsum.photos/seed/pothole6/400/300'] },
  { id: 'r13', top: '70.7%', left: '13.5%', color: '#ef4444', type: 'sos', title: 'Emergency reported', streetLabel: 'Bretton Place', subtitle: 'SOS alert near Bretton Place', distance: '1.4 km', confirmCount: 1, incorrectCount: 0, photos: ['https://picsum.photos/seed/sos2/400/300'] },
  { id: 'r14', top: '75.5%', left: '50.4%', color: '#f59e0b', type: 'tractor', title: 'Farm vehicle crossing', streetLabel: 'Bretton Place', subtitle: 'Slow-moving vehicles near Bretton Place', distance: '0.6 km', confirmCount: 2, incorrectCount: 0, photos: ['https://picsum.photos/seed/tractor2/400/300'] },
  { id: 'r15', top: '83.6%', left: '47.3%', color: '#ef4444', type: 'warning', title: 'Hazard reported', streetLabel: 'Bretton Place', subtitle: 'Debris in the road near Bretton Place', distance: '0.3 km', confirmCount: 5, incorrectCount: 1, photos: ['https://picsum.photos/seed/warn3/400/300'] },
]

export default function HomePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [votes, setVotes] = useState<Record<string, { confirm: number; incorrect: number; voted: 'confirm' | 'incorrect' | null }>>({})

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

  const handleSosPress = () => {
    if (!isAuthenticated) {
      setShowCreateAccount(true)
      return
    }
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

  return (
    <div className="relative h-[100dvh] w-full max-w-[430px] mx-auto bg-[#e4e4e4] overflow-hidden">
      {/* Map background */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 430 932" preserveAspectRatio="none">
        <rect x="0" y="0" width="430" height="932" fill="#e4e4e4" />
        {[54, 124, 194, 264, 334, 404].map((x) => (
          <rect key={`v${x}`} x={x} y="0" width="10" height="932" fill="#fafafa" />
        ))}
        {[114, 234, 354, 474, 594, 714, 834].map((y) => (
          <rect key={`h${y}`} x="0" y={y} width="430" height="10" fill="#fafafa" />
        ))}
        <g stroke="#fafafa" strokeWidth="14" fill="none" strokeLinecap="round">
          <path d="M0,100 L390,280" />
          <path d="M290,240 L410,580" />
          <path d="M0,890 L345,1000" />
        </g>
        <rect x="325" y="310" width="32" height="76" rx="8" fill="#bfe3c8" />
        <rect x="285" y="550" width="80" height="22" rx="8" fill="#bfe3c8" />
        <rect x="48" y="610" width="16" height="76" rx="8" fill="#bfe3c8" />
        <rect x="30" y="980" width="58" height="50" rx="10" fill="#bfe3c8" />
        <path d="M-20,900 C100,870 220,935 430,890 L430,932 L-20,932 Z" fill="#8bd3f0" />
        <path d="M-20,900 C100,870 220,935 430,890" stroke="#8bd3f0" strokeWidth="22" fill="none" />
        <text x="168" y="152" fontSize="15" fill="#4a4a4a" fontWeight="600" transform="rotate(-20 168 152)">Chesapeake Avenue</text>
        <text x="358" y="400" fontSize="15" fill="#4a4a4a" fontWeight="600" transform="rotate(65 358 400)">Southwood Avenue</text>
        <text x="52" y="570" fontSize="15" fill="#4a4a4a" fontWeight="600" transform="rotate(90 52 570)">Dresden Street</text>
        <text x="298" y="550" fontSize="15" fill="#4a4a4a" fontWeight="600">McDowell Street</text>
        <text x="112" y="770" fontSize="15" fill="#4a4a4a" fontWeight="600" transform="rotate(15 112 770)">Bretton Place</text>
      </svg>

      {/* Pins */}
      {REPORTS.map((r) => (
        <button
          key={r.id}
          onClick={() => setSelectedId(r.id === selectedId ? null : r.id)}
          className={`absolute z-[5] flex flex-col items-center cursor-pointer transition-transform active:scale-95 ${r.id === selectedId ? 'z-10' : ''}`}
          style={{
            top: r.top,
            left: r.left,
            transform: `translate(-50%, ${r.id === selectedId ? '-100%' : '-50%'})`,
          }}
        >
          <div
            className="flex items-center justify-center transition-all rounded-full shadow-md"
            style={{
              backgroundColor: r.color,
              width: r.id === selectedId ? 56 : 36,
              height: r.id === selectedId ? 56 : 36,
              boxShadow: r.id === selectedId ? '0 4px 16px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            <ReportIcon type={r.type} selected={r.id === selectedId} />
          </div>
          {r.id === selectedId && (
            <>
              <div
                className="w-3 h-3 -mt-1.5 rotate-45"
                style={{ backgroundColor: r.color, clipPath: 'polygon(0 0, 100% 0, 0 100%)' }}
              />
              <span className="mt-1 text-[13px] font-bold text-gray-900 whitespace-nowrap">{r.streetLabel}</span>
            </>
          )}
        </button>
      ))}

      {/* SOS floating button */}
      <button
        onClick={handleSosPress}
        className="absolute z-30 flex flex-col items-center justify-center w-20 h-20 text-white transition rounded-full shadow-[0_4px_20px_rgba(255,68,68,0.4)] bottom-32 right-4 bg-[#ff4444] active:scale-95"
      >
        <span className="absolute inset-[-6px] rounded-full border-[3px] border-red-400/35 animate-ping" />
        <span className="absolute inset-[-6px] rounded-full border-[3px] border-red-400/35" />
        <span className="text-[15px] font-bold relative z-10">SOS</span>
        <span className="text-[10px] opacity-90 relative z-10">Hold 3 secs</span>
      </button>

      {/* Report bottom sheet */}
      {selected && (
        <div className="absolute bottom-16 left-0 right-0 bg-white rounded-t-[20px] shadow-[0_-4px_24px_rgba(0,0,0,0.12)] z-20 max-h-[55%] flex flex-col">
          <div className="flex justify-center pt-2.5 pb-1">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          <div className="flex items-start justify-between px-5 pt-1 pb-3">
            <h2 className="text-[22px] font-extrabold text-gray-900">{selected.title}</h2>
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
            <span className="font-semibold text-gray-900">{selected.distance}</span>
          </div>

          <div className="flex gap-3 px-5 pb-4">
            <button
              onClick={() => vote(selected, 'confirm')}
              className={`flex-1 h-12 rounded-full flex items-center justify-center gap-2 font-semibold text-sm transition ${
                getCounts(selected).voted === 'confirm' ? 'bg-emerald-700 text-white' : 'bg-emerald-500 text-white'
              }`}
            >
              <ThumbUpIcon />
              Confirm ({getCounts(selected).confirm})
            </button>
            <button
              onClick={() => vote(selected, 'incorrect')}
              className={`flex-1 h-12 rounded-full flex items-center justify-center gap-2 font-semibold text-sm transition ${
                getCounts(selected).voted === 'incorrect' ? 'bg-gray-200 text-red-600' : 'bg-gray-100 text-red-500'
              }`}
            >
              <ThumbDownIcon />
              Incorrect ({getCounts(selected).incorrect})
            </button>
          </div>

          <div className="px-5 pb-5 flex gap-3 overflow-x-auto snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {selected.photos.map((src, i) => (
              <img key={i} src={src} alt="" className="flex-shrink-0 object-cover w-40 h-32 bg-gray-200 rounded-xl snap-start" />
            ))}
          </div>
        </div>
      )}

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

      <div className="relative z-30">
        <BottomNav />
      </div>
    </div>
  )
}

function ReportIcon({ type, selected }: { type: ReportType; selected?: boolean }) {
  const s = selected ? 1.25 : 1
  switch (type) {
    case 'wave': return (
      <svg viewBox="0 0 24 24" width={18 * s} height={18 * s} fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
        <path d="M2 10c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
        <path d="M2 15c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
      </svg>
    )
    case 'hill': return (
      <svg viewBox="0 0 24 24" width={18 * s} height={18 * s} fill="#3a2e1f">
        <path d="M2 18 L9 8 L13 13 L16 9 L22 18 Z" />
      </svg>
    )
    case 'pothole': return (
      <svg viewBox="0 0 24 24" width={18 * s} height={18 * s}>
        <ellipse cx="12" cy="12" rx="8" ry="4.5" fill="#1a1a1a" />
      </svg>
    )
    case 'hazard': return (
      <div style={{ width: 18 * s, height: 14 * s, borderRadius: 2, backgroundImage: 'repeating-linear-gradient(45deg, #f6c400 0 4px, #1a1a1a 4px 8px)' }} />
    )
    case 'sos': return (
      <div className="bg-white rounded-[3px] px-1 py-0.5 flex items-center justify-center">
        <span className="text-red-600 font-extrabold text-[7px] leading-none">SOS</span>
      </div>
    )
    case 'sign': return (
      <svg viewBox="0 0 24 24" width={18 * s} height={18 * s} fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14 L14 4" /><path d="M9 4 L14 4 L14 9" /><path d="M20 10 L10 20" /><path d="M15 20 L10 20 L10 15" />
      </svg>
    )
    case 'warning': return (
      <svg viewBox="0 0 24 24" width={18 * s} height={18 * s}>
        <path d="M12 3 L22 20 L2 20 Z" fill="white" />
        <rect x="11" y="10" width="2" height="5" fill="#e02424" />
        <rect x="11" y="16" width="2" height="2" fill="#e02424" />
      </svg>
    )
    case 'tractor': return (
      <svg viewBox="0 0 24 24" width={18 * s} height={18 * s} fill="#2b2b2b">
        <rect x="8" y="8" width="7" height="5" rx="1" />
        <rect x="4" y="12" width="5" height="4" rx="1" />
        <circle cx="7" cy="18" r="3" fill="none" stroke="#2b2b2b" strokeWidth="2" />
        <circle cx="17" cy="18" r="4" fill="none" stroke="#2b2b2b" strokeWidth="2" />
      </svg>
    )
    default: return null
  }
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


