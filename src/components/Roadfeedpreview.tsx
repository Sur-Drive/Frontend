
// import { useState } from 'react'

// // ─── Types ───────────────────────────────────────────────────────────
// interface Report {
//   id: string
//   type: string
//   emoji: string
//   title: string
//   location: string
//   distanceKm: number
//   minutesAgo: number
//   author: string
//   confirmCount: number
// }

// interface Votes {
//   [key: string]: 'confirmed' | 'incorrect'
// }

// interface PendingVote {
//   reportId: string
//   action: 'confirm' | 'incorrect'
// }

// // ─── Data ────────────────────────────────────────────────────────────
// const initialReports: Report[] = [
//   { id: '1', type: 'Pothole', emoji: '🕳️', title: 'Deep pothole on 3rd Avenue', location: '3rd Ave & Market St', distanceKm: 0.4, minutesAgo: 6, author: 'Ada O.', confirmCount: 18 },
//   { id: '2', type: 'Accident', emoji: '🚧', title: 'Two-car collision blocking lane', location: 'Ring Road, Exit 7', distanceKm: 1.2, minutesAgo: 12, author: 'Tunde A.', confirmCount: 18 },
//   { id: '3', type: 'Flood', emoji: '🌊', title: 'Heavy flood after bridge', location: 'Riverside Crescent', distanceKm: 2.8, minutesAgo: 22, author: 'Mei L.', confirmCount: 18 },
//   { id: '4', type: 'Road Works', emoji: '🚜', title: 'Lane closure for resurfacing', location: 'Independence Blvd', distanceKm: 0.9, minutesAgo: 41, author: 'Sara K.', confirmCount: 18 },
//   { id: '5', type: 'Checkpoint', emoji: '🚓', title: 'Police checkpoint', location: 'Old Toll Gate', distanceKm: 3.4, minutesAgo: 41, author: 'Femi B.', confirmCount: 18 },
//   { id: '6', type: 'Debris', emoji: '🪨', title: 'Tyre scraps across lane 2', location: 'Highway A1, KM 14', distanceKm: 4.1, minutesAgo: 55, author: 'Noah R.', confirmCount: 18 },
//   { id: '7', type: 'SOS', emoji: '🆘', title: 'Driver needs assistance', location: 'Coastal Loop', distanceKm: 1.8, minutesAgo: 3, author: 'Anon', confirmCount: 18 },
//   { id: '8', type: 'Danger Zone', emoji: '⚠️', title: 'Reports of armed activity', location: 'Industrial Estate', distanceKm: 5.5, minutesAgo: 90, author: 'Anon', confirmCount: 18 },
// ]

// // ─── Helpers ─────────────────────────────────────────────────────────
// function formatTimeAgo(minutes: number): string {
//   if (minutes < 60) return `${minutes}m ago`
//   const hours = Math.floor(minutes / 60)
//   return `${hours}h ago`
// }

// // ─── Components ──────────────────────────────────────────────────────
// interface ConfirmModalProps {
//   report: Report
//   action: 'confirm' | 'incorrect'
//   onCancel: () => void
//   onConfirm: () => void
// }

// function ConfirmModal({ report, action, onCancel, onConfirm }: ConfirmModalProps) {
//   const isConfirm = action === 'confirm'
//   return (
//     <div className="fixed inset-0 flex items-center justify-center px-6 z-[60] bg-black/40" onClick={onCancel}>
//       <div className="w-full max-w-sm px-6 py-8 text-center bg-white shadow-xl rounded-3xl" onClick={(e) => e.stopPropagation()}>
//         <h2 className="text-xl font-bold text-gray-900">
//           {isConfirm ? 'Confirm this hazard?' : 'Mark as incorrect?'}
//         </h2>
//         <p className="mt-3 text-[15px] leading-relaxed text-gray-500">
//           {isConfirm ? (
//             <>You're verifying that {report.type.toLowerCase()} at <span className="font-semibold text-gray-900">{report.location}</span> is still there. This helps other drivers stay safe.</>
//           ) : (
//             <>You're reporting that {report.type.toLowerCase()} at <span className="font-semibold text-gray-900">{report.location}</span> is no longer accurate. Thanks for keeping the map clean.</>
//           )}
//         </p>
//         <button onClick={onConfirm} className="mt-6 w-full rounded-2xl bg-purple-700 py-4 text-[15px] font-semibold text-white transition active:scale-[0.98]">
//           {isConfirm ? 'Yes, Confirm' : 'Yes, Mark incorrect'}
//         </button>
//         <button onClick={onCancel} className="mt-4 text-[15px] font-medium text-purple-700">Cancel</button>
//       </div>
//     </div>
//   )
// }

// interface ReportCardProps {
//   report: Report
//   vote: 'confirmed' | 'incorrect' | null
//   onRequestVote: (action: 'confirm' | 'incorrect') => void
// }

// function ReportCard({ report, vote, onRequestVote }: ReportCardProps) {
//   return (
//     <div className="w-full overflow-hidden bg-white border border-gray-100 shadow-sm rounded-3xl">
//       <div className="relative flex items-center justify-center h-32 bg-gradient-to-br from-emerald-100 via-teal-50 to-sky-100">
//         <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'repeating-linear-gradient(115deg, transparent, transparent 38px, rgba(100,130,150,0.35) 38px, rgba(100,130,150,0.35) 40px)' }} />
//         <span className="relative text-4xl drop-shadow-sm">{report.emoji}</span>
//       </div>
//       <div className="px-4 pb-4 pt-3.5">
//         <div className="flex items-center justify-between">
//           <span className="rounded-full bg-gray-100 px-3 py-1 text-[13px] font-medium text-gray-600">{report.type}</span>
//           <span className="text-[13px] text-gray-400">🕐 {formatTimeAgo(report.minutesAgo)} · By {report.author}</span>
//         </div>
//         <h3 className="mt-2.5 text-[17px] font-bold leading-snug text-gray-900">{report.title}</h3>
//         <p className="mt-1 flex items-center gap-1 text-[14px] text-gray-500">📍 {report.location} · {report.distanceKm} km away</p>
//         {vote ? (
//           <div className="mt-3.5 flex items-center justify-between rounded-2xl border border-gray-200 pl-4 pr-1.5 py-1.5">
//             <span className="text-[14px] text-gray-500">You voted {vote === 'confirmed' ? 'Confirmed' : 'Incorrect'}</span>
//             <span className={`rounded-full px-4 py-2 text-[14px] font-semibold text-white ${vote === 'confirmed' ? 'bg-emerald-600' : 'bg-red-600'}`}>
//               {vote === 'confirmed' ? 'Confirmed' : 'Incorrect'}
//             </span>
//           </div>
//         ) : (
//           <div className="mt-3.5 flex items-center gap-3">
//             <button onClick={() => onRequestVote('confirm')} className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 py-3 text-[14px] font-semibold text-white transition active:scale-[0.98]">
//               👍 Confirm ({report.confirmCount})
//             </button>
//             <button onClick={() => onRequestVote('incorrect')} className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-gray-100 py-3 text-[14px] font-semibold text-red-500 transition active:scale-[0.98]">
//               👎 Incorrect
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

// // ─── Main Page ───────────────────────────────────────────────────────
// export default function RoadFeedPreview() {
// const [reports, setReports] = useState<Report[]>(initialReports)
//   const [votes, setVotes] = useState<Votes>({})
//   const [pending, setPending] = useState<PendingVote | null>(null)

//   const requestVote = (reportId: string, action: 'confirm' | 'incorrect') => setPending({ reportId, action })
//   const cancelVote = () => setPending(null)

//   const applyVote = () => {
//     if (!pending) return
//     const { reportId, action } = pending
//     setVotes((prev) => ({ ...prev, [reportId]: action === 'confirm' ? 'confirmed' : 'incorrect' }))
//     if (action === 'confirm') {
//       setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, confirmCount: r.confirmCount + 1 } : r)))
//     }
//     setPending(null)
//   }

//   const pendingReport = pending ? reports.find((r) => r.id === pending.reportId) : undefined

//   return (
//     <div className="max-w-md min-h-screen mx-auto bg-gray-50 pb-28">
//       <div className="px-5 pt-6 pb-4">
//         <h1 className="text-[32px] font-extrabold leading-none text-gray-800">Road Feed</h1>
//         <p className="mt-2 text-[15px] text-gray-400">Live reports from drivers near you.</p>
//       </div>
//       <div className="flex flex-col gap-4 px-4">
//         {reports.map((report) => (
//           <ReportCard key={report.id} report={report} vote={votes[report.id] ?? null} onRequestVote={(action) => requestVote(report.id, action)} />
//         ))}
//       </div>
//       {pending && pendingReport && (
//         <ConfirmModal report={pendingReport} action={pending.action} onCancel={cancelVote} onConfirm={applyVote} />
//       )}
//     </div>
//   )
// }





















import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { useNearbyHazards, useVoteHazard } from '../hooks/useHazards'
import type { HazardDto, HazardType } from '../api/hazards'

// ============================================================
// Display mapping
// ============================================================

const HAZARD_DISPLAY: Record<HazardType, { emoji: string; label: string }> = {
  POTHOLE: { emoji: '🕳️', label: 'Pothole' },
  ACCIDENT: { emoji: '🚧', label: 'Accident' },
  FLOOD: { emoji: '🌊', label: 'Flood' },
  CONSTRUCTION: { emoji: '🚜', label: 'Road Works' },
  ROADBLOCK: { emoji: '🚓', label: 'Checkpoint' },
  DEBRIS: { emoji: '🪨', label: 'Debris' },
  SOS: { emoji: '🆘', label: 'SOS' },
  DANGER_ZONE: { emoji: '⚠️', label: 'Danger Zone' },
}

interface DisplayReport {
  id: string
  type: HazardType
  emoji: string
  label: string
  title: string
  location: string
  distanceKm: number
  minutesAgo: number
  author: string
  confirmCount: number
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function minutesSince(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
}

function formatTimeAgo(minutes: number): string {
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.floor(minutes / 60)}h ago`
}

function mapHazard(h: HazardDto, userLat?: number, userLng?: number): DisplayReport {
  const display = HAZARD_DISPLAY[h.type] ?? { emoji: '⚠️', label: h.type }
  const distanceKm =
    h.distanceKm ??
    (userLat != null && userLng != null
      ? haversineKm(userLat, userLng, h.latitude, h.longitude)
      : 0)

  return {
    id: h.id,
    type: h.type,
    emoji: display.emoji,
    label: display.label,
    title: h.description,
    location: h.locationAddress,
    distanceKm: Math.round(distanceKm * 10) / 10,
    minutesAgo: minutesSince(h.createdAt),
    author: h.isAnonymous ? 'Anonymous' : h.reporterName || 'Driver',
    confirmCount: h.confirmCount ?? 0,
  }
}

type VoteState = 'confirmed' | 'incorrect' | null

interface PendingAction {
  reportId: string
  action: 'confirm' | 'incorrect'
}

// ============================================================
// Confirmation Modal
// ============================================================

function ConfirmModal({
  report,
  action,
  onCancel,
  onConfirm,
  isSubmitting,
}: {
  report: DisplayReport
  action: 'confirm' | 'incorrect'
  onCancel: () => void
  onConfirm: () => void
  isSubmitting: boolean
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
              You're verifying that {report.label.toLowerCase()} at{' '}
              <span className="font-semibold text-gray-900">{report.location}</span> is still
              there. This helps other drivers stay safe.
            </>
          ) : (
            <>
              You're reporting that {report.label.toLowerCase()} at{' '}
              <span className="font-semibold text-gray-900">{report.location}</span> is no longer
              accurate. Thanks for keeping the map clean.
            </>
          )}
        </p>

        <button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="mt-6 w-full rounded-2xl bg-purple-700 py-3 sm:py-3.5 text-[13px] sm:text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
        >
          {isSubmitting ? 'Submitting…' : isConfirm ? 'Yes, Confirm' : 'Yes, Mark incorrect'}
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

// ============================================================
// Report Card
// ============================================================

function ReportCard({
  report,
  vote,
  onRequestVote,
}: {
  report: DisplayReport
  vote: VoteState
  onRequestVote: (action: 'confirm' | 'incorrect') => void
}) {
  return (
    <div className="w-full overflow-hidden bg-white border border-gray-100 shadow-sm rounded-3xl">
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

      <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-3 sm:pt-3.5">
        <div className="flex items-center justify-between">
          <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
            {report.label}
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

// ============================================================
// Page
// ============================================================

export default function RoadFeed() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [votes, setVotes] = useState<Record<string, VoteState>>({})
  const [pending, setPending] = useState<PendingAction | null>(null)

  const voteHazard = useVoteHazard()

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Location services are not available on this device.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeoError('Enable location access to see hazards near you.'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  const { data, isLoading, isError, error } = useNearbyHazards(
    coords ? { latitude: coords.lat, longitude: coords.lng, radius: 5 } : null
  )

  const reports: DisplayReport[] =
    data?.map((h) => mapHazard(h, coords?.lat, coords?.lng)) ?? []

  const requestVote = (reportId: string, action: 'confirm' | 'incorrect') =>
    setPending({ reportId, action })

  const cancelVote = () => setPending(null)

  const applyVote = () => {
    if (!pending) return
    const { reportId, action } = pending

    voteHazard.mutate(
      { hazardId: reportId, type: action === 'confirm' ? 'CONFIRMED' : 'INCORRECT' },
      {
        onSuccess: () => {
          setVotes((prev) => ({
            ...prev,
            [reportId]: action === 'confirm' ? 'confirmed' : 'incorrect',
          }))
          setPending(null)
        },
        onError: () => setPending(null),
      }
    )
  }

  const pendingReport = pending ? reports.find((r) => r.id === pending.reportId) : undefined

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="max-w-xl mx-auto">
        <div className="px-4 pt-6 pb-4 sm:px-5">
          <h1 className="text-[22px] sm:text-[28px] font-extrabold leading-none text-gray-800">
            Road Feed
          </h1>
          <p className="mt-1.5 sm:mt-2 text-[13px] sm:text-[15px] text-gray-400">
            Live reports from drivers near you.
          </p>
        </div>

        {geoError && (
          <div className="flex items-center gap-2 px-4 py-3 mx-4 mb-3 text-amber-700 bg-amber-50 rounded-2xl">
            <AlertCircle size={16} className="shrink-0" />
            <p className="text-[13px]">{geoError}</p>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center px-6 pt-10 text-center">
            <AlertCircle size={36} className="mb-3 text-red-400" />
            <p className="text-[15px] text-gray-500">
              {error instanceof Error ? error.message : 'Could not load nearby hazards.'}
            </p>
          </div>
        )}

        {!isError && isLoading && (
          <div className="flex flex-col gap-3 px-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        )}

        {!isError && !isLoading && reports.length === 0 && coords && (
          <div className="flex flex-col items-center px-6 pt-10 text-center">
            <p className="text-[15px] text-gray-500">No hazards reported near you right now.</p>
          </div>
        )}

        {!isError && reports.length > 0 && (
          <div className="flex flex-col gap-3 px-4">
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                vote={votes[report.id] ?? null}
                onRequestVote={(action) => requestVote(report.id, action)}
              />
            ))}
          </div>
        )}

        {pending && pendingReport && (
          <ConfirmModal
            report={pendingReport}
            action={pending.action}
            onCancel={cancelVote}
            onConfirm={applyVote}
            isSubmitting={voteHazard.isPending}
          />
        )}
      </div>
    </div>
  )
}