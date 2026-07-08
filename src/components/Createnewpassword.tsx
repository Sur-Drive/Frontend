import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface CreateNewPasswordProps {
  onComplete: (password: string) => void
}

function getStrength(password: string): { label: string; ratio: number; color: string } {
  if (!password) return { label: '', ratio: 0, color: 'bg-gray-200' }
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { label: 'Weak', ratio: 0.33, color: 'bg-red-500' }
  if (score <= 2) return { label: 'Fair', ratio: 0.66, color: 'bg-amber-500' }
  return { label: 'Strong', ratio: 1, color: 'bg-emerald-500' }
}

export default function CreateNewPassword({ onComplete }: CreateNewPasswordProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const strength = useMemo(() => getStrength(password), [password])
  const isValid = password.length >= 8 && confirmPassword.length > 0

  const handleSubmit = async () => {
    if (!isValid || submitting) return
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setError('')
    setSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 1200))
    setSubmitting(false)
    onComplete(password)
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
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        />

        {/* Bottom Sheet */}
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
        >
          {/* Drag Handle */}
          <div className="flex justify-center mb-2 -mt-2">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          <div className="mt-6">
            <motion.h1
              className="text-2xl sm:text-[32px] font-extrabold text-gray-900 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              Create new password
            </motion.h1>

            <motion.p
              className="mt-2 text-base text-gray-600"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              Create a strong password to protect your account and keep your information safe.
            </motion.p>
          </div>

          {/* Scrollable form */}
          <div className="mt-6 flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* Password */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <label className="text-lg font-medium text-gray-900">Enter Password</label>
              <div className="mt-3 flex items-center rounded-2xl bg-gray-50 border border-gray-200 focus-within:ring-2 focus-within:ring-purple-300 focus-within:border-[#6E43A3] px-5 py-4">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  placeholder="Enter password"
                  className="flex-1 text-lg text-gray-900 bg-transparent outline-none placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="ml-2 text-gray-400"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {password && (
                <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${strength.ratio * 100}%` }}
                  />
                </div>
              )}
            </motion.div>

            {/* Confirm Password */}
            <motion.div
              className="mt-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <label className="text-lg font-medium text-gray-900">Re-type Password</label>
              <div className="mt-3 flex items-center rounded-2xl bg-gray-50 border border-gray-200 focus-within:ring-2 focus-within:ring-purple-300 focus-within:border-[#6E43A3] px-5 py-4">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setError('')
                  }}
                  placeholder="Re-type password"
                  className="flex-1 text-lg text-gray-900 bg-transparent outline-none placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="ml-2 text-gray-400"
                  aria-label="Toggle password visibility"
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
            </motion.div>

            <div className="h-6" />
          </div>

          {/* Reset Password button */}
          <motion.button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            className={`mt-4 h-14 rounded-2xl font-semibold text-lg text-white transition-all flex items-center justify-center ${
              isValid ? 'bg-[#6E43A3]' : 'bg-purple-300 cursor-not-allowed'
            }`}
            whileTap={isValid ? { scale: 0.97 } : {}}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {submitting ? <Spinner /> : 'Reset Password'}
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s4-7 10-7c1.4 0 2.7.3 3.9.8M22 12s-4 7-10 7c-1.4 0-2.7-.3-3.9-.8" />
      <path d="M3 3l18 18" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
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