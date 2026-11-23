// ---------------------------------------------------------------------------
// googleMaps — singleton loader for the Google Maps JavaScript API.
//
// The API is loaded with a <script> tag (no npm runtime dependency — the project
// keeps its dependency list minimal): the tag is injected at most once per page
// load and every caller waits on the same in-flight promise, so components
// mounting/unmounting never re-inject it.
//
// Usage from a client component:
//   const { status, error } = useGoogleMapsLoader();
//   if (status !== 'ready') return <Unavailable error={error} />;
//
// The key comes from NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (public — it is inlined
// into the client bundle, so restrict it by HTTP referrer instead of treating it
// as a secret). When the value is missing or is still a placeholder, the loader
// reports 'unavailable' straight away and no script is ever injected, so the map
// renders its "unavailable" state instead of crashing.
// ---------------------------------------------------------------------------
import { useEffect, useState } from 'react';

export type GoogleMapsStatus = 'loading' | 'ready' | 'unavailable';

export type GoogleMapsLoaderState = {
  status: GoogleMapsStatus;
  /** Why the API is unusable, for the UI to display. Null unless 'unavailable'. */
  error: string | null;
};

/** id on the injected <script>, so an existing tag can be detected (e.g. after HMR). */
const SCRIPT_ID = 'google-maps-js';
/** Global function passed to the API as `callback=`; the API calls it when ready. */
const CALLBACK_NAME = '__surdriveGoogleMapsReady';
/** Give up — and show the fallback — if the API never signals readiness. */
const LOAD_TIMEOUT_MS = 10_000;
/** Required by AdvancedMarkerElement; the current pins use the legacy Marker. */
const LIBRARIES = 'marker';

const API_KEY = (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '').trim();

/** Template/lorem values (see README → Environment variables) are "not configured". */
// Anchored at the start: a real Google key begins with `AIza`, so broadening the
// alternatives here can never disable a working key.
const PLACEHOLDER_KEY_PATTERN =
  /^(placeholder|your[a-z0-9_-]*key|paste_|changeme|replace[_-]?me|xxxx)/i;

const MISSING_KEY_MESSAGE =
  'Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local to enable the live map.';

/** True when a usable-looking API key is present. */
export function isGoogleMapsConfigured(): boolean {
  return API_KEY.length > 0 && !PLACEHOLDER_KEY_PATTERN.test(API_KEY);
}

/** `window` plus the globals this module owns while the API loads. */
type GoogleMapsWindow = Window & { __surdriveGoogleMapsReady?: () => void };

let loaderState: GoogleMapsLoaderState = isGoogleMapsConfigured()
  ? { status: 'loading', error: null }
  : { status: 'unavailable', error: MISSING_KEY_MESSAGE };

const subscribers = new Set<(state: GoogleMapsLoaderState) => void>();

function setLoaderState(next: GoogleMapsLoaderState): void {
  loaderState = next;
  subscribers.forEach((subscriber) => subscriber(loaderState));
}

/** Current loader state — also used as the hook's lazy initial value. */
export function getGoogleMapsLoaderState(): GoogleMapsLoaderState {
  return loaderState;
}

function subscribe(subscriber: (state: GoogleMapsLoaderState) => void): () => void {
  subscribers.add(subscriber);
  // Emit immediately: the state may have changed since the component rendered.
  subscriber(loaderState);
  return () => {
    subscribers.delete(subscriber);
  };
}

let loadPromise: Promise<void> | null = null;

/**
 * Injects the Maps JS API script once and resolves when `window.google.maps` is
 * available. Concurrent callers share the same in-flight promise.
 */
export function loadGoogleMaps(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only be loaded in the browser.'));
  }
  if (loaderState.status === 'ready') return Promise.resolve();
  if (loaderState.status === 'unavailable') {
    return Promise.reject(new Error(loaderState.error ?? 'Google Maps is unavailable.'));
  }

  if (!loadPromise) {
    loadPromise = injectGoogleMapsScript();
    // Handle the rejection on the module's own chain so a caller that ignores the
    // promise can't surface an unhandled rejection — state carries the reason.
    void loadPromise.catch(() => {
      loadPromise = null; // let a later attempt retry (e.g. once a key is added)
    });
  }
  return loadPromise;
}

/**
 * Hook form of the loader: kicks off the (idempotent) load on mount and reports
 * `{ status, error }` as it changes. Render the fallback when status is
 * 'unavailable'; build the map only when it is 'ready'.
 */
export function useGoogleMapsLoader(): GoogleMapsLoaderState {
  const [state, setState] = useState<GoogleMapsLoaderState>(getGoogleMapsLoaderState);

  useEffect(() => {
    const unsubscribe = subscribe(setState);
    void loadGoogleMaps().catch(() => {
      // Failure is already reflected in `state` — nothing else to do.
    });
    return unsubscribe;
  }, []);

  return state;
}

function injectGoogleMapsScript(): Promise<void> {
  const mapsWindow = window as GoogleMapsWindow;

  return new Promise<void>((resolve, reject) => {
    let settled = false;
    let timeoutId = 0;

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);

      if (error) {
        delete mapsWindow.__surdriveGoogleMapsReady;
        setLoaderState({ status: 'unavailable', error: error.message });
        reject(error);
        return;
      }
      setLoaderState({ status: 'ready', error: null });
      resolve();
    };

    // Already loaded by another component (or an earlier script on the page).
    if (mapsWindow.google?.maps) {
      finish();
      return;
    }

    // The API rejects an invalid key asynchronously, after the script has run.
    mapsWindow.gm_authFailure = () => {
      finish(
        new Error('The Google Maps API key was rejected — check the key and its API restrictions.'),
      );
    };
    mapsWindow.__surdriveGoogleMapsReady = () => finish();

    timeoutId = window.setTimeout(() => {
      finish(new Error('Google Maps did not finish loading — check the network and the API key.'));
    }, LOAD_TIMEOUT_MS);

    // A tag is already in the document (dev HMR reloaded this module before the
    // API finished): the global callback above still fires, so just wait for it.
    if (document.getElementById(SCRIPT_ID)) return;

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = buildScriptUrl();
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      script.remove();
      finish(new Error('The Google Maps script failed to load — check the network and the API key.'));
    };
    document.head.appendChild(script);
  });
}

function buildScriptUrl(): string {
  const params = new URLSearchParams({
    key: API_KEY,
    libraries: LIBRARIES,
    callback: CALLBACK_NAME,
    // Best-practice async loading (silences the console warning); requires the
    // callback param above, which the loader already relies on for readiness.
    loading: 'async',
  });
  return `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
}
