// Finds one relevant YouTube video for a place, the same way placesSearch.ts
// gets photos from Google — except there's no equivalent first-party field
// for video, so this calls YouTube's own public search.list endpoint with
// the place name (+ a location bias) and takes the top hit's video ID.
//
// Needs VITE_YOUTUBE_API_KEY in .env — a Google Cloud API key with the
// "YouTube Data API v3" enabled (console.cloud.google.com → APIs & Services
// → Library → YouTube Data API v3 → Enable, then Credentials → Create
// API key). Same project as VITE_GOOGLE_MAPS_API_KEY works fine, or a
// separate one — either way the key just needs that one API enabled.
//
// Unlike Places photos, search.list is expensive: 100 quota units per
// call against a default free quota of 10,000 units/day, i.e. ~100
// searches/day. That's why callers should only fetch this on demand
// (e.g. when the user actually opens the Videos tab), and why every
// result here is cached for the lifetime of the page — see `cache` below.

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY as
  | string
  | undefined

const SEARCH_ENDPOINT = 'https://www.googleapis.com/youtube/v3/search'

// Keeps results relevant to the actual place rather than a same-named
// business elsewhere. YouTube only honors `location`/`locationRadius`
// when a text `q` is also present, which we always send.
const LOCATION_RADIUS = '10km'

interface YouTubeSearchResponse {
  items?: Array<{
    id?: { videoId?: string }
  }>
  error?: { message?: string }
}

// place_id → in-flight/resolved lookup, so switching the Videos tab off
// and back on (or re-opening the same place later this session) never
// spends quota twice on the same place.
const cache = new Map<string, Promise<string | null>>()

export function isYouTubeConfigured(): boolean {
  return !!YOUTUBE_API_KEY
}

// Returns a bare YouTube video ID (e.g. "dQw4w9WgXcQ"), not a URL — embed
// it as `https://www.youtube-nocookie.com/embed/{id}`. Resolves null
// (never rejects) on any failure, including a missing/invalid API key,
// so callers can fall back to the existing "no videos yet" placeholder.
export function searchPlaceVideo(
  placeId: string,
  name: string,
  lat: number,
  lng: number,
): Promise<string | null> {
  if (!YOUTUBE_API_KEY) return Promise.resolve(null)

  const cached = cache.get(placeId)
  if (cached) return cached

  const params = new URLSearchParams({
    key: YOUTUBE_API_KEY,
    part: 'snippet',
    type: 'video',
    maxResults: '1',
    safeSearch: 'strict',
    q: `${name} review`,
    location: `${lat},${lng}`,
    locationRadius: LOCATION_RADIUS,
  })

  const promise = fetch(`${SEARCH_ENDPOINT}?${params.toString()}`)
    .then(async (res) => {
      const body: YouTubeSearchResponse = await res.json()
      if (!res.ok) {
        throw new Error(
          body.error?.message ?? `YouTube search failed (${res.status})`,
        )
      }
      return body.items?.[0]?.id?.videoId ?? null
    })
    .catch((err) => {
      console.error(`[youtube] search failed for "${name}"`, err)
      return null
    })

  cache.set(placeId, promise)
  return promise
}
