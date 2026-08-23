import { useQuery } from '@tanstack/react-query'
import { getMyFleetInfo } from '../api/fleet'

export interface FleetManager {
  id: string
  fullName: string
  role: string
  badge: 'FLEET OWNER' | 'YOUR MANAGER' | string
  phoneNumber: string
  email: string
}

export interface FleetVehicle {
  id: string
  name: string
  type: string
  vehicleCode: string
  plateNumber: string
  trips: number
  kilometers: number
  lastServiceDate: string
  nextServiceDate: string
}

export interface SubFleet {
  name: string
  location: string
  status: 'ACTIVE' | 'INACTIVE'
}

export interface FleetData {
  companyName: string
  companyCode: string
  tier: string
  subFleet: SubFleet
  managers: FleetManager[]
  vehicle: FleetVehicle
}

// The backend response shape for /fleet/drivers/my-fleetinfo isn't
// strictly pinned down, so we read it defensively field-by-field
// (tolerating a couple of likely naming variants) rather than trusting
// a single interface, and fall back to sane empty values so the UI
// never crashes on a field that's missing or named differently.
function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && !Number.isNaN(value) ? value : fallback
}

function normalizeManager(raw: any, index: number): FleetManager {
  return {
    id: str(raw?.id ?? raw?._id, String(index)),
    fullName: str(raw?.fullName ?? raw?.name ?? raw?.fullname),
    role: str(raw?.role ?? raw?.title),
    badge: str(raw?.badge, raw?.isOwner ? 'FLEET OWNER' : 'YOUR MANAGER'),
    phoneNumber: str(raw?.phoneNumber ?? raw?.phone),
    email: str(raw?.email),
  }
}

function normalizeSubFleet(raw: any): SubFleet {
  const status = str(raw?.status).toUpperCase()
  return {
    name: str(raw?.name ?? raw?.subFleetName),
    location: str(raw?.location ?? raw?.region),
    status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
  }
}

function normalizeVehicle(raw: any): FleetVehicle {
  return {
    id: str(raw?.id ?? raw?._id),
    name: str(raw?.name ?? raw?.model),
    type: str(raw?.type ?? raw?.vehicleType),
    vehicleCode: str(raw?.vehicleCode ?? raw?.code),
    plateNumber: str(raw?.plateNumber ?? raw?.plate),
    trips: num(raw?.trips ?? raw?.totalTrips),
    kilometers: num(raw?.kilometers ?? raw?.totalKilometers ?? raw?.km),
    lastServiceDate: str(raw?.lastServiceDate),
    nextServiceDate: str(raw?.nextServiceDate),
  }
}

function normalizeFleet(raw: any): FleetData {
  const managersRaw = Array.isArray(raw?.managers) ? raw.managers : []
  return {
    companyName: str(raw?.companyName ?? raw?.fleetName ?? raw?.name),
    companyCode: str(raw?.companyCode ?? raw?.fleetCode ?? raw?.code),
    tier: str(raw?.tier ?? raw?.plan),
    subFleet: normalizeSubFleet(raw?.subFleet ?? {}),
    managers: managersRaw.map(normalizeManager),
    vehicle: normalizeVehicle(raw?.vehicle ?? {}),
  }
}

async function fetchFleet(): Promise<FleetData> {
  const raw = await getMyFleetInfo()
  return normalizeFleet(raw)
}

export function useFleet() {
  return useQuery({
    queryKey: ['fleet', 'me'],
    queryFn: fetchFleet,
    staleTime: 5 * 60 * 1000,
  })
}