import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useVerifyResetOtp } from '../hooks/useAuth'

interface VerifyResetOtpModalProps {
  phoneNumber: string
  onClose: () => void
  onBack: () => void
  onVerifySuccess: () => void
}

export default function VerifyResetOtpModal({
  phoneNumber,
  onClose,
  onBack,
  onVerifySuccess,
}: VerifyResetOtpModalProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const verifyResetOtp = useVerifyResetOtp()

  const isComplete = otp.every((d) => d !== '')
  const maskedPhone = phoneNumber?.replace(/(\+\d{3})(\d{3})(\d{4})/, '$1 *** $3') || 'your phone'

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return

    const newOtp = [...otp]
    pasted.split('').forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit
    })
    setOtp(newOtp)

    const focusIndex = Math.min(pasted.length, 5)
    inputRefs.current[focusIndex]?.focus()
  }

  const handleSubmit = async () => {
    if (!isComplete || verifyResetOtp.isPending) return

    const otpString = otp.join('')
    try {
      await verifyResetOtp.mutateAsync({ phoneNumber, otp: otpString })
      onVerifySuccess()
    } catch (err: any) {
      console.error('Verify reset OTP failed:', err)
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
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
              Verify Code
            </motion.h1>

            <motion.p
              className="mt-2 text-base text-gray-600"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              We sent a verification code to <span className="font-semibold text-gray-900">{maskedPhone}</span>.
              Enter the 6-digit code below to continue.
            </motion.p>
          </div>

          {/* OTP Inputs */}
          <div className="mt-8 flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <motion.div
              className="flex justify-center gap-3"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              onPaste={handlePaste}
            >
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-12 h-14 text-2xl font-bold text-center rounded-2xl border-2 outline-none transition-all ${
                    digit
                      ? 'border-[#6E43A3] bg-purple-50 text-[#6E43A3]'
                      : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-[#6E43A3] focus:ring-2 focus:ring-purple-300'
                  }`}
                />
              ))}
            </motion.div>

            {verifyResetOtp.isError && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-sm text-center text-red-500"
              >
                {(verifyResetOtp.error as Error)?.message || 'Invalid code. Please try again.'}
              </motion.p>
            )}

            <motion.p
              className="mt-6 text-center text-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Didn&apos;t receive it?{' '}
              <button
                onClick={() => {
                  // Resend logic
                }}
                className="text-[#6E43A3] font-semibold"
              >
                Resend code
              </button>
            </motion.p>
          </div>

          {/* Verify button */}
          <motion.button
            onClick={handleSubmit}
            disabled={!isComplete || verifyResetOtp.isPending}
            className={`mt-4 h-14 rounded-2xl font-semibold text-lg text-white transition-all flex items-center justify-center ${
              isComplete && !verifyResetOtp.isPending ? 'bg-[#6E43A3]' : 'bg-purple-300 cursor-not-allowed'
            }`}
            whileTap={isComplete && !verifyResetOtp.isPending ? { scale: 0.97 } : {}}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {verifyResetOtp.isPending ? <Spinner /> : 'Verify'}
          </motion.button>
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

function Spinner() {
  return (
    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.35)" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}