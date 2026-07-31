





import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForgotPassword } from '../hooks/useAuth'

interface ForgotPasswordModalProps {
  onClose: () => void
  onBack: () => void
  onSendCode: (identifier: string) => void
  onSendCodeSuccess: (identifier: string) => void
}

type InputMode = 'phone' | 'email'

export default function ForgotPasswordModal({
  onClose,
  onBack,
  onSendCode,
  onSendCodeSuccess,
}: ForgotPasswordModalProps) {
  const [inputMode, setInputMode] = useState<InputMode>('phone')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [localError, setLocalError] = useState('')
  const forgotPassword = useForgotPassword()

  const value = inputMode === 'phone' ? phone : email

  const isValid =
    inputMode === 'phone'
      ? phone.trim().length >= 10
      : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  const handleSubmit = async () => {
    if (!isValid || forgotPassword.isPending) return

    const identifier =
      inputMode === 'phone' ? `+234${phone.trim()}` : email.trim()

    onSendCode(identifier)
    setLocalError('')

    try {
      await forgotPassword.mutateAsync({ identifier })
      onSendCodeSuccess(identifier)
    } catch (err: any) {
      console.error('Forgot password failed:', err)

      const message = err.message || ''

      if (
        message.includes('not found') ||
        message.includes('not registered') ||
        message.includes('does not exist')
      ) {
        setLocalError(
          inputMode === 'phone'
            ? 'This phone number is not registered. Please check and try again.'
            : 'This email is not registered. Please check and try again.'
        )
      } else if (message.includes('valid phone number')) {
        setLocalError('Invalid phone number format. Please use a valid Nigerian number.')
      } else if (message.includes('valid email')) {
        setLocalError('Invalid email format. Please enter a valid email address.')
      } else if (
        message.includes('Failed to send') ||
        message.includes('try again')
      ) {
        setLocalError('Unable to send reset code. Please try again later or contact support.')
      } else {
        setLocalError(message || 'Something went wrong. Please try again.')
      }
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-end justify-center z-[60]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={onClose}
        />

        {/* Bottom Sheet */}
        <motion.div
          className="relative w-full max-w-[430px] bg-white rounded-t-[40px] px-4 sm:px-6 pt-5 sm:pt-8 pb-4 sm:pb-10 flex flex-col overflow-hidden"
          style={{
            height: '100%',
            maxHeight: '100vh',
          }}
          initial={{ y: '110%' }}
          animate={{ y: 0 }}
          exit={{ y: '110%' }}
          transition={{
            type: 'spring',
            damping: 30,
            stiffness: 220,
            mass: 1.2,
          }}
        >
          {/* Drag Handle */}
          <div className="flex justify-center mb-1 -mt-1 shrink-0">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Back button */}
          <motion.button
            onClick={onBack}
            aria-label="Go back"
            className="absolute top-5 left-4 sm:left-6 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1a0a2e] flex items-center justify-center text-white z-10"
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <BackIcon />
          </motion.button>

          {/* Close button */}
          <motion.button
            onClick={onClose}
            aria-label="Close"
            className="absolute flex items-center justify-center text-gray-500 bg-gray-100 rounded-full top-5 right-4 sm:right-6 w-9 h-9"
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <CloseIcon />
          </motion.button>

          {/* Title */}
          <div className="mt-4 sm:mt-6 shrink-0">
            <motion.h1
              className="text-xl sm:text-2xl sm:text-[32px] font-extrabold text-gray-900 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              Password Recovery
            </motion.h1>

            <motion.p
              className="mt-1 text-sm leading-relaxed text-gray-600 sm:mt-2 sm:text-base"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              Don&apos;t worry! It happens. Please enter your phone number or email, and we&apos;ll send you a verification code to reset your password. 🔒
            </motion.p>
          </div>

          {/* Scrollable form + button */}
          <div
            className="relative flex-1 min-h-0 mt-4 overflow-y-auto sm:mt-6"
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              touchAction: 'pan-y',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <style>{`
              .hide-scrollbar::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div className="hide-scrollbar">

              {/* Phone / Email Toggle */}
              <motion.div
                className="flex gap-2 p-1 bg-gray-100 rounded-2xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <button
                  onClick={() => {
                    setInputMode('phone')
                    setLocalError('')
                  }}
                  className={`flex-1 h-10 sm:h-11 rounded-xl text-sm sm:text-base font-semibold transition-all ${
                    inputMode === 'phone'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  Phone
                </button>
                <button
                  onClick={() => {
                    setInputMode('email')
                    setLocalError('')
                  }}
                  className={`flex-1 h-10 sm:h-11 rounded-xl text-sm sm:text-base font-semibold transition-all ${
                    inputMode === 'email'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  Email
                </button>
              </motion.div>

              {/* Input */}
              <motion.div
                className="mt-4 sm:mt-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <label className="text-sm font-medium text-gray-900 sm:text-lg">
                  {inputMode === 'phone' ? 'Phone Number' : 'Email Address'}
                </label>

                {inputMode === 'phone' ? (
                  <div className="mt-2 sm:mt-3 flex items-center rounded-2xl bg-gray-50 border border-gray-200 focus-within:ring-2 focus-within:ring-purple-300 focus-within:border-[#6E43A3] px-4 sm:px-5 py-3 sm:py-4">
                    <span className="text-base font-medium text-gray-700 sm:text-lg">+234</span>
                    <div className="w-px h-5 mx-2 bg-gray-300 sm:h-6 sm:mx-3" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/[^0-9-]/g, ''))
                        setLocalError('')
                      }}
                      placeholder="Input your phone"
                      className="flex-1 text-base text-gray-900 bg-transparent outline-none sm:text-lg placeholder:text-gray-400"
                    />
                    <NigeriaFlagIcon />
                  </div>
                ) : (
                  <div className="mt-2 sm:mt-3">
                    <input
                      type="email"
                      inputMode="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        setLocalError('')
                      }}
                      placeholder="Enter your email"
                      className="w-full rounded-2xl bg-gray-50 border border-gray-200 px-4 sm:px-5 py-3 sm:py-4 text-base sm:text-lg text-gray-900 outline-none focus:ring-2 focus:ring-purple-300 focus:border-[#6E43A3] placeholder:text-gray-400"
                    />
                  </div>
                )}

                {/* Error messages */}
                <AnimatePresence>
                  {(localError || forgotPassword.isError) && (
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="mt-3 text-xs text-red-500 sm:text-sm"
                    >
                      {localError ||
                        (forgotPassword.error as Error)?.message ||
                        'Something went wrong. Please try again.'}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Send code button */}
              <div className="pt-6 pb-24 sm:pb-8">
                <motion.button
                  onClick={handleSubmit}
                  disabled={!isValid || forgotPassword.isPending}
                  className={`w-full h-12 sm:h-14 rounded-2xl font-semibold text-base sm:text-lg text-white transition-all flex items-center justify-center ${
                    isValid && !forgotPassword.isPending
                      ? 'bg-[#6E43A3]'
                      : 'bg-purple-300 cursor-not-allowed'
                  }`}
                  whileTap={isValid && !forgotPassword.isPending ? { scale: 0.97 } : {}}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  {forgotPassword.isPending ? <Spinner /> : 'Send code'}
                </motion.button>
              </div>

              {/* Sign in link */}
              <motion.p
                className="pb-4 text-sm text-center text-gray-900 sm:text-base"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                Remember password?{' '}
                <button onClick={onBack} className="text-[#6E43A3] font-semibold">
                  Sign in
                </button>
              </motion.p>

            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
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

function NigeriaFlagIcon() {
  return (
    <svg viewBox="0 0 24 16" className="flex-shrink-0 w-6 h-4 overflow-hidden rounded-sm">
      <rect x="0" y="0" width="8" height="16" fill="#008751" />
      <rect x="8" y="0" width="8" height="16" fill="#ffffff" />
      <rect x="16" y="0" width="8" height="16" fill="#008751" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.35)" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}