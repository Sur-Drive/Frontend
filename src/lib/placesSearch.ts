import { loadGoogleMaps } from './googleMaps'
import { PLACE_CATEGORIES } from '../types/places'
import type { PlaceCategory, PlaceCategoryKey, PlaceResult, PlaceReview } from '../types/places'

const SEARCH_RADIUS_METERS = 5000
const MAX_RESULTS = 24
const PHOTO_MAX_WIDTH = 640
const PHOTO_MAX_HEIGHT = 480
const NEARBY_PHOTO_COUNT = 4
const DETAIL_PHOTO_COUNT = 10

// PlacesService needs a map or a detached DOM node — it's never attached
// to a visible map here, same pattern AddressAutocompleteInput uses for
// its own instance. Shared/created lazily so nothing touches
// window.google before the script has actually loaded.
let sharedService: google.maps.places.PlacesService | null = null

function getService(): google.maps.places.PlacesService {
  if (!sharedService) {
    sharedService = new google.maps.places.PlacesService(
      document.createElement('div'),
    )
  }
  return sharedService
}

// Google returns at most 5 reviews per place from the JS Places API,
// same as the "Reviews" tab preview Google Maps itself shows before you
// tap "More reviews" (which needs the full web page, not this API).
function toReviews(
  reviews: google.maps.places.PlaceReview[] | undefined,
): PlaceReview[] {
  if (!reviews) return []
  return reviews.map((r) => ({
    authorName: r.author_name ?? 'Google user',
    authorPhotoUrl: r.profile_photo_url ?? null,
    rating: r.rating ?? 0,
    relativeTime: r.relative_time_description ?? '',
    text: r.text ?? '',
  }))
}

function photoUrls(
  photos: google.maps.places.PlacePhoto[] | undefined,
  max: number,
): string[] {
  if (!photos) return []
  return photos.slice(0, max).map((photo) =>
    photo.getUrl({ maxWidth: PHOTO_MAX_WIDTH, maxHeight: PHOTO_MAX_HEIGHT }),
  )
}

function toPlaceResult(
  place: google.maps.places.PlaceResult,
  category: PlaceCategory['key'],
): PlaceResult | null {
  const loc = place.geometry?.location
  if (!loc || !place.place_id) return null

  return {
    id: place.place_id,
    name: place.name ?? 'Unnamed place',
    lat: loc.lat(),
    lng: loc.lng(),
    category,
    address: place.vicinity ?? place.formatted_address ?? '',
    rating: place.rating ?? null,
    userRatingCount: place.user_ratings_total ?? null,
    priceLevel: place.price_level ?? null,
    isOpenNow: place.opening_hours?.open_now ?? null,
    photoUrls: photoUrls(place.photos, NEARBY_PHOTO_COUNT),
    phone: null,
    website: null,
    googleMapsUri: place.url ?? null,
  }
}

function nearbySearchOnce(
  service: google.maps.places.PlacesService,
  request: google.maps.places.PlaceSearchRequest,
): Promise<google.maps.places.PlaceResult[]> {
  return new Promise((resolve, reject) => {
    service.nearbySearch(request, (results, status) => {
      const { PlacesServiceStatus } = google.maps.places
      if (status === PlacesServiceStatus.OK) {
        resolve(results ?? [])
      } else if (status === PlacesServiceStatus.ZERO_RESULTS) {
        resolve([])
      } else {
        reject(new Error(`Places search failed (${status})`))
      }
    })
  })
}

// Runs one Nearby Search per Google place "type" in the category (the API
// only accepts a single type per call), then merges and de-dupes by
// place_id, drops permanently-closed businesses, and ranks by rating.
export async function searchNearbyPlaces(
  category: PlaceCategory,
  center: { lat: number; lng: number },
): Promise<PlaceResult[]> {
  await loadGoogleMaps()
  const service = getService()

  const batches = await Promise.all(
    category.types.map((type) =>
      nearbySearchOnce(service, {
        location: center,
        radius: SEARCH_RADIUS_METERS,
        type,
      }).catch((err) => {
        console.error(`[places] nearby search failed for type "${type}"`, err)
        return [] as google.maps.places.PlaceResult[]
      }),
    ),
  )

  const seen = new Set<string>()
  const merged: PlaceResult[] = []

  for (const batch of batches) {
    for (const raw of batch) {
      if (!raw.place_id || seen.has(raw.place_id)) continue
      if (raw.business_status === 'CLOSED_PERMANENTLY') continue

      const result = toPlaceResult(raw, category.key)
      if (!result) continue

      seen.add(raw.place_id)
      merged.push(result)
    }
  }

  merged.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
  return merged.slice(0, MAX_RESULTS)
}

// Nearby Search only returns a lean field set (and a single photo) to keep
// the initial multi-result query cheap. Once the user taps into a place,
// this fetches the fuller detail set — phone, website, hours, up to 10
// photos — for that one place only.
export function fetchPlaceDetails(placeId: string): Promise<Partial<PlaceResult>> {
  return loadGoogleMaps().then(
    () =>
      new Promise((resolve) => {
        const service = getService()

        service.getDetails(
          {
            placeId,
            fields: [
              'name',
              'formatted_address',
              'geometry',
              'rating',
              'user_ratings_total',
              'price_level',
              'opening_hours',
              'photos',
              'formatted_phone_number',
              'international_phone_number',
              'website',
              'url',
              'editorial_summary',
              'reviews',
            ],
          },
          (place, status) => {
            if (status !== google.maps.places.PlacesServiceStatus.OK || !place) {
              resolve({})
              return
            }

            resolve({
              name: place.name ?? undefined,
              address: place.formatted_address ?? undefined,
              rating: place.rating ?? null,
              userRatingCount: place.user_ratings_total ?? null,
              priceLevel: place.price_level ?? null,
              isOpenNow: place.opening_hours?.open_now ?? null,
              weekdayHours: place.opening_hours?.weekday_text ?? [],
              photoUrls: photoUrls(place.photos, DETAIL_PHOTO_COUNT),
              phone:
                place.formatted_phone_number ??
                place.international_phone_number ??
                null,
              website: place.website ?? null,
              googleMapsUri: place.url ?? null,
              // `editorial_summary` isn't in the public TS typings for the
              // legacy PlacesService yet, even though the JS API returns
              // it when requested — read it defensively.
              description:
                (place as any).editorial_summary?.overview ?? null,
              reviews: toReviews(place.reviews),
            })
          },
        )
      }),
  )
}

// Best-effort match of a Google place's `types` array back to one of our
// own category chips, purely for display (which label/icon to use). No
// match just means the pin renders as a generic "Place".
function guessCategoryFromTypes(types?: string[]): PlaceCategoryKey | undefined {
  if (!types || types.length === 0) return undefined
  const match = PLACE_CATEGORIES.find((cat) =>
    cat.types.some((t) => types.includes(t)),
  )
  return match?.key
}

// Full place lookup by place_id, used when the user taps directly on one
// of Google's own POI icons on the map (clickableIcons is on, so the map
// click event carries a placeId — see GoogleMapView). Unlike
// fetchPlaceDetails above, this returns a complete PlaceResult (lat/lng/id
// included) since there's no prior nearby-search result to merge it into.
// Resolves null if the place can't be found — caller should fall back to
// a manual pin at the clicked coordinates.
export function fetchPlaceById(placeId: string): Promise<PlaceResult | null> {
  return loadGoogleMaps().then(
    () =>
      new Promise((resolve) => {
        const service = getService()

        service.getDetails(
          {
            placeId,
            fields: [
              'place_id',
              'name',
              'formatted_address',
              'geometry',
              'rating',
              'user_ratings_total',
              'price_level',
              'opening_hours',
              'photos',
              'formatted_phone_number',
              'international_phone_number',
              'website',
              'url',
              'types',
              'editorial_summary',
              'reviews',
            ],
          },
          (place, status) => {
            const loc = place?.geometry?.location
            if (
              status !== google.maps.places.PlacesServiceStatus.OK ||
              !place ||
              !loc ||
              !place.place_id
            ) {
              resolve(null)
              return
            }

            resolve({
              id: place.place_id,
              name: place.name ?? 'Selected place',
              lat: loc.lat(),
              lng: loc.lng(),
              category: guessCategoryFromTypes(place.types),
              address: place.formatted_address ?? '',
              rating: place.rating ?? null,
              userRatingCount: place.user_ratings_total ?? null,
              priceLevel: place.price_level ?? null,
              isOpenNow: place.opening_hours?.open_now ?? null,
              weekdayHours: place.opening_hours?.weekday_text ?? [],
              photoUrls: photoUrls(place.photos, DETAIL_PHOTO_COUNT),
              phone:
                place.formatted_phone_number ??
                place.international_phone_number ??
                null,
              website: place.website ?? null,
              googleMapsUri: place.url ?? null,
              description:
                (place as any).editorial_summary?.overview ?? null,
              reviews: toReviews(place.reviews),
            })
          },
        )
      }),
  )
}

// Reverse-geocodes a tapped map point into a human-readable address, for
// the manual-pin flow below. Resolves null (never rejects) on failure so
// callers can fall back to raw coordinates.
export function reverseGeocodeLatLng(
  lat: number,
  lng: number,
): Promise<string | null> {
  return loadGoogleMaps().then(
    () =>
      new Promise((resolve) => {
        const geocoder = new google.maps.Geocoder()
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
            resolve(results[0].formatted_address ?? null)
          } else {
            resolve(null)
          }
        })
      }),
  )
}

// A "drop a pin anywhere" result for a map tap that didn't land on a real
// Google place (e.g. empty ground, a stretch of road) — same shape as a
// searched PlaceResult so it can flow straight into PlaceDetailSheet, but
// isPinned:true marks it as address-only: no place_id, so no ratings,
// photos, or hours to fetch, and no Directions destination_place_id.
export function createManualPin(
  lat: number,
  lng: number,
  address: string | null,
): PlaceResult {
  return {
    id: `pin-${lat.toFixed(6)}-${lng.toFixed(6)}`,
    name: address ?? 'Dropped pin',
    lat,
    lng,
    category: undefined,
    address: address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    rating: null,
    userRatingCount: null,
    priceLevel: null,
    isOpenNow: null,
    photoUrls: [],
    phone: null,
    website: null,
    googleMapsUri: null,
    isPinned: true,
  }
}
