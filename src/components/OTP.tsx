
// import { useState, useRef, useEffect, useCallback } from 'react'
// import { motion, AnimatePresence } from 'framer-motion'

// interface OTPProps {
//   phoneNumber: string
//   onBack: () => void
//   onVerify: (code: string) => Promise<void>  // Now async
//   onResend: () => void
//   onEditPhone: () => void
//   countdownSeconds?: number
// }

// export default function OTP({
//   phoneNumber,
//   onBack,
//   onVerify,
//   onResend,
//   onEditPhone,
//   countdownSeconds = 45,
// }: OTPProps) {
//   const [code, setCode] = useState<string[]>(new Array(6).fill(''))
//   const [activeIndex, setActiveIndex] = useState(0)
//   const [timer, setTimer] = useState(countdownSeconds)
//   const [canResend, setCanResend] = useState(false)
//   const [showToast, setShowToast] = useState(true)
//   const [toastMessage, setToastMessage] = useState('Verification code sent')
//   const [isVerifying, setIsVerifying] = useState(false)
//   const [isSuccess, setIsSuccess] = useState(false)
//   const inputRefs = useRef<(HTMLInputElement | null)[]>([])

//   useEffect(() => {
//     if (timer > 0) {
//       const interval = setInterval(() => {
//         setTimer((prev) => {
//           if (prev <= 1) { setCanResend(true); clearInterval(interval); return 0 }
//           return prev - 1
//         })
//       }, 1000)
//       return () => clearInterval(interval)
//     }
//   }, [timer])

//   useEffect(() => {
//     const timeout = setTimeout(() => setShowToast(false), 3000)
//     return () => clearTimeout(timeout)
//   }, [])

//   useEffect(() => {
//     inputRefs.current[0]?.focus()
//   }, [])

//   const handleChange = useCallback(async (index: number, value: string) => {
//     if (isVerifying || isSuccess) return
//     const digit = value.replace(/\D/g, '').slice(-1)
//     if (!digit) return
//     const newCode = [...code]
//     newCode[index] = digit
//     setCode(newCode)
//     if (index < 5) {
//       setActiveIndex(index + 1)
//       inputRefs.current[index + 1]?.focus()
//     } else {
//       const fullCode = newCode.join('')
//       if (fullCode.length === 6) {
//         setIsVerifying(true)
//         try {
//           await onVerify(fullCode)
//           setIsSuccess(true)
//           setToastMessage('Verification complete')
//           setShowToast(true)
//         } catch (err) {
//           // Reset on error so user can retry
//           setCode(new Array(6).fill(''))
//           setActiveIndex(0)
//           inputRefs.current[0]?.focus()
//         } finally {
//           setIsVerifying(false)
//         }
//       }
//     }
//   }, [code, onVerify, isVerifying, isSuccess])

//   const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (isVerifying || isSuccess) return
//     if (e.key === 'Backspace') {
//       e.preventDefault()
//       const newCode = [...code]
//       if (code[index]) { newCode[index] = ''; setCode(newCode) }
//       else if (index > 0) {
//         newCode[index - 1] = ''
//         setCode(newCode)
//         setActiveIndex(index - 1)
//         inputRefs.current[index - 1]?.focus()
//       }
//     } else if (e.key === 'ArrowLeft' && index > 0) {
//       setActiveIndex(index - 1)
//       inputRefs.current[index - 1]?.focus()
//     } else if (e.key === 'ArrowRight' && index < 5) {
//       setActiveIndex(index + 1)
//       inputRefs.current[index + 1]?.focus()
//     }
//   }, [code, isVerifying, isSuccess])

//   const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
//     if (isVerifying || isSuccess) return
//     e.preventDefault()
//     const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
//     if (!pasted) return
//     const newCode = [...code]
//     pasted.split('').forEach((digit, i) => { if (i < 6) newCode[i] = digit })
//     setCode(newCode)
//     const nextIndex = Math.min(pasted.length, 5)
//     setActiveIndex(nextIndex)
//     inputRefs.current[nextIndex]?.focus()
//     if (pasted.length === 6) {
//       setIsVerifying(true)
//       try {
//         await onVerify(pasted)
//         setIsSuccess(true)
//         setToastMessage('Verification complete')
//         setShowToast(true)
//       } catch (err) {
//         setCode(new Array(6).fill(''))
//         setActiveIndex(0)
//         inputRefs.current[0]?.focus()
//       } finally {
//         setIsVerifying(false)
//       }
//     }
//   }, [code, onVerify, isVerifying, isSuccess])

//   const handleResendClick = () => {
//     if (!canResend || isVerifying || isSuccess) return
//     setTimer(countdownSeconds)
//     setCanResend(false)
//     setCode(new Array(6).fill(''))
//     setActiveIndex(0)
//     setToastMessage('Verification code sent')
//     setShowToast(true)
//     inputRefs.current[0]?.focus()
//     onResend()
//   }

//   const formatPhone = (phone: string) => {
//     const cleaned = phone.replace(/\D/g, '')
//     if (cleaned.startsWith('234') && cleaned.length >= 13) {
//       const rest = cleaned.slice(3)
//       return `234 ${rest.slice(0, 3)}-${rest.slice(3, 6)}-${rest.slice(6, 10)}`
//     }
//     return phone.replace(/^\+/, '')
//   }

//   return (
//     <AnimatePresence>
//       <motion.div
//         className="fixed inset-0 z-40 flex items-end justify-center"
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
//       >
//         <motion.div
//           className="absolute inset-0 bg-black/40"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           transition={{ duration: 0.4 }}
//           onClick={onBack}
//         />

//         <motion.div
//           className="relative w-full max-w-[430px] h-[92dvh] bg-white rounded-t-[40px] px-6 pt-8 pb-10 flex flex-col overflow-hidden"
//           initial={{ y: '110%' }}
//           animate={{ y: 0 }}
//           exit={{ y: '110%' }}
//           transition={{ type: 'spring', damping: 30, stiffness: 220, mass: 1.2 }}
//           drag="y"
//           dragConstraints={{ top: 0, bottom: 0 }}
//           dragElastic={0.15}
//           onDragEnd={(_, info) => { if (info.offset.y > 150) onBack() }}
//         >
//           <div className="flex justify-center mb-2 -mt-2">
//             <div className="w-10 h-1 bg-gray-300 rounded-full" />
//           </div>

//           <motion.button
//             onClick={onBack}
//             aria-label="Go back"
//             className="absolute top-6 left-6 w-10 h-10 rounded-full bg-[#1a0a2e] flex items-center justify-center text-white"
//             whileTap={{ scale: 0.92 }}
//             transition={{ type: 'spring', stiffness: 400, damping: 20 }}
//           >
//             <BackIcon />
//           </motion.button>

//           <div className="mt-14">
//             <motion.h1
//               className="text-2xl sm:text-[32px] font-extrabold text-gray-900 leading-tight"
//               initial={{ opacity: 0, y: 30 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.25, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
//             >
//               We just sent an SMS
//             </motion.h1>

//             <motion.div
//               className="mt-3"
//               initial={{ opacity: 0, y: 30 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.32, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
//             >
//               <p className="text-base leading-relaxed text-gray-600">
//                 Enter the security code we sent to
//               </p>
//               <div className="flex items-center justify-between mt-1">
//                 <span className="text-base font-medium text-gray-900">{formatPhone(phoneNumber)}</span>
//                 <button
//                   onClick={onEditPhone}
//                   className="text-[#6E43A3] font-semibold text-sm shrink-0 ml-3"
//                 >
//                   Edit
//                 </button>
//               </div>
//             </motion.div>
//           </div>

//           {/* OTP Inputs */}
//           <motion.div
//             className="relative flex items-center justify-between gap-2 mt-8"
//             initial={{ opacity: 0, y: 30 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.4, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
//           >
//             {code.map((digit, index) => (
//               <input
//                 key={index}
//                 ref={(el) => { inputRefs.current[index] = el }}
//                 type="text"
//                 inputMode="numeric"
//                 maxLength={1}
//                 value={digit}
//                 disabled={isVerifying || isSuccess}
//                 onChange={(e) => handleChange(index, e.target.value)}
//                 onKeyDown={(e) => handleKeyDown(index, e)}
//                 onPaste={index === 0 ? handlePaste : undefined}
//                 onFocus={() => setActiveIndex(index)}
//                 className={`w-12 h-14 sm:w-14 sm:h-16 rounded-xl text-center text-xl font-bold text-gray-900 outline-none transition-all duration-200 disabled:opacity-50 ${
//                   activeIndex === index && !isVerifying && !isSuccess
//                     ? 'border-2 border-[#6E43A3] shadow-[0_0_0_3px_rgba(110,67,163,0.15)]'
//                     : digit ? 'border-2 border-gray-300' : 'border-2 border-gray-200'
//                 }`}
//               />
//             ))}

//             {/* Loading spinner overlay */}
//             {isVerifying && (
//               <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
//                 <div className="w-10 h-10 border-4 border-gray-200 border-t-[#6E43A3] rounded-full animate-spin" />
//               </div>
//             )}
//           </motion.div>

//           {/* Resend section */}
//           <motion.div
//             className="flex items-center justify-between mt-8"
//             initial={{ opacity: 0, y: 30 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.48, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
//           >
//             <p className="text-base text-gray-900">
//               Didn't get the code?{' '}
//               <button
//                 onClick={handleResendClick}
//                 disabled={!canResend || isVerifying || isSuccess}
//                 className={`font-semibold transition-colors ${
//                   canResend && !isVerifying && !isSuccess
//                     ? 'text-[#6E43A3] hover:text-purple-800'
//                     : 'text-gray-300 cursor-not-allowed'
//                 }`}
//               >
//                 Resend it
//               </button>
//             </p>

//             {/* Timer badge — hidden when timer is 0 */}
//             {timer > 0 && (
//               <div className="flex items-center gap-2">
//                 <div className="w-7 h-7 rounded-full bg-[#6E43A3] flex items-center justify-center">
//                   <ClockIcon />
//                 </div>
//                 <span className="text-base font-semibold text-gray-900">{timer}s</span>
//               </div>
//             )}
//           </motion.div>

//           <div className="flex-1" />

//           {/* Toast notification */}
//           <AnimatePresence>
//             {showToast && (
//               <motion.div
//                 className="flex items-center gap-3 px-5 py-4 mb-4 bg-purple-50 rounded-2xl"
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: 20 }}
//                 transition={{ duration: 0.3 }}
//               >
//                 <div className="w-6 h-6 rounded-full bg-[#1a0a2e] flex items-center justify-center shrink-0">
//                   <CheckIcon />
//                 </div>
//                 <span className="text-base font-medium text-gray-900">{toastMessage}</span>
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </motion.div>
//       </motion.div>
//     </AnimatePresence>
//   )
// }

// function BackIcon() {
//   return (
//     <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M15 18l-6-6 6-6" />
//     </svg>
//   )
// }

// function ClockIcon() {
//   return (
//     <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//       <circle cx="12" cy="12" r="10" />
//       <path d="M12 6v6l4 2" />
//     </svg>
//   )
// }

// function CheckIcon() {
//   return (
//     <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M5 13l4 4L19 7" />
//     </svg>
//   )
// }













import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface OTPProps {
  phoneNumber: string
  onBack: () => void
  onVerify: (code: string) => Promise<void>
  onResend: () => void
  onEditPhone: () => void
  countdownSeconds?: number
}

export default function OTP({
  phoneNumber,
  onBack,
  onVerify,
  onResend,
  onEditPhone,
  countdownSeconds = 45,
}: OTPProps) {
  const [code, setCode] = useState<string[]>(new Array(6).fill(''))
  const [activeIndex, setActiveIndex] = useState(0)
  const [timer, setTimer] = useState(countdownSeconds)
  const [canResend, setCanResend] = useState(false)
  const [showToast, setShowToast] = useState(true)
  const [toastMessage, setToastMessage] = useState('Verification code sent')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) { setCanResend(true); clearInterval(interval); return 0 }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [timer])

  useEffect(() => {
    const timeout = setTimeout(() => setShowToast(false), 3000)
    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = useCallback(async (index: number, value: string) => {
    if (isVerifying || isSuccess) return
    const digit = value.replace(/\D/g, '').slice(-1)
    if (!digit) return
    const newCode = [...code]
    newCode[index] = digit
    setCode(newCode)
    if (index < 5) {
      setActiveIndex(index + 1)
      inputRefs.current[index + 1]?.focus()
    } else {
      const fullCode = newCode.join('')
      if (fullCode.length === 6) {
        setIsVerifying(true)
        try {
          await onVerify(fullCode)
          setIsSuccess(true)
          setToastMessage('Verification complete')
          setShowToast(true)
        } catch (err) {
          setCode(new Array(6).fill(''))
          setActiveIndex(0)
          inputRefs.current[0]?.focus()
        } finally {
          setIsVerifying(false)
        }
      }
    }
  }, [code, onVerify, isVerifying, isSuccess])

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isVerifying || isSuccess) return
    if (e.key === 'Backspace') {
      e.preventDefault()
      const newCode = [...code]
      if (code[index]) { newCode[index] = ''; setCode(newCode) }
      else if (index > 0) {
        newCode[index - 1] = ''
        setCode(newCode)
        setActiveIndex(index - 1)
        inputRefs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      setActiveIndex(index - 1)
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      setActiveIndex(index + 1)
      inputRefs.current[index + 1]?.focus()
    }
  }, [code, isVerifying, isSuccess])

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    if (isVerifying || isSuccess) return
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const newCode = [...code]
    pasted.split('').forEach((digit, i) => { if (i < 6) newCode[i] = digit })
    setCode(newCode)
    const nextIndex = Math.min(pasted.length, 5)
    setActiveIndex(nextIndex)
    inputRefs.current[nextIndex]?.focus()
    if (pasted.length === 6) {
      setIsVerifying(true)
      try {
        await onVerify(pasted)
        setIsSuccess(true)
        setToastMessage('Verification complete')
        setShowToast(true)
      } catch (err) {
        setCode(new Array(6).fill(''))
        setActiveIndex(0)
        inputRefs.current[0]?.focus()
      } finally {
        setIsVerifying(false)
      }
    }
  }, [code, onVerify, isVerifying, isSuccess])

  const handleResendClick = () => {
    if (!canResend || isVerifying || isSuccess) return
    setTimer(countdownSeconds)
    setCanResend(false)
    setCode(new Array(6).fill(''))
    setActiveIndex(0)
    setToastMessage('Verification code sent')
    setShowToast(true)
    inputRefs.current[0]?.focus()
    onResend()
  }

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.startsWith('234') && cleaned.length >= 13) {
      const rest = cleaned.slice(3)
      return `234 ${rest.slice(0, 3)}-${rest.slice(3, 6)}-${rest.slice(6, 10)}`
    }
    return phone.replace(/^\+/, '')
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-40 flex items-end justify-center sm:items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/40 sm:bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          onClick={onBack}
        />

        {/* Sheet / Modal */}
        <motion.div
          className="relative w-full sm:w-auto sm:min-w-[420px] sm:max-w-[480px] 
                     h-[92dvh] sm:h-auto sm:max-h-[90vh]
                     bg-white rounded-t-[40px] sm:rounded-[32px] 
                     px-5 sm:px-8 pt-8 pb-8 sm:pb-10 
                     flex flex-col overflow-hidden shadow-2xl"
          initial={{ y: '110%' }}
          animate={{ y: 0 }}
          exit={{ y: '110%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 220, mass: 1.2 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.15}
          onDragEnd={(_, info) => { if (info.offset.y > 150) onBack() }}
        >
          {/* Drag handle - mobile only */}
          <div className="flex justify-center mb-2 -mt-2 sm:hidden">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Back button */}
          <motion.button
            onClick={onBack}
            aria-label="Go back"
            className="absolute top-6 left-5 sm:left-6 w-10 h-10 rounded-full bg-[#1a0a2e] flex items-center justify-center text-white z-10"
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <BackIcon />
          </motion.button>

          {/* Content */}
          <div className="mt-12 sm:mt-14">
            <motion.h1
              className="text-[22px] sm:text-[28px] lg:text-[32px] font-extrabold text-gray-900 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              We just sent an SMS
            </motion.h1>

            <motion.div
              className="mt-3"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
                Enter the security code we sent to
              </p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-medium text-gray-900 sm:text-base">{formatPhone(phoneNumber)}</span>
                <button
                  onClick={onEditPhone}
                  className="text-[#6E43A3] font-semibold text-sm shrink-0 ml-3 hover:text-purple-800 transition-colors"
                >
                  Edit
                </button>
              </div>
            </motion.div>
          </div>

          {/* OTP Inputs */}
          <motion.div
            className="relative flex items-center justify-between gap-1.5 sm:gap-2.5 mt-6 sm:mt-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                disabled={isVerifying || isSuccess}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                onFocus={() => setActiveIndex(index)}
                className={`
                  w-10 h-12 
                  sm:w-12 sm:h-14 
                  md:w-14 md:h-16 
                  rounded-xl text-center text-lg sm:text-xl font-bold text-gray-900 
                  outline-none transition-all duration-200 disabled:opacity-50
                  ${activeIndex === index && !isVerifying && !isSuccess
                    ? 'border-2 border-[#6E43A3] shadow-[0_0_0_3px_rgba(110,67,163,0.15)]'
                    : digit ? 'border-2 border-gray-300' : 'border-2 border-gray-200'
                  }
                `}
              />
            ))}

            {/* Loading spinner overlay */}
            {isVerifying && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-gray-200 border-t-[#6E43A3] rounded-full animate-spin" />
              </div>
            )}
          </motion.div>

          {/* Resend section */}
          <motion.div
            className="flex items-center justify-between mt-6 sm:mt-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <p className="text-sm text-gray-900 sm:text-base">
              Didn't get the code?{' '}
              <button
                onClick={handleResendClick}
                disabled={!canResend || isVerifying || isSuccess}
                className={`font-semibold transition-colors ${
                  canResend && !isVerifying && !isSuccess
                    ? 'text-[#6E43A3] hover:text-purple-800'
                    : 'text-gray-300 cursor-not-allowed'
                }`}
              >
                Resend it
              </button>
            </p>

            {/* Timer badge */}
            {timer > 0 && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#6E43A3] flex items-center justify-center">
                  <ClockIcon />
                </div>
                <span className="text-sm font-semibold text-gray-900 sm:text-base">{timer}s</span>
              </div>
            )}
          </motion.div>

          <div className="flex-1 sm:flex-initial sm:mt-6" />

          {/* Toast notification */}
          <AnimatePresence>
            {showToast && (
              <motion.div
                className="flex items-center gap-3 px-4 py-3 mb-3 sm:px-5 sm:py-4 sm:mb-4 bg-purple-50 rounded-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#1a0a2e] flex items-center justify-center shrink-0">
                  <CheckIcon />
                </div>
                <span className="text-sm font-medium text-gray-900 sm:text-base">{toastMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>
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

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  )
}