import { useEffect, useRef, useState } from 'react'
import { useGoogleMaps } from '../lib/googleMaps'
import { cumulativeDistances, pointAtFraction, projectPointOntoPath, totalLength, type LatLng } from '../lib/geoPath'
import type { PlaceCategory, NearbyPlace } from '../types/places'

// How far apart (meters) to drop search points along the route. Nearby
// Search only covers a radius around one location, so a long route needs
// several samples spread along it to actually cover the whole trip
// instead of just the area around the start.
const SAMPLE_SPACING_METERS = 12000
const MIN_SAMPLES = 1
const MAX_SAMPLES = 6

// Search radius per sample point. Wide enough to catch places just off
// the route (e.g. set back from the highway) without pulling in results
// from an entirely different town at the next sample point.
const SEARCH_RADIUS_METERS = 4000

// Places further than this from the route line itself are dropped even
// if they were inside a sample's search radius — keeps "along the route"
// honest instead of "somewhere near one point on the route".
const MAX_DISTANCE_FROM_ROUTE_METERS = 6000

const MAX_RESULTS = 40

interface UsePlacesAlongRouteResult {
  places: NearbyPlace[]
  isLoading: boolean
  error: string | null
}

let sharedPlacesService: google.maps.places.PlacesService | null = null
function getPlacesService(): google.maps.places.PlacesService {
  if (!sharedPlacesService) {
    sharedPlacesService = new google.maps.places.PlacesService(document.createElement('div'))
  }
  return sharedPlacesService
}

function pickSamplePoints(path: LatLng[]): LatLng[] {
  if (path.length === 0) return []
  if (path.length === 1) return [path[0]]

  const cum = cumulativeDistances(path)
  const length = totalLength(cum)

  const sampleCount = Math.min(
    MAX_SAMPLES,
    Math.max(MIN_SAMPLES, Math.round(length / SAMPLE_SPACING_METERS) + 1)
  )

  if (sampleCount <= 1) return [pointAtFraction(path, cum, 0.5).position]

  const points: LatLng[] = []
  for (let i = 0; i < sampleCount; i++) {
    points.push(pointAtFraction(path, cum, i / (sampleCount - 1)).position)
  }
  return points
}

function nearbySearch(
  service: google.maps.places.PlacesService,
  location: LatLng,
  type: string
): Promise<google.maps.places.PlaceResult[]> {
  return new Promise((resolve) => {
    service.nearbySearch(
      { location, radius: SEARCH_RADIUS_METERS, type },
      (results, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
          resolve([])
          return
        }
        resolve(results)
      }
    )
  })
}

/**
 * Finds places matching `category` along `path`, sorted "next up the
 * road" (ascending distance-along-route from the start of `path`).
 * Pass `category: null` to skip searching (e.g. panel closed).
 */
export function usePlacesAlongRoute(path: LatLng[], category: PlaceCategory | null): UsePlacesAlongRouteResult {
  const { isLoaded } = useGoogleMaps()
  const [places, setPlaces] = useState<NearbyPlace[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Guards against a slower, stale request (e.g. from a category the user
  // already tapped away from) overwriting a newer one's results.
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (!category || !isLoaded || path.length === 0) {
      setPlaces([])
      setIsLoading(false)
      setError(null)
      return
    }

    const requestId = ++requestIdRef.current
    setIsLoading(true)
    setError(null)

    const cum = cumulativeDistances(path)
    const samplePoints = pickSamplePoints(path)
    const service = getPlacesService()

    Promise.all(
      samplePoints.flatMap((point) =>
        category.types.map((type) => nearbySearch(service, point, type))
      )
    )
      .then((batches) => {
        if (requestIdRef.current !== requestId) return

        const byId = new Map<string, NearbyPlace>()

        for (const results of batches) {
          for (const r of results) {
            const lat = r.geometry?.location?.lat()
            const lng = r.geometry?.location?.lng()
            const id = r.place_id
            if (lat == null || lng == null || !id || byId.has(id)) continue

            const projection = projectPointOntoPath(path, cum, { lat, lng })
            if (projection.distanceMeters > MAX_DISTANCE_FROM_ROUTE_METERS) continue

            byId.set(id, {
              id,
              name: r.name ?? 'Unnamed place',
              category: category.id,
              lat,
              lng,
              vicinity: r.vicinity,
              rating: r.rating,
              userRatingsTotal: r.user_ratings_total,
              openNow: r.opening_hours?.isOpen ? r.opening_hours.isOpen() : undefined,
              distanceFromRouteMeters: projection.distanceMeters,
              distanceAlongRouteMeters: projection.fraction * totalLength(cum),
            })
          }
        }

        const sorted = Array.from(byId.values())
          .sort((a, b) => a.distanceAlongRouteMeters - b.distanceAlongRouteMeters)
          .slice(0, MAX_RESULTS)

        setPlaces(sorted)
        setIsLoading(false)
      })
      .catch(() => {
        if (requestIdRef.current !== requestId) return
        setError('Could not load nearby places right now.')
        setIsLoading(false)
      })
  }, [category, isLoaded, path])

  return { places, isLoading, error }
}
