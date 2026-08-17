
import { useEffect, useState } from 'react'

// ─── Lazy Google Maps script loader ─────────────────────────────────
// The <script> tag is only injected the first time some component that
// actually needs the map (GoogleMapView, AddressAutocompleteInput) mounts
// — never on initial app load. Every subsequent caller reuses the same
// in-flight/resolved promise, so the script is only ever requested once
// per page session, no matter how many map/autocomplete components mount.

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined
const CALLBACK_NAME = '__surdriveGoogleMapsLoaded'
// 'places' → Autocomplete/Place Details for address search.
// 'marker' → AdvancedMarkerElement (not yet used, but valid to preload).
// We intentionally do NOT load or call the Geocoding API from the frontend.
const LIBRARIES = 'places,marker'

declare global {
  interface Window {
    google?: typeof google
    [key: string]: any
  }
}

let loadPromise: Promise<void> | null = null

// With `loading=async`, the bootstrap <script>'s callback only means the
// base loader is ready — it does NOT mean google.maps.Map (or Polyline,
// TrafficLayer, StreetViewService, StreetViewPanorama, LatLng, ...) are
// real constructors yet. Those all live in the core "maps" library, which
// — just like every other library — is only populated once you explicitly
// importLibrary() it. Skipping this step is exactly what produced
// "google.maps.Map is not a constructor": the callback had already fired,
// but google.maps.Map was still an unresolved stub. 'places' and 'marker'
// don't have this problem because requesting them via the `libraries=`
// URL param does load them eagerly — only the core library needs the
// explicit import.
async function ensureCoreLibraryLoaded(): Promise<void> {
  await google.maps.importLibrary('maps')
}

export function loadGoogleMaps(): Promise<void> {
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    if (typeof window === 'undefined') {
      throw new Error('Google Maps can only be loaded in a browser environment')
    }

    if (window.google?.maps?.Map) {
      return
    }

    if (!window.google?.maps) {
      if (!GOOGLE_MAPS_API_KEY) {
        throw new Error('Missing VITE_GOOGLE_MAPS_API_KEY — add it to your .env file')
      }

      await new Promise<void>((resolve, reject) => {
        window[CALLBACK_NAME] = () => resolve()

        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=${LIBRARIES}&loading=async&callback=${CALLBACK_NAME}`
        script.async = true
        script.onerror = () => {
          loadPromise = null // allow a retry on the next call
          reject(new Error('Failed to load the Google Maps script'))
        }
        document.head.appendChild(script)
      })
    }

    // Base loader is ready (either just now, or already present from an
    // earlier mount) — now make sure the core library is actually resolved.
    await ensureCoreLibraryLoaded()
  })()

  return loadPromise
}

export function useGoogleMaps(): { isLoaded: boolean; error: string | null } {
  const [isLoaded, setIsLoaded] = useState(
    typeof window !== 'undefined' && !!window.google?.maps?.Map
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isLoaded) return
    let cancelled = false

    loadGoogleMaps()
      .then(() => {
        if (!cancelled) setIsLoaded(true)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })

    return () => {
      cancelled = true
    }
  }, [isLoaded])

  return { isLoaded, error }
}

