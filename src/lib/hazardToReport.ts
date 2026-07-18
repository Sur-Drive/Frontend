import type { Hazard, BackendHazardType } from '../types/hazard'

export type ReportType =
  | 'wave'
  | 'hill'
  | 'pothole'
  | 'hazard'
  | 'sos'
  | 'sign'
  | 'warning'
  | 'tractor'

export interface Report {
  id: string
  lat: number
  lng: number
  color: string
  type: ReportType
  title: string
  streetLabel: string
  subtitle: string
  distance: string
  confirmCount: number
  incorrectCount: number
  photos: string[]
}

const TYPE_TO_REPORT_TYPE: Record<BackendHazardType, ReportType> = {
  POTHOLE: 'pothole',
  FLOOD: 'wave',
  ACCIDENT: 'hazard',
  DEBRIS: 'warning',
  ROAD: 'tractor',
  CHECKPOINT: 'sign',
  DANGER: 'hazard',
  SOS: 'sos',
}

const TYPE_LABEL: Record<BackendHazardType, string> = {
  POTHOLE: 'Pothole',
  FLOOD: 'Flood risk area',
  ACCIDENT: 'Accident',
  DEBRIS: 'Debris in road',
  ROAD: 'Road works',
  CHECKPOINT: 'Checkpoint',
  DANGER: 'Danger zone',
  SOS: 'Emergency reported',
}

const SEVERITY_COLOR: Record<Hazard['severity'], string> = {
  LOW: '#3b82f6',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
}

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function hazardToReport(hazard: Hazard, userLocation: [number, number] | null): Report {
  const lat = parseFloat(hazard.location.latitude)
  const lng = parseFloat(hazard.location.longitude)

  const dist = userLocation ? distanceKm(userLocation[0], userLocation[1], lat, lng) : null

  return {
    id: hazard.id,
    lat,
    lng,
    color: hazard.type === 'SOS' ? '#ef4444' : SEVERITY_COLOR[hazard.severity],
    type: TYPE_TO_REPORT_TYPE[hazard.type],
    title: TYPE_LABEL[hazard.type],
    streetLabel: hazard.location.address,
    subtitle: hazard.description,
    distance: dist !== null ? `${dist.toFixed(1)} km` : '—',
    confirmCount: hazard.confirmations.confirms,
    incorrectCount: hazard.confirmations.incorrects,
    photos: hazard.photoUrl ? [hazard.photoUrl] : [],
  }
}