// Google Maps JS `styles` arrays for the app's two map appearances.
//
// LIGHT_MAP_STYLE is intentionally empty — an empty styles array just
// means "use Google's normal default roadmap tiles", i.e. the map
// always looks exactly like the real Google Maps app: same road/water
// colors, same labels, nothing overridden.
//
// DARK_MAP_STYLE is Google's own published "Night Mode" palette (the
// same style Google ships in its map-styling docs/wizard) rather than a
// custom-branded skin, so switching to dark still looks like genuine
// Google Maps at night — not an app-specific color scheme.
//
// Both are applied via map.setOptions({ styles }) in GoogleMapView, so
// switching themes never re-creates the map — it just restyles the
// existing tiles/overlays in place.

export type MapThemeId = 'light' | 'dark'

export const LIGHT_MAP_STYLE: google.maps.MapTypeStyle[] = []

export const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
]

export const MAP_STYLE_BY_THEME: Record<MapThemeId, google.maps.MapTypeStyle[]> = {
  light: LIGHT_MAP_STYLE,
  dark: DARK_MAP_STYLE,
}

// Versioned so any theme value saved by an older build — e.g. from when
// this used to auto-detect the OS dark-mode preference — gets treated
// as stale rather than silently carried forward. Everyone starts back
// at the real, unmodified Google Maps look; only an explicit tap on the
// in-app toggle writes a value under this key from here on.
const STORAGE_KEY = 'surdrive:map-theme:v2'

/** Reads the user's last-picked map theme (via the in-app light/dark
 * toggle on the route/navigation screen), falling back to 'light' —
 * the real, unmodified Google Maps look. */
export function getInitialMapTheme(): MapThemeId {
  if (typeof window === 'undefined') return 'light'

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // localStorage can throw in some privacy modes — fall through
  }

  return 'light'
}

export function persistMapTheme(theme: MapThemeId): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // best-effort only
  }
}
