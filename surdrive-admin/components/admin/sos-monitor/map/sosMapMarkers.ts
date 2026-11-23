// ---------------------------------------------------------------------------
// sosMapMarkers — imperative Google Maps plumbing for the SOS Monitor live map.
//
// Kept separate from SosMapView so the component only owns React lifecycle (wait
// for the script, build/destroy the instance, render the fallback), while the
// marker and camera rules live in one plain module: one marker per alert keyed by
// id, icons/z-index from ./sosMarkerIcons, and a viewport that is framed once and
// then left alone.
// ---------------------------------------------------------------------------
import type { SosAlert } from '@/types';
import { getSosMarkerIcon, sosMarkerKind, sosMarkerZIndex } from './sosMarkerIcons';

/** Lagos city centre — the fallback view when no alert has usable coordinates. */
export const FALLBACK_CENTER: google.maps.LatLngLiteral = { lat: 6.5244, lng: 3.3792 };
export const FALLBACK_ZOOM = 12;
/** fitBounds padding, so pins never sit flush against the panel edges. */
const FIT_PADDING_PX = 56;
/** Below this span (~500m) fitBounds would slam to maximum zoom — zoom manually. */
const TIGHT_SPAN_DEG = 0.005;
const TIGHT_SPAN_ZOOM = 14;

/** id → marker. Owned by the component through a ref. */
export type SosMarkerStore = Map<string, google.maps.Marker>;

/** Coordinates are backend data — ignore anything that isn't a real number. */
export function validAlertPositions(alerts: SosAlert[]): google.maps.LatLngLiteral[] {
  const positions: google.maps.LatLngLiteral[] = [];
  alerts.forEach((alert) => {
    if (Number.isFinite(alert.latitude) && Number.isFinite(alert.longitude)) {
      positions.push({ lat: alert.latitude, lng: alert.longitude });
    }
  });
  return positions;
}

/**
 * Frames the viewport around every alert. Returns false — leaving the fallback
 * centre in place — when there is nothing to frame. Callers run this once, so a
 * live update never moves the camera while an operator is panning.
 */
export function frameMapOnAlerts(
  map: google.maps.Map,
  positions: google.maps.LatLngLiteral[],
): boolean {
  if (positions.length === 0) return false;

  const lats = positions.map((position) => position.lat);
  const lngs = positions.map((position) => position.lng);
  const north = Math.max(...lats);
  const south = Math.min(...lats);
  const east = Math.max(...lngs);
  const west = Math.min(...lngs);

  if (Math.max(north - south, east - west) < TIGHT_SPAN_DEG) {
    // A single alert, or a cluster within the same few hundred metres.
    map.setCenter({ lat: (north + south) / 2, lng: (east + west) / 2 });
    map.setZoom(TIGHT_SPAN_ZOOM);
    return true;
  }

  map.fitBounds(
    new google.maps.LatLngBounds({ lat: south, lng: west }, { lat: north, lng: east }),
    FIT_PADDING_PX,
  );
  return true;
}

export type SyncSosMarkersOptions = {
  map: google.maps.Map;
  store: SosMarkerStore;
  alerts: SosAlert[];
  selectedId: string | null;
  onSelectAlert: (id: string) => void;
};

/**
 * Makes the map show exactly `alerts`: adds pins for new ids, moves/restyles the
 * existing ones (selected pins scale up and rise above the rest) and drops pins
 * whose alert left the feed. Existing markers are reused, so a live update never
 * rebuilds the ones that didn't change.
 */
export function syncSosMarkers({
  map,
  store,
  alerts,
  selectedId,
  onSelectAlert,
}: SyncSosMarkersOptions): void {
  const plotted = new Set<string>();

  alerts.forEach((alert) => {
    if (!Number.isFinite(alert.latitude) || !Number.isFinite(alert.longitude)) return;
    const position = { lat: alert.latitude, lng: alert.longitude };
    plotted.add(alert.id);

    const kind = sosMarkerKind(alert.status);
    const isSelected = alert.id === selectedId;
    const existing = store.get(alert.id);

    if (existing) {
      existing.setPosition(position);
      existing.setIcon(getSosMarkerIcon(kind, isSelected));
      existing.setZIndex(sosMarkerZIndex(kind, isSelected));
      return;
    }

    const marker = new google.maps.Marker({
      position,
      map,
      icon: getSosMarkerIcon(kind, isSelected),
      zIndex: sosMarkerZIndex(kind, isSelected),
      title: alert.message,
      cursor: 'pointer',
      // DOM-rendered pins, so zIndex ordering and icon swaps repaint reliably.
      optimized: false,
    });
    marker.addListener('click', () => onSelectAlert(alert.id));
    store.set(alert.id, marker);
  });

  store.forEach((marker, id) => {
    if (plotted.has(id)) return;
    marker.setMap(null);
    store.delete(id);
  });
}

/** Releases every pin — used when the map is torn down or the panel unmounts. */
export function clearSosMarkers(store: SosMarkerStore | null): void {
  store?.forEach((marker) => marker.setMap(null));
  store?.clear();
}