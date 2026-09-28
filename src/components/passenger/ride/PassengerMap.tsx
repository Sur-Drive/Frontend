import { useMemo } from "react";

import LazyGoogleMap from "../../map/LazyGoogleMap";
import type { MapMarkerSpec } from "../../map/GoogleMapView";

import type {
  Coordinates,
  RideLocation,
} from "../../../types/passengerRide";

interface PassengerMapProps {
  center: Coordinates;

  userLocation?: Coordinates | null;

  pickup?: RideLocation | null;

  destination?: RideLocation | null;

  zoom?: number;

  interactive?: boolean;

  followMode?: boolean;

  heading?: number;

  showTraffic?: boolean;

  tilt?: number;

  puckSize?: number;

  puckMode?:
    | "driving"
    | "walking"
    | "cycling"
    | "motorcycle";

  onMapClick?: (
    lat: number,
    lng: number,
    placeId?: string,
  ) => void;
}

/* =========================================
   PASSENGER CURRENT LOCATION
========================================= */

const passengerLocationHtml = `
  <div
    style="
      position: relative;
      width: 42px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
    "
  >
    <div
      style="
        position: absolute;
        width: 42px;
        height: 42px;
        border-radius: 999px;
        background: rgba(116, 66, 173, 0.14);
      "
    ></div>

    <div
      style="
        position: absolute;
        width: 28px;
        height: 28px;
        border-radius: 999px;
        background: rgba(116, 66, 173, 0.22);
      "
    ></div>

    <div
      style="
        position: relative;
        width: 15px;
        height: 15px;
        border-radius: 999px;
        background: #7442AD;
        border: 3px solid white;
        box-shadow:
          0 3px 10px rgba(55, 30, 75, 0.25);
      "
    ></div>
  </div>
`;

/* =========================================
   PICKUP MARKER
========================================= */

const pickupMarkerHtml = `
  <div
    style="
      position: relative;
      width: 46px;
      height: 54px;
      display: flex;
      align-items: flex-start;
      justify-content: center;
    "
  >
    <div
      style="
        width: 38px;
        height: 38px;
        border-radius: 50% 50% 50% 8px;
        background: #7442AD;
        border: 4px solid white;
        box-shadow:
          0 7px 18px rgba(72, 39, 95, 0.28);
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
      "
    >
      <div
        style="
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: white;
        "
      ></div>
    </div>
  </div>
`;

/* =========================================
   DESTINATION MARKER
========================================= */

const destinationMarkerHtml = `
  <div
    style="
      position: relative;
      width: 46px;
      height: 54px;
      display: flex;
      align-items: flex-start;
      justify-content: center;
    "
  >
    <div
      style="
        width: 38px;
        height: 38px;
        border-radius: 50% 50% 50% 8px;
        background: #25212A;
        border: 4px solid white;
        box-shadow:
          0 7px 18px rgba(25, 20, 30, 0.25);
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
      "
    >
      <div
        style="
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: white;
        "
      ></div>
    </div>
  </div>
`;

export default function PassengerMap({
  center,

  userLocation,

  pickup,

  destination,

  zoom = 15,

  interactive = true,

  followMode = false,

  heading = 0,

  showTraffic = false,

  tilt = 0,

  puckSize = 38,

  puckMode = "driving",

  onMapClick,
}: PassengerMapProps) {
  const markers = useMemo<MapMarkerSpec[]>(() => {
    const items: MapMarkerSpec[] = [];

    /* -----------------------------------------
       CURRENT PASSENGER LOCATION
    ----------------------------------------- */

    if (userLocation && !followMode) {
      items.push({
        id: "passenger-current-location",

        lat: userLocation.lat,
        lng: userLocation.lng,

        html: passengerLocationHtml,

        anchor: [21, 21],
      });
    }

    /* -----------------------------------------
       PICKUP
    ----------------------------------------- */

    if (
      pickup?.coordinates &&
      !followMode
    ) {
      items.push({
        id: "ride-pickup",

        lat: pickup.coordinates.lat,
        lng: pickup.coordinates.lng,

        html: pickupMarkerHtml,

        anchor: [23, 46],
      });
    }

    /* -----------------------------------------
       DESTINATION
    ----------------------------------------- */

    if (destination?.coordinates) {
      items.push({
        id: "ride-destination",

        lat:
          destination.coordinates.lat,

        lng:
          destination.coordinates.lng,

        html:
          destinationMarkerHtml,

        anchor: [23, 46],
      });
    }

    return items;
  }, [
    userLocation,
    pickup,
    destination,
    followMode,
  ]);

  return (
    <div className="absolute inset-0 h-full w-full">
      <LazyGoogleMap
        center={center}
        zoom={zoom}
        markers={markers}
        onMapClick={onMapClick}
        interactive={interactive}
        followMode={followMode}
        heading={heading}
        showTraffic={showTraffic}
        tilt={tilt}
        puckSize={puckSize}
        puckMode={puckMode}
      />
    </div>
  );
}