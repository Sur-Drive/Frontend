// Category chips shown along the top of the home map — mirrors the row
// Google Maps shows under its search bar (Restaurants, Hotels, Gas...).
// Each category maps to one or more Google Places "type" values used to
// run a Nearby Search for that category around the current map center.
export type PlaceCategoryKey =
  | 'restaurants'
  | 'hotels'
  | 'attractions'
  | 'things_to_do'
  | 'services'
  | 'gas'
  | 'groceries'
  | 'coffee'
  | 'parks'
  | 'gyms'
  | 'art'
  | 'takeout'
  | 'delivery'
  | 'homes'
  | 'salon'

export interface PlaceCategory {
  key: PlaceCategoryKey
  label: string
  /**
   * Google Places "type" values (see Google's Table A/B place types) to
   * search for this category. Multiple types are searched in parallel and
   * merged/de-duplicated — nearbySearch only accepts one `type` per call.
   */
  types: string[]
  /** Pin + active-chip color for this category. */
  color: string
}

// One brand color for every category — pins and active chips all render
// in the same purple rather than a different color per category (this
// used to be color-coded per type; kept as a per-category field so any
// single category could still be recolored later without touching the
// pin/chip rendering code, but every entry below intentionally matches).
const BRAND_PIN_COLOR = '#6E43A3'

// prettier-ignore
export const PLACE_CATEGORIES: PlaceCategory[] = [
  { key: 'restaurants', label: 'Restaurants', types: ['restaurant'],                     color: BRAND_PIN_COLOR },
  { key: 'hotels',      label: 'Hotels',      types: ['lodging'],                        color: BRAND_PIN_COLOR },
  { key: 'attractions', label: 'Attractions', types: ['tourist_attraction'],             color: BRAND_PIN_COLOR },
  { key: 'things_to_do', label: 'Things to do', types: ['tourist_attraction', 'amusement_park', 'movie_theater', 'zoo', 'aquarium', 'night_club'], color: BRAND_PIN_COLOR },
  { key: 'services',    label: 'Services',   types: ['car_repair', 'laundry', 'bank', 'hair_care', 'electrician', 'plumber'], color: BRAND_PIN_COLOR },
  { key: 'gas',         label: 'Gas',         types: ['gas_station'],                    color: BRAND_PIN_COLOR },
  { key: 'groceries',   label: 'Groceries',   types: ['grocery_or_supermarket', 'supermarket'], color: BRAND_PIN_COLOR },
  { key: 'coffee',      label: 'Coffee',      types: ['cafe'],                           color: BRAND_PIN_COLOR },
  { key: 'parks',       label: 'Parks',       types: ['park'],                           color: BRAND_PIN_COLOR },
  { key: 'gyms',        label: 'Gyms',        types: ['gym'],                            color: BRAND_PIN_COLOR },
  { key: 'art',         label: 'Art',         types: ['art_gallery', 'museum'],          color: BRAND_PIN_COLOR },
  { key: 'takeout',     label: 'Takeout',     types: ['meal_takeaway'],                  color: BRAND_PIN_COLOR },
  { key: 'delivery',    label: 'Delivery',    types: ['meal_delivery'],                  color: BRAND_PIN_COLOR },
  { key: 'homes',       label: 'Homes',       types: ['real_estate_agency'],             color: BRAND_PIN_COLOR },
  { key: 'salon',       label: 'Salons',      types: ['beauty_salon', 'hair_care'],      color: BRAND_PIN_COLOR },
]

export interface PlaceResult {
  id: string
  name: string
  lat: number
  lng: number
  /**
   * Undefined for results that didn't come from a category Nearby Search
   * (e.g. a place resolved from a direct map click) — PlaceDetailSheet
   * falls back to a generic "Place" label in that case.
   */
  category?: PlaceCategoryKey
  address: string
  rating: number | null
  userRatingCount: number | null
  /** 0-4 Google price level, or null when unknown/not applicable. */
  priceLevel: number | null
  isOpenNow: boolean | null
  /** Google-hosted photo URLs (nearby-search gives 1, place-details gives up to 10). */
  photoUrls: string[]
  /**
   * Optional video clips for this place. Google's Places API has no public
   * video field, so this is always empty for real search results today —
   * it's here so a future data source (e.g. business-submitted clips from
   * our own backend) can populate it without changing the sheet's UI.
   * Direct playable file URLs, rendered with a native <video> tag. Takes
   * priority over `youtubeVideoId` below when both are present.
   */
  videoUrls?: string[]
  /**
   * A YouTube video ID (not a URL, e.g. "dQw4w9WgXcQ") found by searching
   * YouTube for this place's name — see lib/youtube.ts. Unlike videoUrls,
   * this isn't set on the initial PlaceResult; PlaceDetailSheet fetches it
   * lazily (only once the Videos tab is opened, since each lookup costs
   * real API quota) and renders it as an embedded iframe rather than a
   * native <video> tag.
   */
  youtubeVideoId?: string | null
  phone: string | null
  website: string | null
  /** Link to this place's own Google Maps page. */
  googleMapsUri: string | null
  /**
   * Short editorial description of the place (Google's "About" blurb),
   * when Google has one on file. Shown on the Overview tab.
   */
  description?: string | null
  /**
   * Full Mon–Sun opening hours as Google formats them, e.g.
   * "Monday: 9:00 AM – 9:00 PM". Only available from the fuller
   * place-details call, not the lean nearby-search result.
   */
  weekdayHours?: string[]
  /** Individual user reviews, newest/most-relevant first, as Google orders them. */
  reviews?: PlaceReview[]
  /**
   * True for a manually dropped pin — a point the user tapped on the map
   * that isn't a registered Google place (no place_id), so it only has an
   * address, not ratings/photos/hours. Set by createManualPin() in
   * lib/placesSearch.ts.
   */
  isPinned?: boolean
}

/** One review left by a Google Maps user, as returned by Places Details. */
export interface PlaceReview {
  authorName: string
  authorPhotoUrl: string | null
  rating: number
  /** Google's own pre-formatted string, e.g. "2 weeks ago". */
  relativeTime: string
  text: string
}
