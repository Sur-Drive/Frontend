import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SignInModalProps {
  onClose: () => void
  onSignIn?: (phone: string, password: string) => void
  onGoogleSignIn?: () => void
  onForgotPassword?: () => void
  onSignUp?: () => void
  countryCode?: string
}

export default function SignInModal({
  onClose,
  onSignIn,
  onGoogleSignIn,
  onForgotPassword,
  onSignUp,
  countryCode = '+234',
}: SignInModalProps) {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, '')
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }

  const digitsOnly = phone.replace(/\D/g, '')
  const isPhoneValid = digitsOnly.length >= 7
  const isPasswordValid = password.length >= 1
  const isFormValid = isPhoneValid && isPasswordValid && !isLoading

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (raw.length > 10) return
    setPhone(raw)
    if (error) setError('')
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    if (error) setError('')
  }

  const handleSubmit = async () => {
    if (!isFormValid) return
    setIsLoading(true)
    setError('')
    try {
      await onSignIn?.(`${countryCode}${digitsOnly}`, password)
    } catch (err) {
      setError('Incorrect email or password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-40 flex items-end justify-center"
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
          className="relative w-full max-w-[430px] h-[92dvh] bg-white rounded-t-[40px] px-6 pt-8 pb-10 flex flex-col overflow-hidden"
          initial={{ y: '110%' }}
          animate={{ y: 0 }}
          exit={{ y: '110%' }}
          transition={{
            type: 'spring',
            damping: 30,
            stiffness: 220,
            mass: 1.2,
          }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.15}
          onDragEnd={(_, info) => {
            if (info.offset.y > 150) onClose()
          }}
        >
          <div className="flex justify-center mb-2 -mt-2">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          <motion.button
            onClick={onClose}
            aria-label="Close"
            className="absolute flex items-center justify-center text-gray-500 bg-gray-100 rounded-full top-6 right-6 w-9 h-9"
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <CloseIcon />
          </motion.button>

          <motion.h1
            className="pr-12 text-2xl font-extrabold text-gray-900 sm:text-3xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            Welcome Back 👋
          </motion.h1>

          <motion.p
            className="mt-2 text-gray-600"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            Sign in to access real-time road alerts, safer routes, and your personalised driving experience.
          </motion.p>

          {/* Phone Number - mt-10 for spacing, focus-within ring like CreateAccountModal */}
          <motion.div
            className="mt-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <label className="text-sm font-semibold text-gray-900">Phone Number</label>
            <div className="mt-2 flex items-stretch rounded-xl bg-gray-50 border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-purple-300 focus-within:border-[#6E43A3]">
              <div className="flex items-center px-4 text-gray-600 border-r border-gray-200 shrink-0">
                {countryCode}
              </div>
              <input
                type="tel"
                inputMode="numeric"
                value={formatPhone(phone)}
                onChange={handlePhoneChange}
                placeholder="812-345-6789"
                className="flex-1 px-4 py-4 text-gray-900 bg-transparent outline-none placeholder:text-gray-400"
              />
              <div className="flex items-center pr-4 shrink-0">
                <NigeriaFlagIcon />
              </div>
            </div>
          </motion.div>

          {/* Password - mt-6 (not mt-8), label row same as screenshot */}
          <motion.div
            className="mt-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-900">Enter Password</label>
              <button
                onClick={onForgotPassword}
                className="text-sm font-semibold text-red-500 hover:text-red-600"
              >
                Forgot password?
              </button>
            </div>
            <div className="mt-2 flex items-center rounded-xl bg-gray-50 border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-purple-300 focus-within:border-[#6E43A3]">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter password"
                className="flex-1 px-4 py-4 text-gray-900 bg-transparent outline-none placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="px-4 text-gray-400 hover:text-gray-600 shrink-0"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
              </button>
            </div>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.p
                className="mt-3 text-sm font-medium text-red-500"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className={`mt-6 h-14 rounded-xl font-semibold text-white ${
              isFormValid ? 'bg-[#6E43A3]' : 'bg-purple-300 cursor-not-allowed'
            }`}
            whileTap={isFormValid ? { scale: 0.97 } : {}}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.56, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </motion.button>

          <motion.div
            className="flex items-center gap-3 mt-6 text-sm font-medium text-gray-400"
            initial={{ opacity: 0, scaleX: 0.8 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.63, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="flex-1 h-px bg-gray-200" />
            <span>OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </motion.div>

          <motion.button
            onClick={onGoogleSignIn}
            className="flex items-center justify-center gap-3 mt-6 font-medium text-gray-900 border border-gray-200 h-14 rounded-xl bg-gray-50"
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <GoogleIcon />
            Continue with Google
          </motion.button>

          <div className="flex-1" />

          <motion.p
            className="text-center text-gray-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.78, duration: 0.5 }}
          >
            Don't have an account?{' '}
            <button onClick={onSignUp} className="text-[#6E43A3] font-bold">
              Sign Up
            </button>
          </motion.p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

function EyeClosedIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOpenIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function NigeriaFlagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 overflow-hidden rounded-full">
      <rect x="0" y="0" width="8" height="24" fill="#3a8f3a" />
      <rect x="8" y="0" width="8" height="24" fill="white" />
      <rect x="16" y="0" width="8" height="24" fill="#3a8f3a" />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5">
      <path fill="#4285F4" d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3.01h3.87c2.27-2.09 3.58-5.17 3.58-8.66z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.94-2.9l-3.87-3.01c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11C3.25 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.28A7.14 7.14 0 0 1 4.9 12c0-.79.14-1.56.37-2.28V6.61H1.27A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.27 5.39z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.61l4 3.11C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  )
}