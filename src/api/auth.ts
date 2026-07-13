

const API_BASE = 'https://backend-production-01de.up.railway.app'

export interface SendOtpPayload {
  phoneNumber: string
  role: string
}

export interface SendOtpResponse {
  message: string
  [key: string]: any
}

export interface VerifyOtpPayload {
  phoneNumber: string
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
  phoneNumber: string
  password: string
}

export interface LoginResponse {
  message: string
  token?: string
  user?: any
  [key: string]: any
}

export async function sendOtp(payload: SendOtpPayload): Promise<SendOtpResponse> {
  console.log('📤 Sending to backend:', JSON.stringify(payload))

  const res = await fetch(`${API_BASE}/auth/send-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  })

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
    throw new Error(errorData.message || errorData.error || `Failed (${res.status})`)
  }

  return JSON.parse(responseText)
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResponse> {
  console.log('📤 Verifying OTP:', JSON.stringify(payload))

  const res = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const responseText = await res.text()
  console.log('📥 Raw verify response:', responseText)
  console.log('📥 Status:', res.status)

  if (!res.ok) {
    let errorData: any = {}
    try {
      errorData = JSON.parse(responseText)
    } catch {
      errorData = { raw: responseText }
    }
    throw new Error(errorData.message || errorData.error || `Invalid OTP (${res.status})`)
  }

  const data = JSON.parse(responseText)

  const token = data.user?.accessToken
  if (token) {
    localStorage.setItem('token', token)
    console.log('🔑 Token saved to localStorage:', token.substring(0, 30) + '...')
  } else {
    console.warn('⚠️ No accessToken found in verify-otp response')
  }

  return data
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

export async function sendPersonalInfo(payload: PersonalInfoPayload): Promise<PersonalInfoResponse> {
  const token = localStorage.getItem('token')

  const formattedPayload = {
    ...payload,
    dateOfBirth: convertToISODate(payload.dateOfBirth),
  }

  console.log('📤 Sending personal info:', JSON.stringify(formattedPayload))
  console.log('🔑 Token present:', !!token)
  console.log('🔑 Full Authorization header:', token ? `Bearer ${token}` : 'NONE')
  console.log('🔑 Token length:', token?.length)

  const res = await fetch(`${API_BASE}/auth/personal-info`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(formattedPayload),
  })

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
    throw new Error(errorData.message || errorData.error || `Failed (${res.status})`)
  }

  return JSON.parse(responseText)
}

export async function setPassword(payload: SetPasswordPayload): Promise<SetPasswordResponse> {
  const token = localStorage.getItem('token')

  console.log('📤 Setting password...')
  console.log('🔑 Token present:', !!token)

  const res = await fetch(`${API_BASE}/auth/set-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  })

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
    throw new Error(errorData.message || errorData.error || `Failed (${res.status})`)
  }

  return JSON.parse(responseText)
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  console.log('📤 Logging in:', payload.phoneNumber)

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const responseText = await res.text()
  console.log('📥 Raw login response:', responseText)
  console.log('📥 Status:', res.status)

  if (!res.ok) {
    let errorData: any = {}
    try {
      errorData = JSON.parse(responseText)
    } catch {
      errorData = { raw: responseText }
    }
    throw new Error(errorData.message || errorData.error || `Login failed (${res.status})`)
  }

  const data = JSON.parse(responseText)

  // Save token from login response
  const token = data.token || data.user?.accessToken
  if (token) {
    localStorage.setItem('token', token)
    console.log('🔑 Login token saved:', token.substring(0, 30) + '...')
  } else {
    console.warn('⚠️ No token found in login response')
  }

  return data
}