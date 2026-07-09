import { useState } from 'react'
import { Paperclip, ThumbsUp, ThumbsDown } from 'lucide-react'
import AddReportModal, { type HazardType, type NewReportPayload } from '../components/Addreportmodal'

// ---------- Types ----------

interface MyReport {
  id: string
  type: HazardType
  emoji: string
  title: string
  location: string
  distanceKm: number
  minutesAgo: number
  confirmCount: number
  incorrectCount: number
}

const HAZARD_EMOJI: Record<HazardType, string> = {
  Pothole: '🕳️',
  Flood: '🌊',
  Accident: '🚧',
  Debris: '🪨',
  Road: '🚜',
  Checkpoint: '🛂',
  Danger: '⚠️',
  SOS: '🆘',
}

function formatTimeAgo(minutes: number): string {
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.floor(minutes / 60)}h ago`
}

// ---------- Empty state ----------

function EmptyState({ onAddReport }: { onAddReport: () => void }) {
  return (
    <div className="flex flex-col items-center px-8 pt-20 text-center">
      <div className="relative flex items-center justify-center w-40 h-40 mb-8">
        <div className="absolute w-48 h-24 rounded-full bg-gray-50" />
        <span className="absolute text-lg text-gray-300 -left-2 top-2">✦</span>
        <span className="absolute text-2xl text-gray-300 -right-2 top-10">✦</span>
        <span className="absolute left-0 text-sm text-gray-300 bottom-8">✦</span>
        <div className="relative w-20 h-24 bg-gray-300 rounded-lg shadow-sm -rotate-6" />
        <div className="absolute w-20 h-24 bg-white rounded-lg shadow-sm rotate-3 ring-1 ring-gray-100">
          <div className="mt-5 flex flex-col gap-1.5 px-3">
            <div className="w-10 h-1 bg-gray-200 rounded" />
            <div className="w-8 h-1 bg-gray-200 rounded" />
            <div className="h-1 bg-gray-200 rounded w-9" />
          </div>
        </div>
        <Paperclip
          size={28}
          className="absolute text-gray-400 -translate-x-1/2 -top-2 left-1/2 -rotate-12"
        />
      </div>

      <h2 className="text-xl font-bold text-gray-900">No Reports Yet</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-gray-400">
        You haven't submitted any road hazard reports yet. Help make the roads safer by reporting
        potholes, accidents, floods, roadworks, and other hazards you encounter.
      </p>

      <button
        onClick={onAddReport}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-700 py-4 text-[16px] font-semibold text-white transition active:scale-[0.98]"
      >
        <span className="text-lg leading-none">+</span> Add report
      </button>
    </div>
  )
}

// ---------- Report card ----------

function MyReportCard({ report }: { report: MyReport }) {
  return (
    <div className="w-full overflow-hidden bg-white border border-gray-100 shadow-sm rounded-3xl">
      <div className="relative flex items-center justify-center h-32 bg-gradient-to-br from-emerald-100 via-teal-50 to-sky-100">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'repeating-linear-gradient(115deg, transparent, transparent 38px, rgba(100,130,150,0.35) 38px, rgba(100,130,150,0.35) 40px)',
          }}
        />
        <span className="relative text-4xl drop-shadow-sm">{report.emoji}</span>
      </div>

      <div className="px-4 pb-4 pt-3.5">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-[13px] font-medium text-gray-600">
            {report.type}
          </span>
          <span className="text-[13px] text-gray-400">🕐 {formatTimeAgo(report.minutesAgo)}</span>
        </div>

        <h3 className="mt-2.5 text-[17px] font-bold leading-snug text-gray-900">
          {report.title || report.type}
        </h3>

        <p className="mt-1 text-[14px] text-gray-500">
          📍 {report.location || 'Unknown location'} · {report.distanceKm} km away
        </p>

        <div className="mt-3.5 flex items-center gap-2.5">
          <span className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-3.5 py-2 text-[14px] font-medium text-gray-700">
            <ThumbsUp size={15} /> {report.confirmCount}
          </span>
          <span className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-3.5 py-2 text-[14px] font-medium text-gray-700">
            <ThumbsDown size={15} /> {report.incorrectCount}
          </span>
        </div>
      </div>
    </div>
  )
}

// ---------- Page ----------

export default function MyReport() {
  const [reports, setReports] = useState<MyReport[]>([])
  const [showModal, setShowModal] = useState(false)

  const handleNewReport = (payload: NewReportPayload) => {
    const report: MyReport = {
      id: crypto.randomUUID(),
      type: payload.type,
      emoji: HAZARD_EMOJI[payload.type],
      title: payload.description,
      location: payload.location,
      distanceKm: 0,
      minutesAgo: 0,
      confirmCount: 0,
      incorrectCount: 0,
    }
    setReports((prev) => [report, ...prev])
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <h1 className="text-[28px] font-extrabold leading-none text-gray-800">My Report</h1>
        <button
          onClick={() => setShowModal(true)}
          className="text-[16px] font-semibold text-purple-700"
        >
          Add Report
        </button>
      </div>

      {/* Content */}
      {reports.length === 0 ? (
        <EmptyState onAddReport={() => setShowModal(true)} />
      ) : (
        <div className="flex flex-col gap-4 px-4">
          {reports.map((report) => (
            <MyReportCard key={report.id} report={report} />
          ))}
        </div>
      )}

      {/* Add report modal */}
      {showModal && (
        <AddReportModal onClose={() => setShowModal(false)} onSubmit={handleNewReport} />
      )}

      {/* Your existing <BottomNav /> renders below this page */}
    </div>
  )
}