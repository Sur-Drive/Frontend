import { useState } from 'react'
import { motion } from 'framer-motion'

interface PlanRouteModalProps {
  onClose: () => void
  onScanRoute: (from: string, to: string) => void
  defaultFrom?: string
}

export default function PlanRouteModal({ onClose, onScanRoute, defaultFrom = '' }: PlanRouteModalProps) {
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState('')

  const useMyLocation = () => setFrom('Current Location')

  const canScan = from.trim().length > 0 && to.trim().length > 0

  return (
    <motion.div
      className="fixed inset-0 z-40 bg-black/40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="absolute bottom-0 left-0 right-0 md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[430px] bg-white rounded-t-3xl shadow-2xl flex flex-col h-[92%] md:h-[85%]"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 pb-1 pt-7">
          <h2 className="text-3xl font-extrabold text-gray-900">Plan a route</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center flex-shrink-0 text-gray-500 bg-gray-100 rounded-full w-9 h-9"
          >
            <CloseIcon />
          </button>
        </div>

        <p className="px-6 pb-6 text-[15px] leading-snug text-gray-500">
          We'll scan reported hazards along the way before you drive.
        </p>

        <div className="px-6">
          <div className="flex items-center gap-2 mb-2">
            <PinDotIcon color="#0f9d58" />
            <span className="text-base font-semibold text-gray-900">Point A — Start</span>
          </div>
          <div className="flex items-center justify-between px-4 mb-6 bg-gray-100 rounded-2xl h-14">
            <input
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="Search a place or Address"
              className="flex-1 h-full text-[15px] bg-transparent outline-none placeholder:text-gray-400"
            />
            <button onClick={useMyLocation} className="flex-shrink-0 ml-2 text-sm font-semibold text-purple-600">
              Use my location
            </button>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <FlagIcon />
            <span className="text-base font-semibold text-gray-900">Point B — Destination</span>
          </div>
          <div className="flex items-center px-4 bg-gray-100 rounded-2xl h-14">
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Where to?"
              className="w-full h-full text-[15px] bg-transparent outline-none placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="flex-1" />

        <div className="px-6 pt-4 pb-8">
          <button
            disabled={!canScan}
            onClick={() => canScan && onScanRoute(from.trim(), to.trim())}
            className={`w-full h-14 rounded-full font-bold text-white text-base transition ${
              canScan ? 'bg-purple-700 active:scale-[0.98]' : 'bg-purple-300 cursor-not-allowed'
            }`}
          >
            Scan route
          </button>
        </div>
      </motion.div>
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

function PinDotIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke={color} strokeWidth="2">
      <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" />
      <circle cx="12" cy="9" r="2.5" fill={color} stroke="none" />
    </svg>
  )
}

function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#e02424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 3v18" />
      <path d="M5 4h11l-2.5 4L16 12H5" fill="#e02424" />
    </svg>
  )
}