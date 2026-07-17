






import { useState } from 'react'

interface Report {
  id: string
  lat: number
  lng: number
  color: string
  type: string
  title: string
  streetLabel: string
  subtitle: string
  distance: string
  confirmCount: number
  incorrectCount: number
  photos: string[]
}

interface ReportDetailModalProps {
  report: Report
  onClose: () => void
  isAuthenticated: boolean
  onAuthRequired: () => void
}

export default function ReportDetailModal({
  report,
  onClose,
  isAuthenticated,
  onAuthRequired,
}: ReportDetailModalProps) {
  const [votes, setVotes] = useState<{
    confirm: number
    incorrect: number
    voted: 'confirm' | 'incorrect' | null
  }>({
    confirm: report.confirmCount,
    incorrect: report.incorrectCount,
    voted: null,
  })

  const vote = (choice: 'confirm' | 'incorrect') => {
    if (!isAuthenticated) {
      onAuthRequired()
      return
    }
    setVotes((prev) => {
      if (prev.voted === choice) return prev
      const next = { ...prev }
      if (prev.voted === 'confirm') next.confirm -= 1
      if (prev.voted === 'incorrect') next.incorrect -= 1
      if (choice === 'confirm') next.confirm += 1
      else next.incorrect += 1
      next.voted = choice
      return next
    })
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: report.title,
        text: report.subtitle,
      })
    }
  }

  return (
    <div className="bg-white rounded-t-[20px] shadow-[0_-4px_24px_rgba(0,0,0,0.12)] overflow-hidden">
      {/* Drag handle */}
      <div className="flex justify-center pt-2.5 pb-1">
        <div className="w-10 h-1 bg-gray-300 rounded-full" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-1 pb-3">
        <h2 className="text-[22px] font-extrabold text-gray-900 leading-tight">{report.title}</h2>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleShare}
            className="flex items-center justify-center text-gray-600 transition-colors bg-gray-100 rounded-full w-9 h-9 hover:bg-gray-200"
            aria-label="Share report"
          >
            <ShareIcon />
          </button>
          <button
            onClick={onClose}
            className="flex items-center justify-center text-gray-600 transition-colors bg-gray-100 rounded-full w-9 h-9 hover:bg-gray-200"
            aria-label="Close report"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* Subtitle + distance */}
      <div className="flex items-center gap-2 px-5 pb-3 text-sm">
        <span className="font-medium text-purple-600">{report.subtitle}</span>
        <span className="text-gray-400">·</span>
        <span className="font-semibold text-gray-900">{report.distance}</span>
      </div>

      {/* Vote buttons */}
      <div className="flex gap-3 px-5 pb-4">
        <button
          onClick={() => vote('confirm')}
          className={`flex-1 h-12 rounded-full flex items-center justify-center gap-2 font-semibold text-sm transition-colors ${
            votes.voted === 'confirm'
              ? 'bg-emerald-700 text-white'
              : 'bg-emerald-500 text-white hover:bg-emerald-600'
          }`}
        >
          <ThumbUpIcon />
          Confirm ({votes.confirm})
        </button>
        <button
          onClick={() => vote('incorrect')}
          className={`flex-1 h-12 rounded-full flex items-center justify-center gap-2 font-semibold text-sm transition-colors ${
            votes.voted === 'incorrect'
              ? 'bg-red-100 text-red-600'
              : 'bg-gray-100 text-red-500 hover:bg-gray-200'
          }`}
        >
          <ThumbDownIcon />
          Incorrect ({votes.incorrect})
        </button>
      </div>

      {/* Photo gallery */}
      <div className="px-5 pb-5 flex gap-3 overflow-x-auto snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {report.photos.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`Report photo ${i + 1}`}
            className="flex-shrink-0 object-cover w-40 h-32 bg-gray-200 rounded-xl snap-start"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  )
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
      <path d="M16 6l-4-4-4 4" />
      <path d="M12 2v14" />
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

function ThumbUpIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 10v11" />
      <path d="M7 10l3-8a2 2 0 0 1 2 2v5h6a2 2 0 0 1 2 2.3l-1.4 7A2 2 0 0 1 16.6 21H7" />
    </svg>
  )
}

function ThumbDownIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 14V3" />
      <path d="M17 14l-3 8a2 2 0 0 1-2-2v-5H6a2 2 0 0 1-2-2.3l1.4-7A2 2 0 0 1 7.4 3H17" />
    </svg>
  )
}