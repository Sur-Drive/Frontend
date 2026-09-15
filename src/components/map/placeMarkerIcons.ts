import type { PlaceCategoryKey } from '../../types/places'

// Simple, recognizable glyph per category — kept as plain stroked SVG
// paths (no icon library dependency) so these drop straight into the
// HTML-overlay pin markup the same way mapMarkerIcons.ts's report icons do.
function categoryIconMarkup(category: PlaceCategoryKey): string {
  switch (category) {
    case 'restaurants':
      return `
        <svg viewBox="0 0 24 24" width="56%" height="56%" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M7 2v7a2 2 0 0 0 2 2v11" />
          <path d="M7 2v7" />
          <path d="M11 2v9" />
          <path d="M17 2c-1.5 0-3 1.5-3 4v3a2 2 0 0 0 2 2v11" />
        </svg>`
    case 'hotels':
      return `
        <svg viewBox="0 0 24 24" width="60%" height="60%" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 19v-9a2 2 0 0 1 2-2h5v6" />
          <path d="M3 19h18" />
          <path d="M10 14h9a2 2 0 0 1 2 2v3" />
          <circle cx="7" cy="10" r="1.5" fill="white" stroke="none" />
        </svg>`
    case 'attractions':
      return `
        <svg viewBox="0 0 24 24" width="58%" height="58%" fill="white">
          <path d="M12 2l2.9 6.6L22 9.3l-5 4.9 1.2 7.1L12 17.8l-6.2 3.5L7 14.2 2 9.3l7.1-.7z" />
        </svg>`
    case 'gas':
      return `
        <svg viewBox="0 0 24 24" width="56%" height="56%" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 22V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
          <path d="M3 22h10" />
          <path d="M13 9h2l3 3v6a1.5 1.5 0 0 1-3 0v-2h-2" />
          <path d="M5 6h6" />
        </svg>`
    case 'groceries':
      return `
        <svg viewBox="0 0 24 24" width="58%" height="58%" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 9h16l-1.5 10a2 2 0 0 1-2 1.8H7.5a2 2 0 0 1-2-1.8L4 9z" />
          <path d="M8 9V6a4 4 0 0 1 8 0v3" />
        </svg>`
    case 'coffee':
      return `
        <svg viewBox="0 0 24 24" width="58%" height="58%" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8z" />
          <path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17" />
          <path d="M7 4c0 1-1 1-1 2M11 4c0 1-1 1-1 2" />
        </svg>`
    case 'parks':
      return `
        <svg viewBox="0 0 24 24" width="58%" height="58%" fill="white">
          <path d="M12 2 7 10h3l-4 6h4v6h4v-6h4l-4-6h3z" />
        </svg>`
    case 'gyms':
      return `
        <svg viewBox="0 0 24 24" width="58%" height="58%" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round">
          <path d="M4 8v8M20 8v8" />
          <path d="M2 10v4M22 10v4" />
          <path d="M7 12h10" />
          <path d="M7 8v8M17 8v8" />
        </svg>`
    case 'art':
      return `
        <svg viewBox="0 0 24 24" width="58%" height="58%" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a10 10 0 1 0 3.5 19.4c1-.4 1-1.8-.1-2.1a2.3 2.3 0 0 1-1.6-2.2c0-1.3 1-2.2 2.3-2.2H19a3 3 0 0 0 3-3c0-5.5-4.5-9.9-10-9.9z" />
          <circle cx="7.5" cy="10.5" r="1.2" fill="white" stroke="none" />
          <circle cx="11" cy="7" r="1.2" fill="white" stroke="none" />
          <circle cx="15.5" cy="8" r="1.2" fill="white" stroke="none" />
        </svg>`
    case 'takeout':
      return `
        <svg viewBox="0 0 24 24" width="56%" height="56%" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 8h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        </svg>`
    case 'delivery':
      return `
        <svg viewBox="0 0 24 24" width="60%" height="60%" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="7" width="13" height="9" rx="1" />
          <path d="M15 10h3l3 3v3h-6z" />
          <circle cx="6.5" cy="18" r="1.6" fill="white" stroke="none" />
          <circle cx="16.5" cy="18" r="1.6" fill="white" stroke="none" />
        </svg>`
    case 'homes':
      return `
        <svg viewBox="0 0 24 24" width="58%" height="58%" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 11l9-8 9 8" />
          <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
        </svg>`
    case 'salon':
      return `
        <svg viewBox="0 0 24 24" width="58%" height="58%" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="6" cy="6" r="2.2" />
          <circle cx="6" cy="18" r="2.2" />
          <path d="M20 5 7.5 13" />
          <path d="M7.5 11 20 19" />
        </svg>`
    default:
      return `<span style="color:white;font-size:55%;font-weight:bold;">•</span>`
  }
}

const MOBILE_BREAKPOINT_PX = 640

function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT_PX
}

function placePinSize(isSelected: boolean): number {
  if (isMobileViewport()) return isSelected ? 42 : 28
  return isSelected ? 48 : 32
}

export function placePinHtml(
  category: PlaceCategoryKey,
  color: string,
  isSelected: boolean,
): string {
  const size = placePinSize(isSelected)
  return `
    <div style="
      background:${color};
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      display:flex;
      align-items:center;
      justify-content:center;
      box-shadow:${isSelected ? '0 4px 16px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.22)'};
      border:${isSelected ? 3 : 2}px solid white;
      transition:all 0.2s;
      cursor:pointer;
    ">
      ${categoryIconMarkup(category)}
    </div>
  `
}

// Anchor must match placePinHtml's actual rendered size (center of the
// circle), mirroring how mapMarkerIcons.ts anchors report pins.
export function getPlacePinAnchor(isSelected: boolean): [number, number] {
  const half = placePinSize(isSelected) / 2
  return [half, half]
}

// Classic red teardrop marker for a manually-dropped pin — deliberately
// distinct from the round category-search pins above, same visual
// language as Google Maps' own "drop a pin" marker, so it's immediately
// clear this came from tapping the map rather than the Explore bar.
function dropPinSize(isSelected: boolean): number {
  if (isMobileViewport()) return isSelected ? 40 : 34
  return isSelected ? 46 : 38
}

export function dropPinHtml(isSelected: boolean): string {
  const width = dropPinSize(isSelected)
  const height = Math.round(width * 1.34)
  return `
    <svg width="${width}" height="${height}" viewBox="0 0 32 43" style="display:block;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.35));cursor:pointer;">
      <path d="M16 0C7.2 0 0 7.2 0 16.1 0 28.2 16 43 16 43s16-14.8 16-26.9C32 7.2 24.8 0 16 0z" fill="${isSelected ? '#d33426' : '#ea4335'}" />
      <circle cx="16" cy="16" r="6.5" fill="white" />
    </svg>
  `
}

// Anchored at the tip of the teardrop (bottom-center), not the center —
// that's the point that should sit exactly on the tapped coordinate.
export function getDropPinAnchor(isSelected: boolean): [number, number] {
  const width = dropPinSize(isSelected)
  const height = Math.round(width * 1.34)
  return [width / 2, height]
}
