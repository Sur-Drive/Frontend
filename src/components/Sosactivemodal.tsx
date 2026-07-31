// // components/SOSActiveModal.tsx
// import { motion } from 'framer-motion'

// interface SOSActiveModalProps {
//   onCancel: () => void
//   onCall: () => void
// }

// export default function SOSActiveModal({ onCancel, onCall }: SOSActiveModalProps) {
//   return (
//     <motion.div
//       className="fixed inset-0 z-[1000] flex flex-col bg-[#ef4444]"
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//       transition={{ duration: 0.3 }}
//     >
//       {/* Header */}
//       <div className="flex items-start justify-between px-6 pt-12">
//         <div>
//           <motion.h1
//             className="text-4xl font-extrabold tracking-tight text-white"
//             initial={{ opacity: 0, y: -20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.1 }}
//           >
//             SOS Active
//           </motion.h1>
//           <motion.p
//             className="mt-2 text-[15px] leading-snug text-white/85 max-w-[260px]"
//             initial={{ opacity: 0, y: -10 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.2 }}
//           >
//             SOS broadcast, nearby drivers and contacts notified
//           </motion.p>
//         </div>
//         <motion.button
//           onClick={onCancel}
//           className="flex items-center justify-center flex-shrink-0 w-10 h-10 text-white rounded-full bg-white/20 backdrop-blur-sm"
//           initial={{ opacity: 0, scale: 0.8 }}
//           animate={{ opacity: 1, scale: 1 }}
//           transition={{ delay: 0.3 }}
//           whileTap={{ scale: 0.9 }}
//         >
//           <CloseIcon />
//         </motion.button>
//       </div>

//       {/* Center Siren */}
//       <div className="flex items-center justify-center flex-1">
//         <div className="relative flex items-center justify-center">
//           {/* Outer pulse ring 1 */}
//           <motion.div
//             className="absolute rounded-full w-72 h-72 bg-white/15"
//             animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.15, 0.3] }}
//             transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
//           />
//           {/* Outer pulse ring 2 */}
//           <motion.div
//             className="absolute w-64 h-64 rounded-full bg-white/20"
//             animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.2, 0.4] }}
//             transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', delay: 0.3 }}
//           />
//           {/* Main white circle */}
//           <motion.div
//             className="relative flex items-center justify-center bg-white rounded-full w-44 h-44 shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
//             initial={{ scale: 0.5, opacity: 0 }}
//             animate={{ scale: 1, opacity: 1 }}
//             transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
//           >
//             <SirenIcon />
//           </motion.div>
//         </div>
//       </div>

//       {/* Bottom Buttons */}
//       <div className="px-6 pb-12 space-y-3">
//         <motion.button
//           onClick={onCancel}
//           className="w-full h-[56px] font-bold text-[#ef4444] bg-white rounded-2xl active:scale-[0.98] transition text-[17px]"
//           initial={{ opacity: 0, y: 30 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.4 }}
//           whileTap={{ scale: 0.98 }}
//         >
//           Cancel SOS
//         </motion.button>
//         <motion.button
//           onClick={onCall}
//           className="flex items-center justify-center w-full gap-2 h-[56px] font-bold text-white rounded-2xl bg-white/25 active:scale-[0.98] transition text-[17px] backdrop-blur-sm"
//           initial={{ opacity: 0, y: 30 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ delay: 0.5 }}
//           whileTap={{ scale: 0.98 }}
//         >
//           <PhoneIcon />
//           Call 112
//         </motion.button>
//       </div>
//     </motion.div>
//   )
// }

// function CloseIcon() {
//   return (
//     <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
//       <path d="M6 6l12 12M18 6L6 18" />
//     </svg>
//   )
// }

// function SirenIcon() {
//   return (
//     <svg viewBox="0 0 64 64" className="w-16 h-16" fill="none">
//       {/* Siren base */}
//       <path
//         d="M32 8C32 8 20 8 20 24V44H44V24C44 8 32 8 32 8Z"
//         stroke="#ef4444"
//         strokeWidth="3"
//         strokeLinecap="round"
//         strokeLinejoin="round"
//         fill="none"
//       />
//       {/* Siren top dome */}
//       <path
//         d="M20 24C20 16 25.4 10 32 10C38.6 10 44 16 44 24"
//         stroke="#ef4444"
//         strokeWidth="3"
//         strokeLinecap="round"
//         fill="none"
//       />
//       {/* Base platform */}
//       <rect x="16" y="44" width="32" height="8" rx="3" stroke="#ef4444" strokeWidth="3" fill="none" />
//       {/* Center line */}
//       <path d="M32 18V32" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
//       {/* Light rays */}
//       <path d="M32 4V2" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
//       <path d="M20 10L18 8" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
//       <path d="M44 10L46 8" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
//       <path d="M14 20L12 18" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
//       <path d="M50 20L52 18" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
//     </svg>
//   )
// }

// function PhoneIcon() {
//   return (
//     <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.1 4.11 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13 1.04.37 2.06.72 3.04a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.98.35 2 .59 3.04.72a2 2 0 0 1 1.72 2v3z" />
//     </svg>
//   )
// }




// components/SOSActiveModal.tsx
import { motion } from 'framer-motion'

interface SOSActiveModalProps {
  onCancel: () => void
  onCall: () => void
  /** Real error message from the backend if the SOS trigger request failed
   *  (e.g. network issue, 500). Not shown for 401 — that case redirects to
   *  sign-in instead, before this modal would even be visible. */
  errorMessage?: string | null
}

export default function SOSActiveModal({ onCancel, onCall, errorMessage }: SOSActiveModalProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[1000] flex flex-col bg-[#ef4444]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-12">
        <div>
          <motion.h1
            className="text-4xl font-extrabold tracking-tight text-white"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            SOS Active
          </motion.h1>
          <motion.p
            className="mt-2 text-[15px] leading-snug text-white/85 max-w-[260px]"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            SOS broadcast, nearby drivers and contacts notified
          </motion.p>
        </div>
        <motion.button
          onClick={onCancel}
          className="flex items-center justify-center flex-shrink-0 w-10 h-10 text-white rounded-full bg-white/20 backdrop-blur-sm"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          whileTap={{ scale: 0.9 }}
        >
          <CloseIcon />
        </motion.button>
      </div>

      {errorMessage && (
        <div className="mx-6 mt-3 rounded-xl bg-white/20 px-4 py-2.5 backdrop-blur-sm">
          <p className="text-[13px] font-medium text-white">
            Couldn&apos;t reach the server: {errorMessage}. Your emergency call and local alert still work.
          </p>
        </div>
      )}

      {/* Center Siren */}
      <div className="flex items-center justify-center flex-1">
        <div className="relative flex items-center justify-center">
          {/* Outer pulse ring 1 */}
          <motion.div
            className="absolute rounded-full w-72 h-72 bg-white/15"
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.15, 0.3] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          />
          {/* Outer pulse ring 2 */}
          <motion.div
            className="absolute w-64 h-64 rounded-full bg-white/20"
            animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.2, 0.4] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', delay: 0.3 }}
          />
          {/* Main white circle */}
          <motion.div
            className="relative flex items-center justify-center bg-white rounded-full w-44 h-44 shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
          >
            <SirenIcon />
          </motion.div>
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="px-6 pb-12 space-y-3">
        <motion.button
          onClick={onCancel}
          className="w-full h-[56px] font-bold text-[#ef4444] bg-white rounded-2xl active:scale-[0.98] transition text-[17px]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.98 }}
        >
          Cancel SOS
        </motion.button>
        <motion.button
          onClick={onCall}
          className="flex items-center justify-center w-full gap-2 h-[56px] font-bold text-white rounded-2xl bg-white/25 active:scale-[0.98] transition text-[17px] backdrop-blur-sm"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileTap={{ scale: 0.98 }}
        >
          <PhoneIcon />
          Call 112
        </motion.button>
      </div>
    </motion.div>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

function SirenIcon() {
  return (
    <svg viewBox="0 0 64 64" className="w-16 h-16" fill="none">
      {/* Siren base */}
      <path
        d="M32 8C32 8 20 8 20 24V44H44V24C44 8 32 8 32 8Z"
        stroke="#ef4444"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Siren top dome */}
      <path
        d="M20 24C20 16 25.4 10 32 10C38.6 10 44 16 44 24"
        stroke="#ef4444"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Base platform */}
      <rect x="16" y="44" width="32" height="8" rx="3" stroke="#ef4444" strokeWidth="3" fill="none" />
      {/* Center line */}
      <path d="M32 18V32" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
      {/* Light rays */}
      <path d="M32 4V2" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
      <path d="M20 10L18 8" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
      <path d="M44 10L46 8" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
      <path d="M14 20L12 18" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
      <path d="M50 20L52 18" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.1 4.11 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13 1.04.37 2.06.72 3.04a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.98.35 2 .59 3.04.72a2 2 0 0 1 1.72 2v3z" />
    </svg>
  )
}