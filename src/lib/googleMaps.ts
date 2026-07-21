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
// We intentionally do NOT load or call the Geocoding API from the frontend.
const LIBRARIES = 'places'

declare global {
  interface Window {
    google?: typeof google
    [key: string]: any
  }
}

let loadPromise: Promise<void> | null = null

export function loadGoogleMaps(): Promise<void> {
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Google Maps can only be loaded in a browser environment'))
      return
    }

    if (window.google?.maps) {
      resolve()
      return
    }

    if (!GOOGLE_MAPS_API_KEY) {
      reject(new Error('Missing VITE_GOOGLE_MAPS_API_KEY — add it to your .env file'))
      return
    }

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

  return loadPromise
}

export function useGoogleMaps(): { isLoaded: boolean; error: string | null } {
  const [isLoaded, setIsLoaded] = useState(
    typeof window !== 'undefined' && !!window.google?.maps
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
