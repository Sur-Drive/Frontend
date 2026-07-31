// import { useState, useMemo } from 'react'
// import { motion, AnimatePresence } from 'framer-motion'
// import { useSetPassword } from '../hooks/useAuth'

// interface CreatePasswordProps {
//   onBack?: () => void
//   onComplete: (password: string) => void
// }

// type Step = 'form' | 'loading' | 'success'
// type Strength = 'weak' | 'medium' | 'strong' | null

// export default function CreatePassword({
//   onBack,
//   onComplete,
// }: CreatePasswordProps) {
//   const [password, setPassword] = useState('')
//   const [confirmPassword, setConfirmPassword] = useState('')
//   const [showPassword, setShowPassword] = useState(false)
//   const [showConfirm, setShowConfirm] = useState(false)
//   const [step, setStep] = useState<Step>('form')
//   const [error, setError] = useState<string | null>(null)

//   const setPasswordMutation = useSetPassword()

//   const strength: Strength = useMemo(() => {
//     if (password.length === 0) return null
//     if (password.length < 8) return 'weak'
//     if (password.length < 12) return 'medium'
//     return 'strong'
//   }, [password])

//   const strengthMeta = {
//     weak: { width: '33%', color: 'bg-red-500', label: 'Weak' },
//     medium: { width: '66%', color: 'bg-yellow-400', label: 'Medium' },
//     strong: { width: '100%', color: 'bg-emerald-500', label: 'Strong' },
//   }

//   const bothFilled = password.length > 0 && confirmPassword.length > 0
//   const isMismatch = bothFilled && password !== confirmPassword
//   const isMatch = bothFilled && password === confirmPassword

//   const isValid = password.length >= 6 && confirmPassword.length >= 6 && password === confirmPassword

//   const confirmBorderClass = isMismatch
//     ? 'border-red-400 focus:ring-red-200 focus:border-red-400'
//     : isMatch
//     ? 'border-purple-300 focus:ring-purple-200 focus:border-[#6E43A3]'
//     : 'border-gray-200 focus:ring-purple-300 focus:border-[#6E43A3]'

//   const handleComplete = async () => {
//     if (!isValid) return
//     setError(null)
//     setStep('loading')

//     try {
//       await setPasswordMutation.mutateAsync({
//         password,
//         confirmPassword,
//       })
//       setStep('success')
//     } catch (err: any) {
//       console.error('Failed to set password:', err)
//       setError(err.message || 'Failed to set password. Please try again.')
//       setStep('form')
//     }
//   }

//   const handleStartExploring = () => {
//     onComplete(password)
//   }

//   return (
//     <AnimatePresence mode="wait">
//       {step !== 'success' ? (
//         <motion.div
//           key="form-sheet"
//           className="fixed inset-0 flex items-end justify-center z-[60]"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
//         >
//           {/* Backdrop */}
//           <motion.div
//             className="absolute inset-0 bg-black/40"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             transition={{ duration: 0.4 }}
//             onClick={step === 'form' ? onBack : undefined}
//           />

//           {/* Bottom Sheet */}
//           <motion.div
//             className="relative w-full max-w-[430px] bg-white rounded-t-[40px] px-4 sm:px-6 pt-5 sm:pt-8 pb-4 sm:pb-10 flex flex-col overflow-hidden"
//             style={{
//               height: '100%',
//               maxHeight: '100vh',
//             }}
//             initial={{ y: '110%' }}
//             animate={{ y: 0 }}
//             exit={{ y: '110%' }}
//             transition={{
//               type: 'spring',
//               damping: 30,
//               stiffness: 220,
//               mass: 1.2,
//             }}
//           >
//             {/* Drag Handle */}
//             <div className="flex justify-center mb-1 -mt-1 shrink-0">
//               <div className="w-10 h-1 bg-gray-300 rounded-full" />
//             </div>

//             {/* Back button */}
//             {onBack && (
//               <motion.button
//                 onClick={onBack}
//                 aria-label="Go back"
//                 disabled={step === 'loading'}
//                 className="absolute top-5 left-4 sm:left-6 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1a0a2e] flex items-center justify-center text-white disabled:opacity-40 z-10"
//                 whileTap={{ scale: 0.92 }}
//                 transition={{ type: 'spring', stiffness: 400, damping: 20 }}
//               >
//                 <BackIcon />
//               </motion.button>
//             )}

//             {/* Step progress dots */}
//             <div className="flex justify-center items-center gap-1.5 mt-1 shrink-0">
//               <div className="w-9 h-1.5 rounded-full bg-[#6E43A3]" />
//               <div className="w-9 h-1.5 rounded-full bg-purple-200" />
//             </div>

//             {/* Title */}
//             <div className="mt-4 sm:mt-6 shrink-0">
//               <motion.h1
//                 className="text-lg sm:text-2xl sm:text-[32px] font-extrabold text-gray-900 leading-tight"
//                 initial={{ opacity: 0, y: 30 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: 0.25, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
//               >
//                 Create your password
//               </motion.h1>

//               <motion.p
//                 className="mt-1 text-sm leading-relaxed text-gray-600 sm:mt-2 sm:text-base"
//                 initial={{ opacity: 0, y: 30 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: 0.32, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
//               >
//                 Create a strong password to protect your account.
//               </motion.p>
//             </div>

//             {/* Error message */}
//             <AnimatePresence>
//               {error && (
//                 <motion.div
//                   initial={{ opacity: 0, y: -10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   exit={{ opacity: 0, y: -10 }}
//                   className="p-2 mt-3 border border-red-200 sm:p-3 bg-red-50 rounded-xl shrink-0"
//                 >
//                   <p className="text-xs font-medium text-red-600 sm:text-sm">{error}</p>
//                 </motion.div>
//               )}
//             </AnimatePresence>

//             {/* Scrollable form + button */}
//             <div
//               className="relative flex-1 min-h-0 mt-3 overflow-y-auto sm:mt-4"
//               style={{
//                 WebkitOverflowScrolling: 'touch',
//                 overscrollBehavior: 'contain',
//                 touchAction: 'pan-y',
//                 scrollbarWidth: 'none',
//                 msOverflowStyle: 'none',
//               }}
//             >
//               <style>{`
//                 .hide-scrollbar::-webkit-scrollbar {
//                   display: none;
//                 }
//               `}</style>
//               <div className="hide-scrollbar">

//                 {/* Form fields */}
//                 <div
//                   className={`transition-all duration-300 ${
//                     step === 'loading' ? 'opacity-40 grayscale pointer-events-none' : ''
//                   }`}
//                 >
//                   {/* Enter Password */}
//                   <motion.div
//                     initial={{ opacity: 0, y: 30 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ delay: 0.4, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
//                   >
//                     <label className="text-sm font-medium text-gray-900 sm:text-lg">Enter Password</label>
//                     <div className="relative mt-2 sm:mt-3">
//                       <input
//                         type={showPassword ? 'text' : 'password'}
//                         value={password}
//                         onChange={(e) => {
//                           setPassword(e.target.value)
//                           setError(null)
//                         }}
//                         placeholder="Enter password"
//                         disabled={step === 'loading'}
//                         className={`w-full rounded-2xl bg-gray-50 border px-4 sm:px-5 py-3 sm:py-4 pr-12 sm:pr-14 text-base sm:text-lg text-gray-900 outline-none focus:ring-2 placeholder:text-gray-400 transition-colors ${
//                           password.length > 0 ? 'border-purple-300' : 'border-gray-200'
//                         } focus:ring-purple-300 focus:border-[#6E43A3]`}
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setShowPassword(!showPassword)}
//                         className="absolute text-gray-400 transition -translate-y-1/2 right-3 sm:right-5 top-1/2 hover:text-gray-600"
//                       >
//                         {showPassword ? <EyeOffIcon /> : <EyeIcon />}
//                       </button>
//                     </div>

//                     {strength && (
//                       <div className="mt-2 sm:mt-3">
//                         <div className="h-1.5 w-full rounded-full bg-purple-50 overflow-hidden">
//                           <motion.div
//                             className={`h-full rounded-full ${strengthMeta[strength].color}`}
//                             initial={{ width: 0 }}
//                             animate={{ width: strengthMeta[strength].width }}
//                             transition={{ duration: 0.3, ease: 'easeOut' }}
//                           />
//                         </div>
//                         <p className={`mt-1 text-xs font-medium ${
//                           strength === 'weak' ? 'text-red-500' :
//                           strength === 'medium' ? 'text-yellow-600' : 'text-emerald-600'
//                         }`}>
//                           {strengthMeta[strength].label}
//                         </p>
//                       </div>
//                     )}
//                   </motion.div>

//                   {/* Re-type Password */}
//                   <motion.div
//                     className="mt-4 sm:mt-6"
//                     initial={{ opacity: 0, y: 30 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ delay: 0.45, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
//                   >
//                     <label className="text-sm font-medium text-gray-900 sm:text-lg">Re-type Password</label>
//                     <div className="relative mt-2 sm:mt-3">
//                       <input
//                         type={showConfirm ? 'text' : 'password'}
//                         value={confirmPassword}
//                         onChange={(e) => {
//                           setConfirmPassword(e.target.value)
//                           setError(null)
//                         }}
//                         placeholder="Re-type password"
//                         disabled={step === 'loading'}
//                         className={`w-full rounded-2xl bg-gray-50 border px-4 sm:px-5 py-3 sm:py-4 pr-12 sm:pr-14 text-base sm:text-lg text-gray-900 outline-none focus:ring-2 placeholder:text-gray-400 transition-colors ${confirmBorderClass}`}
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setShowConfirm(!showConfirm)}
//                         className="absolute text-gray-400 transition -translate-y-1/2 right-3 sm:right-5 top-1/2 hover:text-gray-600"
//                       >
//                         {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
//                       </button>
//                     </div>

//                     {isMismatch && (
//                       <motion.p
//                         initial={{ opacity: 0, y: -4 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         className="mt-2 text-xs font-medium text-red-500 sm:text-sm"
//                       >
//                         Password does not match
//                       </motion.p>
//                     )}

//                     {isMatch && (
//                       <motion.p
//                         initial={{ opacity: 0, y: -4 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         className="mt-2 text-xs font-medium sm:text-sm text-emerald-600"
//                       >
//                         Passwords match
//                       </motion.p>
//                     )}
//                   </motion.div>
//                 </div>

//                 {/* Loading overlay */}
//                 {step === 'loading' && (
//                   <motion.div
//                     initial={{ opacity: 0 }}
//                     animate={{ opacity: 1 }}
//                     className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
//                   >
//                     <SpinnerIcon />
//                   </motion.div>
//                 )}

//                 {/* Complete Setup Button — inside scrollable area with large bottom padding */}
//                 <div className="pt-6 pb-24 sm:pb-8">
//                   <motion.button
//                     onClick={handleComplete}
//                     disabled={!isValid || step === 'loading'}
//                     className={`w-full h-12 sm:h-14 rounded-2xl font-semibold text-base sm:text-lg text-white transition-all ${
//                       isValid && step !== 'loading' ? 'bg-[#6E43A3]' : 'bg-purple-300 cursor-not-allowed'
//                     }`}
//                     whileTap={isValid && step !== 'loading' ? { scale: 0.97 } : {}}
//                     initial={{ opacity: 0, y: 30 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     transition={{ delay: 0.5, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
//                   >
//                     {step === 'loading' ? 'Setting up...' : 'Complete setup'}
//                   </motion.button>
//                 </div>

//               </div>
//             </div>
//           </motion.div>
//         </motion.div>
//       ) : (
//         <motion.div
//           key="success-screen"
//           className="fixed inset-0 z-40 flex items-end justify-center"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           transition={{ duration: 0.4 }}
//         >
//           {/* Backdrop */}
//           <motion.div
//             className="absolute inset-0 bg-black/40"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ duration: 0.4 }}
//           />

//           <motion.div
//             className="relative w-full max-w-[430px] bg-emerald-700 rounded-t-[40px] px-4 sm:px-6 pt-5 sm:pt-8 pb-4 sm:pb-10 flex flex-col items-center overflow-hidden shadow-2xl"
//             style={{
//               height: '100%',
//               maxHeight: '100vh',
//             }}
//             initial={{ y: '110%' }}
//             animate={{ y: 0 }}
//             transition={{ type: 'spring', damping: 30, stiffness: 220, mass: 1.2 }}
//           >
//             {/* Drag Handle */}
//             <div className="flex justify-center mb-1 -mt-1 shrink-0">
//               <div className="w-10 h-1 rounded-full bg-white/40" />
//             </div>

//             <motion.div
//               initial={{ scale: 0.4, opacity: 0 }}
//               animate={{ scale: 1, opacity: 1 }}
//               transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 18 }}
//               className="mt-10 sm:mt-20"
//             >
//               <CheckBadgeIcon />
//             </motion.div>

//             <motion.h1
//               initial={{ opacity: 0, y: 16 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.4, duration: 0.4 }}
//               className="mt-4 text-xl font-extrabold text-center text-white sm:mt-6 sm:text-3xl"
//             >
//               All done!
//             </motion.h1>

//             <motion.p
//               initial={{ opacity: 0, y: 16 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.48, duration: 0.4 }}
//               className="mt-2 sm:mt-3 text-sm sm:text-base text-white/90 text-center leading-relaxed max-w-[320px]"
//             >
//               Your account has been created. You're now ready to explore and enjoy all the features and benefits we have to offer.
//             </motion.p>

//             <div className="flex-1" />

//             <motion.button
//               onClick={handleStartExploring}
//               initial={{ opacity: 0, y: 20 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.55, duration: 0.4 }}
//               whileTap={{ scale: 0.97 }}
//               className="w-full h-12 text-base font-semibold bg-white sm:text-lg sm:h-14 rounded-2xl text-emerald-700"
//             >
//               Start exploring App
//             </motion.button>
//           </motion.div>
//         </motion.div>
//       )}
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

// function EyeIcon() {
//   return (
//     <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
//       <circle cx="12" cy="12" r="3" />
//     </svg>
//   )
// }

// function EyeOffIcon() {
//   return (
//     <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
//       <line x1="1" y1="1" x2="23" y2="23" />
//     </svg>
//   )
// }

// function SpinnerIcon() {
//   return (
//     <svg viewBox="0 0 24 24" className="w-8 h-8 text-gray-400 sm:w-10 sm:h-10 animate-spin" fill="none">
//       <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
//       <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
//     </svg>
//   )
// }

// function CheckBadgeIcon() {
//   return (
//     <svg viewBox="0 0 100 100" className="w-16 h-16 sm:w-24 sm:h-24">
//       <defs>
//         <radialGradient id="checkGradient" cx="35%" cy="30%" r="75%">
//           <stop offset="0%" stopColor="#6FE39B" />
//           <stop offset="100%" stopColor="#2AA35C" />
//         </radialGradient>
//       </defs>
//       <circle cx="50" cy="50" r="46" fill="url(#checkGradient)" />
//       <path
//         d="M32 52 L44 64 L70 36"
//         fill="none"
//         stroke="white"
//         strokeWidth="9"
//         strokeLinecap="round"
//         strokeLinejoin="round"
//       />
//     </svg>
//   )
// }
















import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSetPassword } from '../hooks/useAuth'

interface CreatePasswordProps {
  onBack?: () => void
  onComplete: (password: string) => void
}

type Step = 'form' | 'loading' | 'success'
type Strength = 'weak' | 'medium' | 'strong' | null

export default function CreatePassword({
  onBack,
  onComplete,
}: CreatePasswordProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [step, setStep] = useState<Step>('form')
  const [error, setError] = useState<string | null>(null)

  const setPasswordMutation = useSetPassword()

  const strength: Strength = useMemo(() => {
    if (password.length === 0) return null
    if (password.length < 8) return 'weak'
    if (password.length < 12) return 'medium'
    return 'strong'
  }, [password])

  const strengthMeta = {
    weak: { width: '33%', color: 'bg-red-500', label: 'Weak' },
    medium: { width: '66%', color: 'bg-yellow-400', label: 'Medium' },
    strong: { width: '100%', color: 'bg-emerald-500', label: 'Strong' },
  }

  const bothFilled = password.length > 0 && confirmPassword.length > 0
  const isMismatch = bothFilled && password !== confirmPassword
  const isMatch = bothFilled && password === confirmPassword

  const isValid = password.length >= 6 && confirmPassword.length >= 6 && password === confirmPassword

  const confirmBorderClass = isMismatch
    ? 'border-red-400 focus:ring-red-200 focus:border-red-400'
    : isMatch
    ? 'border-purple-300 focus:ring-purple-200 focus:border-[#6E43A3]'
    : 'border-gray-200 focus:ring-purple-300 focus:border-[#6E43A3]'

  const handleComplete = async () => {
    if (!isValid) return
    setError(null)
    setStep('loading')

    try {
      await setPasswordMutation.mutateAsync({
        password,
        confirmPassword,
      })
      setStep('success')
    } catch (err: any) {
      console.error('Failed to set password:', err)
      setError(err.message || 'Failed to set password. Please try again.')
      setStep('form')
    }
  }

  const handleStartExploring = () => {
    onComplete(password)
  }

  return (
    <AnimatePresence mode="wait">
      {step !== 'success' ? (
        <motion.div
          key="form-sheet"
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
            onClick={step === 'form' ? onBack : undefined}
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
            {onBack && (
              <motion.button
                onClick={onBack}
                aria-label="Go back"
                disabled={step === 'loading'}
                className="absolute top-5 left-4 sm:left-6 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1a0a2e] flex items-center justify-center text-white disabled:opacity-40 z-10"
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <BackIcon />
              </motion.button>
            )}

            {/* Step progress dots */}
            <div className="flex justify-center items-center gap-1.5 mt-1 shrink-0">
              <div className="w-9 h-1.5 rounded-full bg-[#6E43A3]" />
              <div className="w-9 h-1.5 rounded-full bg-purple-200" />
            </div>

            {/* Title */}
            <div className="mt-4 sm:mt-6 shrink-0">
              <motion.h1
                className="text-lg sm:text-2xl sm:text-[32px] font-extrabold text-gray-900 leading-tight"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                Create your password
              </motion.h1>

              <motion.p
                className="mt-1 text-sm leading-relaxed text-gray-600 sm:mt-2 sm:text-base"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                Create a strong password to protect your account.
              </motion.p>
            </div>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-2 mt-3 border border-red-200 sm:p-3 bg-red-50 rounded-xl shrink-0"
                >
                  <p className="text-xs font-medium text-red-600 sm:text-sm">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Scrollable form + button */}
            <div
              className="relative flex-1 min-h-0 mt-3 overflow-y-auto sm:mt-4"
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

                {/* Form fields */}
                <div
                  className={`transition-all duration-300 ${
                    step === 'loading' ? 'opacity-40 grayscale pointer-events-none' : ''
                  }`}
                >
                  {/* Enter Password */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <label className="text-sm font-medium text-gray-900 sm:text-lg">Enter Password</label>
                    <div className="relative mt-2 sm:mt-3">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          setError(null)
                        }}
                        placeholder="Enter password"
                        disabled={step === 'loading'}
                        className={`w-full rounded-2xl bg-gray-50 border px-4 sm:px-5 py-3 sm:py-4 pr-12 sm:pr-14 text-base sm:text-lg text-gray-900 outline-none focus:ring-2 placeholder:text-gray-400 transition-colors ${
                          password.length > 0 ? 'border-purple-300' : 'border-gray-200'
                        } focus:ring-purple-300 focus:border-[#6E43A3]`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute text-gray-400 transition -translate-y-1/2 right-3 sm:right-5 top-1/2 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>

                    {strength && (
                      <div className="mt-2 sm:mt-3">
                        <div className="h-1.5 w-full rounded-full bg-purple-50 overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${strengthMeta[strength].color}`}
                            initial={{ width: 0 }}
                            animate={{ width: strengthMeta[strength].width }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                          />
                        </div>
                        <p className={`mt-1 text-xs font-medium ${
                          strength === 'weak' ? 'text-red-500' :
                          strength === 'medium' ? 'text-yellow-600' : 'text-emerald-600'
                        }`}>
                          {strengthMeta[strength].label}
                        </p>
                      </div>
                    )}
                  </motion.div>

                  {/* Re-type Password */}
                  <motion.div
                    className="mt-4 sm:mt-6"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    <label className="text-sm font-medium text-gray-900 sm:text-lg">Re-type Password</label>
                    <div className="relative mt-2 sm:mt-3">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value)
                          setError(null)
                        }}
                        placeholder="Re-type password"
                        disabled={step === 'loading'}
                        className={`w-full rounded-2xl bg-gray-50 border px-4 sm:px-5 py-3 sm:py-4 pr-12 sm:pr-14 text-base sm:text-lg text-gray-900 outline-none focus:ring-2 placeholder:text-gray-400 transition-colors ${confirmBorderClass}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute text-gray-400 transition -translate-y-1/2 right-3 sm:right-5 top-1/2 hover:text-gray-600"
                      >
                        {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>

                    {isMismatch && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-xs font-medium text-red-500 sm:text-sm"
                      >
                        Password does not match
                      </motion.p>
                    )}

                    {isMatch && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-xs font-medium sm:text-sm text-emerald-600"
                      >
                        Passwords match
                      </motion.p>
                    )}
                  </motion.div>
                </div>

                {/* Loading overlay */}
                {step === 'loading' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
                  >
                    <SpinnerIcon />
                  </motion.div>
                )}

                {/* Complete Setup Button */}
                <div className="pt-6 pb-24 sm:pb-8">
                  <motion.button
                    onClick={handleComplete}
                    disabled={!isValid || step === 'loading'}
                    className={`w-full h-12 sm:h-14 rounded-2xl font-semibold text-base sm:text-lg text-white transition-all ${
                      isValid && step !== 'loading' ? 'bg-[#6E43A3]' : 'bg-purple-300 cursor-not-allowed'
                    }`}
                    whileTap={isValid && step !== 'loading' ? { scale: 0.97 } : {}}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    {step === 'loading' ? 'Setting up...' : 'Complete setup'}
                  </motion.button>
                </div>

              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="success-screen"
          className="fixed inset-0 z-40 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          />

          <motion.div
            className="relative w-full max-w-[430px] bg-emerald-700 rounded-t-[40px] px-4 sm:px-6 pt-5 sm:pt-8 pb-4 sm:pb-10 flex flex-col overflow-hidden"
            style={{
              height: '100%',
              maxHeight: '100vh',
            }}
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 220, mass: 1.2 }}
          >
            {/* Drag Handle */}
            <div className="flex justify-center mb-1 -mt-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-white/40" />
            </div>

            {/* Scrollable content area */}
            <div
              className="flex-1 w-full min-h-0 overflow-y-auto"
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
              <div className="flex flex-col items-center min-h-full pb-24 hide-scrollbar sm:pb-8">
                <motion.div
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 18 }}
                  className="mt-10 sm:mt-20"
                >
                  <CheckBadgeIcon />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.4 }}
                  className="mt-4 text-xl font-extrabold text-center text-white sm:mt-6 sm:text-3xl"
                >
                  All done!
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.48, duration: 0.4 }}
                  className="mt-2 sm:mt-3 text-sm sm:text-base text-white/90 text-center leading-relaxed max-w-[320px]"
                >
                  Your account has been created. You're now ready to explore and enjoy all the features and benefits we have to offer.
                </motion.p>

                {/* Spacer pushes button to bottom when there's room */}
                <div className="flex-1 min-h-[40px]" />

                {/* Button — always reachable by scrolling */}
                <div className="w-full pt-6">
                  <motion.button
                    onClick={handleStartExploring}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55, duration: 0.4 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full h-12 text-base font-semibold bg-white sm:text-lg sm:h-14 rounded-2xl text-emerald-700"
                  >
                    Start exploring App
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
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

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8 text-gray-400 sm:w-10 sm:h-10 animate-spin" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function CheckBadgeIcon() {
  return (
    <svg viewBox="0 0 100 100" className="w-16 h-16 sm:w-24 sm:h-24">
      <defs>
        <radialGradient id="checkGradient" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#6FE39B" />
          <stop offset="100%" stopColor="#2AA35C" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#checkGradient)" />
      <path
        d="M32 52 L44 64 L70 36"
        fill="none"
        stroke="white"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}


