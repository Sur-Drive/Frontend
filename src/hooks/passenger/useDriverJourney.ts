
import {
  useEffect,
  useRef,
  useState,
} from "react";

import { getRideSocket } from "../../lib/rideSocket";

import {
  getDriverEta,
  isValidPoint,
  planDrivingRoute,
  type DriverEta,
  type DrivingRoute,
  type GeoPoint,
} from "../../lib/passenger/journeyApi";

export type JourneyPhase =
  | "to-pickup"
  | "arrived"
  | "in-trip";

export type LiveCar = GeoPoint & {
  heading: number;
};

interface JourneyOptions {
  rideId: string | null | undefined;
  driverId: string | null | undefined;
  token: string | null;
  destination: GeoPoint | null | undefined;
  phase: JourneyPhase;
}

interface LocationEvent {
  rideId?: string;
  id?: string;
  driverId?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  heading?: number;
  bearing?: number;
  at?: string;
  updatedAt?: string;
  location?: {
    lat?: number;
    lng?: number;
    latitude?: number;
    longitude?: number;
    heading?: number;
    bearing?: number;
    updatedAt?: string;
  };
}

type GpsFix = {
  point: LiveCar;
  timestamp: number;
};

const ROUTE_REFRESH_MS = 30_000;
const ROUTE_MOVEMENT_METERS = 100;
const MAX_SPEED_METERS_PER_SECOND = 55;
const GPS_TOLERANCE_METERS = 50;
const ANIMATION_MS = 1200;
const ETA_REFRESH_MS = 30_000;
const MAX_FIX_AGE_MS = 120_000;

function distanceMeters(
  a: GeoPoint,
  b: GeoPoint,
): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) *
      Math.cos(b.lat * rad) *
      Math.sin(dLng / 2) ** 2;

  return (
    12_742_000 *
    Math.asin(Math.min(1, Math.sqrt(h)))
  );
}

function calculateHeading(
  from: GeoPoint,
  to: GeoPoint,
): number {
  const rad = Math.PI / 180;

  const y =
    Math.sin((to.lng - from.lng) * rad) *
    Math.cos(to.lat * rad);

  const x =
    Math.cos(from.lat * rad) *
      Math.sin(to.lat * rad) -
    Math.sin(from.lat * rad) *
      Math.cos(to.lat * rad) *
      Math.cos((to.lng - from.lng) * rad);

  return (
    (Math.atan2(y, x) * 180) / Math.PI +
    360
  ) % 360;
}

function parseTimestamp(
  value?: string,
): number | null {
  if (!value) return null;

  const result = Date.parse(value);

  return Number.isFinite(result)
    ? result
    : null;
}

function parseLocation(
  event: LocationEvent,
): GpsFix | null {
  const location = event.location ?? event;

  const lat = Number(
    location.lat ?? location.latitude
  );

  const lng = Number(
    location.lng ?? location.longitude
  );

  if (!isValidPoint({ lat, lng })) {
    return null;
  }

  const timestamp = parseTimestamp(
    location.updatedAt ??
      event.updatedAt ??
      event.at
  );

  // Do not use an untimestamped socket event
  // to establish authoritative GPS position.
  if (timestamp === null) {
    return null;
  }

  const rawHeading =
    location.heading ??
    location.bearing ??
    event.heading ??
    event.bearing;

  const heading = Number(rawHeading);

  return {
    point: {
      lat,
      lng,
      heading: Number.isFinite(heading)
        ? ((heading % 360) + 360) % 360
        : 0,
    },
    timestamp,
  };
}

export function useDriverJourney({
  rideId,
  driverId,
  token,
  destination,
  phase,
}: JourneyOptions) {
  const [car, setCar] =
    useState<LiveCar | null>(null);

  const [route, setRoute] =
    useState<DrivingRoute | null>(null);

  const [eta, setEta] =
    useState<DriverEta | null>(null);

  const [lastGpsAt, setLastGpsAt] =
    useState<number | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [routeOrigin, setRouteOrigin] =
    useState<GeoPoint | null>(null);

  const [gpsReady, setGpsReady] =
    useState(false);

  const [trackingStatus, setTrackingStatus] =
    useState<
      "waiting" | "live" | "stale" | "conflict"
    >("waiting");

  const latestFixRef = useRef<GpsFix | null>(
    null
  );

  const displayedRef =
    useRef<LiveCar | null>(null);

  const lastRouteRef =
    useRef<GeoPoint | null>(null);

  const lastRouteTimeRef = useRef(0);

  const animationRef =
    useRef<number | null>(null);

  const destinationLat = destination?.lat;
  const destinationLng = destination?.lng;

  // A unique tracking session is created for
  // each ride, driver and journey phase.
  const sessionKey = [
    rideId ?? "",
    driverId ?? "",
    phase,
    destinationLat ?? "",
    destinationLng ?? "",
  ].join(":");

  useEffect(() => {
    let disposed = false;

    const socket =
      rideId && driverId && token
        ? getRideSocket(token)
        : null;

    let etaController: AbortController | null =
      null;

    let routeController: AbortController | null =
      null;

    let latestFix: GpsFix | null = null;
    let displayed: LiveCar | null = null;
    let lastRouteOrigin: GeoPoint | null = null;
    let lastRouteTime = 0;
    let animationFrame: number | null = null;
    let hasInitialEta = false;
    let activeRoute: DrivingRoute | null = null;

    latestFixRef.current = null;
    displayedRef.current = null;
    lastRouteRef.current = null;
    lastRouteTimeRef.current = 0;
    animationRef.current = null;

    setCar(null);
    setRoute(null);
    setEta(null);
    setLastGpsAt(null);
    setRouteOrigin(null);
    setGpsReady(false);
    setTrackingStatus("waiting");
    setError(null);

    const destinationPoint =
      destinationLat != null &&
      destinationLng != null
        ? {
            lat: destinationLat,
            lng: destinationLng,
          }
        : null;

    if (
      !rideId ||
      !driverId ||
      !token ||
      !destinationPoint ||
      !isValidPoint(destinationPoint)
    ) {
      return;
    }

    const stopAnimation = () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
        animationRef.current = null;
      }
    };

    const animateCar = (target: LiveCar) => {
      stopAnimation();

      const from = displayed;

      if (!from) {
        displayed = target;
        displayedRef.current = target;
        setCar(target);
        return;
      }

      const startedAt = performance.now();

      const draw = (now: number) => {
        if (disposed) return;

        const t = Math.min(
          1,
          (now - startedAt) / ANIMATION_MS
        );

        const eased = t * t * (3 - 2 * t);

        const headingDelta =
          ((target.heading - from.heading + 540) %
            360) -
          180;

        const next: LiveCar = {
          lat:
            from.lat +
            (target.lat - from.lat) * eased,
          lng:
            from.lng +
            (target.lng - from.lng) * eased,
          heading:
            (from.heading +
              headingDelta * eased +
              360) %
            360,
        };

        displayed = next;
        displayedRef.current = next;
        setCar(next);

        if (t < 1) {
          animationFrame =
            requestAnimationFrame(draw);
          animationRef.current =
            animationFrame;
        } else {
          animationFrame = null;
          animationRef.current = null;
        }
      };

      animationFrame =
        requestAnimationFrame(draw);
      animationRef.current = animationFrame;
    };

    const requestRoute = async (
      origin: GeoPoint,
    ) => {
      if (disposed || phase === "arrived") {
        return;
      }

      routeController?.abort();
      const controller = new AbortController();
      routeController = controller;

      try {
        const result = await planDrivingRoute(
          origin,
          destinationPoint,
          token,
          controller.signal
        );

        if (
          disposed ||
          controller.signal.aborted
        ) {
          return;
        }

        activeRoute = result;
        setRoute(result);
        setError(null);
      } catch (cause) {
        if (
          disposed ||
          controller.signal.aborted
        ) {
          return;
        }

        // Keep the last valid route if
        // a subsequent replan fails.
        if (!activeRoute) {
          setRoute(null);
        }

        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to plan route"
        );
      }
    };

    const maybeReplan = (
      point: GeoPoint,
      force = false,
    ) => {
      if (phase === "arrived") return;

      const now = Date.now();

      const movedEnough =
        !lastRouteOrigin ||
        distanceMeters(
          lastRouteOrigin,
          point
        ) >= ROUTE_MOVEMENT_METERS;

      const refreshDue =
        now - lastRouteTime >=
        ROUTE_REFRESH_MS;

      if (
        !force &&
        lastRouteOrigin &&
        !(movedEnough && refreshDue)
      ) {
        return;
      }

      lastRouteOrigin = {
        lat: point.lat,
        lng: point.lng,
      };

      lastRouteTime = now;

      lastRouteRef.current =
        lastRouteOrigin;

      lastRouteTimeRef.current =
        lastRouteTime;

      setRouteOrigin(lastRouteOrigin);

      void requestRoute(lastRouteOrigin);
    };

    const acceptFix = (
      fix: GpsFix,
      source: "eta" | "socket",
    ) => {
      if (disposed) return;

      const now = Date.now();

      if (
        fix.timestamp > now + 30_000 ||
        now - fix.timestamp > MAX_FIX_AGE_MS
      ) {
        console.warn(
          "[SurDrive] Stale/future GPS rejected",
          source,
          fix
        );
        return;
      }

      const previous = latestFix;

      if (previous) {
        if (
          fix.timestamp <= previous.timestamp
        ) {
          return;
        }

        const distance = distanceMeters(
          previous.point,
          fix.point
        );

        const seconds = Math.max(
          1,
          (fix.timestamp -
            previous.timestamp) /
            1000
        );

        const maximumDistance =
          MAX_SPEED_METERS_PER_SECOND *
            seconds +
          GPS_TOLERANCE_METERS;

        if (distance > maximumDistance) {
          console.warn(
            "[SurDrive] GPS conflict rejected",
            {
              source,
              previous: previous.point,
              incoming: fix.point,
              distance,
            }
          );

          setTrackingStatus("conflict");
          return;
        }
      }

      const heading =
        previous &&
        distanceMeters(
          previous.point,
          fix.point
        ) >= 1
          ? calculateHeading(
              previous.point,
              fix.point
            )
          : fix.point.heading;

      const accepted: GpsFix = {
        timestamp: fix.timestamp,
        point: {
          ...fix.point,
          heading,
        },
      };

      latestFix = accepted;
      latestFixRef.current = accepted;

      setLastGpsAt(fix.timestamp);
      setGpsReady(true);
      setTrackingStatus("live");

      animateCar(accepted.point);
      maybeReplan(
        accepted.point,
        !lastRouteOrigin
      );
    };

    const onLocation = (
      payload: LocationEvent,
    ) => {
      if (!hasInitialEta) {
        return;
      }

      const eventRideId =
        payload.rideId ?? payload.id;

      if (eventRideId !== rideId) {
        return;
      }

      if (
        payload.driverId &&
        payload.driverId !== driverId
      ) {
        return;
      }

      const fix = parseLocation(payload);

      if (!fix) return;

      acceptFix(fix, "socket");
    };

    const refreshEta = async () => {
      etaController?.abort();

      const controller = new AbortController();
      etaController = controller;

      try {
        const result = await getDriverEta(
          driverId,
          destinationPoint,
          token,
          controller.signal
        );

        if (
          disposed ||
          controller.signal.aborted
        ) {
          return;
        }

        setEta(result);

        const timestamp = parseTimestamp(
          result.driverLocation.updatedAt
        );

        if (timestamp !== null) {
          acceptFix(
            {
              timestamp,
              point: {
                lat: result.driverLocation.lat,
                lng: result.driverLocation.lng,
                heading:
                  latestFix?.point.heading ?? 0,
              },
            },
            "eta"
          );
        }

        hasInitialEta = true;
      } catch (cause) {
        if (
          disposed ||
          controller.signal.aborted
        ) {
          return;
        }

        // Do not start from an arbitrary
        // socket position if initial ETA
        // location validation failed.
        setError(
          cause instanceof Error
            ? cause.message
            : "Unable to get driver location"
        );
      }
    };

    if (socket) {
      socket.on(
        "driver.location_updated",
        onLocation
      );
    }

    void refreshEta();

    const etaInterval = window.setInterval(
      () => void refreshEta(),
      ETA_REFRESH_MS
    );

    const freshnessInterval =
      window.setInterval(() => {
        if (!latestFix) return;

        if (
          Date.now() -
            latestFix.timestamp >
          MAX_FIX_AGE_MS
        ) {
          setTrackingStatus("stale");
        }
      }, 10_000);

    return () => {
      disposed = true;

      etaController?.abort();
      routeController?.abort();

      window.clearInterval(etaInterval);
      window.clearInterval(
        freshnessInterval
      );

      socket?.off(
        "driver.location_updated",
        onLocation
      );

      stopAnimation();
    };
  }, [sessionKey, token]);

  const etaMinutes =
    phase === "arrived"
      ? 0
      : route?.durationMin ??
        eta?.durationInTrafficMin ??
        eta?.durationMin ??
        null;

  const distanceKm =
    phase === "arrived"
      ? 0
      : route?.distanceKm ??
        eta?.distanceKm ??
        null;

  return {
    car,
    route,
    eta,
    etaMinutes,
    distanceKm,
    lastGpsAt,
    routeOrigin,
    gpsReady,
    trackingStatus,
    error,
    phase,
  };
}
