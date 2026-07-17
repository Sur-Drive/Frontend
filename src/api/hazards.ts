import { api, ApiError } from '../lib/apiClient'

const API_BASE = 'https://backend-production-01de.up.railway.app'

// ============================================================
// Types
// ============================================================

export type HazardType =
  | 'POTHOLE'
  | 'ACCIDENT'
  | 'FLOOD'
  | 'CONSTRUCTION'
  | 'ROADBLOCK'
  | 'DEBRIS'
  | 'SOS'
  | 'DANGER_ZONE'

export type HazardSeverity = 'LOW' | 'MEDIUM' | 'HIGH'
export type HazardVoteType = 'CONFIRMED' | 'INCORRECT'

export interface HazardDto {
  id: string
  type: HazardType
  description: string
  latitude: number
  longitude: number
  locationAddress: string
  severity: HazardSeverity
  isAnonymous: boolean
  createdAt: string
  reporterName?: string | null
  confirmCount?: number
  photoUrl?: string | null
  distanceKm?: number
}

export interface CreateHazardInput {
  type: HazardType
  description: string
  latitude: number
  longitude: number
  locationAddress: string
  severity: HazardSeverity
  isAnonymous: boolean
}

export interface CreateHazardWithPhotoInput extends CreateHazardInput {
  photo?: File | Blob | null
}

export interface NearbyHazardsParams {
  latitude: number
  longitude: number
  radius: number
}

export interface HazardVoteInput {
  hazardId: string
  type: HazardVoteType
}

// ============================================================
// JSON-only create (no photo)
// POST /hazards
// ============================================================

export const createHazard = (data: CreateHazardInput) =>
  api.post<HazardDto>('/hazards', data)

// ============================================================
// Multipart create (with photo)
// POST /hazards (multipart/form-data)
// ============================================================

export const createHazardWithPhoto = async (
  data: CreateHazardWithPhotoInput
): Promise<HazardDto> => {
  const formData = new FormData()
  formData.append('type', data.type)
  formData.append('description', data.description)
  formData.append('latitude', String(data.latitude))
  formData.append('longitude', String(data.longitude))
  formData.append('locationAddress', data.locationAddress)
  formData.append('severity', data.severity)
  formData.append('isAnonymous', String(data.isAnonymous))
  if (data.photo) {
    formData.append('photo', data.photo)
  }

  const token = localStorage.getItem('token')

  console.log('[api] -> POST /hazards (multipart)', {
    type: data.type,
    description: data.description,
    latitude: data.latitude,
    longitude: data.longitude,
    locationAddress: data.locationAddress,
    severity: data.severity,
    isAnonymous: data.isAnonymous,
    hasPhoto: !!data.photo,
  })

  const res = await fetch(`${API_BASE}/hazards`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })

  const text = await res.text()
  const body = text ? JSON.parse(text) : null

  if (!res.ok) {
    console.log(`[api] x POST /hazards (multipart) -> ${res.status}`, body)
    throw new ApiError(
      (body && (body.message || body.error)) || `Request failed with status ${res.status}`,
      res.status,
      body
    )
  }

  console.log(`[api] ok POST /hazards (multipart) -> ${res.status}`, body)

  return body as HazardDto
}

// ============================================================
// Confirm / mark incorrect
// POST /hazards/confirm
// ============================================================

export const voteHazard = (data: HazardVoteInput) =>
  api.post<HazardDto>('/hazards/confirm', data)

// ============================================================
// Nearby hazards
// GET /hazards/nearby?latitude=&longitude=&radius=
// ============================================================

export const getNearbyHazards = (params: NearbyHazardsParams) =>
  api.get<HazardDto[]>('/hazards/nearby', {
    params: {
      latitude: params.latitude,
      longitude: params.longitude,
      radius: params.radius,
    },
  })