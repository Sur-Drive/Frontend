



import { api } from '../lib/apiClient'
import type {
  CreateHazardPayload,
  CreateHazardWithPhotoPayload,
  Hazard,
  ConfirmHazardPayload,
  HazardLocationQuery,
} from '../types/hazard'

// POST /hazards (application/json)
export function createHazard(payload: CreateHazardPayload): Promise<Hazard> {
  return api.post<Hazard>('/hazards', payload)
}

// POST /hazards (multipart/form-data)
export function createHazardWithPhoto(payload: CreateHazardWithPhotoPayload): Promise<Hazard> {
  const formData = new FormData()
  formData.append('type', payload.type)
  formData.append('description', payload.description)
  formData.append('latitude', String(payload.latitude))
  formData.append('longitude', String(payload.longitude))
  formData.append('locationAddress', payload.locationAddress)
  formData.append('severity', payload.severity)
  formData.append('isAnonymous', String(payload.isAnonymous))
  if (payload.photo) {
    formData.append('photo', payload.photo)
  }

  return api.post<Hazard>('/hazards', formData)
}

// GET /hazards/my
export function getMyHazards(): Promise<Hazard[]> {
  return api.get<Hazard[]>('/hazards/my')
}

// POST /hazards/confirm  (also used for "incorrect", via `type`)
export function confirmHazard(payload: ConfirmHazardPayload): Promise<unknown> {
  return api.post('/hazards/confirm', payload)
}

// GET /hazards/feed?latitude=&longitude=&radius=
export function getHazardFeed({ latitude, longitude, radius }: HazardLocationQuery): Promise<Hazard[]> {
  return api.get<Hazard[]>('/hazards/feed', {
    params: { latitude, longitude, radius },
  })
}

// GET /hazards/nearby?latitude=&longitude=&radius=
export function getNearbyHazards({ latitude, longitude, radius }: HazardLocationQuery): Promise<Hazard[]> {
  return api.get<Hazard[]>('/hazards/nearby', {
    params: { latitude, longitude, radius },
  })
}