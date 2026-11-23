import { useEffect, useRef, useState } from "react";
import { getRideSocket } from "../../lib/rideSocket";

export interface DriverCarPosition {
  lat: number;
  lng: number;
  heading: number;
}

interface DriverLocationEvent {
  rideId?: string;
  id?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  heading?: number;
  bearing?: number;
  location?: {
    lat?: number;
    lng?: number;
    latitude?: number;
    longitude?: number;
    heading?: number;
    bearing?: number;
  };
}

function parseLocation(
  payload: DriverLocationEvent,
): DriverCarPosition | null {
  const location = payload.location ?? payload;

  const lat = location.lat ?? location.latitude;
  const lng = location.lng ?? location.longitude;
  const heading = location.heading ?? location.bearing;

  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  ) {
    return null;
  }

  return {
    lat,
    lng,
    heading:
      typeof heading === "number" &&
      Number.isFinite(heading)
        ? ((heading % 360) + 360) % 360
        : NaN,
  };
}

function calculateBearing(
  from: DriverCarPosition,
  to: DriverCarPosition,
): number {
  const rad = Math.PI / 180;

  const lat1 = from.lat * rad;
  const lat2 = to.lat * rad;
  const deltaLng = (to.lng - from.lng) * rad;

  const y = Math.sin(deltaLng) * Math.cos(lat2);

  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) *
      Math.cos(lat2) *
      Math.cos(deltaLng);

  return (Math.atan2(y, x) / rad + 360) % 360;
}

function distanceMeters(
  from: DriverCarPosition,
  to: DriverCarPosition,
): number {
  const rad = Math.PI / 180;

  const dLat = (to.lat - from.lat) * rad;
  const dLng = (to.lng - from.lng) * rad;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(from.lat * rad) *
      Math.cos(to.lat * rad) *
      Math.sin(dLng / 2) ** 2;

  return (
    6371000 *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(Math.max(0, 1 - a)),
    )
  );
}

export function useLiveDriverCar(
  rideId: string | null | undefined,
  token: string | null,
) {
  const [driverCar, setDriverCar] =
    useState<DriverCarPosition | null>(null);

  const currentRef =
    useRef<DriverCarPosition | null>(null);

  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    currentRef.current = null;
    setDriverCar(null);

    if (!rideId || !token) {
      console.warn("[GPS] Missing ride ID or token");
      return;
    }

    const socket = getRideSocket(token);
    let active = true;

    const stopAnimation = () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };

    const handleLocation = (payload: DriverLocationEvent) => {
      if (!active) return;

      // Log before filtering to identify unexpected payloads.
      console.log("[GPS] Raw location event:", payload);

      const eventRideId = payload?.rideId ?? payload?.id;

      if (eventRideId !== rideId) {
        console.warn("[GPS] Ride ID mismatch", {
          expected: rideId,
          received: eventRideId,
        });
        return;
      }

      const incoming = parseLocation(payload);

      if (!incoming) {
        console.warn("[GPS] Invalid coordinates:", payload);
        return;
      }

      const previous = currentRef.current;

      console.log("[GPS] Valid driver position:", incoming);

      stopAnimation();

      if (!previous) {
        const initial = {
          ...incoming,
          heading: Number.isFinite(incoming.heading)
            ? incoming.heading
            : 0,
        };

        currentRef.current = initial;
        setDriverCar(initial);
        return;
      }

      const distance = distanceMeters(previous, incoming);

      const targetHeading = Number.isFinite(incoming.heading)
        ? incoming.heading
        : distance > 2
          ? calculateBearing(previous, incoming)
          : previous.heading;

      const target: DriverCarPosition = {
        ...incoming,
        heading: targetHeading,
      };

      if (distance > 250) {
  console.warn(
    "[GPS] Implausible location jump ignored:",
    {
      distanceMeters: Math.round(distance),
      previous,
      incoming,
    },
  );

  return;
}

      // Smooth each real GPS update over 1.2 seconds.
      const duration = 1200;
      const startTime = performance.now();

      const headingDifference =
        ((target.heading - previous.heading + 540) % 360) -
        180;

      const animate = (now: number) => {
        if (!active) return;

        const progress = Math.min(
          (now - startTime) / duration,
          1,
        );

        const eased =
          progress * progress * (3 - 2 * progress);

        const next: DriverCarPosition = {
          lat:
            previous.lat +
            (target.lat - previous.lat) * eased,
          lng:
            previous.lng +
            (target.lng - previous.lng) * eased,
          heading:
            (previous.heading +
              headingDifference * eased +
              360) %
            360,
        };

        currentRef.current = next;
        setDriverCar(next);

        if (progress < 1) {
          animationRef.current =
            requestAnimationFrame(animate);
        } else {
          currentRef.current = target;
          setDriverCar(target);
          animationRef.current = null;
        }
      };

      animationRef.current =
        requestAnimationFrame(animate);
    };

    socket.on("driver.location_updated", handleLocation);

    console.log("[GPS] Listener registered", {
      rideId,
      socketConnected: socket.connected,
    });

    return () => {
      active = false;
      stopAnimation();

      socket.off("driver.location_updated", handleLocation);
    };
  }, [rideId, token]);

  return driverCar;
}

// import { useEffect, useRef, useState } from "react";
// import { getRideSocket } from "../../lib/rideSocket";

// export interface DriverCarPosition {
//   lat: number;
//   lng: number;
//   heading: number;
// }

// interface DriverLocationEvent {
//   rideId?: string;
//   id?: string;
//   lat?: number;
//   lng?: number;
//   latitude?: number;
//   longitude?: number;
//   heading?: number;
//   bearing?: number;
//   location?: {
//     lat?: number;
//     lng?: number;
//     latitude?: number;
//     longitude?: number;
//     heading?: number;
//     bearing?: number;
//   };
// }

// function parseLocation(
//   payload: DriverLocationEvent,
// ): DriverCarPosition | null {
//   const lat =
//     payload.location?.lat ??
//     payload.location?.latitude ??
//     payload.lat ??
//     payload.latitude;

//   const lng =
//     payload.location?.lng ??
//     payload.location?.longitude ??
//     payload.lng ??
//     payload.longitude;

//   if (
//     typeof lat !== "number" ||
//     typeof lng !== "number" ||
//     !Number.isFinite(lat) ||
//     !Number.isFinite(lng) ||
//     lat < -90 ||
//     lat > 90 ||
//     lng < -180 ||
//     lng > 180
//   ) {
//     return null;
//   }

//   const heading =
//     payload.location?.heading ??
//     payload.location?.bearing ??
//     payload.heading ??
//     payload.bearing;

//   return {
//     lat,
//     lng,
//     heading:
//       typeof heading === "number" &&
//       Number.isFinite(heading)
//         ? ((heading % 360) + 360) % 360
//         : NaN,
//   };
// }

// function bearingBetween(
//   from: DriverCarPosition,
//   to: DriverCarPosition,
// ) {
//   const rad = Math.PI / 180;

//   const lat1 = from.lat * rad;
//   const lat2 = to.lat * rad;
//   const deltaLng = (to.lng - from.lng) * rad;

//   const y = Math.sin(deltaLng) * Math.cos(lat2);

//   const x =
//     Math.cos(lat1) * Math.sin(lat2) -
//     Math.sin(lat1) *
//       Math.cos(lat2) *
//       Math.cos(deltaLng);

//   return (
//     (Math.atan2(y, x) / rad + 360) % 360
//   );
// }

// function distanceMeters(
//   a: DriverCarPosition,
//   b: DriverCarPosition,
// ) {
//   const rad = Math.PI / 180;
//   const deltaLat = (b.lat - a.lat) * rad;
//   const deltaLng = (b.lng - a.lng) * rad;

//   const h =
//     Math.sin(deltaLat / 2) ** 2 +
//     Math.cos(a.lat * rad) *
//       Math.cos(b.lat * rad) *
//       Math.sin(deltaLng / 2) ** 2;

//   return (
//     6371000 *
//     2 *
//     Math.atan2(
//       Math.sqrt(h),
//       Math.sqrt(Math.max(0, 1 - h)),
//     )
//   );
// }

// export function useLiveDriverCar(
//   rideId: string | null | undefined,
//   token: string | null,
// ) {
//   const [driverCar, setDriverCar] =
//     useState<DriverCarPosition | null>(null);

//   const positionRef =
//     useRef<DriverCarPosition | null>(null);

//   const animationRef = useRef<number | null>(null);

//   useEffect(() => {
//     positionRef.current = null;
//     setDriverCar(null);

//     if (!rideId || !token) return;

//     const socket = getRideSocket(token);
//     let active = true;

//     const cancelAnimation = () => {
//       if (animationRef.current !== null) {
//         cancelAnimationFrame(animationRef.current);
//         animationRef.current = null;
//       }
//     };

//     const handleLocation = (
//       payload: DriverLocationEvent,
//     ) => {
//       if (!active) return;

//       const eventRideId = payload?.rideId ?? payload?.id;

//       if (eventRideId !== rideId) return;

//       const incoming = parseLocation(payload);
//       if (!incoming) return;

//       cancelAnimation();

//       const previous = positionRef.current;

//       if (!previous) {
//         const first = {
//           ...incoming,
//           heading: Number.isFinite(incoming.heading)
//             ? incoming.heading
//             : 0,
//         };

//         positionRef.current = first;
//         setDriverCar(first);
//         return;
//       }

//       const distance = distanceMeters(previous, incoming);

//       const heading =
//         Number.isFinite(incoming.heading)
//           ? incoming.heading
//           : distance > 2
//             ? bearingBetween(previous, incoming)
//             : previous.heading;

//       const target = {
//         ...incoming,
//         heading,
//       };

//       // Avoid animating large GPS jumps or stale positions.
//       if (distance > 250) {
//         positionRef.current = target;
//         setDriverCar(target);
//         return;
//       }

//       const duration = 1200;
//       const start = performance.now();

//       const headingDelta =
//         ((target.heading - previous.heading + 540) %
//           360) -
//         180;

//       const animate = (now: number) => {
//         if (!active) return;

//         const progress = Math.min(
//           (now - start) / duration,
//           1,
//         );

//         const eased =
//           progress * progress * (3 - 2 * progress);

//         const next: DriverCarPosition = {
//           lat:
//             previous.lat +
//             (target.lat - previous.lat) * eased,
//           lng:
//             previous.lng +
//             (target.lng - previous.lng) * eased,
//           heading:
//             (previous.heading +
//               headingDelta * eased +
//               360) %
//             360,
//         };

//         positionRef.current = next;
//         setDriverCar(next);

//         if (progress < 1) {
//           animationRef.current =
//             requestAnimationFrame(animate);
//         } else {
//           animationRef.current = null;
//         }
//       };

//       animationRef.current =
//         requestAnimationFrame(animate);
//     };

//     socket.on(
//       "driver.location_updated",
//       handleLocation,
//     );

//     return () => {
//       active = false;
//       cancelAnimation();

//       socket.off(
//         "driver.location_updated",
//         handleLocation,
//       );
//     };
//   }, [rideId, token]);

//   return driverCar;
// }