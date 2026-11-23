'use client';

// ---------------------------------------------------------------------------
// MapPanel — the SOS Monitor's "Live map" panel.
//
// The header (title, Live badge, layers/refresh/expand controls) and the Status
// legend are unchanged from the previous build; only the canvas behind them is
// new. The decorative SVG street grid and its absolutely-positioned mock pins are
// gone, replaced by the real Google map, which is fed the same alerts the
// incident list shows and reports pin clicks back through onSelectAlert — so
// selecting a pin and selecting a list row behave identically.
//
// The map is mounted through LazySosMap and never SosMapView directly, to keep
// the Maps bundle out of the initial page load.
//
// Controls: refresh re-fetches through the view's own fetch function (pins update,
// the camera deliberately does not move), expand shows the very same instance
// larger — the wrapper is always mounted and only its classes change, so the map's
// DOM node is never recreated — and the layers button opens the Roadmap/Satellite
// switcher (see MapTypeMenu), which calls setMapTypeId on that same instance. Base
// map type is orthogonal to the camera and to the pins, so it interacts with
// neither refresh nor expand.
//
// On the expanded state and "the app's modal shell": there is no shared modal
// component. LogoutModal, ConfirmActionModal and the rest each repeat their own
// `fixed inset-0` backdrop markup, so this overlay repeats it too rather than
// composing anything. The two behaviors it wants, Escape and a scroll lock, come
// from lib/useModalBehavior — the lock switched off here, see the call below.
// ---------------------------------------------------------------------------
import { useCallback, useRef, useState } from 'react';
import { LayersIcon } from '@/components/ui/icons/LayersIcon';
import { RefreshIcon } from '@/components/ui/icons/RefreshIcon';
import { ExpandIcon } from '@/components/ui/icons/ExpandIcon';
import { useModalBehavior } from '@/lib/useModalBehavior';
import { LazySosMap } from './map/LazySosMap';
import { MapTypeMenu, MAP_TYPE_TRIGGER_ATTR } from './MapTypeMenu';
import type { MapBaseType } from './map/SosMapView';
import type { SosAlert } from '@/types';

export type MapPanelProps = {
  /** Alerts to plot — one pin per alert. */
  alerts: SosAlert[];
  /** Currently selected incident, highlighted on the map. */
  selectedId: string | null;
  /** Selects an incident — the same handler the list rows call. */
  onSelectAlert: (id: string) => void;
  /**
   * Refetches the alert feed. Deliberately the view's existing fetch function
   * (the one the initial load and the detail panel already use) rather than a
   * second fetch path. Resolves once the request settles.
   */
  onRefresh: () => Promise<void>;
};

/** Inline in the page: the established h-[35vh] mobile / stretched desktop sizing. */
const INLINE_SECTION_CLASS =
  'flex min-w-0 flex-none flex-col overflow-hidden rounded-2xl border border-line-card bg-surface-card h-[35vh] lg:flex-1 lg:h-auto lg:max-h-none';

/**
 * Expanded: a near-full-viewport card following the app's dialog convention — the
 * same `fixed inset-0` backdrop markup every modal repeats, not a shared shell
 * (see the file header). A separate class set rather than overrides, because the
 * inline `lg:flex-1 lg:h-auto` rules would fight the expanded height.
 */
const EXPANDED_SECTION_CLASS =
  'flex min-w-0 w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-line-card bg-surface-card h-[90vh]';

export function MapPanel({ alerts, selectedId, onSelectAlert, onRefresh }: MapPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  /** The real overlap guard: `refreshing` state lands a tick late, a ref does not. */
  const refreshingRef = useRef(false);
  /** Bumped on every expand/collapse so the map can announce its container resize. */
  const [resizeToken, setResizeToken] = useState(0);
  /**
   * Base map selection. Local state only — it resets to Roadmap on reload, the
   * same "session state" treatment as the refresh spinner. Persisting it would
   * mean reading the cookie during render (this component is server-rendered
   * too, so that is a hydration mismatch) or plumbing it down from the page,
   * which the design does not ask for.
   */
  const [mapType, setMapType] = useState<MapBaseType>('roadmap');
  /** Layers dropdown — same open/close shape as the Topbar's profile overlay. */
  const [layersMenuOpen, setLayersMenuOpen] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
    }
  }, [onRefresh]);

  const toggleExpanded = useCallback(() => {
    setExpanded((previous) => !previous);
    // Lands in the same commit as `expanded`, so the map measures the container
    // only after it has already been resized.
    setResizeToken((token) => token + 1);
  }, []);

  /**
   * The overlay's Escape handling — a separate call rather than sharing the
   * dialogs' invocation, because this is not a dialog: it never unmounts, and its
   * Escape has to back out in two stages. The layers dropdown is not Escape-aware
   * itself, so it closes first; only an Escape with no dropdown open collapses the
   * map. Collapsing goes through toggleExpanded rather than setExpanded, so the
   * resizeToken bump — the map's only signal that its container changed size — is
   * never skipped.
   *
   * lockScroll is off on purpose: this overlay is `fixed inset-0` and sized by the
   * viewport, so a lock on <main> could neither resize it nor disturb the
   * persistent map instance — leaving the page behind scrollable is the chosen
   * behavior here, and expand/collapse then touches no styles at all.
   */
  useModalBehavior({
    open: expanded,
    onClose: () => {
      if (layersMenuOpen) {
        setLayersMenuOpen(false);
        return;
      }
      toggleExpanded();
    },
    lockScroll: false,
  });

  return (
    // Always mounted, so toggling expansion only changes classes — the map's DOM
    // node, and with it the live Maps instance, is never recreated. While inline
    // the wrapper is `display: contents`, i.e. layout-transparent, so the section
    // stays a direct flex child of the view's 3-panel row exactly as before.
    <div
      className={
        expanded
          ? 'fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'
          : 'contents'
      }
      role={expanded ? 'dialog' : undefined}
      aria-modal={expanded ? true : undefined}
      aria-label={expanded ? 'Expanded live map' : undefined}
      onClick={expanded ? toggleExpanded : undefined}
    >
      <section
        className={expanded ? EXPANDED_SECTION_CLASS : INLINE_SECTION_CLASS}
        onClick={expanded ? (event) => event.stopPropagation() : undefined}
      >
        {/* Map header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <SirenHeaderIcon />
            <span className="text-sm font-semibold text-ink-primary">Live map</span>
            <span className="flex items-center gap-1 rounded-full bg-status-success-bg px-2 py-0.5 text-[10px] font-semibold text-status-success-text">
              <span className="h-1 w-1 rounded-full bg-current" aria-hidden="true" />
              Live
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* Base-map switcher. Wrapper is `relative` so the menu anchors to the
                layers button; the button carries data-overlay-trigger so it keeps
                owning its own toggle (see MapTypeMenu). */}
            <div className="relative">
              <button
                type="button"
                data-overlay-trigger={MAP_TYPE_TRIGGER_ATTR}
                onClick={() => setLayersMenuOpen((current) => !current)}
                aria-label="Map layers"
                aria-haspopup="menu"
                aria-expanded={layersMenuOpen}
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                  layersMenuOpen
                    ? 'bg-surface-hover text-ink-secondary'
                    : 'text-ink-tertiary hover:bg-surface-hover'
                }`}
              >
                <LayersIcon className="h-4 w-4" />
              </button>
              <MapTypeMenu
                open={layersMenuOpen}
                value={mapType}
                onChange={setMapType}
                onClose={() => setLayersMenuOpen(false)}
              />
            </div>
            <button
              type="button"
              aria-label="Refresh map"
              onClick={handleRefresh}
              disabled={refreshing}
              aria-busy={refreshing}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-tertiary transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              aria-label={expanded ? 'Collapse map' : 'Expand map'}
              aria-pressed={expanded}
              onClick={toggleExpanded}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-tertiary transition-colors hover:bg-surface-hover"
            >
              {/* No collapse icon exists in the icon set, so the expand glyph is
                  flipped inward to read as "collapse". */}
              <ExpandIcon className={`h-4 w-4 ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Live map — real Google Maps, with the Status legend overlaid */}
        <div className="relative min-h-0 flex-1 overflow-hidden bg-[#E9EBED]">
          <LazySosMap
            alerts={alerts}
            selectedId={selectedId}
            onSelectAlert={onSelectAlert}
            resizeToken={resizeToken}
            mapType={mapType}
          />
          <MapLegend />
        </div>
      </section>
    </div>
  );
}

/* Small placeholder siren-style icon for the map header — exact icon TBD */
function SirenHeaderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-sos"
      aria-hidden="true"
    >
      <path d="M5 17h14l-1.2-4.5a5.8 5.8 0 0 0-11.6 0L5 17Z" />
      <path d="M3.5 20h17" />
      <path d="M12 4.5V3M5.6 6.6 4.5 5.5M18.4 6.6l1.1-1.1" />
    </svg>
  );
}

// Keep in sync with SOS_MARKER_COLORS in ./map/sosMarkerIcons (the pin palette).
const LEGEND_ROWS: { label: string; dotClass: string }[] = [
  { label: 'Active SOS', dotClass: 'bg-[#F04438]' },
  { label: 'Resolved SOS', dotClass: 'bg-[#12B76A]' },
  { label: 'Confirmed SOS', dotClass: 'bg-[#F5A623]' },
  { label: 'Not Confirmed', dotClass: 'bg-[#98A2B3]' },
];

function MapLegend() {
  return (
    <div className="absolute bottom-4 left-4 z-10 rounded-xl bg-white px-3.5 py-3 shadow-md">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">Status</p>
      <ul className="mt-1.5 flex flex-col gap-1">
        {LEGEND_ROWS.map((row) => (
          <li key={row.label} className="flex items-center gap-2 text-xs text-[#4B5563]">
            <span className={`h-2 w-2 rounded-full ${row.dotClass}`} aria-hidden="true" />
            {row.label}
          </li>
        ))}
      </ul>
    </div>
  );
}