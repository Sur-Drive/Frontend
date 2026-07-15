
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useForgotPassword } from '../hooks/useAuth'

interface ForgotPasswordModalProps {
  onClose: () => void
  onBack: () => void
  onSendCode: (fullPhone: string) => void
  onSendCodeSuccess: (fullPhone: string) => void
}

export default function ForgotPasswordModal({
  onClose,
  onBack,
  onSendCode,
  onSendCodeSuccess,
}: ForgotPasswordModalProps) {
  const [phone, setPhone] = useState('')
  const [localError, setLocalError] = useState('')
  const forgotPassword = useForgotPassword()

  const isValid = phone.trim().length >= 10

  const handleSubmit = async () => {
    if (!isValid || forgotPassword.isPending) return

    const fullPhone = `+234${phone.trim()}`
    onSendCode(fullPhone)
    setLocalError('')

    try {
      await forgotPassword.mutateAsync({ phoneNumber: fullPhone })
      onSendCodeSuccess(fullPhone)
    } catch (err: any) {
      console.error('Forgot password failed:', err)
      
      const message = err.message || ''
      
      // Check for specific backend errors
      if (message.includes('not found') || message.includes('not registered') || message.includes('does not exist')) {
        setLocalError('This phone number is not registered. Please check and try again.')
      } else if (message.includes('valid phone number')) {
        setLocalError('Invalid phone number format. Please use a valid Nigerian number.')
      } else if (message.includes('Failed to send') || message.includes('try again')) {
        // This is likely SMS provider failure OR user not found (backend hides it)
        setLocalError('Unable to send reset code. Please try again later or contact support.')
      } else {
        setLocalError(message || 'Something went wrong. Please try again.')
      }
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-end justify-center z-60"
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
          {/* Drag Handle */}
          <div className="flex justify-center mb-2 -mt-2">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Back button */}
          <motion.button
            onClick={onBack}
            aria-label="Go back"
            className="absolute top-6 left-6 w-10 h-10 rounded-full bg-[#1a0a2e] flex items-center justify-center text-white"
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <BackIcon />
          </motion.button>

          {/* Close button */}
          <motion.button
            onClick={onClose}
            aria-label="Close"
            className="absolute flex items-center justify-center text-gray-500 bg-gray-100 rounded-full top-6 right-6 w-9 h-9"
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <CloseIcon />
          </motion.button>

          <div className="mt-6">
            <motion.h1
              className="text-2xl sm:text-[32px] font-extrabold text-gray-900 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              Password Recovery
            </motion.h1>

            <motion.p
              className="mt-2 text-base text-gray-600"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              Don&apos;t worry! It happens. Please enter the phone number associated with your
              account, and we&apos;ll send you a verification code to reset your password. 🔒
            </motion.p>
          </div>

          {/* Scrollable form */}
          <div className="mt-6 flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <label className="text-lg font-medium text-gray-900">Phone Number</label>
              <div className="mt-3 flex items-center rounded-2xl bg-gray-50 border border-gray-200 focus-within:ring-2 focus-within:ring-purple-300 focus-within:border-[#6E43A3] px-5 py-4">
                <span className="text-lg font-medium text-gray-700">+234</span>
                <div className="w-px h-6 mx-3 bg-gray-300" />
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/[^0-9-]/g, ''))
                    setLocalError('')
                  }}
                  placeholder="Input your phone"
                  className="flex-1 text-lg text-gray-900 bg-transparent outline-none placeholder:text-gray-400"
                />
                <NigeriaFlagIcon />
              </div>

              {/* Error messages */}
              {(localError || forgotPassword.isError) && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 text-sm text-red-500"
                >
                  {localError || (forgotPassword.error as Error)?.message || 'Something went wrong. Please try again.'}
                </motion.p>
              )}
            </motion.div>
          </div>

          {/* Send code button */}
          <motion.button
            onClick={handleSubmit}
            disabled={!isValid || forgotPassword.isPending}
            className={`mt-4 h-14 rounded-2xl font-semibold text-lg text-white transition-all flex items-center justify-center ${
              isValid && !forgotPassword.isPending ? 'bg-[#6E43A3]' : 'bg-purple-300 cursor-not-allowed'
            }`}
            whileTap={isValid && !forgotPassword.isPending ? { scale: 0.97 } : {}}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {forgotPassword.isPending ? <Spinner /> : 'Send code'}
          </motion.button>

          <motion.p
            className="mt-5 text-center text-gray-900"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            Remember password?{' '}
            <button onClick={onBack} className="text-[#6E43A3] font-semibold">
              Sign in
            </button>
          </motion.p>
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