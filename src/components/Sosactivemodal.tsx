import { motion } from 'framer-motion'

interface SOSActiveModalProps {
  onCancel: () => void
  onCall: () => void
}

export default function SOSActiveModal({ onCancel, onCall }: SOSActiveModalProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col bg-red-500 md:left-1/2 md:right-auto md:w-[430px] md:mx-auto"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
    >
      <div className="flex items-start justify-between px-6 pt-8">
        <div>
          <h1 className="text-4xl font-extrabold text-white">SOS Active</h1>
          <p className="mt-2 text-[15px] leading-snug text-white/90 max-w-[280px]">
            SOS broadcast, nearby drivers and contacts notified
          </p>
        </div>
        <button
          onClick={onCancel}
          className="flex items-center justify-center flex-shrink-0 text-white rounded-full w-9 h-9 bg-white/20"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="flex items-center justify-center flex-1">
        <motion.div
          className="flex items-center justify-center w-56 h-56 rounded-full bg-white/25"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        >
          <div className="flex items-center justify-center bg-white rounded-full w-36 h-36">
            <SirenIcon />
          </div>
        </motion.div>
      </div>

      <div className="px-6 pb-10 space-y-3">
        <button
          onClick={onCancel}
          className="w-full font-bold text-red-500 bg-white h-14 rounded-full active:scale-[0.98] transition"
        >
          Cancel SOS
        </button>
        <button
          onClick={onCall}
          className="flex items-center justify-center w-full gap-2 font-bold text-white h-14 rounded-full bg-white/25 active:scale-[0.98] transition"
        >
          <PhoneIcon />
          Call 112
        </button>
      </div>
    </motion.div>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

function SirenIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-14 h-14" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v1.5M6 4.5l1 1.3M18 4.5l-1 1.3" />
      <path d="M12 6a5 5 0 0 1 5 5v3H7v-3a5 5 0 0 1 5-5z" />
      <rect x="6" y="14" width="12" height="3" rx="1" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.4 2.1L8.1 9.7a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.9 2.2z" />
    </svg>
  )
}