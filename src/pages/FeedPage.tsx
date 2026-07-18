import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useCurrentLocation } from '../hooks/useCurrentLocation'
import { useHazardFeed, useConfirmHazard } from '../hooks/useHazards'
import AuthFlow from '../components/AuthFlow'
import type { BackendHazardType, Hazard } from '../types/hazard'

// ---------- Display mapping ----------

const TYPE_LABEL: Record<BackendHazardType, string> = {
  POTHOLE: 'Pothole',
  ACCIDENT: 'Accident',
  FLOOD: 'Flood',
  ROAD: 'Road Works',
  CHECKPOINT: 'Checkpoint',
  DEBRIS: 'Debris',
  SOS: 'SOS',
  DANGER: 'Danger Zone',
}

const TYPE_EMOJI: Record<BackendHazardType, string> = {
  POTHOLE: '🕳️',
  ACCIDENT: '🚧',
  FLOOD: '🌊',
  ROAD: '🚜',
  CHECKPOINT: '🚓',
  DEBRIS: '🪨',
  SOS: '🆘',
  DANGER: '⚠️',
}

type VoteState = 'confirmed' | 'incorrect' | null

interface PendingAction {
  hazardId: string
  action: 'confirm' | 'incorrect'
}

function formatTimeAgo(dateStr: string): string {
  const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.floor(minutes / 60)}h ago`
}

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ---------- Signed-out state ----------

function SignedOutFeed({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 pt-16 text-center sm:px-8 sm:pt-20">
      <div className="relative flex items-center justify-center mb-6 w-36 h-36 sm:w-40 sm:h-40 sm:mb-8">
        <div className="absolute w-40 h-20 rounded-full sm:w-48 sm:h-24 bg-purple-50" />
        <span className="absolute text-base text-purple-200 sm:text-lg -left-2 top-2">✦</span>
        <span className="absolute text-xl text-purple-200 sm:text-2xl -right-2 top-8 sm:top-10">✦</span>
        <div className="relative flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full sm:w-24 sm:h-24">
          <LockIcon />
        </div>
      </div>

      <h2 className="text-lg font-bold text-gray-900 sm:text-xl">Sign in to see the road feed</h2>
      <p className="mt-2 sm:mt-3 text-[13px] sm:text-[15px] leading-relaxed text-gray-400">
        Live hazard reports from drivers near you are only visible to signed-in users. Sign in or
        create an account to get started.
      </p>

      <button
        onClick={onSignIn}
        className="mt-6 sm:mt-8 flex w-full max-w-sm items-center justify-center gap-2 rounded-2xl bg-purple-700 py-3.5 sm:py-4 text-[14px] sm:text-[16px] font-semibold text-white transition active:scale-[0.98]"
      >
        Sign in
      </button>
    </div>
  )
}

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-8 h-8 text-purple-500 sm:w-9 sm:h-9"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

// ---------- Confirmation Modal ----------

function ConfirmModal({
  hazard,
  action,
  onCancel,
  onConfirm,
  isSubmitting,
}: {
  hazard: Hazard
  action: 'confirm' | 'incorrect'
  onCancel: () => void
  onConfirm: () => void
  isSubmitting: boolean
}) {
  const isConfirm = action === 'confirm'
  const typeLabel = TYPE_LABEL[hazard.type]

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
              You're verifying that {typeLabel.toLowerCase()} at{' '}
              <span className="font-semibold text-gray-900">{hazard.location.address}</span> is
              still there. This helps other drivers stay safe.
            </>
          ) : (
            <>
              You're reporting that {typeLabel.toLowerCase()} at{' '}
              <span className="font-semibold text-gray-900">{hazard.location.address}</span> is no
              longer accurate. Thanks for keeping the map clean.
            </>
          )}
        </p>

        <button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="mt-6 w-full rounded-2xl bg-purple-700 py-3 sm:py-3.5 text-[13px] sm:text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          {isConfirm ? 'Yes, Confirm' : 'Yes, Mark incorrect'}
        </button>

        <button
          onClick={onCancel}
          disabled={isSubmitting}
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
  hazard,
  distanceKm: dist,
  onRequestVote,
}: {
  hazard: Hazard
  distanceKm: number | null
  onRequestVote: (action: 'confirm' | 'incorrect') => void
}) {
  const vote: VoteState =
    hazard.confirmations.userConfirmation === true
      ? 'confirmed'
      : hazard.confirmations.userConfirmation === false
        ? 'incorrect'
        : null

  return (
    <div className="w-full overflow-hidden bg-white border border-gray-100 shadow-sm rounded-3xl">
      {/* Map-style header */}
      <div className="relative flex items-center justify-center h-28 sm:h-32 bg-gradient-to-br from-emerald-100 via-teal-50 to-sky-100">
        {hazard.photoUrl ? (
          <img src={hazard.photoUrl} alt="" className="absolute inset-0 object-cover w-full h-full" />
        ) : (
          <>
            <div
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(115deg, transparent, transparent 38px, rgba(100,130,150,0.35) 38px, rgba(100,130,150,0.35) 40px)',
              }}
            />
            <span className="relative text-3xl sm:text-4xl drop-shadow-sm">
              {TYPE_EMOJI[hazard.type]}
            </span>
          </>
        )}
      </div>

      {/* Body */}
      <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-3 sm:pt-3.5">
        <div className="flex items-center justify-between">
          <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
            {TYPE_LABEL[hazard.type]}
          </span>
          <span className="text-[11px] sm:text-xs text-gray-400">
            🕐 {formatTimeAgo(hazard.createdAt)} · By{' '}
            {hazard.isAnonymous ? 'Anon' : hazard.driver.name}
          </span>
        </div>

        <h3 className="mt-2 sm:mt-2.5 text-[15px] sm:text-base font-bold leading-snug text-gray-900">
          {hazard.description}
        </h3>

        <p className="flex items-center gap-1 mt-1 text-[13px] sm:text-sm text-gray-500">
          📍 {hazard.location.address}
          {dist !== null && ` · ${dist.toFixed(1)} km away`}
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
              👍 Confirm ({hazard.confirmations.confirms})
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

const DEFAULT_RADIUS_KM = 10

export default function RoadFeed() {
  const [showAuth, setShowAuth] = useState(false)
  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('token')

  const { coords, isLoading: isLocating, error: locationError } = useCurrentLocation()

  const feedParams = coords
    ? { latitude: coords.latitude, longitude: coords.longitude, radius: DEFAULT_RADIUS_KM }
    : null

  // Only fire the feed request at all if the user is logged in — the
  // endpoint returns 401 for guests, so there's no point calling it otherwise.
  const { data: hazards = [], isLoading: isFeedLoading, isError, refetch } = useHazardFeed(
    isLoggedIn ? feedParams : null
  )
  const confirmMutation = useConfirmHazard()

  const [pending, setPending] = useState<PendingAction | null>(null)

  const requestVote = (hazardId: string, action: 'confirm' | 'incorrect') => {
    setPending({ hazardId, action })
  }

  const cancelVote = () => {
    if (confirmMutation.isPending) return
    setPending(null)
  }

  const applyVote = async () => {
    if (!pending) return
    try {
      await confirmMutation.mutateAsync({
        hazardId: pending.hazardId,
        type: pending.action === 'confirm' ? 'CONFIRM' : 'INCORRECT',
      })
      setPending(null)
    } catch (err) {
      console.error('Failed to submit vote', err)
      // keep modal open so the user can retry or cancel
    }
  }

  const pendingHazard = pending ? hazards.find((h) => h.id === pending.hazardId) : undefined

  const isLoading = isLoggedIn && (isLocating || (coords !== null && isFeedLoading))

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
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
        {!isLoggedIn ? (
          <SignedOutFeed onSignIn={() => setShowAuth(true)} />
        ) : locationError ? (
          <p className="px-6 text-sm text-center text-red-500">
            Couldn't get your location: {locationError}
          </p>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="text-purple-700 animate-spin" />
          </div>
        ) : isError ? (
          <p className="px-6 text-sm text-center text-red-500">Failed to load the feed.</p>
        ) : hazards.length === 0 ? (
          <p className="px-6 text-sm text-center text-gray-400">No hazards reported nearby.</p>
        ) : (
          <div className="flex flex-col gap-3 px-4 sm:gap-4">
            {hazards.map((hazard) => (
              <ReportCard
                key={hazard.id}
                hazard={hazard}
                distanceKm={
                  coords
                    ? distanceKm(
                        coords.latitude,
                        coords.longitude,
                        parseFloat(hazard.location.latitude),
                        parseFloat(hazard.location.longitude)
                      )
                    : null
                }
                onRequestVote={(action) => requestVote(hazard.id, action)}
              />
            ))}
          </div>
        )}

        {/* Vote confirmation modal (only reachable when logged in) */}
        {pending && pendingHazard && (
          <ConfirmModal
            hazard={pendingHazard}
            action={pending.action}
            onCancel={cancelVote}
            onConfirm={applyVote}
            isSubmitting={confirmMutation.isPending}
          />
        )}

        {/* Sign-in flow for guests */}
        {showAuth && (
          <AuthFlow
            onClose={() => setShowAuth(false)}
            onAuthSuccess={() => {
              setShowAuth(false)
              refetch()
            }}
          />
        )}
      </div>

      {/* Your existing <BottomNav /> renders below this page */}
    </div>
  )
}
// import { useState } from 'react'
// import { Loader2 } from 'lucide-react'
// import { useCurrentLocation } from '../hooks/useCurrentLocation'
// import { useHazardFeed, useConfirmHazard } from '../hooks/useHazards'
// import type { BackendHazardType, Hazard } from '../types/hazard'

// // ---------- Display mapping ----------

// const TYPE_LABEL: Record<BackendHazardType, string> = {
//   POTHOLE: 'Pothole',
//   ACCIDENT: 'Accident',
//   FLOOD: 'Flood',
//   ROAD: 'Road Works',
//   CHECKPOINT: 'Checkpoint',
//   DEBRIS: 'Debris',
//   SOS: 'SOS',
//   DANGER: 'Danger Zone',
// }

// const TYPE_EMOJI: Record<BackendHazardType, string> = {
//   POTHOLE: '🕳️',
//   ACCIDENT: '🚧',
//   FLOOD: '🌊',
//   ROAD: '🚜',
//   CHECKPOINT: '🚓',
//   DEBRIS: '🪨',
//   SOS: '🆘',
//   DANGER: '⚠️',
// }

// type VoteState = 'confirmed' | 'incorrect' | null

// interface PendingAction {
//   hazardId: string
//   action: 'confirm' | 'incorrect'
// }

// function formatTimeAgo(dateStr: string): string {
//   const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
//   if (minutes < 1) return 'just now'
//   if (minutes < 60) return `${minutes}m ago`
//   return `${Math.floor(minutes / 60)}h ago`
// }

// function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
//   const R = 6371
//   const dLat = ((lat2 - lat1) * Math.PI) / 180
//   const dLon = ((lon2 - lon1) * Math.PI) / 180
//   const a =
//     Math.sin(dLat / 2) ** 2 +
//     Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
//   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
// }

// // ---------- Confirmation Modal ----------

// function ConfirmModal({
//   hazard,
//   action,
//   onCancel,
//   onConfirm,
//   isSubmitting,
// }: {
//   hazard: Hazard
//   action: 'confirm' | 'incorrect'
//   onCancel: () => void
//   onConfirm: () => void
//   isSubmitting: boolean
// }) {
//   const isConfirm = action === 'confirm'
//   const typeLabel = TYPE_LABEL[hazard.type]

//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/40"
//       onClick={onCancel}
//     >
//       <div
//         className="w-full max-w-sm px-6 py-8 text-center bg-white shadow-xl rounded-3xl"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <h2 className="text-base font-bold text-gray-900 sm:text-lg">
//           {isConfirm ? 'Confirm this hazard?' : 'Mark as incorrect?'}
//         </h2>

//         <p className="mt-3 text-[13px] sm:text-sm leading-relaxed text-gray-500">
//           {isConfirm ? (
//             <>
//               You're verifying that {typeLabel.toLowerCase()} at{' '}
//               <span className="font-semibold text-gray-900">{hazard.location.address}</span> is
//               still there. This helps other drivers stay safe.
//             </>
//           ) : (
//             <>
//               You're reporting that {typeLabel.toLowerCase()} at{' '}
//               <span className="font-semibold text-gray-900">{hazard.location.address}</span> is no
//               longer accurate. Thanks for keeping the map clean.
//             </>
//           )}
//         </p>

//         <button
//           onClick={onConfirm}
//           disabled={isSubmitting}
//           className="mt-6 w-full rounded-2xl bg-purple-700 py-3 sm:py-3.5 text-[13px] sm:text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
//         >
//           {isSubmitting && <Loader2 size={14} className="animate-spin" />}
//           {isConfirm ? 'Yes, Confirm' : 'Yes, Mark incorrect'}
//         </button>

//         <button
//           onClick={onCancel}
//           disabled={isSubmitting}
//           className="mt-4 text-[13px] sm:text-sm font-medium text-purple-700"
//         >
//           Cancel
//         </button>
//       </div>
//     </div>
//   )
// }

// // ---------- Report Card ----------

// function ReportCard({
//   hazard,
//   distanceKm: dist,
//   onRequestVote,
// }: {
//   hazard: Hazard
//   distanceKm: number | null
//   onRequestVote: (action: 'confirm' | 'incorrect') => void
// }) {
//   const vote: VoteState =
//     hazard.confirmations.userConfirmation === true
//       ? 'confirmed'
//       : hazard.confirmations.userConfirmation === false
//         ? 'incorrect'
//         : null

//   return (
//     <div className="w-full overflow-hidden bg-white border border-gray-100 shadow-sm rounded-3xl">
//       {/* Map-style header */}
//       <div className="relative flex items-center justify-center h-28 sm:h-32 bg-gradient-to-br from-emerald-100 via-teal-50 to-sky-100">
//         {hazard.photoUrl ? (
//           <img src={hazard.photoUrl} alt="" className="absolute inset-0 object-cover w-full h-full" />
//         ) : (
//           <>
//             <div
//               className="absolute inset-0 opacity-40"
//               style={{
//                 backgroundImage:
//                   'repeating-linear-gradient(115deg, transparent, transparent 38px, rgba(100,130,150,0.35) 38px, rgba(100,130,150,0.35) 40px)',
//               }}
//             />
//             <span className="relative text-3xl sm:text-4xl drop-shadow-sm">
//               {TYPE_EMOJI[hazard.type]}
//             </span>
//           </>
//         )}
//       </div>

//       {/* Body */}
//       <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-3 sm:pt-3.5">
//         <div className="flex items-center justify-between">
//           <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 text-[11px] sm:text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
//             {TYPE_LABEL[hazard.type]}
//           </span>
//           <span className="text-[11px] sm:text-xs text-gray-400">
//             🕐 {formatTimeAgo(hazard.createdAt)} · By{' '}
//             {hazard.isAnonymous ? 'Anon' : hazard.driver.name}
//           </span>
//         </div>

//         <h3 className="mt-2 sm:mt-2.5 text-[15px] sm:text-base font-bold leading-snug text-gray-900">
//           {hazard.description}
//         </h3>

//         <p className="flex items-center gap-1 mt-1 text-[13px] sm:text-sm text-gray-500">
//           📍 {hazard.location.address}
//           {dist !== null && ` · ${dist.toFixed(1)} km away`}
//         </p>

//         {vote ? (
//           <div className="mt-3 sm:mt-3.5 flex items-center justify-between rounded-2xl border border-gray-200 pl-4 pr-1.5 py-1.5">
//             <span className="text-[13px] sm:text-sm text-gray-500">
//               You voted {vote === 'confirmed' ? 'Confirmed' : 'Incorrect'}
//             </span>
//             <span
//               className={`rounded-full px-3.5 sm:px-4 py-2 text-[13px] sm:text-sm font-semibold text-white ${
//                 vote === 'confirmed' ? 'bg-emerald-600' : 'bg-red-600'
//               }`}
//             >
//               {vote === 'confirmed' ? 'Confirmed' : 'Incorrect'}
//             </span>
//           </div>
//         ) : (
//           <div className="mt-3 sm:mt-3.5 flex items-center gap-2.5 sm:gap-3">
//             <button
//               onClick={() => onRequestVote('confirm')}
//               className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 py-2.5 sm:py-3 text-[13px] sm:text-sm font-semibold text-white transition active:scale-[0.98]"
//             >
//               👍 Confirm ({hazard.confirmations.confirms})
//             </button>
//             <button
//               onClick={() => onRequestVote('incorrect')}
//               className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-gray-100 py-2.5 sm:py-3 text-[13px] sm:text-sm font-semibold text-red-500 transition active:scale-[0.98]"
//             >
//               👎 Incorrect
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

// // ---------- Page ----------

// const DEFAULT_RADIUS_KM = 10

// export default function RoadFeed() {
//   const { coords, isLoading: isLocating, error: locationError } = useCurrentLocation()

//   const feedParams = coords
//     ? { latitude: coords.latitude, longitude: coords.longitude, radius: DEFAULT_RADIUS_KM }
//     : null

//   const { data: hazards = [], isLoading: isFeedLoading, isError } = useHazardFeed(feedParams)
//   const confirmMutation = useConfirmHazard()

//   const [pending, setPending] = useState<PendingAction | null>(null)

//   const requestVote = (hazardId: string, action: 'confirm' | 'incorrect') => {
//     setPending({ hazardId, action })
//   }

//   const cancelVote = () => {
//     if (confirmMutation.isPending) return
//     setPending(null)
//   }

//   const applyVote = async () => {
//     if (!pending) return
//     try {
//       await confirmMutation.mutateAsync({
//         hazardId: pending.hazardId,
//         type: pending.action === 'confirm' ? 'CONFIRM' : 'INCORRECT',
//       })
//       setPending(null)
//     } catch (err) {
//       console.error('Failed to submit vote', err)
//       // keep modal open so the user can retry or cancel
//     }
//   }

//   const pendingHazard = pending ? hazards.find((h) => h.id === pending.hazardId) : undefined

//   const isLoading = isLocating || (coords !== null && isFeedLoading)

//   return (
//     <div className="min-h-screen bg-gray-50 pb-28">
//       <div className="max-w-xl mx-auto">
//         {/* Header */}
//         <div className="px-4 pt-6 pb-4 sm:px-5">
//           <h1 className="text-[22px] sm:text-[28px] font-extrabold leading-none text-gray-800">
//             Road Feed
//           </h1>
//           <p className="mt-1.5 sm:mt-2 text-[13px] sm:text-[15px] text-gray-400">
//             Live reports from drivers near you.
//           </p>
//         </div>

//         {/* Feed */}
//         {locationError ? (
//           <p className="px-6 text-sm text-center text-red-500">
//             Couldn't get your location: {locationError}
//           </p>
//         ) : isLoading ? (
//           <div className="flex items-center justify-center py-20">
//             <Loader2 size={24} className="text-purple-700 animate-spin" />
//           </div>
//         ) : isError ? (
//           <p className="px-6 text-sm text-center text-red-500">Failed to load the feed.</p>
//         ) : hazards.length === 0 ? (
//           <p className="px-6 text-sm text-center text-gray-400">No hazards reported nearby.</p>
//         ) : (
//           <div className="flex flex-col gap-3 px-4 sm:gap-4">
//             {hazards.map((hazard) => (
//               <ReportCard
//                 key={hazard.id}
//                 hazard={hazard}
//                 distanceKm={
//                   coords
//                     ? distanceKm(
//                         coords.latitude,
//                         coords.longitude,
//                         parseFloat(hazard.location.latitude),
//                         parseFloat(hazard.location.longitude)
//                       )
//                     : null
//                 }
//                 onRequestVote={(action) => requestVote(hazard.id, action)}
//               />
//             ))}
//           </div>
//         )}

//         {/* Modal */}
//         {pending && pendingHazard && (
//           <ConfirmModal
//             hazard={pendingHazard}
//             action={pending.action}
//             onCancel={cancelVote}
//             onConfirm={applyVote}
//             isSubmitting={confirmMutation.isPending}
//           />
//         )}
//       </div>

//       {/* Your existing <BottomNav /> renders below this page */}
//     </div>
//   )
// }