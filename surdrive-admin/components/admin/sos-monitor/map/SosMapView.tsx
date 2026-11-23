'use client';

// ---------------------------------------------------------------------------
// SosMapView — the real Google map behind the SOS Monitor's "Live map" panel.
//
// Mounted only through LazySosMap (next/dynamic, ssr: false) because the Maps JS
// API needs `window`. Pin appearance lives in ./sosMarkerIcons, the marker/camera
// rules in ./sosMapMarkers; this component owns the React lifecycle — waiting for
// the script, building and tearing down the map instance, and rendering the
// fallback UI when the API is unavailable.
//
// Camera behaviour: the viewport is framed once (fitted to every alert
// coordinate, or Lagos city centre when there are none) and then left alone, so
// live updates never yank the map out from under an operator who is panning.
// Selection is shown by scaling/highlighting the pin rather than moving the
// camera — eased pans read as stutter against fast live updates.
// ---------------------------------------------------------------------------
import { useEffect, useRef, useState } from 'react';
import { useGoogleMapsLoader } from '@/lib/googleMaps';
import type { SosAlert } from '@/types';
import {
  FALLBACK_CENTER,
  FALLBACK_ZOOM,
  clearSosMarkers,
  frameMapOnAlerts,
  syncSosMarkers,
  validAlertPositions,
  type SosMarkerStore,
} from './sosMapMarkers';

export type SosMapViewProps = {
  /** Alerts to plot — one marker per alert, keyed by id. */
  alerts: SosAlert[];
  /** Currently selected incident id, highlighted on the map. */
  selectedId: string | null;
  /** Fired when a pin is clicked, so the panel can select it like a list row. */
  onSelectAlert: (id: string) => void;
  /**
   * Bumped by the panel whenever the map's container changes size without a
   * window resize (the panel expanding into an overlay). The Maps API only
   * follows window resize events, so this is the only way it learns.
   */
  resizeToken?: number;
  /**
   * Base tile style from the panel's layers menu. Applied with setMapTypeId,
   * which swaps the tiles and nothing else — center, zoom, and every marker are
   * untouched, so this is independent of `resizeToken`, `framedRef` and the
   * marker store.
   */
  mapType?: MapBaseType;
};

/**
 * The base maps the app exposes. A subset of google.maps.MapTypeId on purpose:
 * hybrid/terrain are not in the design, and narrowing the union keeps the menu's
 * options and the map's accepted values in lockstep.
 */
export type MapBaseType = 'roadmap' | 'satellite';

export function SosMapView({
  alerts,
  selectedId,
  onSelectAlert,
  resizeToken = 0,
  mapType = 'roadmap',
}: SosMapViewProps) {
  const { status, error } = useGoogleMapsLoader();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<SosMarkerStore | null>(null);
  /** The live instance — a ref, so creation stays idempotent across effect re-runs. */
  const instanceRef = useRef<google.maps.Map | null>(null);
  /** True once the viewport has been framed around real alerts — frame once only. */
  const framedRef = useRef(false);
  /** Last resize request handled — a newer token means the container just resized. */
  const resizeTokenRef = useRef(resizeToken);

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  // Pins get one click listener at creation time, so keep the latest callback in
  // a ref instead of re-creating every marker when the parent re-renders.
  const onSelectRef = useRef(onSelectAlert);
  useEffect(() => {
    onSelectRef.current = onSelectAlert;
  }, [onSelectAlert]);

  // Build the map once the API is ready and the host node exists.
  useEffect(() => {
    if (status !== 'ready' || instanceRef.current || initError) return;
    const container = containerRef.current;
    if (!container) return;

    try {
      const instance = new google.maps.Map(container, {
        center: FALLBACK_CENTER,
        zoom: FALLBACK_ZOOM,
        // The panel header already owns layers/refresh/expand and POI popups
        // would fight with pin clicks, so keep only the zoom control.
        disableDefaultUI: true,
        zoomControl: true,
        clickableIcons: false,
      });
      instanceRef.current = instance;
      setMap(instance);
    } catch (err) {
      // e.g. a rejected key — fall back to the "unavailable" layer, never crash.
      setInitError(err instanceof Error ? err.message : 'Google Maps failed to initialise.');
    }
  }, [status, initError]);

  // Base map only. setMapTypeId swaps the tile layer and leaves center, zoom and
  // every marker standing, so this deliberately does not touch framedRef, the
  // camera effects or the marker store — a map-type switch is not a re-frame and
  // not a data change. Running on every `mapType`/`map` change is idempotent, and
  // it also covers a selection made before the instance existed (the parent keeps
  // the choice in state, so the effect simply re-applies it once `map` lands).
  useEffect(() => {
    if (!map) return;
    map.setMapTypeId(mapType);
  }, [map, mapType]);

  // Keep the pins in step with the alert feed and the current selection.
  useEffect(() => {
    if (!map) return;
    const store = markersRef.current ?? new Map<string, google.maps.Marker>();
    markersRef.current = store;

    syncSosMarkers({
      map,
      store,
      alerts,
      selectedId,
      onSelectAlert: (id) => onSelectRef.current(id),
    });
  }, [map, alerts, selectedId]);

  // Frame the viewport once, as soon as there is something to frame.
  useEffect(() => {
    if (!map || framedRef.current) return;
    framedRef.current = frameMapOnAlerts(map, validAlertPositions(alerts));
  }, [map, alerts]);

  // Container-only resize (the panel expanding): re-framing IS correct here — this
  // is a genuine size change, not a data refresh. framedRef is deliberately left
  // latched, so a later alert refresh still never moves the camera.
  useEffect(() => {
    if (!map || resizeTokenRef.current === resizeToken) return;
    resizeTokenRef.current = resizeToken;

    // rAF: let the browser settle the new layout before the map measures it.
    const frame = window.requestAnimationFrame(() => {
      google.maps.event.trigger(map, 'resize');
      const positions = validAlertPositions(alerts);
      if (positions.length > 0) frameMapOnAlerts(map, positions);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [map, resizeToken, alerts]);

  // An unusable API (a rejected key flips the loader to 'unavailable') or a failed
  // init releases the instance; the fallback layer takes over instead.
  useEffect(() => {
    if (status === 'ready' && !initError) return;
    clearSosMarkers(markersRef.current);
    markersRef.current = null;
    instanceRef.current = null;
    framedRef.current = false;
    setMap(null);
  }, [status, initError]);

  // Unmount: release the pins (the map instance goes with its DOM node).
  useEffect(
    () => () => {
      clearSosMarkers(markersRef.current);
      markersRef.current = null;
    },
    [],
  );

  const unavailableMessage =
    initError ?? (status === 'unavailable' ? error ?? 'Google Maps is unavailable.' : null);

  return (
    <div className="relative h-full w-full">
      {/* The host node stays mounted so the instance never loses its DOM node. */}
      <div ref={containerRef} className="h-full w-full" />

      {status === 'loading' && !initError && <MapLoadingLayer />}
      {unavailableMessage && <MapUnavailableLayer message={unavailableMessage} />}
    </div>
  );
}

/** Spinner shown while the Maps script is still downloading. */
function MapLoadingLayer() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface-hover">
      <span
        className="h-6 w-6 animate-spin rounded-full border-2 border-line-hover border-t-brand-accent"
        aria-hidden="true"
      />
      <p className="text-[11px] font-medium text-ink-tertiary">Loading map…</p>
    </div>
  );
}

/** Graceful fallback: the panel must never crash when Maps can't load. */
function MapUnavailableLayer({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-surface-hover px-6 text-center">
      <p className="text-xs font-semibold text-ink-primary">Map unavailable</p>
      <p className="max-w-xs text-[11px] leading-4 text-ink-tertiary">{message}</p>
    </div>
  );
}