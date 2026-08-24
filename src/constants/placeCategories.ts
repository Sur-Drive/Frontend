import type { PlaceCategory } from '../types/places'

// One entry per category the user can filter by. `types` are Google
// Places "Table 1" nearbySearch types — a category with more than one
// type (e.g. worship places, or the "Other" catch-all) fires one
// nearbySearch per type per sample point and merges the results.
export const PLACE_CATEGORIES: PlaceCategory[] = [
  { id: 'fuel', label: 'Petrol Stations', icon: '⛽', color: '#f97316', types: ['gas_station'] },
  { id: 'restaurant', label: 'Restaurants', icon: '🍽️', color: '#ef4444', types: ['restaurant'] },
  { id: 'hotel', label: 'Hotels', icon: '🏨', color: '#8b5cf6', types: ['lodging'] },
  { id: 'hospital', label: 'Hospitals', icon: '🏥', color: '#dc2626', types: ['hospital'] },
  { id: 'pharmacy', label: 'Pharmacies', icon: '💊', color: '#14b8a6', types: ['pharmacy'] },
  { id: 'atm', label: 'ATMs', icon: '🏧', color: '#0ea5e9', types: ['atm'] },
  { id: 'bank', label: 'Banks', icon: '🏦', color: '#1d4ed8', types: ['bank'] },
  { id: 'parking', label: 'Parking', icon: '🅿️', color: '#2563eb', types: ['parking'] },
  { id: 'supermarket', label: 'Supermarkets', icon: '🛒', color: '#16a34a', types: ['supermarket'] },
  { id: 'police', label: 'Police Stations', icon: '🚓', color: '#1e3a8a', types: ['police'] },
  { id: 'charging', label: 'Charging Stations', icon: '🔌', color: '#22c55e', types: ['electric_vehicle_charging_station'] },
  { id: 'school', label: 'Schools', icon: '🏫', color: '#eab308', types: ['school'] },
  { id: 'worship', label: 'Churches / Mosques', icon: '🛐', color: '#a855f7', types: ['church', 'mosque'] },
  { id: 'other', label: 'Other Useful Places', icon: '📍', color: '#6b7280', types: ['point_of_interest'] },
]

export function getPlaceCategory(id: PlaceCategory['id']): PlaceCategory | undefined {
  return PLACE_CATEGORIES.find((c) => c.id === id)
}
