const BASE_URL = 'https://backend-production-01de.up.railway.app'

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
    throw new Error(`Failed to fetch hazards: ${res.status} ${err}`)
  }

  return res.json()
}

export async function confirmHazard(hazardId: string, type: 'CONFIRM' | 'INCORRECT') {
  const res = await fetch(`${BASE_URL}/hazards/${hazardId}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to confirm: ${res.status} ${err}`)
  }

  return res.json()
}