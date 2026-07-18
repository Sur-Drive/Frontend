import { useEffect, useState } from 'react'

interface Coords {
  latitude: number
  longitude: number
}

interface UseCurrentLocationResult {
  coords: Coords | null
  isLoading: boolean
  error: string | null
}

export function useCurrentLocation(): UseCurrentLocationResult {
  const [coords, setCoords] = useState<Coords | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported')
      setIsLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setIsLoading(false)
      },
      (err) => {
        setError(err.message || 'Unable to get location')
        setIsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    )
  }, [])

  return { coords, isLoading, error }
}