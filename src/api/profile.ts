





const API_BASE = 'https://backend-production-01de.up.railway.app'

export interface DriverProfile {
  id: string
  licenseNumber: string
  phoneNumber: string | null
  dateOfBirth: string
  address: string | null
  emergencyContact: string | null
  createdAt: string
  updatedAt: string
}

export interface UserProfileResponse {
  id: string
  phoneNumber: string | null
  firstName: string
  lastName: string
  gender: string
  dateOfBirth: string
  occupation: string
  role: string
  isPhoneVerified: boolean
  hasCompletedOnboarding: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  driverProfile: DriverProfile | null
}

// ── Update payload ──────────────────────────────────────────

export interface UpdateProfileInput {
  firstName: string
  lastName: string
  gender: string
  dateOfBirth: string // "YYYY-MM-DD"
  occupation: string
  address: string
}

// ── Token Helpers ───────────────────────────────────────────

function getToken(): string | null {
  return localStorage.getItem('token')
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const exp = payload.exp
    if (!exp) return false
    return Date.now() >= exp * 1000
  } catch {
    return true
  }
}

function authHeaders(): HeadersInit {
  const token = getToken()

  if (!token) {
    throw new Error('No authentication token found')
  }

  if (isTokenExpired(token)) {
    throw new Error('Session expired. Please log in again.')
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

export async function getUserProfile(): Promise<UserProfileResponse> {
  const res = await fetch(`${API_BASE}/users/profile`, {
    headers: authHeaders(),
  })

  if (res.status === 401) {
    throw new Error('Session expired. Please log in again.')
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new Error(errBody.message || `Failed to fetch profile (${res.status})`)
  }

  return res.json()
}

export async function updateUserProfile(
  input: UpdateProfileInput
): Promise<UserProfileResponse> {
  const res = await fetch(`${API_BASE}/users/profile`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(input),
  })

  if (res.status === 401) {
    throw new Error('Session expired. Please log in again.')
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    throw new Error(errBody.message || `Failed to update profile (${res.status})`)
  }

  return res.json()
}