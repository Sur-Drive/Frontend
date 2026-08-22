// import { useState, useRef, useEffect } from 'react'
// import { motion, AnimatePresence } from 'framer-motion'
// import { useVerifyResetOtp } from '../hooks/useAuth'

// interface VerifyResetOtpModalProps {
//   phoneNumber: string
//   onClose: () => void
//   onBack: () => void
//   onVerifySuccess: () => void
// }

// export default function VerifyResetOtpModal({
//   phoneNumber,
//   onClose,
//   onBack,
//   onVerifySuccess,
// }: VerifyResetOtpModalProps) {
//   const [otp, setOtp] = useState(['', '', '', '', '', ''])
//   const inputRefs = useRef<(HTMLInputElement | null)[]>([])
//   const verifyResetOtp = useVerifyResetOtp()

//   const isComplete = otp.every((d) => d !== '')

//   // Handle both phone (+234...) and email identifiers
//   const isEmail = phoneNumber?.includes('@')
//   const displayIdentifier = isEmail
//     ? phoneNumber
//     : phoneNumber?.replace(/(\+\d{3})(\d{3})(\d{4})/, '$1 *** $3') || 'your phone'

//   useEffect(() => {
//     inputRefs.current[0]?.focus()
//   }, [])

//   const handleChange = (index: number, value: string) => {
//     if (!/^\d*$/.test(value)) return

//     const newOtp = [...otp]
//     newOtp[index] = value.slice(-1)
//     setOtp(newOtp)

//     if (value && index < 5) {
//       inputRefs.current[index + 1]?.focus()
//     }
//   }

//   const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
//     if (e.key === 'Backspace' && !otp[index] && index > 0) {
//       inputRefs.current[index - 1]?.focus()
//     }
//   }

//   const handlePaste = (e: React.ClipboardEvent) => {
//     e.preventDefault()
//     const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
//     if (!pasted) return

//     const newOtp = [...otp]
//     pasted.split('').forEach((digit, i) => {
//       if (i < 6) newOtp[i] = digit
//     })
//     setOtp(newOtp)

//     const focusIndex = Math.min(pasted.length, 5)
//     inputRefs.current[focusIndex]?.focus()
//   }

//   const handleSubmit = async () => {
//     if (!isComplete || verifyResetOtp.isPending) return

//     const otpString = otp.join('')
//     try {
//       await verifyResetOtp.mutateAsync({ identifier: phoneNumber, otp: otpString })
//       onVerifySuccess()
//     } catch (err: any) {
//       console.error('Verify reset OTP failed:', err)
//       setOtp(['', '', '', '', '', ''])
//       inputRefs.current[0]?.focus()
//     }
//   }

//   return (
//     <AnimatePresence>
//       <motion.div
//         className="fixed inset-0 flex items-end justify-center z-[60]"
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
//       >
//         {/* Backdrop */}
//         <motion.div
//           className="absolute inset-0 bg-black/40"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           transition={{ duration: 0.4 }}
//           onClick={onClose}
//         />

//         {/* Bottom Sheet */}
//         <motion.div
//           className="relative w-full max-w-[430px] bg-white rounded-t-[40px] px-4 sm:px-6 pt-5 sm:pt-8 pb-4 sm:pb-10 flex flex-col overflow-hidden"
//           style={{
//             height: '100%',
//             maxHeight: '100vh',
//           }}
//           initial={{ y: '110%' }}
//           animate={{ y: 0 }}
//           exit={{ y: '110%' }}
//           transition={{
//             type: 'spring',
//             damping: 30,
//             stiffness: 220,
//             mass: 1.2,
//           }}
//         >
//           {/* Drag Handle */}
//           <div className="flex justify-center mb-1 -mt-1 shrink-0">
//             <div className="w-10 h-1 bg-gray-300 rounded-full" />
//           </div>

//           {/* Back button */}
//           <motion.button
//             onClick={onBack}
//             aria-label="Go back"
//             className="absolute top-5 left-4 sm:left-6 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1a0a2e] flex items-center justify-center text-white z-10"
//             whileTap={{ scale: 0.92 }}
//             transition={{ type: 'spring', stiffness: 400, damping: 20 }}
//           >
//             <BackIcon />
//           </motion.button>

//           {/* Close button */}
//           <motion.button
//             onClick={onClose}
//             aria-label="Close"
//             className="absolute flex items-center justify-center text-gray-500 bg-gray-100 rounded-full top-5 right-4 sm:right-6 w-9 h-9"
//             whileTap={{ scale: 0.92 }}
//             transition={{ type: 'spring', stiffness: 400, damping: 20 }}
//           >
//             <CloseIcon />
//           </motion.button>

//           {/* Title */}
//           <div className="mt-4 sm:mt-6 shrink-0">
//             <motion.h1
//               className="text-xl sm:text-2xl sm:text-[32px] font-extrabold text-gray-900 leading-tight"
//               initial={{ opacity: 0, y: 30 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.25, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
//             >
//               Verify Code
//             </motion.h1>

//             <motion.p
//               className="mt-1 text-sm leading-relaxed text-gray-600 sm:mt-2 sm:text-base"
//               initial={{ opacity: 0, y: 30 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{ delay: 0.32, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
//             >
//               We sent a verification code to{' '}
//               <span className="font-semibold text-gray-900 break-all">{displayIdentifier}</span>.
//               Enter the 6-digit code below to continue.
//             </motion.p>
//           </div>

//           {/* Scrollable content + button */}
//           <div
//             className="relative flex-1 min-h-0 mt-4 overflow-y-auto sm:mt-6"
//             style={{
//               WebkitOverflowScrolling: 'touch',
//               overscrollBehavior: 'contain',
//               touchAction: 'pan-y',
//               scrollbarWidth: 'none',
//               msOverflowStyle: 'none',
//             }}
//           >
//             <style>{`
//               .hide-scrollbar::-webkit-scrollbar {
//                 display: none;
//               }
//             `}</style>
//             <div className="hide-scrollbar">

//               {/* OTP Inputs */}
//               <motion.div
//                 className="flex justify-center gap-2 sm:gap-3"
//                 initial={{ opacity: 0, y: 30 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ delay: 0.4, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
//                 onPaste={handlePaste}
//               >
//                 {otp.map((digit, index) => (
//                   <input
//                     key={index}
//                     ref={(el) => { inputRefs.current[index] = el }}
//                     type="text"
//                     inputMode="numeric"
//                     maxLength={1}
//                     value={digit}
//                     onChange={(e) => handleChange(index, e.target.value)}
//                     onKeyDown={(e) => handleKeyDown(index, e)}
//                     className={`w-10 h-12 sm:w-12 sm:h-14 text-xl sm:text-2xl font-bold text-center rounded-2xl border-2 outline-none transition-all ${
//                       digit
//                         ? 'border-[#6E43A3] bg-purple-50 text-[#6E43A3]'
//                         : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-[#6E43A3] focus:ring-2 focus:ring-purple-300'
//                     }`}
//                   />
//                 ))}
//               </motion.div>

//               {verifyResetOtp.isError && (
//                 <motion.p
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   className="mt-4 text-xs text-center text-red-500 sm:text-sm"
//                 >
//                   {(verifyResetOtp.error as Error)?.message || 'Invalid code. Please try again.'}
//                 </motion.p>
//               )}

//               <motion.p
//                 className="mt-6 text-sm text-center text-gray-600 sm:text-base"
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 transition={{ delay: 0.5 }}
//               >
//                 Didn&apos;t receive it?{' '}
//                 <button
//                   onClick={() => {
//                     // Resend logic
//                   }}
//                   className="text-[#6E43A3] font-semibold"
//                 >
//                   Resend code
//                 </button>
//               </motion.p>

//               {/* Verify button */}
//               <div className="pt-6 pb-24 sm:pb-8">
//                 <motion.button
//                   onClick={handleSubmit}
//                   disabled={!isComplete || verifyResetOtp.isPending}
//                   className={`w-full h-12 sm:h-14 rounded-2xl font-semibold text-base sm:text-lg text-white transition-all flex items-center justify-center ${
//                     isComplete && !verifyResetOtp.isPending ? 'bg-[#6E43A3]' : 'bg-purple-300 cursor-not-allowed'
//                   }`}
//                   whileTap={isComplete && !verifyResetOtp.isPending ? { scale: 0.97 } : {}}
//                   initial={{ opacity: 0, y: 30 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ delay: 0.55, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
//                 >
//                   {verifyResetOtp.isPending ? <Spinner /> : 'Verify'}
//                 </motion.button>
//               </div>

//             </div>
//           </div>
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

// function CloseIcon() {
//   return (
//     <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
//       <path d="M6 6l12 12M18 6L6 18" />
//     </svg>
//   )
// }

// function Spinner() {
//   return (
//     <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
//       <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.35)" strokeWidth="3" />
//       <path d="M21 12a9 9 0 0 0-9-9" stroke="white" strokeWidth="3" strokeLinecap="round" />
//     </svg>
//   )
// }

// import { useState, useRef, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { useVerifyResetOtp } from "../hooks/useAuth";

// interface VerifyResetOtpModalProps {
//   phoneNumber: string;
//   sessionId: string;
//   onClose: () => void;
//   onBack: () => void;
//   onVerifySuccess: () => void;
// }

// export default function VerifyResetOtpModal({
//   phoneNumber,
//   sessionId,
//   onClose,
//   onBack,
//   onVerifySuccess,
// }: VerifyResetOtpModalProps) {
//   const [otp, setOtp] = useState(["", "", "", "", "", ""]);
//   const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
//   const verifyResetOtp = useVerifyResetOtp();

//   const isComplete = otp.every((d) => d !== "");

//   // Handle both phone (+234...) and email identifiers
//   const isEmail = phoneNumber?.includes("@");
//   const displayIdentifier = isEmail
//     ? phoneNumber
//     : phoneNumber?.replace(/(\+\d{3})(\d{3})(\d{4})/, "$1 *** $3") ||
//       "your phone";

//   useEffect(() => {
//     inputRefs.current[0]?.focus();
//   }, []);

//   const handleChange = (index: number, value: string) => {
//     if (!/^\d*$/.test(value)) return;

//     const newOtp = [...otp];
//     newOtp[index] = value.slice(-1);
//     setOtp(newOtp);

//     if (value && index < 5) {
//       inputRefs.current[index + 1]?.focus();
//     }
//   };

//   const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
//     if (e.key === "Backspace" && !otp[index] && index > 0) {
//       inputRefs.current[index - 1]?.focus();
//     }
//   };

//   const handlePaste = (e: React.ClipboardEvent) => {
//     e.preventDefault();
//     const pasted = e.clipboardData
//       .getData("text")
//       .replace(/\D/g, "")
//       .slice(0, 6);
//     if (!pasted) return;

//     const newOtp = [...otp];
//     pasted.split("").forEach((digit, i) => {
//       if (i < 6) newOtp[i] = digit;
//     });
//     setOtp(newOtp);

//     const focusIndex = Math.min(pasted.length, 5);
//     inputRefs.current[focusIndex]?.focus();
//   };

//   const handleSubmit = async () => {
//     if (!isComplete || verifyResetOtp.isPending) return;

//     const otpString = otp.join("");
//     try {
//       await verifyResetOtp.mutateAsync({
//         identifier: phoneNumber,
//         otp: otpString,
//         sessionId,
//       });
//       onVerifySuccess();
//     } catch (err: any) {
//       console.error("Verify reset OTP failed:", err);
//       setOtp(["", "", "", "", "", ""]);
//       inputRefs.current[0]?.focus();
//     }
//   };

//   return (
//     <AnimatePresence>
//       <motion.div
//         className="fixed inset-0 flex items-end justify-center z-[60]"
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
//       >
//         {/* Backdrop */}
//         <motion.div
//           className="absolute inset-0 bg-black/40"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           transition={{ duration: 0.4 }}
//           onClick={onClose}
//         />

//         {/* Bottom Sheet */}
//         <motion.div
//           className="relative w-full max-w-[430px] bg-white rounded-t-[40px] px-4 sm:px-6 pt-5 sm:pt-8 pb-4 sm:pb-10 flex flex-col overflow-hidden"
//           style={{
//             height: "100%",
//             maxHeight: "100vh",
//           }}
//           initial={{ y: "110%" }}
//           animate={{ y: 0 }}
//           exit={{ y: "110%" }}
//           transition={{
//             type: "spring",
//             damping: 30,
//             stiffness: 220,
//             mass: 1.2,
//           }}
//         >
//           {/* Drag Handle */}
//           <div className="flex justify-center mb-1 -mt-1 shrink-0">
//             <div className="w-10 h-1 bg-gray-300 rounded-full" />
//           </div>

//           {/* Back button */}
//           <motion.button
//             onClick={onBack}
//             aria-label="Go back"
//             className="absolute top-5 left-4 sm:left-6 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1a0a2e] flex items-center justify-center text-white z-10"
//             whileTap={{ scale: 0.92 }}
//             transition={{ type: "spring", stiffness: 400, damping: 20 }}
//           >
//             <BackIcon />
//           </motion.button>

//           {/* Close button */}
//           <motion.button
//             onClick={onClose}
//             aria-label="Close"
//             className="absolute flex items-center justify-center text-gray-500 bg-gray-100 rounded-full top-5 right-4 sm:right-6 w-9 h-9"
//             whileTap={{ scale: 0.92 }}
//             transition={{ type: "spring", stiffness: 400, damping: 20 }}
//           >
//             <CloseIcon />
//           </motion.button>

//           {/* Title */}
//           <div className="mt-4 sm:mt-6 shrink-0">
//             <motion.h1
//               className="text-xl sm:text-2xl sm:text-[32px] font-extrabold text-gray-900 leading-tight"
//               initial={{ opacity: 0, y: 30 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{
//                 delay: 0.25,
//                 duration: 0.5,
//                 ease: [0.25, 0.46, 0.45, 0.94],
//               }}
//             >
//               Verify Code
//             </motion.h1>

//             <motion.p
//               className="mt-1 text-sm leading-relaxed text-gray-600 sm:mt-2 sm:text-base"
//               initial={{ opacity: 0, y: 30 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{
//                 delay: 0.32,
//                 duration: 0.5,
//                 ease: [0.25, 0.46, 0.45, 0.94],
//               }}
//             >
//               We sent a verification code to{" "}
//               <span className="font-semibold text-gray-900 break-all">
//                 {displayIdentifier}
//               </span>
//               . Enter the 6-digit code below to continue.
//             </motion.p>
//           </div>

//           {/* Scrollable content + button */}
//           <div
//             className="relative flex-1 min-h-0 mt-4 overflow-y-auto sm:mt-6"
//             style={{
//               WebkitOverflowScrolling: "touch",
//               overscrollBehavior: "contain",
//               touchAction: "pan-y",
//               scrollbarWidth: "none",
//               msOverflowStyle: "none",
//             }}
//           >
//             <style>{`
//               .hide-scrollbar::-webkit-scrollbar {
//                 display: none;
//               }
//             `}</style>
//             <div className="hide-scrollbar">
//               {/* OTP Inputs */}
//               <motion.div
//                 className="flex justify-center gap-2 sm:gap-3"
//                 initial={{ opacity: 0, y: 30 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{
//                   delay: 0.4,
//                   duration: 0.5,
//                   ease: [0.25, 0.46, 0.45, 0.94],
//                 }}
//                 onPaste={handlePaste}
//               >
//                 {otp.map((digit, index) => (
//                   <input
//                     key={index}
//                     ref={(el) => {
//                       inputRefs.current[index] = el;
//                     }}
//                     type="text"
//                     inputMode="numeric"
//                     maxLength={1}
//                     value={digit}
//                     onChange={(e) => handleChange(index, e.target.value)}
//                     onKeyDown={(e) => handleKeyDown(index, e)}
//                     className={`w-10 h-12 sm:w-12 sm:h-14 text-xl sm:text-2xl font-bold text-center rounded-2xl border-2 outline-none transition-all ${
//                       digit
//                         ? "border-[#6E43A3] bg-purple-50 text-[#6E43A3]"
//                         : "border-gray-200 bg-gray-50 text-gray-900 focus:border-[#6E43A3] focus:ring-2 focus:ring-purple-300"
//                     }`}
//                   />
//                 ))}
//               </motion.div>

//               {verifyResetOtp.isError && (
//                 <motion.p
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   className="mt-4 text-xs text-center text-red-500 sm:text-sm"
//                 >
//                   {(verifyResetOtp.error as Error)?.message ||
//                     "Invalid code. Please try again."}
//                 </motion.p>
//               )}

//               <motion.p
//                 className="mt-6 text-sm text-center text-gray-600 sm:text-base"
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 transition={{ delay: 0.5 }}
//               >
//                 Didn&apos;t receive it?{" "}
//                 <button
//                   onClick={() => {
//                     // Resend logic
//                   }}
//                   className="text-[#6E43A3] font-semibold"
//                 >
//                   Resend code
//                 </button>
//               </motion.p>

//               {/* Verify button */}
//               <div className="pt-6 pb-24 sm:pb-8">
//                 <motion.button
//                   onClick={handleSubmit}
//                   disabled={!isComplete || verifyResetOtp.isPending}
//                   className={`w-full h-12 sm:h-14 rounded-2xl font-semibold text-base sm:text-lg text-white transition-all flex items-center justify-center ${
//                     isComplete && !verifyResetOtp.isPending
//                       ? "bg-[#6E43A3]"
//                       : "bg-purple-300 cursor-not-allowed"
//                   }`}
//                   whileTap={
//                     isComplete && !verifyResetOtp.isPending
//                       ? { scale: 0.97 }
//                       : {}
//                   }
//                   initial={{ opacity: 0, y: 30 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{
//                     delay: 0.55,
//                     duration: 0.5,
//                     ease: [0.25, 0.46, 0.45, 0.94],
//                   }}
//                 >
//                   {verifyResetOtp.isPending ? <Spinner /> : "Verify"}
//                 </motion.button>
//               </div>
//             </div>
//           </div>
//         </motion.div>
//       </motion.div>
//     </AnimatePresence>
//   );
// }

// function BackIcon() {
//   return (
//     <svg
//       viewBox="0 0 24 24"
//       className="w-5 h-5"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2.5"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     >
//       <path d="M15 18l-6-6 6-6" />
//     </svg>
//   );
// }

// function CloseIcon() {
//   return (
//     <svg
//       viewBox="0 0 24 24"
//       className="w-4 h-4"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2.4"
//       strokeLinecap="round"
//     >
//       <path d="M6 6l12 12M18 6L6 18" />
//     </svg>
//   );
// }

// function Spinner() {
//   return (
//     <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
//       <circle
//         cx="12"
//         cy="12"
//         r="9"
//         stroke="rgba(255,255,255,0.35)"
//         strokeWidth="3"
//       />
//       <path
//         d="M21 12a9 9 0 0 0-9-9"
//         stroke="white"
//         strokeWidth="3"
//         strokeLinecap="round"
//       />
//     </svg>
//   );
// }

// import { useState, useRef, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { useVerifyResetOtp, useForgotPassword } from "../hooks/useAuth";

// interface VerifyResetOtpModalProps {
//   phoneNumber: string;
//   sessionId: string;
//   onClose: () => void;
//   onBack: () => void;
//   onVerifySuccess: () => void;
//   onSessionRefresh?: (sessionId: string) => void;
// }

// export default function VerifyResetOtpModal({
//   phoneNumber,
//   sessionId,
//   onClose,
//   onBack,
//   onVerifySuccess,
//   onSessionRefresh,
// }: VerifyResetOtpModalProps) {
//   const [otp, setOtp] = useState(["", "", "", "", "", ""]);
//   const [resendError, setResendError] = useState<string | null>(null);
//   const [resendSuccess, setResendSuccess] = useState(false);
//   const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
//   const verifyResetOtp = useVerifyResetOtp();
//   const forgotPassword = useForgotPassword();

//   const isComplete = otp.every((d) => d !== "");

//   // Handle both phone (+234...) and email identifiers
//   const isEmail = phoneNumber?.includes("@");
//   const displayIdentifier = isEmail
//     ? phoneNumber
//     : phoneNumber?.replace(/(\+\d{3})(\d{3})(\d{4})/, "$1 *** $3") ||
//       "your phone";

//   useEffect(() => {
//     inputRefs.current[0]?.focus();
//   }, []);

//   const handleChange = (index: number, value: string) => {
//     if (!/^\d*$/.test(value)) return;

//     const newOtp = [...otp];
//     newOtp[index] = value.slice(-1);
//     setOtp(newOtp);

//     if (value && index < 5) {
//       inputRefs.current[index + 1]?.focus();
//     }
//   };

//   const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
//     if (e.key === "Backspace" && !otp[index] && index > 0) {
//       inputRefs.current[index - 1]?.focus();
//     }
//   };

//   const handlePaste = (e: React.ClipboardEvent) => {
//     e.preventDefault();
//     const pasted = e.clipboardData
//       .getData("text")
//       .replace(/\D/g, "")
//       .slice(0, 6);
//     if (!pasted) return;

//     const newOtp = [...otp];
//     pasted.split("").forEach((digit, i) => {
//       if (i < 6) newOtp[i] = digit;
//     });
//     setOtp(newOtp);

//     const focusIndex = Math.min(pasted.length, 5);
//     inputRefs.current[focusIndex]?.focus();
//   };

//   const handleSubmit = async () => {
//     if (!isComplete || verifyResetOtp.isPending) return;

//     const otpString = otp.join("");
//     try {
//       await verifyResetOtp.mutateAsync({
//         identifier: phoneNumber,
//         otp: otpString,
//         sessionId,
//       });
//       onVerifySuccess();
//     } catch (err: any) {
//       console.error("Verify reset OTP failed:", err);
//       setOtp(["", "", "", "", "", ""]);
//       inputRefs.current[0]?.focus();
//     }
//   };

//   // Requests a fresh code AND a fresh session token — the old sessionId
//   // becomes stale the moment a new one is issued, so verifying against it
//   // afterward would fail with "Invalid or expired session token" even with
//   // the right OTP. onSessionRefresh lets the parent update its stored
//   // sessionId so the next submit uses the current one.
//   const handleResend = async () => {
//     if (forgotPassword.isPending) return;
//     setResendError(null);
//     setResendSuccess(false);
//     try {
//       const data = await forgotPassword.mutateAsync({
//         identifier: phoneNumber,
//       });
//       const newSessionId = data?.sessionId;
//       if (!newSessionId) {
//         setResendError("Something went wrong. Please try again.");
//         return;
//       }
//       onSessionRefresh?.(newSessionId);
//       setOtp(["", "", "", "", "", ""]);
//       inputRefs.current[0]?.focus();
//       setResendSuccess(true);
//     } catch (err: any) {
//       setResendError(
//         err?.message || "Failed to resend code. Please try again.",
//       );
//     }
//   };

//   return (
//     <AnimatePresence>
//       <motion.div
//         className="fixed inset-0 flex items-end justify-center z-[60]"
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
//       >
//         {/* Backdrop */}
//         <motion.div
//           className="absolute inset-0 bg-black/40"
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           transition={{ duration: 0.4 }}
//           onClick={onClose}
//         />

//         {/* Bottom Sheet */}
//         <motion.div
//           className="relative w-full max-w-[430px] bg-white rounded-t-[40px] px-4 sm:px-6 pt-5 sm:pt-8 pb-4 sm:pb-10 flex flex-col overflow-hidden"
//           style={{
//             height: "100%",
//             maxHeight: "100vh",
//           }}
//           initial={{ y: "110%" }}
//           animate={{ y: 0 }}
//           exit={{ y: "110%" }}
//           transition={{
//             type: "spring",
//             damping: 30,
//             stiffness: 220,
//             mass: 1.2,
//           }}
//         >
//           {/* Drag Handle */}
//           <div className="flex justify-center mb-1 -mt-1 shrink-0">
//             <div className="w-10 h-1 bg-gray-300 rounded-full" />
//           </div>

//           {/* Back button */}
//           <motion.button
//             onClick={onBack}
//             aria-label="Go back"
//             className="absolute top-5 left-4 sm:left-6 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1a0a2e] flex items-center justify-center text-white z-10"
//             whileTap={{ scale: 0.92 }}
//             transition={{ type: "spring", stiffness: 400, damping: 20 }}
//           >
//             <BackIcon />
//           </motion.button>

//           {/* Close button */}
//           <motion.button
//             onClick={onClose}
//             aria-label="Close"
//             className="absolute flex items-center justify-center text-gray-500 bg-gray-100 rounded-full top-5 right-4 sm:right-6 w-9 h-9"
//             whileTap={{ scale: 0.92 }}
//             transition={{ type: "spring", stiffness: 400, damping: 20 }}
//           >
//             <CloseIcon />
//           </motion.button>

//           {/* Title */}
//           <div className="mt-4 sm:mt-6 shrink-0">
//             <motion.h1
//               className="text-xl sm:text-2xl sm:text-[32px] font-extrabold text-gray-900 leading-tight"
//               initial={{ opacity: 0, y: 30 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{
//                 delay: 0.25,
//                 duration: 0.5,
//                 ease: [0.25, 0.46, 0.45, 0.94],
//               }}
//             >
//               Verify Code
//             </motion.h1>

//             <motion.p
//               className="mt-1 text-sm leading-relaxed text-gray-600 sm:mt-2 sm:text-base"
//               initial={{ opacity: 0, y: 30 }}
//               animate={{ opacity: 1, y: 0 }}
//               transition={{
//                 delay: 0.32,
//                 duration: 0.5,
//                 ease: [0.25, 0.46, 0.45, 0.94],
//               }}
//             >
//               We sent a verification code to{" "}
//               <span className="font-semibold text-gray-900 break-all">
//                 {displayIdentifier}
//               </span>
//               . Enter the 6-digit code below to continue.
//             </motion.p>
//           </div>

//           {/* Scrollable content + button */}
//           <div
//             className="relative flex-1 min-h-0 mt-4 overflow-y-auto sm:mt-6"
//             style={{
//               WebkitOverflowScrolling: "touch",
//               overscrollBehavior: "contain",
//               touchAction: "pan-y",
//               scrollbarWidth: "none",
//               msOverflowStyle: "none",
//             }}
//           >
//             <style>{`
//               .hide-scrollbar::-webkit-scrollbar {
//                 display: none;
//               }
//             `}</style>
//             <div className="hide-scrollbar">
//               {/* OTP Inputs */}
//               <motion.div
//                 className="flex justify-center gap-2 sm:gap-3"
//                 initial={{ opacity: 0, y: 30 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{
//                   delay: 0.4,
//                   duration: 0.5,
//                   ease: [0.25, 0.46, 0.45, 0.94],
//                 }}
//                 onPaste={handlePaste}
//               >
//                 {otp.map((digit, index) => (
//                   <input
//                     key={index}
//                     ref={(el) => {
//                       inputRefs.current[index] = el;
//                     }}
//                     type="text"
//                     inputMode="numeric"
//                     maxLength={1}
//                     value={digit}
//                     onChange={(e) => handleChange(index, e.target.value)}
//                     onKeyDown={(e) => handleKeyDown(index, e)}
//                     className={`w-10 h-12 sm:w-12 sm:h-14 text-xl sm:text-2xl font-bold text-center rounded-2xl border-2 outline-none transition-all ${
//                       digit
//                         ? "border-[#6E43A3] bg-purple-50 text-[#6E43A3]"
//                         : "border-gray-200 bg-gray-50 text-gray-900 focus:border-[#6E43A3] focus:ring-2 focus:ring-purple-300"
//                     }`}
//                   />
//                 ))}
//               </motion.div>

//               {verifyResetOtp.isError && (
//                 <motion.p
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   className="mt-4 text-xs text-center text-red-500 sm:text-sm"
//                 >
//                   {(verifyResetOtp.error as Error)?.message ||
//                     "Invalid code. Please try again."}
//                 </motion.p>
//               )}

//               {resendError && (
//                 <motion.p
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   className="mt-4 text-xs text-center text-red-500 sm:text-sm"
//                 >
//                   {resendError}
//                 </motion.p>
//               )}

//               {resendSuccess && !resendError && (
//                 <motion.p
//                   initial={{ opacity: 0, y: 10 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   className="mt-4 text-xs text-center text-emerald-600 sm:text-sm"
//                 >
//                   A new code has been sent.
//                 </motion.p>
//               )}

//               <motion.p
//                 className="mt-6 text-sm text-center text-gray-600 sm:text-base"
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 transition={{ delay: 0.5 }}
//               >
//                 Didn&apos;t receive it?{" "}
//                 <button
//                   onClick={handleResend}
//                   disabled={forgotPassword.isPending}
//                   className="text-[#6E43A3] font-semibold disabled:opacity-50"
//                 >
//                   {forgotPassword.isPending ? "Sending..." : "Resend code"}
//                 </button>
//               </motion.p>

//               {/* Verify button */}
//               <div className="pt-6 pb-24 sm:pb-8">
//                 <motion.button
//                   onClick={handleSubmit}
//                   disabled={!isComplete || verifyResetOtp.isPending}
//                   className={`w-full h-12 sm:h-14 rounded-2xl font-semibold text-base sm:text-lg text-white transition-all flex items-center justify-center ${
//                     isComplete && !verifyResetOtp.isPending
//                       ? "bg-[#6E43A3]"
//                       : "bg-purple-300 cursor-not-allowed"
//                   }`}
//                   whileTap={
//                     isComplete && !verifyResetOtp.isPending
//                       ? { scale: 0.97 }
//                       : {}
//                   }
//                   initial={{ opacity: 0, y: 30 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{
//                     delay: 0.55,
//                     duration: 0.5,
//                     ease: [0.25, 0.46, 0.45, 0.94],
//                   }}
//                 >
//                   {verifyResetOtp.isPending ? <Spinner /> : "Verify"}
//                 </motion.button>
//               </div>
//             </div>
//           </div>
//         </motion.div>
//       </motion.div>
//     </AnimatePresence>
//   );
// }

// function BackIcon() {
//   return (
//     <svg
//       viewBox="0 0 24 24"
//       className="w-5 h-5"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2.5"
//       strokeLinecap="round"
//       strokeLinejoin="round"
//     >
//       <path d="M15 18l-6-6 6-6" />
//     </svg>
//   );
// }

// function CloseIcon() {
//   return (
//     <svg
//       viewBox="0 0 24 24"
//       className="w-4 h-4"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="2.4"
//       strokeLinecap="round"
//     >
//       <path d="M6 6l12 12M18 6L6 18" />
//     </svg>
//   );
// }

// function Spinner() {
//   return (
//     <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
//       <circle
//         cx="12"
//         cy="12"
//         r="9"
//         stroke="rgba(255,255,255,0.35)"
//         strokeWidth="3"
//       />
//       <path
//         d="M21 12a9 9 0 0 0-9-9"
//         stroke="white"
//         strokeWidth="3"
//         strokeLinecap="round"
//       />
//     </svg>
//   );
// }

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVerifyResetOtp, useForgotPassword } from "../hooks/useAuth";

interface VerifyResetOtpModalProps {
  phoneNumber: string;
  sessionId: string;
  onClose: () => void;
  onBack: () => void;
  onVerifySuccess: () => void;
  onSessionRefresh?: (sessionId: string) => void;
}

export default function VerifyResetOtpModal({
  phoneNumber,
  sessionId,
  onClose,
  onBack,
  onVerifySuccess,
  onSessionRefresh,
}: VerifyResetOtpModalProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const verifyResetOtp = useVerifyResetOtp();
  const forgotPassword = useForgotPassword();

  const isComplete = otp.every((d) => d !== "");

  // Handle both phone (+234...) and email identifiers
  const isEmail = phoneNumber?.includes("@");
  const displayIdentifier = isEmail
    ? phoneNumber
    : phoneNumber?.replace(/(\+\d{3})(\d{3})(\d{4})/, "$1 *** $3") ||
      "your phone";

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    pasted.split("").forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit;
    });
    setOtp(newOtp);

    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async () => {
    if (!isComplete || verifyResetOtp.isPending) return;

    const otpString = otp.join("");
    try {
      await verifyResetOtp.mutateAsync({
        identifier: phoneNumber,
        otp: otpString,
        sessionId,
      });
      onVerifySuccess();
    } catch (err: any) {
      console.error("Verify reset OTP failed:", err);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  };

  // Requests a fresh code AND a fresh session token — the old sessionId
  // becomes stale the moment a new one is issued, so verifying against it
  // afterward would fail with "Invalid or expired session token" even with
  // the right OTP. onSessionRefresh lets the parent update its stored
  // sessionId so the next submit uses the current one.
  const handleResend = async () => {
    if (forgotPassword.isPending) return;
    setResendError(null);
    setResendSuccess(false);
    try {
      const data = await forgotPassword.mutateAsync({
        identifier: phoneNumber,
      });
      const newSessionId = data?.sessionId;
      if (!newSessionId) {
        setResendError("Something went wrong. Please try again.");
        return;
      }
      onSessionRefresh?.(newSessionId);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
      setResendSuccess(true);
    } catch (err: any) {
      setResendError(
        err?.message || "Failed to resend code. Please try again.",
      );
    }
  };

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
            height: "100%",
            maxHeight: "100vh",
          }}
          initial={{ y: "110%" }}
          animate={{ y: 0 }}
          exit={{ y: "110%" }}
          transition={{
            type: "spring",
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
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <BackIcon />
          </motion.button>

          {/* Close button */}
          <motion.button
            onClick={onClose}
            aria-label="Close"
            className="absolute flex items-center justify-center text-gray-500 bg-gray-100 rounded-full top-5 right-4 sm:right-6 w-9 h-9"
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
          >
            <CloseIcon />
          </motion.button>

          {/* Title */}
          <div className="mt-4 sm:mt-6 shrink-0">
            <motion.h1
              className="text-xl sm:text-2xl sm:text-[32px] font-extrabold text-gray-900 leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.25,
                duration: 0.5,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              Verify Code
            </motion.h1>

            <motion.p
              className="mt-1 text-sm leading-relaxed text-gray-600 sm:mt-2 sm:text-base"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.32,
                duration: 0.5,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              We sent a verification code to{" "}
              <span className="font-semibold text-gray-900 break-all">
                {displayIdentifier}
              </span>
              . Enter the 6-digit code below to continue.
            </motion.p>
          </div>

          {/* Scrollable content + button */}
          <div
            className="relative flex-1 min-h-0 mt-4 overflow-y-auto sm:mt-6"
            style={{
              WebkitOverflowScrolling: "touch",
              overscrollBehavior: "contain",
              touchAction: "pan-y",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <style>{`
              .hide-scrollbar::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div className="hide-scrollbar">
              {/* OTP Inputs */}
              <motion.div
                className="flex justify-center gap-2 sm:gap-3"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.4,
                  duration: 0.5,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                onPaste={handlePaste}
              >
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-10 h-12 sm:w-12 sm:h-14 text-xl sm:text-2xl font-bold text-center rounded-2xl border-2 outline-none transition-all ${
                      digit
                        ? "border-[#6E43A3] bg-purple-50 text-[#6E43A3]"
                        : "border-gray-200 bg-gray-50 text-gray-900 focus:border-[#6E43A3] focus:ring-2 focus:ring-purple-300"
                    }`}
                  />
                ))}
              </motion.div>

              {verifyResetOtp.isError && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 text-xs text-center text-red-500 sm:text-sm"
                >
                  {(verifyResetOtp.error as Error)?.message ||
                    "Invalid code. Please try again."}
                </motion.p>
              )}

              {resendError && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 text-xs text-center text-red-500 sm:text-sm"
                >
                  {resendError}
                </motion.p>
              )}

              {resendSuccess && !resendError && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 text-xs text-center text-emerald-600 sm:text-sm"
                >
                  A new code has been sent.
                </motion.p>
              )}

              <motion.p
                className="mt-6 text-sm text-center text-gray-600 sm:text-base"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Didn&apos;t receive it?{" "}
                <button
                  onClick={handleResend}
                  disabled={forgotPassword.isPending}
                  className="text-[#6E43A3] font-semibold disabled:opacity-50"
                >
                  {forgotPassword.isPending ? "Sending..." : "Resend code"}
                </button>
              </motion.p>

              {/* Verify button */}
              <div className="pt-6 pb-24 sm:pb-8">
                <motion.button
                  onClick={handleSubmit}
                  disabled={!isComplete || verifyResetOtp.isPending}
                  className={`w-full h-12 sm:h-14 rounded-2xl font-semibold text-base sm:text-lg text-white transition-all flex items-center justify-center ${
                    isComplete && !verifyResetOtp.isPending
                      ? "bg-[#6E43A3]"
                      : "bg-purple-300 cursor-not-allowed"
                  }`}
                  whileTap={
                    isComplete && !verifyResetOtp.isPending
                      ? { scale: 0.97 }
                      : {}
                  }
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.55,
                    duration: 0.5,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                >
                  {verifyResetOtp.isPending ? <Spinner /> : "Verify"}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function BackIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
