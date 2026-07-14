



// const API_BASE = 'https://backend-production-01de.up.railway.app'

// export interface SendOtpPayload {
//   phoneNumber: string
//   role: string
// }

// export interface SendOtpResponse {
//   message: string
//   [key: string]: any
// }

// export interface VerifyOtpPayload {
//   phoneNumber: string
//   otp: string
// }

// export interface VerifyOtpResponse {
//   message: string
//   token?: string
//   user?: any
//   [key: string]: any
// }

// export interface PersonalInfoPayload {
//   firstName: string
//   lastName: string
//   gender: string
//   dateOfBirth: string
//   occupation: string
// }

// export interface PersonalInfoResponse {
//   message: string
//   user?: any
//   [key: string]: any
// }

// export interface SetPasswordPayload {
//   password: string
//   confirmPassword: string
// }

// export interface SetPasswordResponse {
//   message: string
//   user?: any
//   [key: string]: any
// }

// export interface LoginPayload {
//   phoneNumber: string
//   password: string
// }

// export interface LoginResponse {
//   message: string
//   token?: string
//   user?: any
//   [key: string]: any
// }

// export interface RefreshTokenResponse {
//   message: string
//   tokens?: {
//     accessToken: string
//     refreshToken: string
//   }
//   [key: string]: any
// }

// export async function sendOtp(payload: SendOtpPayload): Promise<SendOtpResponse> {
//   console.log('📤 Sending to backend:', JSON.stringify(payload))

//   const res = await fetch(`${API_BASE}/auth/send-otp`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Accept': 'application/json',
//     },
//     body: JSON.stringify(payload),
//   })

//   const responseText = await res.text()
//   console.log('📥 Raw response:', responseText)
//   console.log('📥 Status:', res.status)

//   if (!res.ok) {
//     let errorData: any = {}
//     try {
//       errorData = JSON.parse(responseText)
//     } catch {
//       errorData = { raw: responseText }
//     }
//     throw new Error(errorData.message || errorData.error || `Failed (${res.status})`)
//   }

//   return JSON.parse(responseText)
// }

// export async function verifyOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResponse> {
//   console.log('📤 Verifying OTP:', JSON.stringify(payload))

//   const res = await fetch(`${API_BASE}/auth/verify-otp`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Accept': 'application/json',
//     },
//     body: JSON.stringify(payload),
//   })

//   const responseText = await res.text()
//   console.log('📥 Raw verify response:', responseText)
//   console.log('📥 Status:', res.status)

//   if (!res.ok) {
//     let errorData: any = {}
//     try {
//       errorData = JSON.parse(responseText)
//     } catch {
//       errorData = { raw: responseText }
//     }
//     throw new Error(errorData.message || errorData.error || `Invalid OTP (${res.status})`)
//   }

//   const data = JSON.parse(responseText)

//   const token = data.user?.accessToken
//   if (token) {
//     localStorage.setItem('token', token)
//     console.log('🔑 Token saved to localStorage:', token.substring(0, 30) + '...')
//   } else {
//     console.warn('⚠️ No accessToken found in verify-otp response')
//   }

//   return data
// }

// function convertToISODate(dateString: string): string {
//   if (!dateString.includes('/')) {
//     return dateString
//   }

//   const parts = dateString.split('/')
//   if (parts.length !== 3) {
//     throw new Error('Invalid date format. Expected DD/MM/YYYY or MM/DD/YYYY')
//   }

//   const [part1, part2, year] = parts

//   const day = parseInt(part1) > 12 ? part1 : part2
//   const month = parseInt(part1) > 12 ? part2 : part1

//   return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
// }

// export async function sendPersonalInfo(payload: PersonalInfoPayload): Promise<PersonalInfoResponse> {
//   const token = localStorage.getItem('token')

//   const formattedPayload = {
//     ...payload,
//     dateOfBirth: convertToISODate(payload.dateOfBirth),
//   }

//   console.log('📤 Sending personal info:', JSON.stringify(formattedPayload))
//   console.log('🔑 Token present:', !!token)
//   console.log('🔑 Full Authorization header:', token ? `Bearer ${token}` : 'NONE')
//   console.log('🔑 Token length:', token?.length)

//   const res = await fetch(`${API_BASE}/auth/personal-info`, {
//     method: 'PATCH',
//     headers: {
//       'Content-Type': 'application/json',
//       'Accept': 'application/json',
//       ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
//     },
//     body: JSON.stringify(formattedPayload),
//   })

//   const responseText = await res.text()
//   console.log('📥 Raw response:', responseText)
//   console.log('📥 Status:', res.status)

//   if (!res.ok) {
//     let errorData: any = {}
//     try {
//       errorData = JSON.parse(responseText)
//     } catch {
//       errorData = { raw: responseText }
//     }
//     throw new Error(errorData.message || errorData.error || `Failed (${res.status})`)
//   }

//   return JSON.parse(responseText)
// }

// export async function setPassword(payload: SetPasswordPayload): Promise<SetPasswordResponse> {
//   const token = localStorage.getItem('token')

//   console.log('📤 Setting password...')
//   console.log('🔑 Token present:', !!token)

//   const res = await fetch(`${API_BASE}/auth/set-password`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Accept': 'application/json',
//       ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
//     },
//     body: JSON.stringify(payload),
//   })

//   const responseText = await res.text()
//   console.log('📥 Raw response:', responseText)
//   console.log('📥 Status:', res.status)

//   if (!res.ok) {
//     let errorData: any = {}
//     try {
//       errorData = JSON.parse(responseText)
//     } catch {
//       errorData = { raw: responseText }
//     }
//     throw new Error(errorData.message || errorData.error || `Failed (${res.status})`)
//   }

//   return JSON.parse(responseText)
// }

// export async function login(payload: LoginPayload): Promise<LoginResponse> {
//   console.log('📤 Logging in:', payload.phoneNumber)

//   const res = await fetch(`${API_BASE}/auth/login`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Accept': 'application/json',
//     },
//     body: JSON.stringify(payload),
//   })

//   const responseText = await res.text()
//   console.log('📥 Raw login response:', responseText)
//   console.log('📥 Status:', res.status)

//   if (!res.ok) {
//     let errorData: any = {}
//     try {
//       errorData = JSON.parse(responseText)
//     } catch {
//       errorData = { raw: responseText }
//     }
//     throw new Error(errorData.message || errorData.error || `Login failed (${res.status})`)
//   }

//   const data = JSON.parse(responseText)

//   // ✅ FIXED: Check data.tokens.accessToken (backend nests it here)
//   const token = data.tokens?.accessToken || data.token || data.user?.accessToken
//   const refreshToken = data.tokens?.refreshToken

//   if (token) {
//     localStorage.setItem('token', token)
//     console.log('🔑 Login token saved:', token.substring(0, 30) + '...')
//   } else {
//     console.warn('⚠️ No token found in login response')
//     console.warn('Response keys:', Object.keys(data))
//   }

//   if (refreshToken) {
//     localStorage.setItem('refreshToken', refreshToken)
//   }

//   return data
// }

// export async function refreshToken(): Promise<RefreshTokenResponse> {
//   const refreshToken = localStorage.getItem('refreshToken')

//   console.log('🔄 Refreshing token...')
//   console.log('🔑 Refresh token present:', !!refreshToken)

//   if (!refreshToken) {
//     throw new Error('No refresh token available')
//   }

//   const res = await fetch(`${API_BASE}/auth/refresh`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Accept': 'application/json',
//     },
//     body: JSON.stringify({ refreshToken }),
//   })

//   const responseText = await res.text()
//   console.log('📥 Raw refresh response:', responseText)
//   console.log('📥 Status:', res.status)

//   if (!res.ok) {
//     let errorData: any = {}
//     try {
//       errorData = JSON.parse(responseText)
//     } catch {
//       errorData = { raw: responseText }
//     }
//     throw new Error(errorData.message || errorData.error || `Token refresh failed (${res.status})`)
//   }

//   const data = JSON.parse(responseText)

//   // Update stored tokens
//   const newAccessToken = data.tokens?.accessToken || data.accessToken || data.token
//   const newRefreshToken = data.tokens?.refreshToken || data.refreshToken

//   if (newAccessToken) {
//     localStorage.setItem('token', newAccessToken)
//     console.log('🔑 New access token saved:', newAccessToken.substring(0, 30) + '...')
//   } else {
//     console.warn('⚠️ No access token in refresh response')
//   }

//   if (newRefreshToken) {
//     localStorage.setItem('refreshToken', newRefreshToken)
//   }

//   return data
// }








const API_BASE = 'https://backend-production-01de.up.railway.app'

// ─── Existing interfaces ───────────────────────────────────────────

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

export interface RefreshTokenResponse {
  message: string
  tokens?: {
    accessToken: string
    refreshToken: string
  }
  [key: string]: any
}

// ─── Forgot Password interfaces ────────────────────────────────────

export interface ForgotPasswordPayload {
  phoneNumber: string
}

export interface ForgotPasswordResponse {
  message: string
  [key: string]: any
}

export interface VerifyResetOtpPayload {
  phoneNumber: string
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

// ─── Existing functions ────────────────────────────────────────────

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

  const token = data.tokens?.accessToken || data.token || data.user?.accessToken
  const refreshToken = data.tokens?.refreshToken

  if (token) {
    localStorage.setItem('token', token)
    console.log('🔑 Login token saved:', token.substring(0, 30) + '...')
  } else {
    console.warn('⚠️ No token found in login response')
    console.warn('Response keys:', Object.keys(data))
  }

  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken)
  }

  return data
}

export async function refreshToken(): Promise<RefreshTokenResponse> {
  const refreshToken = localStorage.getItem('refreshToken')

  console.log('🔄 Refreshing token...')
  console.log('🔑 Refresh token present:', !!refreshToken)

  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  })

  const responseText = await res.text()
  console.log('📥 Raw refresh response:', responseText)
  console.log('📥 Status:', res.status)

  if (!res.ok) {
    let errorData: any = {}
    try {
      errorData = JSON.parse(responseText)
    } catch {
      errorData = { raw: responseText }
    }
    throw new Error(errorData.message || errorData.error || `Token refresh failed (${res.status})`)
  }

  const data = JSON.parse(responseText)

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

// ─── Forgot Password functions ─────────────────────────────────────

// export async function forgotPassword(payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> {
//   console.log('📤 Sending forgot password:', JSON.stringify(payload))

//   const res = await fetch(`${API_BASE}/auth/forgot-password`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Accept': 'application/json',
//     },
//     body: JSON.stringify(payload),
//   })

//   const responseText = await res.text()
//   console.log('📥 Raw forgot-password response:', responseText)
//   console.log('📥 Status:', res.status)

//   if (!res.ok) {
//     let errorData: any = {}
//     try {
//       errorData = JSON.parse(responseText)
//     } catch {
//       errorData = { raw: responseText }
//     }
//     throw new Error(errorData.message || errorData.error || `Failed (${res.status})`)
//   }

//   return JSON.parse(responseText)
// }

export async function forgotPassword(payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> {
  console.log('📤 Sending forgot password:', JSON.stringify(payload))
  console.log('📤 URL:', `${API_BASE}/auth/forgot-password`)

  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const responseText = await res.text()
  console.log('📥 Raw forgot-password response:', responseText)
  console.log('📥 Status:', res.status)

  if (!res.ok) {
    let errorData: any = {}
    try {
      errorData = JSON.parse(responseText)
    } catch {
      errorData = { raw: responseText }
    }
    console.error('❌ Backend error:', errorData) // Add this
    throw new Error(errorData.message || errorData.error || `Failed (${res.status})`)
  }

  return JSON.parse(responseText)
}

export async function verifyResetOtp(payload: VerifyResetOtpPayload): Promise<VerifyResetOtpResponse> {
  console.log('📤 Verifying reset OTP:', JSON.stringify(payload))

  const res = await fetch(`${API_BASE}/auth/verify-reset-otp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const responseText = await res.text()
  console.log('📥 Raw verify-reset-otp response:', responseText)
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

  // Save reset token if backend returns one
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
  console.log('🔑 Reset token present:', !!resetToken)

  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(resetToken ? { 'Authorization': `Bearer ${resetToken}` } : {}),
    },
    body: JSON.stringify(payload),
  })

  const responseText = await res.text()
  console.log('📥 Raw reset-password response:', responseText)
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

  // Clean up reset token on success
  localStorage.removeItem('resetToken')

  return JSON.parse(responseText)
}