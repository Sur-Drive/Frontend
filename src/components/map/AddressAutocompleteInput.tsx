import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, MapPin } from 'lucide-react'
import { useGoogleMaps } from '../../lib/googleMaps'
import { getCachedPredictions, setCachedPredictions } from '../../lib/addressCache'

export interface SelectedAddress {
  address: string
  lat: number
  lng: number
  placeId: string
}

interface AddressAutocompleteInputProps {
  value: string
  onChange: (value: string) => void
  onSelect: (result: SelectedAddress) => void
  placeholder?: string
  className?: string
  inputClassName?: string
  /** ISO 3166-1 alpha-2 country code to restrict results to. Defaults to Nigeria. */
  countryRestriction?: string
}

interface Prediction {
  placeId: string
  mainText: string
  secondaryText: string
}

const DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 3

export default function AddressAutocompleteInput({
  value,
  onChange,
  onSelect,
  placeholder = 'Search a place or address',
  className = '',
  inputClassName = '',
  countryRestriction = 'ng',
}: AddressAutocompleteInputProps) {
  const { isLoaded, error: loadError } = useGoogleMaps()
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)

  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null)
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null)
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Services are created once the script is ready — this is the point at
  // which the Maps script actually gets requested (see useGoogleMaps).
  useEffect(() => {
    if (!isLoaded) return
    autocompleteServiceRef.current = new google.maps.places.AutocompleteService()
    // PlacesService needs a map or a node — it's never attached to a visible map here.
    placesServiceRef.current = new google.maps.places.PlacesService(document.createElement('div'))
  }, [isLoaded])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const search = useCallback(
    (query: string) => {
      if (!autocompleteServiceRef.current || query.trim().length < MIN_QUERY_LENGTH) {
        setPredictions([])
        return
      }

      const cached = getCachedPredictions<Prediction[]>(query, countryRestriction)
      if (cached) {
        setPredictions(cached)
        setIsOpen(cached.length > 0)
        return
      }

      if (!sessionTokenRef.current) {
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken()
      }

      setIsSearching(true)
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: query,
          componentRestrictions: { country: countryRestriction },
          sessionToken: sessionTokenRef.current,
        },
        (results, status) => {
          setIsSearching(false)

          if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
            setPredictions([])
            setIsOpen(false)
            return
          }

          const mapped: Prediction[] = results.map((r) => ({
            placeId: r.place_id,
            mainText: r.structured_formatting?.main_text ?? r.description,
            secondaryText: r.structured_formatting?.secondary_text ?? '',
          }))

          setPredictions(mapped)
          setIsOpen(mapped.length > 0)
          setCachedPredictions(query, countryRestriction, mapped)
        }
      )
    },
    [countryRestriction]
  )

  const handleInputChange = (text: string) => {
    onChange(text)
    setHighlightIndex(-1)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!text.trim()) {
      setPredictions([])
      setIsOpen(false)
      return
    }

    debounceRef.current = setTimeout(() => search(text), DEBOUNCE_MS)
  }

  const handleSelect = (prediction: Prediction) => {
    if (!placesServiceRef.current) return

    setIsSearching(true)
    placesServiceRef.current.getDetails(
      {
        placeId: prediction.placeId,
        fields: ['formatted_address', 'geometry', 'name'],
        sessionToken: sessionTokenRef.current ?? undefined,
      },
      (place, status) => {
        setIsSearching(false)
        // A session ends once a place is fetched from it — the next
        // keystroke starts a new (billable) session.
        sessionTokenRef.current = null

        if (status !== google.maps.places.PlacesServiceStatus.OK || !place?.geometry?.location) {
          return
        }

        const address = place.formatted_address || prediction.mainText
        onChange(address)
        onSelect({
          address,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          placeId: prediction.placeId,
        })
        setIsOpen(false)
        setPredictions([])
      }
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || predictions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((i) => Math.min(i + 1, predictions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      if (highlightIndex >= 0) {
        e.preventDefault()
        handleSelect(predictions[highlightIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        placeholder={loadError ? 'Address search unavailable' : placeholder}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => predictions.length > 0 && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        disabled={!!loadError}
        autoComplete="off"
        className={inputClassName}
      />

      {isSearching && (
        <Loader2
          size={14}
          className="absolute -translate-y-1/2 animate-spin right-3 top-1/2 text-gray-400"
        />
      )}

      {isOpen && predictions.length > 0 && (
        <ul className="absolute left-0 right-0 z-50 mt-1 overflow-y-auto bg-white border border-gray-100 shadow-lg top-full rounded-xl max-h-64">
          {predictions.map((p, i) => (
            <li key={p.placeId}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(p)}
                className={`flex w-full items-start gap-2 px-3.5 py-2.5 text-left text-xs sm:text-sm ${
                  i === highlightIndex ? 'bg-purple-50' : 'hover:bg-gray-50'
                }`}
              >
                <MapPin size={14} className="mt-0.5 flex-shrink-0 text-gray-400" />
                <span>
                  <span className="font-medium text-gray-900">{p.mainText}</span>
                  {p.secondaryText && (
                    <span className="block text-[11px] text-gray-400">{p.secondaryText}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
