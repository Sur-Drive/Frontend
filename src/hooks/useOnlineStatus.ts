import { useEffect, useState } from 'react'

export interface OnlineStatus {
  /** Live browser connectivity — flips on the 'online'/'offline' window events. */
  isOnline: boolean
  /**
   * True for a few seconds right after coming back online, so the UI can
   * show a brief "back online" confirmation instead of the banner just
   * vanishing with no acknowledgement.
   */
  justReconnected: boolean
}

const RECONNECT_BANNER_MS = 3000

/**
 * navigator.onLine only tells you the OS thinks it has a network
 * interface up — it does NOT mean requests will actually succeed (e.g.
 * connected to Wi-Fi with no internet, captive portal, etc). It's still
 * the right first-line signal for a "you're offline" banner because it's
 * instant and free; anything more thorough (a HEAD ping) would need to
 * poll and cost data on every driver's phone, which isn't worth it for a
 * banner. Route planning / hazard fetch calls already surface their own
 * "couldn't reach the server" errors for the deeper case.
 */
export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine
  )
  const [justReconnected, setJustReconnected] = useState(false)

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    const handleOnline = () => {
      setIsOnline(true)
      setJustReconnected(true)
      reconnectTimer = setTimeout(() => setJustReconnected(false), RECONNECT_BANNER_MS)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setJustReconnected(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (reconnectTimer) clearTimeout(reconnectTimer)
    }
  }, [])

  return { isOnline, justReconnected }
}
