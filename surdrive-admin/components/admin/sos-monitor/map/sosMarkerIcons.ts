// ---------------------------------------------------------------------------
// sosMarkerIcons — the one place that decides how an SOS pin looks.
//
// Pins are drawn by google.maps.Marker with an inline SVG icon (no sprite sheet,
// no per-pin image request, and no custom OverlayView class — the standard marker
// covers this look). Colours are the Status-legend swatches from the SOS Monitor
// map panel and the glyphs mirror the app's existing icons, so a pin can never
// drift from the legend that explains it:
//
//   active        red   #F04438   triangle   PENDING  ("Active SOS")
//   confirmed     amber #F5A623   dash       CONFIRMED
//   resolved      green #12B76A   check      RESOLVED
//   notConfirmed  grey  #98A2B3   (none)     CANCELLED / anything unknown — small dot
//
// A selected pin is scaled up and swaps its white ring for the dark ring the
// previous decorative pins used, which is how `selectedId` is shown on the map.
//
// Both palettes live in MapPanel's LEGEND_ROWS — keep them in sync if the
// design changes.
// ---------------------------------------------------------------------------

/** Appearance bucket for a pin; unrelated to the wire status string. */
export type SosMarkerKind = 'active' | 'confirmed' | 'resolved' | 'notConfirmed';

/** Legend order used by the map's Status legend. */
export const SOS_MARKER_KINDS: SosMarkerKind[] = [
  'active',
  'resolved',
  'confirmed',
  'notConfirmed',
];

/** Badge fill per kind — the exact legend swatch colours. */
export const SOS_MARKER_COLORS: Record<SosMarkerKind, string> = {
  active: '#F04438',
  confirmed: '#F5A623',
  resolved: '#12B76A',
  notConfirmed: '#98A2B3',
};

/**
 * SosAlert status → marker kind. Unknown statuses fall back to the neutral dot,
 * matching how the incident list falls back to a neutral badge.
 */
const STATUS_KINDS: Record<string, SosMarkerKind> = {
  PENDING: 'active',
  CONFIRMED: 'confirmed',
  RESOLVED: 'resolved',
  CANCELLED: 'notConfirmed',
};

export function sosMarkerKind(status: string): SosMarkerKind {
  return STATUS_KINDS[status] ?? 'notConfirmed';
}

// ---------------------------------------------------------------------------
// Geometry — copied from the previous decorative pins so the real map matches
// ---------------------------------------------------------------------------

/** Source canvas is sized to badge + ring, so an icon fills its box exactly. */
const RING_WIDTH = 3; // matches the previous ring-[3px]
const BADGE_RADIUS = 16; // 32px badge, matches the previous h-8 w-8 pins
const DOT_RADIUS = 5; // 10px dot, matches the previous h-2.5 w-2.5 dot
/** ≈ the previous scale-110, a touch louder now that pins sit on a real map. */
const SELECTED_SCALE = 1.15;
/** Every icon in the app is authored on a 24x24 grid. */
const GLYPH_VIEW_BOX = 24;

const RING_COLOR = '#FFFFFF';
/** ring-[#14102B]/40 — the dark ring the previous selected pins used. */
const SELECTED_RING_COLOR = 'rgba(20, 16, 43, 0.4)';
/** Glyph colour drawn inside a badge. */
const GLYPH_COLOR = '#FFFFFF';

type SosMarkerStyle = {
  radius: number;
  /** Glyph markup on a 24x24 grid. Dot kinds deliberately have none. */
  glyph?: (color: string) => string;
};

const MARKER_STYLES: Record<SosMarkerKind, SosMarkerStyle> = {
  active: {
    radius: BADGE_RADIUS,
    // Same triangle the list/detail panel use for an active SOS.
    glyph: (color) => `<path d="M12 3.5 22 20H2L12 3.5Z" fill="${color}"/>`,
  },
  confirmed: {
    radius: BADGE_RADIUS,
    // The 14x4px white pill from the previous Confirmed pins.
    glyph: (color) => `<rect x="1.5" y="9" width="21" height="6" rx="3" fill="${color}"/>`,
  },
  resolved: {
    radius: BADGE_RADIUS,
    // CheckIcon's path, kept stroked so it stays crisp at this size.
    glyph: (color) =>
      `<path d="m5 13 4 4L19 7" fill="none" stroke="${color}" stroke-width="2.5"` +
      ` stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  // Glyph-less: a small dot reads as "unconfirmed" without shouting.
  notConfirmed: { radius: DOT_RADIUS },
};

const iconCache = new Map<string, google.maps.Icon>();

/**
 * Icon for a pin; `selected` scales it up and darkens its ring. Built once per
 * kind/state and cached, so the same Icon object is handed to every marker of
 * that kind and a live update never rebuilds an SVG data URI.
 */
export function getSosMarkerIcon(kind: SosMarkerKind, selected = false): google.maps.Icon {
  const cacheKey = `${kind}:${selected ? 'selected' : 'default'}`;
  const cached = iconCache.get(cacheKey);
  if (cached) return cached;

  const icon = buildMarkerIcon(kind, selected);
  iconCache.set(cacheKey, icon);
  return icon;
}

function buildMarkerIcon(kind: SosMarkerKind, selected: boolean): google.maps.Icon {
  const style = MARKER_STYLES[kind];
  const sourceSize = (style.radius + RING_WIDTH) * 2;
  const center = sourceSize / 2;
  const displaySize = Math.round(sourceSize * (selected ? SELECTED_SCALE : 1));

  // The glyph box is radius-sized (a 16px icon on a 32px badge), centred.
  const glyph = style.glyph
    ? `<g transform="translate(${center - style.radius / 2} ${center - style.radius / 2})` +
      ` scale(${(style.radius / GLYPH_VIEW_BOX).toFixed(4)})">${style.glyph(GLYPH_COLOR)}</g>`
    : '';

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${displaySize}" height="${displaySize}"` +
    ` viewBox="0 0 ${sourceSize} ${sourceSize}">` +
    `<circle cx="${center}" cy="${center}" r="${style.radius + RING_WIDTH}" fill="${
      selected ? SELECTED_RING_COLOR : RING_COLOR
    }"/>` +
    `<circle cx="${center}" cy="${center}" r="${style.radius}" fill="${SOS_MARKER_COLORS[kind]}"/>` +
    glyph +
    `</svg>`;

  return {
    // encodeURIComponent stops the `#` in each colour from truncating the URI.
    url: `data:image/svg+xml,${encodeURIComponent(svg)}`,
    size: new google.maps.Size(displaySize, displaySize),
    scaledSize: new google.maps.Size(displaySize, displaySize),
    // Circular badge → anchor at the centre, exactly like the previous pins.
    anchor: new google.maps.Point(displaySize / 2, displaySize / 2),
  };
}

/** Selected pins sit above the rest; badges sit above the small grey dots. */
export function sosMarkerZIndex(kind: SosMarkerKind, selected: boolean): number {
  if (selected) return 1000;
  return kind === 'notConfirmed' ? 100 : 200;
}
