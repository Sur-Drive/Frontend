// ─── Driver / Fleet Owner role tracking ────────────────────────────
// The backend doesn't return `role` on every auth response (e.g. plain
// /auth/login), so we keep a local record of which role the person
// picked/used last. This lets pages that need to force fleet owners to
// log in before browsing (see useFleetOwnerGate) know who they're
// dealing with even before a token exists.

export type UserRole = 'driver' | 'fleet_owner'

const ROLE_KEY = 'userRole'

export function getStoredRole(): UserRole | null {
  if (typeof window === 'undefined') return null
  const value = localStorage.getItem(ROLE_KEY)
  return value === 'driver' || value === 'fleet_owner' ? value : null
}

export function setStoredRole(role: UserRole) {
  if (typeof window === 'undefined') return
  localStorage.setItem(ROLE_KEY, role)
}

export function clearStoredRole() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ROLE_KEY)
}

/**
 * Best-effort role resolution after an auth call succeeds: prefer
 * whatever the server says the account's role actually is, and only
 * fall back to the role the person picked in the UI (relevant for
 * /auth/login, which doesn't accept or return a role at all).
 */
export function resolveRoleFromAuthResponse(data: any, fallback: UserRole): UserRole {
  const serverRole = data?.user?.role ?? data?.role
  return serverRole === 'driver' || serverRole === 'fleet_owner' ? serverRole : fallback
}
