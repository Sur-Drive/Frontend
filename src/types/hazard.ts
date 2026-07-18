



export type BackendHazardType =
  | 'POTHOLE'
  | 'FLOOD'
  | 'ACCIDENT'
  | 'DEBRIS'
  | 'ROAD'
  | 'CHECKPOINT'
  | 'DANGER'
  | 'SOS'

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH'

export interface CreateHazardPayload {
  type: BackendHazardType
  description: string
  latitude: number
  longitude: number
  locationAddress: string
  severity: Severity
  isAnonymous: boolean
}

export interface CreateHazardWithPhotoPayload extends CreateHazardPayload {
  photo?: File
}

export interface Hazard {
  id: string
  type: BackendHazardType
  description: string
  photoUrl: string | null
  location: {
    latitude: string
    longitude: string
    address: string
  }
  severity: Severity
  isAnonymous: boolean
  isResolved: boolean
  isActive: boolean
  createdAt: string
  expiresAt: string
  driver: {
    id: string
    name: string
  }
  confirmations: {
    confirms: number
    incorrects: number
    userConfirmation: boolean | null
  }
}

// ---- New for feed / confirm ----

export type ConfirmationType = 'CONFIRM' | 'INCORRECT'

export interface ConfirmHazardPayload {
  hazardId: string
  type: ConfirmationType
}

export interface HazardLocationQuery {
  latitude: number
  longitude: number
  radius: number
}