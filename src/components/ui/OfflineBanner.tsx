import { useOnlineStatus } from '../../hooks/useOnlineStatus'

interface OfflineBannerProps {
  /** Extra classes for positioning — the banner has no built-in position. */
  className?: string
}

/**
 * Slim, dismiss-free status strip for internet connectivity. Renders
 * nothing while online, an amber "offline" strip while the connection is
 * down, and a brief green "back online" confirmation for a few seconds
 * after it returns — then unmounts itself again.
 *
 * Deliberately not a blocking modal: GPS, on-device voice guidance, and
 * an already-planned route all keep working offline, so a driver
 * mid-trip shouldn't be interrupted — they just need to know why a
 * search or reroute might be failing.
 */
export default function OfflineBanner({ className = '' }: OfflineBannerProps) {
  const { isOnline, justReconnected } = useOnlineStatus()

  if (isOnline && !justReconnected) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl shadow-sm animate-in slide-in-from-top-2 ${
        isOnline
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-amber-50 text-amber-800 border border-amber-200'
      } ${className}`}
    >
      {isOnline ? (
        <>
          <span className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full" />
          Back online
        </>
      ) : (
        <>
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="flex-shrink-0"
          >
            <path d="M2 8.82a15 15 0 0 1 20 0M5 12.86a10 10 0 0 1 14 0M8.5 16.9a5 5 0 0 1 7 0M12 20h.01" />
            <path d="M2 2l20 20" />
          </svg>
          You're offline — search, rerouting, and hazard reports won't update until you're back online
        </>
      )}
    </div>
  )
}
