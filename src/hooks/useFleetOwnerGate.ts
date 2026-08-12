import { useEffect, useState } from 'react'
import { getStoredRole } from '../lib/userRole'

function computeMustAuthenticate(): boolean {
  if (typeof window === 'undefined') return false
  const hasToken = !!localStorage.getItem('token')
  return getStoredRole() === 'fleet_owner' && !hasToken
}

// Drivers can browse Home/Feed/Plan Route as guests and only get an
// auth prompt when they try a protected action (voting, reporting,
// SOS, etc). Fleet owners don't get that guest mode at all -- as soon
// as we know (from a previous sign-up/sign-in) that someone is a
// fleet owner, they must be authenticated before they can do
// anything on those pages.
//
// Recomputed straight from localStorage on every render (not just on
// mount) so it reflects a token that was set moments earlier in the
// same render pass -- e.g. right after a successful sign-in -- without
// waiting on an event to fire.
export function useFleetOwnerGate(): boolean {
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    const recompute = () => forceUpdate((n) => n + 1)

    // 'auth:logout' fires from apiClient.clearSession(); 'storage' catches
    // token/role changes made in another tab.
    window.addEventListener('auth:logout', recompute)
    window.addEventListener('storage', recompute)
    return () => {
      window.removeEventListener('auth:logout', recompute)
      window.removeEventListener('storage', recompute)
    }
  }, [])

  return computeMustAuthenticate()
}
