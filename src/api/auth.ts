const API_BASE = 'https://backend-production-01de.up.railway.app'

// ─── Interfaces ─────────────────────────────────────────────────────

export interface SendOtpPayload {
  identifier: string // email or phone number
  role: string
}

export interface SendOtpResponse {
  message: string
  [key: string]: any
}

export interface VerifyOtpPayload {
  identifier: string // email or phone number
  otp: string
}

export interface VerifyOtpResponse {
  message: string
  token?: string
  user?: any
  [key: string]: any
}

export interface PersonalInfoPayload {
  firstName: string
  lastName: string
  gender: string
  dateOfBirth: string
  occupation: string
}

export interface PersonalInfoResponse {
  message: string
  user?: any
  [key: string]: any
}

export interface SetPasswordPayload {
  password: string
  confirmPassword: string
}

export interface SetPasswordResponse {
  message: string
  user?: any
  [key: string]: any
}

export interface LoginPayload {
  identifier: string // email or phone number
  password: string
}

export interface LoginResponse {
  message: string
  token?: string
  user?: any
  [key: string]: any
}

export interface RefreshTokenResponse {
  message: string
  tokens?: {
    accessToken: string
    refreshToken: string
  }
  [key: string]: any
}

export interface LogoutResponse {
  message: string
  [key: string]: any
}

// ─── Forgot Password interfaces ────────────────────────────────────

export interface ForgotPasswordPayload {
  identifier: string // email or phone number
}

export interface ForgotPasswordResponse {
  message: string
  [key: string]: any
}

export interface VerifyResetOtpPayload {
  identifier: string // email or phone number
  otp: string
}

export interface VerifyResetOtpResponse {
  message: string
  token?: string
  [key: string]: any
}

export interface ResetPasswordPayload {
  password: string
  confirmPassword: string
}

export interface ResetPasswordResponse {
  message: string
  [key: string]: any
}

// ─── Shared helpers ─────────────────────────────────────────────────

async function parseResponse(res: Response, fallbackMessage: string) {
  const responseText = await res.text()
  console.log('📥 Raw response:', responseText)
  console.log('📥 Status:', res.status)

  if (!res.ok) {
    let errorData: any = {}
    try {
      errorData = JSON.parse(responseText)
    } catch {
      errorData = { raw: responseText }
    }
    throw new Error(errorData.message || errorData.error || `${fallbackMessage} (${res.status})`)
  }

  return responseText ? JSON.parse(responseText) : {}
}

function authHeaders(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function convertToISODate(dateString: string): string {
  if (!dateString.includes('/')) {
    return dateString
  }

  const parts = dateString.split('/')
  if (parts.length !== 3) {
    throw new Error('Invalid date format. Expected DD/MM/YYYY or MM/DD/YYYY')
  }

  const [part1, part2, year] = parts

  const day = parseInt(part1) > 12 ? part1 : part2
  const month = parseInt(part1) > 12 ? part2 : part1

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

// ─── Auth functions ─────────────────────────────────────────────────

export async function sendOtp(payload: SendOtpPayload): Promise<SendOtpResponse> {
  console.log('📤 Sending OTP:', JSON.stringify(payload))

  const res = await fetch(`${API_BASE}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload),
  })

  return parseResponse(res, 'Failed to send OTP')
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResponse> {
  console.log('📤 Verifying OTP:', JSON.stringify(payload))

  const res = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await parseResponse(res, 'Invalid OTP')

  const token = data.user?.accessToken || data.token
  if (token) {
    localStorage.setItem('token', token)
    console.log('🔑 Token saved to localStorage:', token.substring(0, 30) + '...')
  } else {
    console.warn('⚠️ No accessToken found in verify-otp response')
  }

  return data
}

export async function sendPersonalInfo(payload: PersonalInfoPayload): Promise<PersonalInfoResponse> {
  const token = localStorage.getItem('token')

  const formattedPayload = {
    ...payload,
    dateOfBirth: convertToISODate(payload.dateOfBirth),
  }

  console.log('📤 Sending personal info:', JSON.stringify(formattedPayload))

  const res = await fetch(`${API_BASE}/auth/personal-info`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders(token),
    },
    body: JSON.stringify(formattedPayload),
  })

  return parseResponse(res, 'Failed to save personal info')
}

export async function setPassword(payload: SetPasswordPayload): Promise<SetPasswordResponse> {
  const token = localStorage.getItem('token')

  console.log('📤 Setting password...')

  const res = await fetch(`${API_BASE}/auth/set-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders(token),
    },
    body: JSON.stringify(payload),
  })

  return parseResponse(res, 'Failed to set password')
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  console.log('📤 Logging in:', payload.identifier)

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await parseResponse(res, 'Login failed')

  const token = data.tokens?.accessToken || data.token || data.user?.accessToken
  const refreshTokenValue = data.tokens?.refreshToken

  if (token) {
    localStorage.setItem('token', token)
    console.log('🔑 Login token saved:', token.substring(0, 30) + '...')
  } else {
    console.warn('⚠️ No token found in login response. Keys:', Object.keys(data))
  }

  if (refreshTokenValue) {
    localStorage.setItem('refreshToken', refreshTokenValue)
  }

  return data
}

export async function refreshToken(): Promise<RefreshTokenResponse> {
  const refreshTokenValue = localStorage.getItem('refreshToken')

  console.log('🔄 Refreshing token...')

  if (!refreshTokenValue) {
    throw new Error('No refresh token available')
  }

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ refreshToken: refreshTokenValue }),
  })

  const data = await parseResponse(res, 'Token refresh failed')

  const newAccessToken = data.tokens?.accessToken || data.accessToken || data.token
  const newRefreshToken = data.tokens?.refreshToken || data.refreshToken

  if (newAccessToken) {
    localStorage.setItem('token', newAccessToken)
    console.log('🔑 New access token saved:', newAccessToken.substring(0, 30) + '...')
  } else {
    console.warn('⚠️ No access token in refresh response')
  }

  if (newRefreshToken) {
    localStorage.setItem('refreshToken', newRefreshToken)
  }

  return data
}

export async function logout(): Promise<LogoutResponse> {
  const token = localStorage.getItem('token')
  const refreshTokenValue = localStorage.getItem('refreshToken')

  console.log('📤 Logging out...')

  try {
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...authHeaders(token),
      },
      body: JSON.stringify({ refreshToken: refreshTokenValue }),
    })

    const data = await parseResponse(res, 'Logout failed')
    return data
  } finally {
    // Always clear local session, even if the request fails,
    // so the user isn't stuck "logged in" on the client.
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    console.log('🔑 Local session cleared')
  }
}

// ─── Forgot Password functions ─────────────────────────────────────

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> {
  console.log('📤 Sending forgot password:', JSON.stringify(payload))

  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload),
  })

  return parseResponse(res, 'Failed to send reset code')
}

export async function verifyResetOtp(payload: VerifyResetOtpPayload): Promise<VerifyResetOtpResponse> {
  console.log('📤 Verifying reset OTP:', JSON.stringify(payload))

  const res = await fetch(`${API_BASE}/auth/verify-reset-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await parseResponse(res, 'Invalid OTP')

  const token = data.token || data.user?.accessToken || data.tokens?.accessToken
  if (token) {
    localStorage.setItem('resetToken', token)
    console.log('🔑 Reset token saved:', token.substring(0, 30) + '...')
  }

  return data
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<ResetPasswordResponse> {
  const resetToken = localStorage.getItem('resetToken')

  console.log('📤 Resetting password...')

  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...authHeaders(resetToken),
    },
    body: JSON.stringify(payload),
  })

  const data = await parseResponse(res, 'Failed to reset password')

  localStorage.removeItem('resetToken')

  return data
}