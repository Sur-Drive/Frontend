
import { useMemo } from "react";

import LazyGoogleMap from "../../map/LazyGoogleMap";
import type { MapMarkerSpec, MapRouteSpec } from "../../map/GoogleMapView";

import type {
  Coordinates,
  RideLocation,
} from "../../../types/passengerRide";
import type { TrackingPoint } from "../../../lib/passenger/rideTracking";
import type { DriverCarPosition } from "../../../hooks/passenger/useLiveDriverCar";
import { driverCarMarkerHtml } from "./DriverCarMarker";

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
  routePoints?: TrackingPoint[];
animateRoute?: boolean;
fitRoute?: boolean;

  /**
   * Use the cinematic location marker on
   * Passenger Home, while keeping the
   * standard GPS marker on ride screens.
   */
  locationMarkerVariant?: "standard" | "cinematic";
  driverCar?: DriverCarPosition | null;
  trackDriver?: boolean;
}

/* =====================================================
   STANDARD GPS MARKER
===================================================== */

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
        border-radius: 50%;
        background: rgba(116,66,173,0.14);
      "
    ></div>

    <div
      style="
        position: absolute;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: rgba(116,66,173,0.22);
      "
    ></div>

    <div
      style="
        position: relative;
        width: 15px;
        height: 15px;
        border-radius: 50%;
        background: #7442AD;
        border: 3px solid white;
        box-shadow: 0 3px 10px rgba(55,30,75,0.25);
      "
    ></div>
  </div>
`;

/* =====================================================
   CINEMATIC GPS MARKER

   The marker's HTML is anchored to the real
   coordinates supplied to GoogleMapView.

   CSS animations work inside custom HTML
   markers without needing React motion
   components inside the marker.
===================================================== */

const cinematicLocationHtml = `
  <div
    class="surdrive-location-marker"
    aria-label="Your current location"
  >
    <style>
      .surdrive-location-marker {
        position: relative;
        width: 180px;
        height: 180px;
        pointer-events: none;
        overflow: visible;
        isolation: isolate;
      }

      .surdrive-location-marker *,
      .surdrive-location-marker *::before,
      .surdrive-location-marker *::after {
        box-sizing: border-box;
      }

      /* Rotating purple spotlight */

      .surdrive-location-beam {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: conic-gradient(
          from 0deg,
          transparent 0deg,
          transparent 205deg,
          rgba(116,66,173,0.015) 235deg,
          rgba(147,83,223,0.09) 265deg,
          rgba(147,83,223,0.25) 300deg,
          rgba(147,83,223,0.10) 325deg,
          transparent 355deg
        );
        filter: blur(9px);
        transform-origin: center;
        animation: surdriveBeamRotate 8s linear infinite;
      }

      /* Wide ambient glow */

      .surdrive-location-glow {
        position: absolute;
        width: 90px;
        height: 90px;
        top: 45px;
        left: 45px;
        border-radius: 50%;
        background: radial-gradient(
          circle,
          rgba(116,66,173,0.25) 0%,
          rgba(116,66,173,0.10) 40%,
          transparent 75%
        );
        filter: blur(7px);
        animation: surdriveGlow 3.2s ease-in-out infinite;
      }

      /* Expanding pulse rings */

      .surdrive-location-pulse {
        position: absolute;
        width: 42px;
        height: 42px;
        top: 69px;
        left: 69px;
        border-radius: 50%;
        border: 1.5px solid rgba(116,66,173,0.45);
        background: rgba(116,66,173,0.08);
        animation: surdrivePulse 3s ease-out infinite;
      }

      .surdrive-location-pulse.second {
        animation-delay: 1.5s;
      }

      /* Central location pin */

      .surdrive-location-pin {
        position: absolute;
        z-index: 3;
        width: 40px;
        height: 48px;
        left: 70px;
        top: 65px;
        filter: drop-shadow(
          0 6px 10px rgba(80,36,120,0.28)
        );
        animation: surdrivePinFloat 3s ease-in-out infinite;
      }

      .surdrive-location-pin svg {
        width: 40px;
        height: 48px;
        display: block;
      }

      /* Pin shadow */

      .surdrive-location-shadow {
        position: absolute;
        z-index: 2;
        width: 24px;
        height: 7px;
        left: 78px;
        top: 111px;
        border-radius: 50%;
        background: rgba(68,35,101,0.16);
        filter: blur(4px);
        animation: surdriveShadow 3s ease-in-out infinite;
      }

      @keyframes surdriveBeamRotate {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      @keyframes surdriveGlow {
        0%, 100% {
          transform: scale(0.85);
          opacity: 0.55;
        }
        50% {
          transform: scale(1.25);
          opacity: 1;
        }
      }

      @keyframes surdrivePulse {
        0% {
          transform: scale(0.65);
          opacity: 0.8;
        }
        100% {
          transform: scale(3);
          opacity: 0;
        }
      }

      @keyframes surdrivePinFloat {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-5px);
        }
      }

      @keyframes surdriveShadow {
        0%, 100% {
          transform: scale(1);
          opacity: 0.65;
        }
        50% {
          transform: scale(0.75);
          opacity: 0.3;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .surdrive-location-beam,
        .surdrive-location-glow,
        .surdrive-location-pulse,
        .surdrive-location-pin,
        .surdrive-location-shadow {
          animation: none !important;
        }
      }
    </style>

    <div class="surdrive-location-beam"></div>
    <div class="surdrive-location-glow"></div>

    <div class="surdrive-location-pulse"></div>
    <div class="surdrive-location-pulse second"></div>

    <div class="surdrive-location-shadow"></div>

    <div class="surdrive-location-pin">
      <svg
        viewBox="0 0 40 48"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="
            M20 2
            C9.5 2 2 9.8 2 20
            C2 32 20 46 20 46
            C20 46 38 32 38 20
            C38 9.8 30.5 2 20 2
            Z
          "
          fill="#7442AD"
          stroke="#FFFFFF"
          stroke-width="2.5"
        />
        <circle
          cx="20"
          cy="20"
          r="7"
          fill="#FFFFFF"
        />
      </svg>
    </div>
  </div>
`;

/* =====================================================
   PICKUP MARKER
===================================================== */

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
        box-shadow: 0 7px 18px rgba(72,39,95,0.28);
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
          border-radius: 50%;
          background: white;
        "
      ></div>
    </div>
  </div>
`;

/* =====================================================
   DESTINATION MARKER
===================================================== */

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
        box-shadow: 0 7px 18px rgba(25,20,30,0.25);
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
          border-radius: 50%;
          background: white;
        "
      ></div>
    </div>
  </div>
`;

/* =====================================================
   COMPONENT
===================================================== */

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
  routePoints = [],
animateRoute = false,
fitRoute = false,
  locationMarkerVariant = "standard",
  driverCar = null,
  trackDriver = false,
}: PassengerMapProps) {
  const markers = useMemo<MapMarkerSpec[]>(() => {
    const items: MapMarkerSpec[] = [];

    /* -----------------------------------------
       PASSENGER CURRENT LOCATION
    ----------------------------------------- */

    if (userLocation && !followMode) {
      const isCinematic =
        locationMarkerVariant === "cinematic";

      items.push({
        id: "passenger-current-location",
        lat: userLocation.lat,
        lng: userLocation.lng,

        html: isCinematic
          ? cinematicLocationHtml
          : passengerLocationHtml,

        /*
         * Anchor coordinates must match the
         * marker HTML dimensions.
         *
         * Standard: 42 x 42
         * Cinematic: 180 x 180
         */
        anchor: isCinematic
          ? [90, 90]
          : [21, 21],
      });
    }

    /* -----------------------------------------
       PICKUP
    ----------------------------------------- */

    // if (pickup?.coordinates && !followMode) {
    const pickupMatchesUser =
  Boolean(
    userLocation &&
    pickup?.coordinates &&
    Math.abs(
      userLocation.lat - pickup.coordinates.lat,
    ) < 0.00001 &&
    Math.abs(
      userLocation.lng - pickup.coordinates.lng,
    ) < 0.00001,
  );

if (
  pickup?.coordinates &&
  !followMode &&
  !(
    locationMarkerVariant === "cinematic" &&
    pickupMatchesUser
  )
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
        lat: destination.coordinates.lat,
        lng: destination.coordinates.lng,
        html: destinationMarkerHtml,
        anchor: [23, 46],
      });
    }

    if (
  driverCar &&
  Number.isFinite(driverCar.lat) &&
  Number.isFinite(driverCar.lng)
) {
  items.push({
    id: "live-driver-car",
    lat: driverCar.lat,
    lng: driverCar.lng,
    heading: Number.isFinite(driverCar.heading)
      ? driverCar.heading
      : 0,
    html: driverCarMarkerHtml(),
    anchor: [32, 32],
  });
}

    return items;
  }, [
    userLocation?.lat,
    userLocation?.lng,
    pickup?.coordinates?.lat,
    pickup?.coordinates?.lng,
    destination?.coordinates?.lat,
    destination?.coordinates?.lng,
    followMode,
    locationMarkerVariant,
    driverCar?.lat,
driverCar?.lng,
driverCar?.heading,
  ]);

  const routes = useMemo<MapRouteSpec[]>(
  () =>
    routePoints.length >= 2
      ? [
          {
            id: "passenger-journey-route",
            points: routePoints,
            color: "#7442AD",
            weight: 6,
            opacity: 0.95,
          },
        ]
      : [],
  [routePoints],
);

if (driverCar) {
  markers.push({
    id: "live-driver-car",
    lat: driverCar.lat,
    lng: driverCar.lng,
    heading: driverCar.heading,
    html: driverCarMarkerHtml(),
    anchor: [32, 32],
  });
}

  return (
    <div className="absolute inset-0 h-full w-full">
      {/* <LazyGoogleMap
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
      /> */}
      <LazyGoogleMap
  center={center}
  zoom={zoom}
  markers={markers}
  routes={routes}
  animateRoute={animateRoute}
  fitRoute={fitRoute}
  onMapClick={onMapClick}
  interactive={interactive}
  followMode={followMode}
  heading={heading}
  showTraffic={showTraffic}
  tilt={tilt}
  puckSize={puckSize}
  puckMode={puckMode}
  trackPosition={
    trackDriver && driverCar
      ? {
          lat: driverCar.lat,
          lng: driverCar.lng,
        }
      : null
  }
/>
    </div>
  );
}


// import { useMemo } from "react";

// import LazyGoogleMap from "../../map/LazyGoogleMap";
// import type { MapMarkerSpec } from "../../map/GoogleMapView";

// import type {
//   Coordinates,
//   RideLocation,
// } from "../../../types/passengerRide";

// interface PassengerMapProps {
//   center: Coordinates;

//   userLocation?: Coordinates | null;

//   pickup?: RideLocation | null;

//   destination?: RideLocation | null;

//   zoom?: number;

//   interactive?: boolean;

//   followMode?: boolean;

//   heading?: number;

//   showTraffic?: boolean;

//   tilt?: number;

//   puckSize?: number;

//   puckMode?:
//     | "driving"
//     | "walking"
//     | "cycling"
//     | "motorcycle";

//   onMapClick?: (
//     lat: number,
//     lng: number,
//     placeId?: string,
//   ) => void;
// }

// /* =========================================
//    PASSENGER CURRENT LOCATION
// ========================================= */

// const passengerLocationHtml = `
//   <div
//     style="
//       position: relative;
//       width: 42px;
//       height: 42px;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//     "
//   >
//     <div
//       style="
//         position: absolute;
//         width: 42px;
//         height: 42px;
//         border-radius: 999px;
//         background: rgba(116, 66, 173, 0.14);
//       "
//     ></div>

//     <div
//       style="
//         position: absolute;
//         width: 28px;
//         height: 28px;
//         border-radius: 999px;
//         background: rgba(116, 66, 173, 0.22);
//       "
//     ></div>

//     <div
//       style="
//         position: relative;
//         width: 15px;
//         height: 15px;
//         border-radius: 999px;
//         background: #7442AD;
//         border: 3px solid white;
//         box-shadow:
//           0 3px 10px rgba(55, 30, 75, 0.25);
//       "
//     ></div>
//   </div>
// `;

// /* =========================================
//    PICKUP MARKER
// ========================================= */

// const pickupMarkerHtml = `
//   <div
//     style="
//       position: relative;
//       width: 46px;
//       height: 54px;
//       display: flex;
//       align-items: flex-start;
//       justify-content: center;
//     "
//   >
//     <div
//       style="
//         width: 38px;
//         height: 38px;
//         border-radius: 50% 50% 50% 8px;
//         background: #7442AD;
//         border: 4px solid white;
//         box-shadow:
//           0 7px 18px rgba(72, 39, 95, 0.28);
//         transform: rotate(-45deg);
//         display: flex;
//         align-items: center;
//         justify-content: center;
//       "
//     >
//       <div
//         style="
//           width: 10px;
//           height: 10px;
//           border-radius: 999px;
//           background: white;
//         "
//       ></div>
//     </div>
//   </div>
// `;

// /* =========================================
//    DESTINATION MARKER
// ========================================= */

// const destinationMarkerHtml = `
//   <div
//     style="
//       position: relative;
//       width: 46px;
//       height: 54px;
//       display: flex;
//       align-items: flex-start;
//       justify-content: center;
//     "
//   >
//     <div
//       style="
//         width: 38px;
//         height: 38px;
//         border-radius: 50% 50% 50% 8px;
//         background: #25212A;
//         border: 4px solid white;
//         box-shadow:
//           0 7px 18px rgba(25, 20, 30, 0.25);
//         transform: rotate(-45deg);
//         display: flex;
//         align-items: center;
//         justify-content: center;
//       "
//     >
//       <div
//         style="
//           width: 10px;
//           height: 10px;
//           border-radius: 999px;
//           background: white;
//         "
//       ></div>
//     </div>
//   </div>
// `;

// export default function PassengerMap({
//   center,

//   userLocation,

//   pickup,

//   destination,

//   zoom = 15,

//   interactive = true,

//   followMode = false,

//   heading = 0,

//   showTraffic = false,

//   tilt = 0,

//   puckSize = 38,

//   puckMode = "driving",

//   onMapClick,
// }: PassengerMapProps) {
//   const markers = useMemo<MapMarkerSpec[]>(() => {
//     const items: MapMarkerSpec[] = [];

//     /* -----------------------------------------
//        CURRENT PASSENGER LOCATION
//     ----------------------------------------- */

//     if (userLocation && !followMode) {
//       items.push({
//         id: "passenger-current-location",

//         lat: userLocation.lat,
//         lng: userLocation.lng,

//         html: passengerLocationHtml,

//         anchor: [21, 21],
//       });
//     }

//     /* -----------------------------------------
//        PICKUP
//     ----------------------------------------- */

//     if (
//       pickup?.coordinates &&
//       !followMode
//     ) {
//       items.push({
//         id: "ride-pickup",

//         lat: pickup.coordinates.lat,
//         lng: pickup.coordinates.lng,

//         html: pickupMarkerHtml,

//         anchor: [23, 46],
//       });
//     }

//     /* -----------------------------------------
//        DESTINATION
//     ----------------------------------------- */

//     if (destination?.coordinates) {
//       items.push({
//         id: "ride-destination",

//         lat:
//           destination.coordinates.lat,

//         lng:
//           destination.coordinates.lng,

//         html:
//           destinationMarkerHtml,

//         anchor: [23, 46],
//       });
//     }

//     return items;
//   }, [
//     userLocation,
//     pickup,
//     destination,
//     followMode,
//   ]);

//   return (
//     <div className="absolute inset-0 h-full w-full">
//       <LazyGoogleMap
//         center={center}
//         zoom={zoom}
//         markers={markers}
//         onMapClick={onMapClick}
//         interactive={interactive}
//         followMode={followMode}
//         heading={heading}
//         showTraffic={showTraffic}
//         tilt={tilt}
//         puckSize={puckSize}
//         puckMode={puckMode}
//       />
//     </div>
//   );
// }