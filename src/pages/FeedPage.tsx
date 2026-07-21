
import { useState, useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { useCurrentLocation } from '../hooks/useCurrentLocation'
import { useNearbyFeed, useVoteHazard } from '../hooks/useFeed'
import AuthFlow from '../components/AuthFlow'
import type { BackendHazardType, Hazard } from '../types/hazard'

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

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-6 h-6 text-purple-500 sm:w-7 sm:h-7"
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

function ConfirmModal({
  hazard,
  action,
  error,
  onCancel,
  onConfirm,
  isSubmitting,
}: {
  hazard: Hazard
  action: 'confirm' | 'incorrect'
  error: string | null
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
        className="w-full max-w-xs px-5 py-6 text-center bg-white shadow-xl rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-bold text-gray-900">
          {isConfirm ? 'Confirm this hazard?' : 'Mark as incorrect?'}
        </h2>

        <p className="mt-2 text-[12px] leading-relaxed text-gray-500">
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

        {error && (
          <p className="mt-2 text-[12px] font-medium text-red-600">
            {error}
          </p>
        )}

        <button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="mt-5 w-full rounded-2xl bg-purple-700 py-2.5 text-[12px] font-semibold text-white transition hover:bg-purple-800 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 size={13} className="animate-spin" />}
          {error ? 'Retry' : isConfirm ? 'Yes, Confirm' : 'Yes, Mark incorrect'}
        </button>

        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="mt-3 text-[12px] font-medium text-purple-700"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

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
    hazard.confirmations.userConfirmation === 'CONFIRM'
      ? 'confirmed'
      : hazard.confirmations.userConfirmation === 'INCORRECT'
        ? 'incorrect'
        : null

  return (
    <div className="w-full overflow-hidden transition bg-white border border-gray-100 shadow-sm rounded-3xl hover:shadow-md">
      <div className="relative flex items-center justify-center h-24 bg-gradient-to-br from-emerald-100 via-teal-50 to-sky-100">
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
            <span className="relative text-2xl drop-shadow-sm">
              {TYPE_EMOJI[hazard.type]}
            </span>
          </>
        )}
      </div>

      <div className="px-3 pt-2.5 pb-3">
        <div className="flex items-center justify-between gap-2">
          <span className="px-2 py-0.5 text-[10px] font-medium text-gray-600 bg-gray-100 rounded-full whitespace-nowrap">
            {TYPE_LABEL[hazard.type]}
          </span>
          <span className="text-[10px] text-gray-400 text-right truncate">
            🕐 {formatTimeAgo(hazard.createdAt)} · By{' '}
            {hazard.isAnonymous ? 'Anon' : hazard.driver?.name ?? 'Anon'}
          </span>
        </div>

        <h3 className="mt-1.5 text-[13px] font-bold leading-snug text-gray-900">
          {hazard.description}
        </h3>

        <p className="flex items-center gap-1 mt-0.5 text-[11px] text-gray-500">
          📍 {hazard.location.address}
          {dist !== null && ` · ${dist.toFixed(1)} km away`}
        </p>

        {vote ? (
          <div className="mt-2.5 flex items-center justify-between rounded-2xl border border-gray-200 pl-3 pr-1.5 py-1.5">
            <span className="text-[11px] text-gray-500">
              You voted {vote === 'confirmed' ? 'Confirmed' : 'Incorrect'}
            </span>
            <span
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold text-white ${
                vote === 'confirmed' ? 'bg-emerald-600' : 'bg-red-600'
              }`}
            >
              {vote === 'confirmed' ? 'Confirmed' : 'Incorrect'}
            </span>
          </div>
        ) : (
          <div className="mt-2.5 flex items-center gap-2">
            <button
              onClick={() => onRequestVote('confirm')}
              className="flex flex-1 items-center justify-center gap-1 rounded-2xl bg-emerald-600 py-2 text-[11px] font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.98]"
            >
              👍 Confirm ({hazard.confirmations.confirms})
            </button>
            <button
              onClick={() => onRequestVote('incorrect')}
              className="flex flex-1 items-center justify-center gap-1 rounded-2xl bg-gray-100 py-2 text-[11px] font-semibold text-red-500 transition hover:bg-gray-200 active:scale-[0.98]"
            >
              👎 Incorrect
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------- Signed-out state (same design as Profile page) ----------

function SignedOutFeed({
  onSignIn,
  onCreateAccount,
}: {
  onSignIn: () => void
  onCreateAccount: () => void
}) {
  return (
    <div className="flex flex-col items-center px-6 pt-10 text-center sm:pt-14">
      <div className="relative flex items-center justify-center mb-5 w-28 h-28 sm:w-32 sm:h-32 sm:mb-6">
        <div className="absolute w-32 h-16 rounded-full sm:w-36 sm:h-[72px] bg-purple-50" />
        <span className="absolute text-sm text-purple-200 -left-1 top-1">✦</span>
        <span className="absolute text-base text-purple-200 -right-1 top-6 sm:top-8">✦</span>
        <div className="relative flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full sm:w-[72px] sm:h-[72px]">
          <LockIcon />
        </div>
      </div>

      <h2 className="text-base font-bold text-gray-900 sm:text-lg">
        Sign in to vote on hazards
      </h2>
      <p className="max-w-sm mt-2 text-xs leading-relaxed text-gray-400 sm:text-sm">
        Confirm or mark hazards as incorrect to help other drivers stay safe. Sign in or create an account to get started.
      </p>

      <div className="flex flex-col w-full max-w-sm gap-3 mt-6 sm:mt-8">
        <button
          onClick={onCreateAccount}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-purple-200 bg-white py-3 text-sm font-semibold text-purple-700 transition active:scale-[0.98] hover:bg-purple-50"
        >
          Create Account
        </button>
        <button
          onClick={onSignIn}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-700 py-3 text-sm font-semibold text-white transition active:scale-[0.98]"
        >
          Sign in
        </button>
      </div>
    </div>
  )
}

const DEFAULT_RADIUS_KM = 10

export default function FeedPage() {
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [showAuthWall, setShowAuthWall] = useState(false)
  const [pendingVote, setPendingVote] = useState<PendingAction | null>(null)

  const { coords, isLoading: isLocating, error: locationError } = useCurrentLocation()

  const feedParams = coords
    ? { latitude: coords.latitude, longitude: coords.longitude, radius: DEFAULT_RADIUS_KM }
    : null

  const {
    data: hazards = [],
    isLoading: isFeedLoading,
    isError,
    error: feedError,
    refetch,
  } = useNearbyFeed(feedParams)

  const voteMutation = useVoteHazard()

  const [pending, setPending] = useState<PendingAction | null>(null)
  const [voteError, setVoteError] = useState<string | null>(null)

  // Tracks whether the vote currently in `pending` should be auto-submitted
  // once state settles (used for the post-auth retry flow).
  const autoRetryRef = useRef(false)

  const handleSignIn = () => {
    setAuthMode('signin')
    setShowAuth(true)
  }

  const handleCreateAccount = () => {
    setAuthMode('signup')
    setShowAuth(true)
  }

  const handleAuthSuccess = () => {
    setShowAuth(false)
    setShowAuthWall(false)
    if (pendingVote) {
      autoRetryRef.current = true
      setPending(pendingVote)
      setPendingVote(null)
    }
  }

  // Runs once `pending` actually reflects the retried vote, avoiding the
  // fragile setTimeout-based retry from the original implementation.
  useEffect(() => {
    if (autoRetryRef.current && pending) {
      autoRetryRef.current = false
      applyVote()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending])

  const requestVote = (hazardId: string, action: 'confirm' | 'incorrect') => {
    // Ignore new requests while a vote is mid-flight, to prevent
    // double-submits from rapid clicks.
    if (voteMutation.isPending) return
    setVoteError(null)
    setPending({ hazardId, action })
  }

  const cancelVote = () => {
    if (voteMutation.isPending) return
    setPending(null)
    setVoteError(null)
  }

  const applyVote = async () => {
    // Guard against double-submit: ignore if there's nothing pending or
    // a request is already in flight.
    if (!pending || voteMutation.isPending) return
    setVoteError(null)
    try {
      await voteMutation.mutateAsync({
        hazardId: pending.hazardId,
        type: pending.action === 'confirm' ? 'CONFIRM' : 'INCORRECT',
      })
      setPending(null)
      setPendingVote(null)
    } catch (err) {
      console.error('Failed to submit vote', err)

      const status = err instanceof Error && 'status' in err ? (err as any).status : undefined

      if (status === 401) {
        setPendingVote({ ...pending })
        setShowAuthWall(true)
        setPending(null)
        return
      }

      setVoteError('Something went wrong sending your vote. Please try again.')
    }
  }

  const pendingHazard = pending ? hazards.find((h) => h.id === pending.hazardId) : undefined

  const isLoading = isLocating || (coords !== null && isFeedLoading)

  // If auth wall is showing, render the signed-out design
  if (showAuthWall) {
    return (
      <div className="min-h-screen bg-gray-50 pb-28">
        <div className="max-w-6xl px-4 mx-auto sm:px-6 lg:px-8">
          <div className="pt-5 pb-3 lg:pt-8 lg:pb-4">
            <h1 className="text-[18px] font-extrabold leading-none text-gray-800">
              Road Feed
            </h1>
            <p className="mt-1 text-[12px] text-gray-400">
              Live reports from drivers near you.
            </p>
          </div>
          <SignedOutFeed onSignIn={handleSignIn} onCreateAccount={handleCreateAccount} />
        </div>

        {showAuth && (
          <AuthFlow
            initialScreen={authMode}
            onClose={() => setShowAuth(false)}
            onAuthSuccess={handleAuthSuccess}
          />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className="max-w-6xl px-4 mx-auto sm:px-6 lg:px-8">
        <div className="pt-5 pb-3 lg:pt-8 lg:pb-4">
          <h1 className="text-[18px] font-extrabold leading-none text-gray-800">
            Road Feed
          </h1>
          <p className="mt-1 text-[12px] text-gray-400">
            Live reports from drivers near you.
          </p>
        </div>

        {locationError ? (
          <p className="text-[13px] text-center text-red-500 max-w-md mx-auto">
            Couldn't get your location: {locationError}
          </p>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="text-purple-700 animate-spin" />
          </div>
        ) : isError ? (
          <div className="max-w-md mx-auto text-center">
            <p className="text-[13px] text-red-500">Failed to load the feed.</p>
            <pre className="mt-2 text-[11px] text-left bg-gray-100 p-3 rounded-lg overflow-auto">
              {feedError instanceof Error ? feedError.message : JSON.stringify(feedError, null, 2)}
            </pre>
            <button
              onClick={() => refetch()}
              className="mt-3 text-[12px] text-purple-700 underline"
            >
              Retry
            </button>
          </div>
        ) : hazards.length === 0 ? (
          <p className="text-[13px] text-center text-gray-400 max-w-md mx-auto">No hazards reported nearby.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
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

        {pending && pendingHazard && (
          <ConfirmModal
            hazard={pendingHazard}
            action={pending.action}
            error={voteError}
            onCancel={cancelVote}
            onConfirm={applyVote}
            isSubmitting={voteMutation.isPending}
          />
        )}

        {showAuth && (
          <AuthFlow
            initialScreen={authMode}
            onClose={() => setShowAuth(false)}
            onAuthSuccess={handleAuthSuccess}
          />
        )}
      </div>
    </div>
  )
}
