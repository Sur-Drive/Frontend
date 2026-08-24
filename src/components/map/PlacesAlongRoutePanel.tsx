import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Navigation, Search, X } from 'lucide-react'
import { PLACE_CATEGORIES } from '../../constants/placeCategories'
import type { NearbyPlace, PlaceCategoryId } from '../../types/places'

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10}m`
  return `${(meters / 1000).toFixed(1)}km`
}

function directionsUrl(place: NearbyPlace): string {
  const params = new URLSearchParams({
    api: '1',
    destination: `${place.lat},${place.lng}`,
    destination_place_id: place.id,
  })
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

// ─── Floating trigger button ────────────────────────────────────────
export function PlacesAlongRouteButton({
  active,
  onClick,
  className = '',
}: {
  active: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label="Find places along the route"
      title="Places along the route"
      className={`absolute z-[999] flex items-center gap-1.5 h-11 px-4 rounded-full shadow-lg text-xs font-semibold transition ${
        active ? 'bg-purple-700 text-white' : 'bg-white text-gray-700'
      } ${className}`}
    >
      <Search size={15} strokeWidth={2.4} />
      Places
    </button>
  )
}

// ─── Bottom sheet: category chips + results list ────────────────────
interface PlacesAlongRoutePanelProps {
  open: boolean
  onClose: () => void
  activeCategory: PlaceCategoryId | null
  onCategoryChange: (id: PlaceCategoryId) => void
  places: NearbyPlace[]
  isLoading: boolean
  error: string | null
  selectedPlaceId: string | null
  onSelectPlace: (place: NearbyPlace) => void
  className?: string
}

export default function PlacesAlongRoutePanel({
  open,
  onClose,
  activeCategory,
  onCategoryChange,
  places,
  isLoading,
  error,
  selectedPlaceId,
  onSelectPlace,
  className = '',
}: PlacesAlongRoutePanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className={`absolute left-0 right-0 z-[998] px-4 mx-auto max-w-[430px] lg:max-w-md ${className}`}
        >
          <div className="overflow-hidden bg-white shadow-xl rounded-2xl">
            <div className="flex items-center justify-between px-4 pt-3.5 pb-1">
              <p className="text-sm font-bold text-gray-900">Places along your route</p>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex items-center justify-center flex-shrink-0 text-gray-400 rounded-full w-7 h-7 active:bg-gray-100"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex gap-2 px-4 py-2.5 overflow-x-auto">
              {PLACE_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => onCategoryChange(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                    cat.id === activeCategory
                      ? 'text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  style={cat.id === activeCategory ? { backgroundColor: cat.color } : undefined}
                >
                  <span className="leading-none">{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="max-h-[42vh] overflow-y-auto border-t border-gray-100">
              {isLoading && (
                <div className="flex items-center justify-center gap-2 py-8 text-xs text-gray-400">
                  <Loader2 size={16} className="animate-spin" />
                  Searching along your route…
                </div>
              )}

              {!isLoading && error && (
                <p className="px-4 py-8 text-xs text-center text-red-500">{error}</p>
              )}

              {!isLoading && !error && activeCategory && places.length === 0 && (
                <p className="px-4 py-8 text-xs text-center text-gray-400">
                  No results found along this route.
                </p>
              )}

              {!isLoading &&
                !error &&
                places.map((place) => (
                  <button
                    key={place.id}
                    onClick={() => onSelectPlace(place)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left border-b border-gray-50 last:border-0 ${
                      place.id === selectedPlaceId ? 'bg-purple-50' : 'active:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">{place.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[11px] font-medium text-purple-700">
                          {formatDistance(place.distanceAlongRouteMeters)} ahead
                        </span>
                        {place.rating != null && (
                          <span className="text-[11px] text-gray-400">
                            · ★ {place.rating.toFixed(1)}
                            {place.userRatingsTotal ? ` (${place.userRatingsTotal})` : ''}
                          </span>
                        )}
                        {place.openNow != null && (
                          <span className={`text-[11px] font-medium ${place.openNow ? 'text-emerald-600' : 'text-red-500'}`}>
                            · {place.openNow ? 'Open now' : 'Closed'}
                          </span>
                        )}
                      </div>
                      {place.vicinity && (
                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{place.vicinity}</p>
                      )}
                    </div>

                    <a
                      href={directionsUrl(place)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Directions to ${place.name}`}
                      className="flex items-center justify-center flex-shrink-0 w-8 h-8 mt-0.5 text-purple-700 rounded-full bg-purple-50 active:scale-95"
                    >
                      <Navigation size={14} />
                    </a>
                  </button>
                ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
