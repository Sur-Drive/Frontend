import { useEffect, useMemo, useState } from "react";
import LazyGoogleMap from "../../components/map/LazyGoogleMap";
import type { MapMarkerSpec } from "../../components/map/GoogleMapView";
import {
  destinationPinHtml,
  DESTINATION_PIN_ANCHOR,
  startPinHtml,
  START_PIN_ANCHOR,
} from "../../components/map/mapMarkerIcons";
import { loadGoogleMaps } from "../../lib/googleMaps";

type LatLng = { lat: number; lng: number };

const geoCache = new Map<string, LatLng | null>();
async function geocode(address?: string): Promise<LatLng | null> {
  if (!address || address === "—") return null;
  if (geoCache.has(address)) return geoCache.get(address)!;
  try {
    await loadGoogleMaps();
    const { Geocoder } = (await google.maps.importLibrary(
      "geocoding",
    )) as google.maps.GeocodingLibrary;
    const res = await new Geocoder().geocode({ address });
    const loc = res.results[0]?.geometry.location;
    const out = loc ? { lat: loc.lat(), lng: loc.lng() } : null;
    geoCache.set(address, out);
    return out;
  } catch (e) {
    console.warn("[map] geocode failed for", address, e);
    geoCache.set(address, null);
    return null;
  }
}

/**
 * Real Google Map for a past/finished ride: pickup pin, dropoff pin and the
 * driving route between them, framed to fit. Uses coordinates when the API
 * gave them, otherwise geocodes the addresses.
 */
export default function RideRouteMap({
  pickupAddress,
  dropoffAddress,
  pickupCoords,
  dropoffCoords,
}: {
  pickupAddress?: string;
  dropoffAddress?: string;
  pickupCoords?: LatLng;
  dropoffCoords?: LatLng;
}) {
  const [pickup, setPickup] = useState<LatLng | null>(pickupCoords ?? null);
  const [dropoff, setDropoff] = useState<LatLng | null>(dropoffCoords ?? null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [path, setPath] = useState<LatLng[]>([]);

  useEffect(() => {
    if (pickupCoords) return setPickup(pickupCoords);
    let alive = true;
    geocode(pickupAddress).then((c) => alive && setPickup(c));
    return () => {
      alive = false;
    };
  }, [pickupAddress, pickupCoords?.lat, pickupCoords?.lng]);
  useEffect(() => {
    if (dropoffCoords) return setDropoff(dropoffCoords);
    let alive = true;
    geocode(dropoffAddress).then((c) => alive && setDropoff(c));
    return () => {
      alive = false;
    };
  }, [dropoffAddress, dropoffCoords?.lat, dropoffCoords?.lng]);

  // Route pickup -> dropoff (straight line if Directions isn't available).
  useEffect(() => {
    if (!pickup || !dropoff) return setPath([]);
    let alive = true;
    (async () => {
      try {
        await loadGoogleMaps();
        const { DirectionsService } = (await google.maps.importLibrary(
          "routes",
        )) as google.maps.RoutesLibrary;
        const res = await new DirectionsService().route({
          origin: pickup,
          destination: dropoff,
          travelMode: google.maps.TravelMode.DRIVING,
        });
        if (alive)
          setPath(
            res.routes[0].overview_path.map((p) => ({
              lat: p.lat(),
              lng: p.lng(),
            })),
          );
      } catch (e) {
        console.warn("[map] directions failed, drawing straight line", e);
        if (alive) setPath([pickup, dropoff]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [pickup?.lat, pickup?.lng, dropoff?.lat, dropoff?.lng]);

  useEffect(() => {
    if (!map || path.length < 2) return;
    const line = new google.maps.Polyline({
      path,
      strokeColor: "#6E43A3",
      strokeOpacity: 0.95,
      strokeWeight: 5,
      map,
    });
    const b = new google.maps.LatLngBounds();
    path.forEach((p) => b.extend(p));
    map.fitBounds(b, 40);
    return () => line.setMap(null);
  }, [map, path]);

  const markers = useMemo<MapMarkerSpec[]>(() => {
    const m: MapMarkerSpec[] = [];
    if (pickup)
      m.push({
        id: "pickup",
        ...pickup,
        html: startPinHtml,
        anchor: START_PIN_ANCHOR,
      });
    if (dropoff)
      m.push({
        id: "dropoff",
        ...dropoff,
        html: destinationPinHtml(),
        anchor: DESTINATION_PIN_ANCHOR,
      });
    return m;
  }, [pickup, dropoff]);

  const center = pickup ?? dropoff;

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-100">
      {center ? (
        <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
          <LazyGoogleMap
            center={center}
            zoom={14}
            markers={markers}
            onReady={setMap}
          />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm font-medium text-gray-500">Loading map…</p>
        </div>
      )}
    </div>
  );
}
