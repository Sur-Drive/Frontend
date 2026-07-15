





import { useState } from 'react'

// ---------- Types ----------

type HazardType =
  | 'Pothole'
  | 'Accident'
  | 'Flood'
  | 'Road Works'
  | 'Checkpoint'
  | 'Debris'
  | 'SOS'
  | 'Danger Zone'

type VoteState = 'confirmed' | 'incorrect' | null

interface HazardReport {
  id: string
  type: HazardType
  emoji: string
  title: string
  location: string
  distanceKm: number
  minutesAgo: number
  author: string
  confirmCount: number
}

interface PendingAction {
  reportId: string
  action: 'confirm' | 'incorrect'
}

// ---------- Mock data ----------

const initialReports: HazardReport[] = [
  {
    id: '1',
    type: 'Pothole',
    emoji: '🕳️',
    title: 'Deep pothole on 3rd Avenue',
    location: '3rd Ave & Market St',
    distanceKm: 0.4,
    minutesAgo: 6,
    author: 'Ada O.',
    confirmCount: 18,
  },
  {
    id: '2',
    type: 'Accident',
    emoji: '🚧',
    title: 'Two-car collision blocking lane',
    location: 'Ring Road, Exit 7',
    distanceKm: 1.2,
    minutesAgo: 12,
    author: 'Tunde A.',
    confirmCount: 18,
  },
  {
    id: '3',
    type: 'Flood',
    emoji: '🌊',
    title: 'Heavy flood after bridge',
    location: 'Riverside Crescent',
    distanceKm: 2.8,
    minutesAgo: 22,
    author: 'Mei L.',
    confirmCount: 18,
  },
  {
    id: '4',
    type: 'Road Works',
    emoji: '🚜',
    title: 'Lane closure for resurfacing',
    location: 'Independence Blvd',
    distanceKm: 0.9,
    minutesAgo: 41,
    author: 'Sara K.',
    confirmCount: 18,
  },
  {
    id: '5',
    type: 'Checkpoint',
    emoji: '🚓',
    title: 'Police checkpoint',
    location: 'Old Toll Gate',
    distanceKm: 3.4,
    minutesAgo: 41,
    author: 'Femi B.',
    confirmCount: 18,
  },
  {
    id: '6',
    type: 'Debris',
    emoji: '🪨',
    title: 'Tyre scraps across lane 2',
    location: 'Highway A1, KM 14',
    distanceKm: 4.1,
    minutesAgo: 55,
    author: 'Noah R.',
    confirmCount: 18,
  },
  {
    id: '7',
    type: 'SOS',
    emoji: '🆘',
    title: 'Driver needs assistance',
    location: 'Coastal Loop',
    distanceKm: 1.8,
    minutesAgo: 3,
    author: 'Anon',
    confirmCount: 18,
  },
  {
    id: '8',
    type: 'Danger Zone',
    emoji: '⚠️',
    title: 'Reports of armed activity',
    location: 'Industrial Estate',
    distanceKm: 5.5,
    minutesAgo: 90,
    author: 'Anon',
    confirmCount: 18,
  },
]

// ---------- Helpers ----------

function formatTimeAgo(minutes: number): string {
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

// ---------- Confirmation Modal ----------

function ConfirmModal({
  report,
  action,
  onCancel,
  onConfirm,
}: {
  report: HazardReport
  action: 'confirm' | 'incorrect'
  onCancel: () => void
  onConfirm: () => void
}) {
  const isConfirm = action === 'confirm'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/40"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm px-6 py-8 text-center bg-white shadow-xl rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-bold text-gray-900 sm:text-lg">
          {isConfirm ? 'Confirm this hazard?' : 'Mark as incorrect?'}
        </h2>

        <p className="mt-3 text-[13px] sm:text-sm leading-relaxed text-gray-500">
          {isConfirm ? (
            <>
              You're verifying that {report.type.toLowerCase()} at{' '}
              <span className="font-semibold text-gray-900">{report.location}</span> is still
              there. This helps other drivers stay safe.
            </>
          ) : (
            <>
              You're reporting that {report.type.toLowerCase()} at{' '}
              <span className="font-semibold text-gray-900">{report.location}</span> is no longer
              accurate. Thanks for keeping the map clean.
            </>
          )}
        </p>

        <button
          onClick={onConfirm}
          className="mt-6 w-full rounded-2xl bg-purple-700 py-3 sm:py-3.5 text-[13px] sm:text-sm font-semibold text-white transition active:scale-[0.98]"
        >
          {isConfirm ? 'Yes, Confirm' : 'Yes, Mark incorrect'}
        </button>

        <button
          onClick={onCancel}
          className="mt-4 text-[13px] sm:text-sm font-medium text-purple-700"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ---------- Report Card ----------

function ReportCard({
  report,
  vote,
  onRequestVote,
}: {
  report: HazardReport
  vote: VoteState
  onRequestVote: (action: 'confirm' | 'incorrect') => void
}) {
  return (
    <div className="w-full overflow-hidden bg-white border border-gray-100 shadow-sm rounded-3xl">
      {/* Map-style header */}
      <div className="relative flex items-center justify-center h-28 sm:h-32 bg-gradient-to-br from-emerald-100 via-teal-50 to-sky-100">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'repeating-linear-gradient(115deg, transparent, transparent 38px, rgba(100,130,150,0.35) 38px, rgba(100,130,150,0.35) 40px)',
          }}
        />
        <span className="relative text-3xl sm:text-4xl drop-shadow-sm">{report.emoji}</span>
      </div>

      {/* Body */}
      <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-3 sm:pt-3.5">
        <div className="flex items-center justify-between">
          <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
            {report.type}
          </span>
          <span className="text-[11px] sm:text-xs text-gray-400">
            🕐 {formatTimeAgo(report.minutesAgo)} · By {report.author}
          </span>
        </div>

        <h3 className="mt-2 sm:mt-2.5 text-[15px] sm:text-base font-bold leading-snug text-gray-900">
          {report.title}
        </h3>

        <p className="flex items-center gap-1 mt-1 text-[13px] sm:text-sm text-gray-500">
          📍 {report.location} · {report.distanceKm} km away
        </p>

        {vote ? (
          <div className="mt-3 sm:mt-3.5 flex items-center justify-between rounded-2xl border border-gray-200 pl-4 pr-1.5 py-1.5">
            <span className="text-[13px] sm:text-sm text-gray-500">
              You voted {vote === 'confirmed' ? 'Confirmed' : 'Incorrect'}
            </span>
            <span
              className={`rounded-full px-3.5 sm:px-4 py-2 text-[13px] sm:text-sm font-semibold text-white ${
                vote === 'confirmed' ? 'bg-emerald-600' : 'bg-red-600'
              }`}
            >
              {vote === 'confirmed' ? 'Confirmed' : 'Incorrect'}
            </span>
          </div>
        ) : (
          <div className="mt-3 sm:mt-3.5 flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => onRequestVote('confirm')}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 py-2.5 sm:py-3 text-[13px] sm:text-sm font-semibold text-white transition active:scale-[0.98]"
            >
              👍 Confirm ({report.confirmCount})
            </button>
            <button
              onClick={() => onRequestVote('incorrect')}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-gray-100 py-2.5 sm:py-3 text-[13px] sm:text-sm font-semibold text-red-500 transition active:scale-[0.98]"
            >
              👎 Incorrect
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------- Page ----------

export default function RoadFeed() {
  const [reports, setReports] = useState<HazardReport[]>(initialReports)
  const [votes, setVotes] = useState<Record<string, VoteState>>({})
  const [pending, setPending] = useState<PendingAction | null>(null)

  const requestVote = (reportId: string, action: 'confirm' | 'incorrect') => {
    setPending({ reportId, action })
  }

  const cancelVote = () => setPending(null)

  const applyVote = () => {
    if (!pending) return
    const { reportId, action } = pending

    setVotes((prev) => ({
      ...prev,
      [reportId]: action === 'confirm' ? 'confirmed' : 'incorrect',
    }))

    if (action === 'confirm') {
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, confirmCount: r.confirmCount + 1 } : r,
        ),
      )
    }

    setPending(null)
  }

  const pendingReport = pending ? reports.find((r) => r.id === pending.reportId) : undefined

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Centered container for web, full width on mobile */}
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="px-4 pt-6 pb-4 sm:px-5">
          <h1 className="text-[22px] sm:text-[28px] font-extrabold leading-none text-gray-800">
            Road Feed
          </h1>
          <p className="mt-1.5 sm:mt-2 text-[13px] sm:text-[15px] text-gray-400">
            Live reports from drivers near you.
          </p>
        </div>

        {/* Feed */}
        <div className="flex flex-col gap-3 px-4 sm:gap-4">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              vote={votes[report.id] ?? null}
              onRequestVote={(action) => requestVote(report.id, action)}
            />
          ))}
        </div>

        {/* Modal */}
        {pending && pendingReport && (
          <ConfirmModal
            report={pendingReport}
            action={pending.action}
            onCancel={cancelVote}
            onConfirm={applyVote}
          />
        )}
      </div>

      {/* Your existing <BottomNav /> renders below this page */}
    </div>
  )
}