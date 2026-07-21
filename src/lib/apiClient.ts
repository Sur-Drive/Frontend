import { refreshToken as refreshTokenRequest } from '../api/auth'

const API_BASE = 'https://backend-production-01de.up.railway.app'

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

function getAuthToken(): string | null {
  return localStorage.getItem('token')
}

interface RequestOptions {
  params?: Record<string, string | number | boolean | undefined>
  data?: unknown
  /** Internal flag — set automatically when a request is being retried
   *  after a successful token refresh. Not meant to be passed by callers. */
  _retry?: boolean
}

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const url = new URL(API_BASE + path, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) url.searchParams.set(key, String(value))
    })
  }
  return url.toString()
}

// ─── Silent token refresh ──────────────────────────────────────────
// If several requests fire around the same time (e.g. multiple queries
// on mount) and all hit a 401 because the access token just expired,
// we don't want each one to call /auth/refresh separately. They all
// share this single in-flight promise instead — only one refresh
// request ever hits the server at a time.
let refreshPromise: Promise<string> | null = null

function isAuthEndpoint(path: string): boolean {
  // Never try to "refresh and retry" the auth endpoints themselves —
  // that would just loop.
  return path.startsWith('/auth/refresh') || path.startsWith('/auth/login')
}

function getRefreshAccessToken(): string | null {
  return localStorage.getItem('refreshToken')
}

async function performRefresh(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshTokenRequest()
      .then((data) => {
        const newToken = data.tokens?.accessToken || data.accessToken || data.token
        if (!newToken || typeof newToken !== 'string') {
          throw new Error('Refresh response did not include an access token')
        }
        return newToken
      })
      .finally(() => {
        // Whether it succeeded or failed, the next 401 should be able
        // to start a fresh refresh attempt.
        refreshPromise = null
      })
  }
  return refreshPromise
}

function clearSession() {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  // Let the rest of the app know the session is gone (e.g. a listener
  // can redirect to sign-in or show the SignInModal) without every
  // page having to poll localStorage.
  window.dispatchEvent(new Event('auth:logout'))
}

async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
  const token = getAuthToken()
  const url = buildUrl(path, options.params)

  const isFormData = options.data instanceof FormData

  console.log(`[api] -> ${method} ${url}`, isFormData ? '[FormData]' : options.data ?? '')

  const res = await fetch(url, {
    method,
    headers: {
      // Don't set Content-Type for FormData — the browser sets it
      // (including the multipart boundary) automatically.
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body:
      options.data === undefined
        ? undefined
        : isFormData
          ? (options.data as FormData)
          : JSON.stringify(options.data),
  })

  // Access token expired — try one silent refresh, then retry the
  // request exactly once with the new token.
  if (
    res.status === 401 &&
    !options._retry &&
    !isAuthEndpoint(path) &&
    getRefreshAccessToken()
  ) {
    try {
      console.log('[api] 401 received, attempting silent token refresh...')
      await performRefresh()
      return request<T>(method, path, { ...options, _retry: true })
    } catch (refreshError) {
      console.log('[api] token refresh failed, clearing session', refreshError)
      clearSession()
      // Fall through and report the *original* 401 below.
    }
  }

  // Handle "no content" responses
  const text = await res.text()
  const body = text ? JSON.parse(text) : null

  if (!res.ok) {
    console.log(`[api] x ${method} ${url} -> ${res.status}`, body)

    if (res.status === 401 && !isAuthEndpoint(path)) {
      // Either there was no refresh token to try, or the retried
      // request is still unauthorized — the session is no longer valid.
      clearSession()
    }

    throw new ApiError(
      (body && (body.message || body.error)) || `Request failed with status ${res.status}`,
      res.status,
      body
    )
  }

  console.log(`[api] ok ${method} ${url} -> ${res.status}`, body)

  return body as T
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, data?: unknown, options?: Omit<RequestOptions, 'data'>) =>
    request<T>('POST', path, { ...options, data }),
  put: <T>(path: string, data?: unknown, options?: Omit<RequestOptions, 'data'>) =>
    request<T>('PUT', path, { ...options, data }),
  patch: <T>(path: string, data?: unknown, options?: Omit<RequestOptions, 'data'>) =>
    request<T>('PATCH', path, { ...options, data }),
  delete: <T>(path: string, data?: unknown, options?: Omit<RequestOptions, 'data'>) =>
    request<T>('DELETE', path, { ...options, data }),
}
