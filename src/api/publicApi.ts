const BASE_URL = 'https://backend-production-01de.up.railway.app'

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

export async function getNearbyHazards(params: {
  latitude: number
  longitude: number
  radius: number
}) {
  const query = new URLSearchParams({
    latitude: String(params.latitude),
    longitude: String(params.longitude),
    radius: String(params.radius),
  })

  const res = await fetch(`${BASE_URL}/hazards/nearby?${query}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new ApiError(`Failed to fetch hazards: ${res.status} ${err}`, res.status)
  }

  return res.json()
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

  const res = await fetch(`${BASE_URL}/hazards/confirm`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ hazardId, type }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new ApiError(`Failed to confirm: ${res.status} ${err}`, res.status)
  }

  return res.json()
}