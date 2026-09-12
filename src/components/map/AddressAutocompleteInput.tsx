import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, MapPin, Mic } from 'lucide-react'
import { useGoogleMaps } from '../../lib/googleMaps'
import { getCachedPredictions, setCachedPredictions } from '../../lib/addressCache'
import { useVoiceSearch } from '../../hooks/useVoiceSearch'
import { forwardGeocode } from '../../api/geocoding'

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
  /** ISO 3166-1 alpha-2 country code(s) to restrict results to. Defaults to Nigeria + United Kingdom. */
  countryRestriction?: string | string[]
  /** Show the tap-to-speak mic button (auto-hidden if the browser doesn't support voice input). Defaults to true. */
  enableVoice?: boolean
  /**
   * Center point (typically the driver's current location) used to bias
   * Places predictions toward nearby, specific results. Without this,
   * Google's Autocomplete ranks purely by country-wide prominence, which
   * surfaces well-known landmarks and buries smaller/local addresses —
   * that's the "only major landmarks show up" gap. Optional; search still
   * works without it, just less locally relevant.
   */
  biasLocation?: { lat: number; lng: number }
  /** Bias radius in meters around `biasLocation`. Defaults to 50km. */
  biasRadiusMeters?: number
}

interface Prediction {
  placeId: string
  mainText: string
  secondaryText: string
}

const DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 3

/** Google's AutocompleteService allows up to 5 country codes per request. */
function normalizeCountryRestriction(restriction: string | string[]): string[] {
  const list = Array.isArray(restriction) ? restriction : [restriction]
  return list.map((c) => c.toLowerCase()).slice(0, 5)
}

export default function AddressAutocompleteInput({
  value,
  onChange,
  onSelect,
  placeholder = 'Search a place or address',
  className = '',
  inputClassName = '',
  countryRestriction = ['ng', 'gb'],
  enableVoice = true,
  biasLocation,
  biasRadiusMeters = 50000,
}: AddressAutocompleteInputProps) {
  const { isLoaded, error: loadError } = useGoogleMaps()
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const [noResultsQuery, setNoResultsQuery] = useState<string | null>(null)

  const voiceSearch = useVoiceSearch()
  // Set right before a voice-driven search kicks off, so the predictions
  // effect below knows to jump straight to the top result — mirroring
  // how Google Maps' mic search auto-picks the best match instead of
  // making you tap it again.
  const autoSelectFromVoiceRef = useRef(false)

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

  const countries = normalizeCountryRestriction(countryRestriction)
  const cacheCountryKey = countries.join(',')
  // Round the bias point to ~1km so nearby searches still share a cache
  // entry, but a genuinely different location (new city, new trip) isn't
  // served stale results biased toward somewhere else.
  const biasKey = biasLocation ? `${biasLocation.lat.toFixed(2)},${biasLocation.lng.toFixed(2)}` : 'none'
  const cacheKeySuffix = `${cacheCountryKey}|${biasKey}`

  const search = useCallback(
    (query: string) => {
      if (!autocompleteServiceRef.current || query.trim().length < MIN_QUERY_LENGTH) {
        setPredictions([])
        return
      }

      setNoResultsQuery(null)

      const cached = getCachedPredictions<Prediction[]>(query, cacheKeySuffix)
      if (cached) {
        setPredictions(cached)
        setIsOpen(cached.length > 0)
        if (cached.length === 0) setNoResultsQuery(query)
        return
      }

      if (!sessionTokenRef.current) {
        sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken()
      }

      setIsSearching(true)
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: query,
          // Google accepts a single country or an array of up to 5.
          componentRestrictions: { country: countries },
          sessionToken: sessionTokenRef.current,
          // Bias (not restrict) toward the driver's area so specific local
          // addresses rank above country-wide "major landmark" results —
          // without a bias, Google falls back to pure prominence ranking.
          ...(biasLocation
            ? {
                locationBias: {
                  center: new google.maps.LatLng(biasLocation.lat, biasLocation.lng),
                  radius: biasRadiusMeters,
                } as google.maps.places.LocationBias,
              }
            : {}),
        },
        (results, status) => {
          setIsSearching(false)

          if (status !== google.maps.places.PlacesServiceStatus.OK || !results) {
            setPredictions([])
            setIsOpen(false)
            // ZERO_RESULTS (as opposed to an error status) means Places
            // genuinely has nothing — offer the raw-text geocode fallback
            // below instead of a dead end.
            if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
              setNoResultsQuery(query)
            }
            return
          }

          const mapped: Prediction[] = results.map((r) => ({
            placeId: r.place_id,
            mainText: r.structured_formatting?.main_text ?? r.description,
            secondaryText: r.structured_formatting?.secondary_text ?? '',
          }))

          setPredictions(mapped)
          setIsOpen(mapped.length > 0)
          setCachedPredictions(query, cacheKeySuffix, mapped)
        }
      )
    },
    [cacheKeySuffix, biasLocation?.lat, biasLocation?.lng, biasRadiusMeters]
  )

  const handleInputChange = (text: string) => {
    onChange(text)
    setHighlightIndex(-1)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    setNoResultsQuery(null)

    if (!text.trim()) {
      setPredictions([])
      setIsOpen(false)
      return
    }

    debounceRef.current = setTimeout(() => search(text), DEBOUNCE_MS)
  }

  // Fallback for addresses Places Autocomplete doesn't know as a
  // "place" (new developments, unnamed compounds, rural addresses) but
  // that a straight geocode can still resolve. Also used when someone
  // types a full address and hits Enter without ever opening the dropdown.
  const handleManualSearch = async (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return

    setIsSearching(true)
    setIsOpen(false)
    try {
      const result = await forwardGeocode(trimmed)
      if (typeof result.lat === 'number' && typeof result.lng === 'number') {
        onChange(result.address || trimmed)
        onSelect({
          address: result.address || trimmed,
          lat: result.lat,
          lng: result.lng,
          placeId: '',
        })
        setNoResultsQuery(null)
        setPredictions([])
      }
    } catch {
      // Leave the typed text as-is — nothing more to offer here.
    } finally {
      setIsSearching(false)
    }
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
        setNoResultsQuery(null)
      }
    )
  }

  // Once a voice-driven query's predictions come back, jump straight to
  // the top match instead of leaving the dropdown open — you already said
  // what you wanted, no need to tap it again.
  useEffect(() => {
    if (autoSelectFromVoiceRef.current && predictions.length > 0) {
      autoSelectFromVoiceRef.current = false
      handleSelect(predictions[0])
    }
  }, [predictions]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMicClick = () => {
    if (voiceSearch.isListening) {
      voiceSearch.stop()
      return
    }
    voiceSearch.start((transcript) => {
      autoSelectFromVoiceRef.current = true
      handleInputChange(transcript)
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && (!isOpen || predictions.length === 0)) {
      // Dropdown has nothing to pick from (still loading, or a genuine
      // no-results case) — try a raw geocode of the typed text instead of
      // silently swallowing the keypress.
      e.preventDefault()
      if (value.trim().length >= MIN_QUERY_LENGTH) handleManualSearch(value)
      return
    }

    if (!isOpen || predictions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((i) => Math.min(i + 1, predictions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightIndex >= 0) {
        handleSelect(predictions[highlightIndex])
      } else if (value.trim().length >= MIN_QUERY_LENGTH) {
        // No suggestion picked (e.g. Places had nothing for this exact
        // text) — fall back to geocoding whatever was typed.
        handleManualSearch(value)
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
        placeholder={loadError ? 'Address search unavailable' : voiceSearch.isListening ? 'Listening…' : placeholder}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => predictions.length > 0 && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        disabled={!!loadError}
        autoComplete="off"
        className={`${inputClassName} ${enableVoice && voiceSearch.isSupported ? 'pr-7' : ''}`}
      />

      {isSearching && (
        <Loader2
          size={14}
          className="absolute -translate-y-1/2 animate-spin right-3 top-1/2 text-gray-400"
        />
      )}

      {!isSearching && enableVoice && voiceSearch.isSupported && !loadError && (
        <button
          type="button"
          onClick={handleMicClick}
          aria-label={voiceSearch.isListening ? 'Stop voice search' : 'Search by voice'}
          className={`absolute -translate-y-1/2 right-2.5 top-1/2 flex items-center justify-center w-5 h-5 rounded-full transition ${
            voiceSearch.isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-[#6E43A3]'
          }`}
        >
          <Mic size={15} />
        </button>
      )}

      {voiceSearch.error && (
        <p className="absolute left-0 mt-1 text-[11px] text-red-500 top-full">{voiceSearch.error}</p>
      )}

      {!isOpen && !isSearching && noResultsQuery && noResultsQuery === value && (
        <ul className="absolute left-0 right-0 z-50 mt-1 overflow-y-auto bg-white border border-gray-100 shadow-lg top-full rounded-xl max-h-64">
          <li>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleManualSearch(noResultsQuery)}
              className="flex w-full items-start gap-2 px-3.5 py-2.5 text-left text-xs sm:text-sm hover:bg-gray-50"
            >
              <MapPin size={14} className="mt-0.5 flex-shrink-0 text-gray-400" />
              <span>
                <span className="font-medium text-gray-900">Use "{noResultsQuery}"</span>
                <span className="block text-[11px] text-gray-400">No exact match — search this address directly</span>
              </span>
            </button>
          </li>
        </ul>
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
                  i === highlightIndex ? 'bg-[#6E43A3]/10' : 'hover:bg-gray-50'
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
