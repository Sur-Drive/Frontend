import { useMemo, type ReactNode } from "react";
import LazyGoogleMap from "../../components/map/LazyGoogleMap";
import type { MapMarkerSpec } from "../../components/map/GoogleMapView";
import {
  userLocationPinHtml,
  USER_LOCATION_ANCHOR,
} from "../../components/map/mapMarkerIcons";
import { useCurrentLocation } from "../../hooks/useCurrentLocation";
import { useDriverLiveLocation } from "../hooks/useDriverLiveLocation";

/**
 * Real Google Map for the driver screens — same map, zoom and blue
 * "you are here" dot as the normal (passenger) home page. Overlays such
 * as the TopBar are passed as children and sit on top of the map.
 */
export default function RiderMap({
  children,
  zoom = 15,
}: {
  children?: ReactNode;
  zoom?: number;
}) {
  const { coords: firstFix, error } = useCurrentLocation();
  const live = useDriverLiveLocation();
  const coords = live ?? firstFix;

  const markers = useMemo<MapMarkerSpec[]>(
    () =>
      coords
        ? [
            {
              id: "__driver_location__",
              lat: coords.latitude,
              lng: coords.longitude,
              html: userLocationPinHtml,
              anchor: USER_LOCATION_ANCHOR,
            },
          ]
        : [],
    [coords],
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-gray-100">
      {coords ? (
        <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
          <LazyGoogleMap
            center={{ lat: coords.latitude, lng: coords.longitude }}
            zoom={zoom}
            markers={markers}
          />
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-10 h-10 mb-3 border-4 border-red-500 rounded-full border-t-transparent animate-spin" />
          <p className="text-sm font-medium text-gray-600">
            Getting your location...
          </p>
        </div>
      )}

      {error && coords && (
        <div className="absolute left-1/2 top-[calc(env(safe-area-inset-top,0px)+72px)] z-10 -translate-x-1/2 rounded-xl bg-white px-3 py-2 text-xs font-medium text-gray-600 shadow-md">
          {error}
        </div>
      )}

      {/* Overlays (TopBar, Go Offline pill) must sit above the map. */}
      <div className="pointer-events-none absolute inset-0 z-20 [&>*]:pointer-events-auto">
        {children}
      </div>
    </div>
  );
}
