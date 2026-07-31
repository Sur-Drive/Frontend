// const BASE_URL = 'https://backend-production-01de.up.railway.app'

// class ApiError extends Error {
//   status: number
//   constructor(message: string, status: number) {
//     super(message)
//     this.status = status
//     this.name = 'ApiError'
//   }
// }

// export async function getNearbyHazards(params: {
//   latitude: number
//   longitude: number
//   radius: number
// }) {
//   const query = new URLSearchParams({
//     latitude: String(params.latitude),
//     longitude: String(params.longitude),
//     radius: String(params.radius),
//   })

//   const res = await fetch(`${BASE_URL}/hazards/nearby?${query}`, {
//     method: 'GET',
//     headers: { 'Content-Type': 'application/json' },
//   })

//   if (!res.ok) {
//     const err = await res.text()
//     throw new ApiError(`Failed to fetch hazards: ${res.status} ${err}`, res.status)
//   }

//   return res.json()
// }

// export async function confirmHazard(
//   hazardId: string,
//   type: 'CONFIRM' | 'INCORRECT',
//   token?: string | null
// ) {
//   const headers: Record<string, string> = {
//     'Content-Type': 'application/json',
//   }

//   if (token) {
//     headers['Authorization'] = `Bearer ${token}`
//   }

//   const res = await fetch(`${BASE_URL}/hazards/confirm`, {
//     method: 'POST',
//     headers,
//     body: JSON.stringify({ hazardId, type }),
//   })

//   if (!res.ok) {
//     const err = await res.text()
//     throw new ApiError(`Failed to confirm: ${res.status} ${err}`, res.status)
//   }

//   return res.json()
// }






const BASE_URL = 'https://backend-production-01de.up.railway.app'

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

export async function getNearbyHazards(
  params: {
    latitude: number
    longitude: number
    radius: number
  },
  token?: string | null
) {
  const query = new URLSearchParams({
    latitude: String(params.latitude),
    longitude: String(params.longitude),
    radius: String(params.radius),
  })

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Without this, the backend has no way to know which user is asking,
  // so it can't return confirmations.userConfirmation for their votes —
  // every hazard comes back looking un-voted.
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  console.log('[getNearbyHazards] token present?', !!token, 'params:', params)

  const res = await fetch(`${BASE_URL}/hazards/nearby?${query}`, {
    method: 'GET',
    headers,
  })

  if (!res.ok) {
    const err = await res.text()
    console.log('[getNearbyHazards] FAILED', res.status, err)
    throw new ApiError(`Failed to fetch hazards: ${res.status} ${err}`, res.status)
  }

  const data = await res.json()
  console.log(
    '[getNearbyHazards] response userConfirmation values:',
    Array.isArray(data) ? data.map((h: any) => h?.confirmations?.userConfirmation) : data
  )

  return data
}

export async function confirmHazard(
  hazardId: string,
  type: 'CONFIRM' | 'INCORRECT',
  token?: string | null
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  console.log('[confirmHazard] hazardId:', hazardId, 'type:', type, 'token present?', !!token)

  const res = await fetch(`${BASE_URL}/hazards/confirm`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ hazardId, type }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.log('[confirmHazard] FAILED', res.status, err)
    throw new ApiError(`Failed to confirm: ${res.status} ${err}`, res.status)
  }

  const data = await res.json()
  console.log('[confirmHazard] response hazard.confirmations:', data?.hazard?.confirmations)

  return data
}