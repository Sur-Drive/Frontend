
















import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSendOtp } from '../hooks/useAuth'

type InputMode = 'phone' | 'email'

interface CreateAccountModalProps {
  onClose: () => void
  onSendCode?: (identifier: string) => void
  onSendCodeSuccess?: (identifier: string) => void
  onGoogleSignIn?: () => void
  onSignIn?: () => void
  countryCode?: string
}

export default function CreateAccountModal({
  onClose,
  onSendCode,
  onSendCodeSuccess,
  onGoogleSignIn,
  onSignIn,
  countryCode = '+234',
}: CreateAccountModalProps) {
  const [inputMode, setInputMode] = useState<InputMode>('phone')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  const sendOtpMutation = useSendOtp()

  const digitsOnly = phone.replace(/\D/g, '')
  const isPhoneValid = digitsOnly.length === 10 || digitsOnly.length === 11
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const isValid = inputMode === 'phone' ? isPhoneValid : isEmailValid
  const hasInput = inputMode === 'phone' ? digitsOnly.length > 0 : email.trim().length > 0

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    const limited = raw.slice(0, 11)
    setPhone(limited)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
  }

  const handleSendCode = () => {
    if (!isValid || sendOtpMutation.isPending) return

    const identifier = inputMode === 'phone'
      ? `${countryCode}${digitsOnly}`
      : email.trim().toLowerCase()

    console.log('Mode:', inputMode)
    console.log('Identifier sent:', identifier)

    sendOtpMutation.mutate(
      {
        identifier,
        role: 'driver',
      },
      {
        onSuccess: (data) => {
          onSendCode?.(identifier)
          onSendCodeSuccess?.(identifier)
          console.log('✅ Success:', data)
        },
        onError: (error) => {
          console.error('❌ Error:', error.message)
        },
      }
    )
  }

  const switchMode = (mode: InputMode) => {
    setInputMode(mode)
    setPhone('')
    setEmail('')
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-end justify-center sm:items-center z-90"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      >
        <motion.div
          className="absolute inset-0 bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={onClose}
        />

        <motion.div
          className="relative w-full max-w-[430px] sm:max-w-[480px] lg:max-w-[520px] bg-white rounded-t-[40px] sm:rounded-[40px] sm:max-h-[100vh] sm:m-4 flex flex-col overflow-hidden shadow-2xl"
          style={{ maxHeight: '100dvh' }}
          initial={{ y: '110%' }}
          animate={{ y: 0 }}
          exit={{ y: '110%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 220, mass: 1.2 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.15}
          onDragEnd={(_, info) => { if (info.offset.y > 150) onClose() }}
        >
          {/* Scrollable content area */}
          <div className="flex-1 px-6 pt-8 pb-10 overflow-y-auto sm:px-8 sm:pt-10 sm:pb-10">
            {/* Drag handle — mobile only */}
            <div className="flex justify-center mb-2 -mt-2 sm:hidden">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <motion.button
              onClick={onClose}
              aria-label="Close"
              className="absolute flex items-center justify-center text-gray-500 bg-gray-100 rounded-full top-4 right-4 sm:top-6 sm:right-6 w-9 h-9"
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <CloseIcon />
            </motion.button>

            <motion.h1
              className="pr-12 text-xl font-extrabold text-gray-900 sm:text-2xl lg:text-3xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              Create Your Account
            </motion.h1>

            <motion.p
              className="mt-1.5 text-sm text-gray-600 sm:text-base sm:mt-2"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {hasInput ? (
                <>
                  Already have an account?{' '}
                  <button onClick={onSignIn} className="text-[#6E43A3] font-bold">
                    Sign in
                  </button>
                </>
              ) : (
                'Enter your details to get started.'
              )}
            </motion.p>

            {/* Toggle: Phone / Email */}
            <motion.div
              className="flex p-1 mt-4 bg-gray-100 rounded-xl sm:mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.4 }}
            >
              <button
                onClick={() => switchMode('phone')}
                className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
                  inputMode === 'phone'
                    ? 'bg-white text-[#6E43A3] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <PhoneIcon />
                  Phone Number
                </span>
              </button>
              <button
                onClick={() => switchMode('email')}
                className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
                  inputMode === 'email'
                    ? 'bg-white text-[#6E43A3] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <EmailIcon />
                  Email Address
                </span>
              </button>
            </motion.div>

            {/* Input Field */}
            <motion.div
              className="mt-3 sm:mt-4"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <AnimatePresence mode="wait">
                {inputMode === 'phone' ? (
                  <motion.div
                    key="phone-input"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="text-xs font-semibold text-gray-900 sm:text-sm">Phone Number</label>
                    <div className="mt-1.5 sm:mt-2 flex items-stretch rounded-xl bg-gray-50 border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-purple-300 focus-within:border-[#6E43A3]">
                      <div className="flex items-center px-3 text-xs text-gray-600 border-r border-gray-200 sm:px-4 shrink-0 sm:text-sm">
                        {countryCode}
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="8060452832"
                        className="flex-1 px-3 py-3 text-sm text-gray-900 bg-transparent outline-none sm:px-4 sm:py-4 placeholder:text-gray-400 sm:text-base"
                      />
                      <div className="flex items-center pr-3 sm:pr-4 shrink-0">
                        <NigeriaFlagIcon />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="email-input"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="text-xs font-semibold text-gray-900 sm:text-sm">Email Address</label>
                    <div className="mt-1.5 sm:mt-2 flex items-stretch rounded-xl bg-gray-50 border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-purple-300 focus-within:border-[#6E43A3]">
                      <div className="flex items-center pl-3 pr-2 text-gray-400 sm:pl-4 sm:pr-3 shrink-0">
                        <EmailIcon />
                      </div>
                      <input
                        type="email"
                        inputMode="email"
                        value={email}
                        onChange={handleEmailChange}
                        placeholder="you@example.com"
                        className="flex-1 px-0 py-3 text-sm text-gray-900 bg-transparent outline-none sm:py-4 placeholder:text-gray-400 sm:text-base"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {sendOtpMutation.isError && (
                <p className="mt-2 text-xs text-red-500 sm:text-sm">
                  {sendOtpMutation.error.message}
                </p>
              )}
            </motion.div>

            <motion.button
              onClick={handleSendCode}
              disabled={!isValid || sendOtpMutation.isPending}
              className={`mt-4 sm:mt-6 h-12 sm:h-14 rounded-xl font-semibold text-white transition-colors w-full ${
                isValid && !sendOtpMutation.isPending
                  ? 'bg-[#6E43A3]'
                  : 'bg-purple-300 cursor-not-allowed'
              }`}
              whileTap={isValid && !sendOtpMutation.isPending ? { scale: 0.97 } : {}}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.52, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {sendOtpMutation.isPending ? 'Sending...' : 'Send code'}
            </motion.button>

            <motion.div
              className="flex items-center gap-3 mt-4 text-xs font-medium text-gray-400 sm:mt-6 sm:text-sm"
              initial={{ opacity: 0, scaleX: 0.8 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.58, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <div className="flex-1 h-px bg-gray-200" />
              <span>OR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </motion.div>

            <motion.button
              onClick={onGoogleSignIn}
              className="flex items-center justify-center w-full h-12 gap-3 mt-4 font-medium text-gray-900 border border-gray-200 sm:mt-6 sm:h-14 rounded-xl bg-gray-50"
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.64, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <GoogleIcon />
              <span className="text-sm sm:text-base">Continue with Google</span>
            </motion.button>

            <motion.p
              className="mt-4 text-xs text-center text-gray-700 sm:text-sm sm:mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              Already have an account?{' '}
              <button onClick={onSignIn} className="text-[#6E43A3] font-bold">
                Sign in
              </button>
            </motion.p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Icons ─────────────────────────────────────────────────────────

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

function NigeriaFlagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 overflow-hidden rounded-full sm:w-6 sm:h-6">
      <rect x="0" y="0" width="8" height="24" fill="#3a8f3a" />
      <rect x="8" y="0" width="8" height="24" fill="white" />
      <rect x="16" y="0" width="8" height="24" fill="#3a8f3a" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5">
      <path fill="#4285F4" d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3.01h3.87c2.27-2.09 3.58-5.17 3.58-8.66z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.87-3.01c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11C3.25 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.28A7.14 7.14 0 0 1 4.9 12c0-.79.14-1.56.37-2.28V6.61H1.27A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.27 5.39z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.61l4 3.11C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  )
}