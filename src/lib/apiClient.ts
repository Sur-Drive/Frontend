














// const API_BASE = 'https://backend-production-01de.up.railway.app'

// export class ApiError extends Error {
//   status: number
//   body: unknown

//   constructor(message: string, status: number, body: unknown) {
//     super(message)
//     this.name = 'ApiError'
//     this.status = status
//     this.body = body
//   }
// }

// function getAuthToken(): string | null {
//   return localStorage.getItem('token')
// }

// interface RequestOptions {
//   params?: Record<string, string | number | boolean | undefined>
//   data?: unknown
// }

// function buildUrl(path: string, params?: RequestOptions['params']): string {
//   const url = new URL(API_BASE + path, window.location.origin)
//   if (params) {
//     Object.entries(params).forEach(([key, value]) => {
//       if (value !== undefined) url.searchParams.set(key, String(value))
//     })
//   }
//   return url.toString()
// }

// async function request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
//   const token = getAuthToken()
//   const url = buildUrl(path, options.params)

//   console.log(`[api] -> ${method} ${url}`, options.data ?? '')

//   const res = await fetch(url, {
//     method,
//     headers: {
//       'Content-Type': 'application/json',
//       ...(token ? { Authorization: `Bearer ${token}` } : {}),
//     },
//     body: options.data !== undefined ? JSON.stringify(options.data) : undefined,
//   })

//   // Handle "no content" responses
//   const text = await res.text()
//   const body = text ? JSON.parse(text) : null

//   if (!res.ok) {
//     console.log(`[api] x ${method} ${url} -> ${res.status}`, body)
//     throw new ApiError(
//       (body && (body.message || body.error)) || `Request failed with status ${res.status}`,
//       res.status,
//       body
//     )
//   }

//   console.log(`[api] ok ${method} ${url} -> ${res.status}`, body)

//   return body as T
// }

// export const api = {
//   get: <T>(path: string, options?: RequestOptions) => request<T>('GET', path, options),
//   post: <T>(path: string, data?: unknown, options?: Omit<RequestOptions, 'data'>) =>
//     request<T>('POST', path, { ...options, data }),
//   put: <T>(path: string, data?: unknown, options?: Omit<RequestOptions, 'data'>) =>
//     request<T>('PUT', path, { ...options, data }),
//   patch: <T>(path: string, data?: unknown, options?: Omit<RequestOptions, 'data'>) =>
//     request<T>('PATCH', path, { ...options, data }),
//   delete: <T>(path: string, data?: unknown, options?: Omit<RequestOptions, 'data'>) =>
//     request<T>('DELETE', path, { ...options, data }),
// }





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

  // Handle "no content" responses
  const text = await res.text()
  const body = text ? JSON.parse(text) : null

  if (!res.ok) {
    console.log(`[api] x ${method} ${url} -> ${res.status}`, body)
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