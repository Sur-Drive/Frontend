import { useQuery } from '@tanstack/react-query'

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

// TODO: replace with a real API call once the endpoint exists
async function fetchFleet(): Promise<FleetData> {
  await new Promise((r) => setTimeout(r, 400))
  return {
    companyName: 'Acme Logistics.',
    companyCode: 'ACME-NG-001',
    tier: 'PRO FLEET',
    subFleet: {
      name: 'Lagos Metro',
      location: 'Lagos, SW',
      status: 'ACTIVE',
    },
    managers: [
      {
        id: '1',
        fullName: 'Adeniji Abiodun',
        role: 'Owner · All Fleets',
        badge: 'FLEET OWNER',
        phoneNumber: '+234 803 555 0100',
        email: 'Abiodun@acmelogistics.ng',
      },
      {
        id: '2',
        fullName: 'Chinedu Okeke',
        role: 'Manager · Lagos Metro',
        badge: 'YOUR MANAGER',
        phoneNumber: '+234 803 555 0100',
        email: 'Abiodun@acmelogistics.ng',
      },
    ],
    vehicle: {
      id: 'v1042',
      name: 'Toyota Hiace 2022',
      type: 'Van',
      vehicleCode: 'V-1042',
      plateNumber: 'LAG-882-KJ',
      trips: 234,
      kilometers: 84210,
      lastServiceDate: '2026-05-12',
      nextServiceDate: '2026-07-12',
    },
  }
}

export function useFleet() {
  return useQuery({
    queryKey: ['fleet', 'me'],
    queryFn: fetchFleet,
    staleTime: 5 * 60 * 1000,
  })
}