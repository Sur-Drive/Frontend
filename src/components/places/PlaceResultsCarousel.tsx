import { useEffect, useRef } from 'react'
import { PLACE_CATEGORIES } from '../../types/places'
import type { PlaceResult } from '../../types/places'
import { haversineMeters } from '../../lib/geoPath'

interface PlaceResultsCarouselProps {
  places: PlaceResult[]
  /** The currently-highlighted place — its marker is enlarged on the map
   * and its card gets the active ring. Driven by scrolling this carousel
   * OR by tapping a pin directly on the map (kept in sync either way). */
  activePlaceId: string | null
  /** Fired when the card nearest the container's center changes, i.e. the
   * user scrolled to a new card. Does NOT open the full detail sheet —
   * that only happens on an explicit tap (onSelect). */
  onActiveChange: (id: string) => void
  /** Tapping a card opens its full PlaceDetailSheet. */
  onSelect: (place: PlaceResult) => void
  userLocation: [number, number] | null
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
 * Google Maps' own "swipe through the results instead of hunting for pins"
 * pattern — a horizontal, snap-scrolling strip of compact cards sitting
 * above the bottom nav. Scrolling settles on a card, which highlights the
 * matching marker on the map and gently pans to it (see HomePage's
 * mapCenter, which follows activePlaceId); tapping a card opens the full
 * detail sheet.
 */
export default function PlaceResultsCarousel({
  places,
  activePlaceId,
  onActiveChange,
  onSelect,
  userLocation,
}: PlaceResultsCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const scrollTimeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null)
  // Distinguishes "user is dragging the strip" from "we just called
  // scrollIntoView programmatically" so the resulting scroll event doesn't
  // immediately fire onActiveChange again for the same id.
  const isProgrammaticScrollRef = useRef(false)

  // External change (a map pin was tapped directly) — scroll the matching
  // card into view if it isn't already roughly centered.
  useEffect(() => {
    if (!activePlaceId) return
    const node = cardRefs.current.get(activePlaceId)
    const scroller = scrollerRef.current
    if (!node || !scroller) return

    const scrollerRect = scroller.getBoundingClientRect()
    const nodeRect = node.getBoundingClientRect()
    const alreadyCentered =
      Math.abs(
        nodeRect.left + nodeRect.width / 2 - (scrollerRect.left + scrollerRect.width / 2),
      ) < 8

    if (alreadyCentered) return

    isProgrammaticScrollRef.current = true
    node.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    window.setTimeout(() => {
      isProgrammaticScrollRef.current = false
    }, 400)
  }, [activePlaceId])

  // Debounced "which card is centered now" check — runs ~130ms after
  // scrolling stops, not on every scroll frame, so the map doesn't try to
  // pan continuously while the strip is in motion.
  const handleScroll = () => {
    if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current)

    scrollTimeoutRef.current = window.setTimeout(() => {
      if (isProgrammaticScrollRef.current) return
      const scroller = scrollerRef.current
      if (!scroller) return

      const scrollerCenter =
        scroller.getBoundingClientRect().left + scroller.getBoundingClientRect().width / 2

      let closestId: string | null = null
      let closestDistance = Infinity

      cardRefs.current.forEach((node, id) => {
        const rect = node.getBoundingClientRect()
        const cardCenter = rect.left + rect.width / 2
        const distance = Math.abs(cardCenter - scrollerCenter)
        if (distance < closestDistance) {
          closestDistance = distance
          closestId = id
        }
      })

      if (closestId && closestId !== activePlaceId) {
        onActiveChange(closestId)
      }
    }, 130)
  }

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current)
    }
  }, [])

  return (
    <div
      ref={scrollerRef}
      onScroll={handleScroll}
      className="flex gap-3 px-4 py-1 overflow-x-auto snap-x snap-mandatory scroll-px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {places.map((place) => {
        const isActive = place.id === activePlaceId
        const categoryLabel =
          PLACE_CATEGORIES.find((c) => c.key === place.category)?.label ?? 'Place'
        const distance = userLocation
          ? formatDistance(
              haversineMeters(
                { lat: userLocation[0], lng: userLocation[1] },
                { lat: place.lat, lng: place.lng },
              ),
            )
          : null

        return (
          <div
            key={place.id}
            ref={(node) => {
              if (node) cardRefs.current.set(place.id, node)
              else cardRefs.current.delete(place.id)
            }}
            onClick={() => onSelect(place)}
            role="button"
            tabIndex={0}
            className={`flex-shrink-0 w-[200px] snap-center bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.15)] overflow-hidden cursor-pointer transition-all ${
              isActive ? 'ring-2 ring-red-500 scale-[1.02]' : 'opacity-90'
            }`}
          >
            <div className="w-full bg-gray-200 h-24">
              {place.photoUrls.length > 0 ? (
                <img
                  src={place.photoUrls[0]}
                  alt={place.name}
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full text-[11px] text-gray-400">
                  No photo
                </div>
              )}
            </div>

            <div className="px-2.5 pt-1.5 pb-2">
              <p className="text-[13px] font-bold leading-tight text-gray-900 truncate">
                {place.name}
              </p>

              <div className="flex flex-wrap items-center gap-1 mt-1 text-[11px] text-gray-600">
                {place.rating !== null && (
                  <span className="flex items-center gap-0.5 font-semibold text-gray-900">
                    <StarIcon />
                    {place.rating.toFixed(1)}
                  </span>
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

              <div className="flex items-center gap-1 mt-0.5 text-[11px]">
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
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Dot() {
  return <span className="text-gray-300">·</span>
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3 h-3 text-amber-400" fill="currentColor">
      <path d="M12 2l2.9 6.6L22 9.3l-5 4.9 1.2 7.1L12 17.8l-6.2 3.5L7 14.2 2 9.3l7.1-.7z" />
    </svg>
  )
}
