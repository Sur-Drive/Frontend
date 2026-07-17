import { motion } from 'framer-motion'

interface SOSActiveModalProps {
  onClose: () => void
  onCancel: () => void
  onCall112?: () => void
}

export default function SOSActiveModal({ onClose, onCancel, onCall112 }: SOSActiveModalProps) {
  const handleCall = () => {
    if (onCall112) {
      onCall112()
    } else {
      window.location.href = 'tel:112'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex flex-col bg-gradient-to-b from-[#ff5252] to-[#ef4444] max-w-[430px] mx-auto"
    >
      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-8 pb-2">
        <div>
          <h1 className="text-[32px] font-extrabold text-white leading-tight">SOS Active</h1>
          <p className="mt-2 text-[15px] text-white/90 leading-snug max-w-[280px]">
            SOS broadcast, nearby drivers and contacts notified
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center flex-shrink-0 text-white rounded-full w-9 h-9 bg-white/25"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {/* Pulsing siren icon */}
      <div className="flex items-center justify-center flex-1">
        <div className="relative flex items-center justify-center w-64 h-64">
          <span className="absolute inset-0 rounded-full bg-white/25 animate-ping" />
          <span className="absolute rounded-full inset-3 bg-white/20" />
          <div className="relative flex items-center justify-center bg-white rounded-full shadow-xl w-52 h-52">
            <svg viewBox="0 0 24 24" className="w-20 h-20" fill="none" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21h6" />
              <path d="M8 21v-4a4 4 0 0 1 4-4v0a4 4 0 0 1 4 4v4" />
              <path d="M12 3v0a5 5 0 0 1 5 5v5H7V8a5 5 0 0 1 5-5Z" />
              <path d="M12 2v1.5" />
              <path d="M5 8l-1.5-1" />
              <path d="M19 8l1.5-1" />
              <path d="M4 12H2.5" />
              <path d="M21.5 12H20" />
            </svg>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 px-6 pb-10">
        <button
          onClick={onCancel}
          className="flex items-center justify-center w-full h-14 font-bold text-red-500 bg-white rounded-2xl active:scale-[0.98] transition"
        >
          Cancel SOS
        </button>
        <button
          onClick={handleCall}
          className="flex items-center justify-center w-full h-14 gap-2 font-bold text-white rounded-2xl bg-white/25 active:scale-[0.98] transition"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          Call 112
        </button>
      </div>
    </motion.div>
  )
}