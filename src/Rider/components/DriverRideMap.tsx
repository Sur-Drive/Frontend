import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import LazyGoogleMap from "../../components/map/LazyGoogleMap";
import type { MapMarkerSpec } from "../../components/map/GoogleMapView";
import {
  destinationPinHtml,
  DESTINATION_PIN_ANCHOR,
  startPinHtml,
  START_PIN_ANCHOR,
  userLocationPinHtml,
  USER_LOCATION_ANCHOR,
} from "../../components/map/mapMarkerIcons";
import { useCurrentLocation } from "../../hooks/useCurrentLocation";
import { loadGoogleMaps } from "../../lib/googleMaps";
import { useDriverLiveLocation } from "../hooks/useDriverLiveLocation";

type LatLng = { lat: number; lng: number };

/** Address -> coordinates with Google's own geocoder (cached per address). */
const geoCache = new Map<string, LatLng | null>();
async function geocode(address?: string): Promise<LatLng | null> {
  if (!address || address === "—") return null;
  if (geoCache.has(address)) return geoCache.get(address)!;
  try {
    await loadGoogleMaps();
    const { Geocoder } = (await google.maps.importLibrary("geocoding")) as google.maps.GeocodingLibrary;
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
 * Real Google Map for /driver/ride: driver's live position, pickup + dropoff
 * pins, and the driving route to wherever the driver is heading next
 * (pickup before the ride starts, dropoff after).
 */
export default function DriverRideMap({
  pickupAddress,
  dropoffAddress,
  pickupCoords,
  dropoffCoords,
  heading,
  children,
}: {
  pickupAddress?: string;
  dropoffAddress?: string;
  pickupCoords?: LatLng;
  dropoffCoords?: LatLng;
  /** which point the driver is heading to right now */
  heading: "pickup" | "dropoff";
  children?: ReactNode;
}) {
  const { coords: firstFix } = useCurrentLocation();
  const live = useDriverLiveLocation();
  const coords = live ?? firstFix; // moves as the driver drives
  const [pickup, setPickup] = useState<LatLng | null>(pickupCoords ?? null);
  const [dropoff, setDropoff] = useState<LatLng | null>(dropoffCoords ?? null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Use coordinates from the API when we have them, otherwise geocode the address.
  useEffect(() => {
    if (pickupCoords) return setPickup(pickupCoords);
    let live = true;
    geocode(pickupAddress).then((c) => live && setPickup(c));
    return () => { live = false; };
  }, [pickupAddress, pickupCoords?.lat, pickupCoords?.lng]);
  useEffect(() => {
    if (dropoffCoords) return setDropoff(dropoffCoords);
    let live = true;
    geocode(dropoffAddress).then((c) => live && setDropoff(c));
    return () => { live = false; };
  }, [dropoffAddress, dropoffCoords?.lat, dropoffCoords?.lng]);

  const me: LatLng | null = coords ? { lat: coords.latitude, lng: coords.longitude } : null;
  const target = heading === "pickup" ? pickup : dropoff;

  // Map starts centred on the driver; after that the camera is driven by fitBounds below.
  const initialCenter = useRef<LatLng | null>(null);
  if (!initialCenter.current) initialCenter.current = me ?? pickup ?? null;

  const markers = useMemo<MapMarkerSpec[]>(() => {
    const m: MapMarkerSpec[] = [];
    if (me) m.push({ id: "me", ...me, html: userLocationPinHtml, anchor: USER_LOCATION_ANCHOR });
    if (pickup) m.push({ id: "pickup", ...pickup, html: startPinHtml, anchor: START_PIN_ANCHOR });
    if (dropoff)
      m.push({ id: "dropoff", ...dropoff, html: destinationPinHtml(), anchor: DESTINATION_PIN_ANCHOR });
    return m;
  }, [me?.lat, me?.lng, pickup, dropoff]);

  // Route driver -> target, drawn as a purple line; falls back to a straight
  // line if the Directions API isn't enabled for the key.
  const [path, setPath] = useState<LatLng[]>([]);
  const lastRouteKey = useRef("");
  useEffect(() => {
    if (!me || !target) return setPath([]);
    // Re-route only when the driver moves ~100m or the target changes.
    const key = `${me.lat.toFixed(3)},${me.lng.toFixed(3)}>${target.lat},${target.lng}`;
    if (key === lastRouteKey.current) return;
    lastRouteKey.current = key;
    let live = true;
    (async () => {
      try {
        await loadGoogleMaps();
        const { DirectionsService } = (await google.maps.importLibrary("routes")) as google.maps.RoutesLibrary;
        const res = await new DirectionsService().route({
          origin: me,
          destination: target,
          travelMode: google.maps.TravelMode.DRIVING,
        });
        if (live) setPath(res.routes[0].overview_path.map((p) => ({ lat: p.lat(), lng: p.lng() })));
      } catch (e) {
        console.warn("[map] directions failed, drawing straight line", e);
        if (live) setPath([me, target]);
      }
    })();
    return () => { live = false; };
  }, [me?.lat, me?.lng, target?.lat, target?.lng]);

  useEffect(() => {
    if (!map || path.length < 2) return;
    const line = new google.maps.Polyline({
      path,
      strokeColor: "#6E43A3",
      strokeOpacity: 0.95,
      strokeWeight: 5,
      map,
    });
    return () => line.setMap(null);
  }, [map, path]);

  // Frame driver + target once per leg (pickup leg, then dropoff leg). After
  // that the camera is left alone so the driver can pan/zoom while moving.
  const fittedFor = useRef("");
  useEffect(() => {
    if (!map || path.length < 2 || !target) return;
    const key = `${heading}:${target.lat},${target.lng}`;
    if (fittedFor.current === key) return;
    fittedFor.current = key;
    const b = new google.maps.LatLngBounds();
    [...path, ...(me ? [me] : []), target].forEach((p) => b.extend(p));
    map.fitBounds(b, { top: 130, bottom: 40, left: 40, right: 40 });
  }, [map, path, heading, target?.lat, target?.lng]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-gray-100">
      {initialCenter.current ? (
        <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
          <LazyGoogleMap
            center={initialCenter.current}
            zoom={15}
            markers={markers}
            onReady={setMap}
          />
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-10 h-10 mb-3 border-4 border-red-500 rounded-full border-t-transparent animate-spin" />
          <p className="text-[13px] font-medium text-gray-600">Getting your location...</p>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 z-20 [&>*]:pointer-events-auto">{children}</div>
    </div>
  );
}
