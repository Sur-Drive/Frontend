import { api } from '../lib/apiClient'

// Triggering SOS notifies nearby drivers and the user's emergency contacts
// server-side — the frontend just reports where the driver is right now.

export interface TriggerSosPayload {
  latitude: number
  longitude: number
  /** Optional free-text note, e.g. from a follow-up prompt after triggering. */
  message?: string
}

export interface SosResponse {
  id?: string
  message?: string
  [key: string]: unknown
}

// POST /sos  { latitude, longitude, message? }
export function triggerSos(payload: TriggerSosPayload): Promise<SosResponse> {
  return api.post<SosResponse>('/sos', payload)
}

// POST /sos/:id/cancel — best guess for "Cancel SOS"; adjust the path if the
// backend exposes a different shape (e.g. PATCH /sos/:id with { status }).
export function cancelSos(sosId: string): Promise<SosResponse> {
  return api.post<SosResponse>(`/sos/${sosId}/cancel`)
}
