import { useEffect, useRef } from 'react'
import type { PlaceResult } from '../../types/places'
import { haversineMeters } from '../../lib/geoPath'

interface PlaceResultsListProps {
  places: PlaceResult[]
  /** Label for the header, e.g. "Restaurants", "Parks", "Homes". */
  categoryLabel: string
  /** The result currently highlighted on the map (a pin was tapped, or a
   * row here was tapped) — gets a tinted background and is scrolled into
   * view if a map-pin tap changed it while this list is open. */
  activePlaceId: string | null
  onActiveChange: (id: string) => void
  /** Tapping a row opens that place's full PlaceDetailSheet. */
  onSelect: (place: PlaceResult) => void
  userLocation: [number, number] | null
  /** Closes the whole list (clears the active category), independent of
   * the sheet's own drag-to-dismiss — this list has no other close
   * affordance of its own, unlike PlaceDetailSheet/ReportDetailModal
   * which both draw their own X over their hero photo. */
  onClose: () => void
}

const PRICE_LEVEL_LABEL: Record<number, string> = {
  0: 'Free',
  1: '$',
  2: '$$',
  3: '$$$',
  4: '$$$$',
}

function formatDistance(meters: number): string {
  if (meters < 950) return `${Math.round(meters / 10) * 10}m`
  return `${(meters / 1000).toFixed(1)}km`
}

/**
 * The actual Google Maps "results list" pattern — a plain vertical,
 * scrollable stack of rows (not a card carousel), one per result, each
 * with a thumbnail (photo, or a video-badged thumbnail once a place has
 * video clips), name, rating, price/category, open state, distance, and
 * address. Lives inside GoogleStyleBottomSheet's scrollable body, so it
 * only scrolls once the sheet itself has been dragged to full height —
 * the sheet owns that behavior, this component just renders the list.
 */
export default function PlaceResultsList({
  places,
  categoryLabel,
  activePlaceId,
  onActiveChange,
  onSelect,
  userLocation,
  onClose,
}: PlaceResultsListProps) {
  const rowRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  // A pin was tapped directly on the map while this list is open — scroll
  // the matching row into view, same courtesy the old carousel gave.
  useEffect(() => {
    if (!activePlaceId) return
    const node = rowRefs.current.get(activePlaceId)
    node?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activePlaceId])

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 pt-1 pb-2 bg-white">
        <div>
          <h2 className="text-[15px] font-bold text-gray-900">{categoryLabel} nearby</h2>
          <span className="text-[12px] text-gray-400">
            {places.length} {places.length === 1 ? 'result' : 'results'}
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="flex items-center justify-center flex-shrink-0 w-8 h-8 text-gray-600 bg-gray-100 rounded-full"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="divide-y divide-gray-100 pb-4">
        {places.map((place) => {
          const isActive = place.id === activePlaceId
          const hasVideo = (place.videoUrls?.length ?? 0) > 0
          const distance = userLocation
            ? formatDistance(
                haversineMeters(
                  { lat: userLocation[0], lng: userLocation[1] },
                  { lat: place.lat, lng: place.lng },
                ),
              )
            : null

          return (
            <button
              key={place.id}
              ref={(node) => {
                if (node) rowRefs.current.set(place.id, node)
                else rowRefs.current.delete(place.id)
              }}
              onClick={() => {
                onActiveChange(place.id)
                onSelect(place)
              }}
              className={`flex w-full items-start gap-3 px-5 py-3 text-left transition-colors ${
                isActive ? 'bg-[#6E43A3]/10' : 'active:bg-gray-50'
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold leading-snug text-gray-900 truncate">
                  {place.name}
                </p>

                <div className="flex flex-wrap items-center gap-1 mt-0.5 text-[12px] text-gray-600">
                  {place.rating !== null && (
                    <span className="flex items-center gap-0.5 font-semibold text-gray-900">
                      <StarIcon />
                      {place.rating.toFixed(1)}
                    </span>
                  )}
                  {place.userRatingCount !== null && (
                    <span className="text-gray-400">({place.userRatingCount})</span>
                  )}
                  {place.priceLevel !== null && PRICE_LEVEL_LABEL[place.priceLevel] && (
                    <>
                      <Dot />
                      <span>{PRICE_LEVEL_LABEL[place.priceLevel]}</span>
                    </>
                  )}
                  <Dot />
                  <span className="truncate">{categoryLabel}</span>
                </div>

                <div className="flex items-center gap-1 mt-0.5 text-[12px]">
                  {place.isOpenNow !== null && (
                    <span
                      className={
                        place.isOpenNow
                          ? 'font-semibold text-emerald-600'
                          : 'font-semibold text-red-500'
                      }
                    >
                      {place.isOpenNow ? 'Open' : 'Closed'}
                    </span>
                  )}
                  {place.isOpenNow !== null && distance && <Dot />}
                  {distance && <span className="text-gray-400">{distance} away</span>}
                </div>

                {place.address && (
                  <p className="mt-1 text-[12px] text-gray-400 truncate">{place.address}</p>
                )}
              </div>

              {/* Thumbnail — photo by default; a small play badge overlays
                  it once a place has video clips (see videoUrls comment in
                  types/places.ts), same idea as Google's own list rows
                  showing a video thumbnail when a business has one. */}
              <div className="relative flex-shrink-0 w-20 h-20 overflow-hidden bg-gray-200 rounded-xl">
                {place.photoUrls.length > 0 ? (
                  <img
                    src={place.photoUrls[0]}
                    alt={place.name}
                    className="object-cover w-full h-full"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-[10px] text-gray-400 text-center px-1">
                    No photo
                  </div>
                )}

                {hasVideo && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/90">
                      <PlayIcon />
                    </div>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Dot() {
  return <span className="text-gray-300">·</span>
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3 h-3 text-amber-400" fill="currentColor">
      <path d="M12 2l2.9 6.6L22 9.3l-5 4.9 1.2 7.1L12 17.8l-6.2 3.5L7 14.2 2 9.3l7.1-.7z" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="#1a1a1a">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}
