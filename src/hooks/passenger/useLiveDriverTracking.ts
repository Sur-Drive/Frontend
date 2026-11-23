
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { getRideSocket } from "../../lib/rideSocket";

import { getPlannedRoute } from "../../api/passenger/routeTracking";

import {
  bearingBetween,
  distanceMeters,
  parseGps,
  routeProgress,
  validPoint,
  type TrackingPoint,
  type TrackingRoute,
} from "../../lib/passenger/rideTracking";

type EtaSnapshot = {
  driverLocation: TrackingPoint | null;
  minutes: number | null;
  distanceKm: number | null;
};

type Options = {
  rideId: string | null | undefined;
  token: string | null;
  target: TrackingPoint | null;
  enabled?: boolean;

  // Supply your existing Get ETA API method here.
  fetchEta?: () => Promise<EtaSnapshot | null>;
};

const ROUTE_REFRESH_MS = 15000;
const ETA_REFRESH_MS = 10000;
const GPS_STALE_MS = 20000;

type SocketLocationPayload = {
  rideId?: string;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  location?: unknown;
  heading?: number;
  timestamp?: number | string;
  updatedAt?: number | string;
};

function parseTimestamp(
  value: unknown,
): number | null {
  if (typeof value === "number") {
    const milliseconds =
      value < 1e12 ? value * 1000 : value;

    return Number.isFinite(milliseconds)
      ? milliseconds
      : null;
  }

  if (typeof value === "string") {
    const parsed = Date.parse(value);

    return Number.isFinite(parsed)
      ? parsed
      : null;
  }

  return null;
}

export function useLiveDriverTracking({
  rideId,
  token,
  target,
  enabled = true,
  fetchEta,
}: Options) {
  const [driverLocation, setDriverLocation] =
    useState<TrackingPoint | null>(null);

  const [heading, setHeading] = useState(0);

  const [route, setRoute] =
    useState<TrackingRoute | null>(null);

  const [etaMinutes, setEtaMinutes] =
    useState<number | null>(null);

  const [distanceKm, setDistanceKm] =
    useState<number | null>(null);

  const [lastGpsAt, setLastGpsAt] =
    useState<number | null>(null);

  const [now, setNow] = useState(Date.now());

  const [routeLoading, setRouteLoading] =
    useState(false);

  const [routeError, setRouteError] =
    useState(false);

  const latestPositionRef =
    useRef<TrackingPoint | null>(null);

  const lastGpsAtRef = useRef<number | null>(null);
  const lastRoutePositionRef =
    useRef<TrackingPoint | null>(null);

  const lastRouteAtRef = useRef(0);
  const latestRequestRef = useRef(0);
  const etaRequestRef = useRef(0);

  const fetchEtaRef = useRef(fetchEta);

  useEffect(() => {
    fetchEtaRef.current = fetchEta;
  }, [fetchEta]);

  const acceptPosition = useCallback(
    (
      position: TrackingPoint,
      timestamp = Date.now(),
      suppliedHeading?: number,
    ) => {
      if (!validPoint(position)) return;

      if (
        lastGpsAtRef.current !== null &&
        timestamp < lastGpsAtRef.current
      ) {
        return;
      }

      const previous = latestPositionRef.current;

      if (
        previous &&
        distanceMeters(previous, position) > 2
      ) {
        setHeading(
          typeof suppliedHeading === "number" &&
          Number.isFinite(suppliedHeading)
            ? suppliedHeading
            : bearingBetween(previous, position),
        );
      } else if (
        typeof suppliedHeading === "number" &&
        Number.isFinite(suppliedHeading)
      ) {
        setHeading(suppliedHeading);
      }

      latestPositionRef.current = position;
      lastGpsAtRef.current = timestamp;

      setDriverLocation(position);
      setLastGpsAt(timestamp);
    },
    [],
  );

  // Reset tracking when a different ride starts.
  useEffect(() => {
    latestPositionRef.current = null;
    lastGpsAtRef.current = null;
    lastRoutePositionRef.current = null;
    lastRouteAtRef.current = 0;

    setDriverLocation(null);
    setRoute(null);
    setEtaMinutes(null);
    setDistanceKm(null);
    setLastGpsAt(null);
    setHeading(0);
  }, [rideId]);

  // Receive live GPS through the existing ride socket.
  useEffect(() => {
    if (!enabled || !rideId || !token) {
      return;
    }

    const socket = getRideSocket(token);

    const onLocation = (
      payload: SocketLocationPayload,
    ) => {
      if (
        !payload ||
        payload.rideId !== rideId
      ) {
        return;
      }

      const position = parseGps(payload);

      if (!position) return;

      const timestamp =
        parseTimestamp(
          payload.timestamp ?? payload.updatedAt,
        ) ?? Date.now();

      acceptPosition(
        position,
        timestamp,
        payload.heading,
      );
    };

    socket.on(
      "driver.location_updated",
      onLocation,
    );

    return () => {
      socket.off(
        "driver.location_updated",
        onLocation,
      );
    };
  }, [
    enabled,
    rideId,
    token,
    acceptPosition,
  ]);

  // Initial position and ETA fallback.
  useEffect(() => {
    if (!enabled || !rideId || !fetchEtaRef.current) {
      return;
    }

    let active = true;

    const refreshEta = async () => {
      const requestId = ++etaRequestRef.current;

      try {
        const result =
          await fetchEtaRef.current?.();

        if (
          !active ||
          requestId !== etaRequestRef.current ||
          !result
        ) {
          return;
        }

        if (
          result.driverLocation &&
          validPoint(result.driverLocation)
        ) {
          acceptPosition(result.driverLocation);
        }

        setEtaMinutes(
          typeof result.minutes === "number" &&
          Number.isFinite(result.minutes) &&
          result.minutes >= 0
            ? result.minutes
            : null,
        );

        setDistanceKm(
          typeof result.distanceKm === "number" &&
          Number.isFinite(result.distanceKm) &&
          result.distanceKm >= 0
            ? result.distanceKm
            : null,
        );
      } catch (error) {
        console.error(
          "LIVE DRIVER ETA ERROR:",
          error,
        );
      }
    };

    void refreshEta();

    const interval = window.setInterval(
      () => void refreshEta(),
      ETA_REFRESH_MS,
    );

    return () => {
      active = false;
      window.clearInterval(interval);
      etaRequestRef.current += 1;
    };
  }, [
    enabled,
    rideId,
    acceptPosition,
  ]);

  // Plan the road route and refresh it as the
  // driver moves. No straight-line fallback.
  useEffect(() => {
    if (
      !enabled ||
      !token ||
      !driverLocation ||
      !target ||
      !validPoint(target)
    ) {
      setRoute(null);
      return;
    }

    const controller = new AbortController();

    const movedEnough =
      !lastRoutePositionRef.current ||
      distanceMeters(
        lastRoutePositionRef.current,
        driverLocation,
      ) >= 40;

    const oldEnough =
      Date.now() - lastRouteAtRef.current >=
      ROUTE_REFRESH_MS;

    if (!movedEnough && !oldEnough && route) {
      return;
    }

    const requestId = ++latestRequestRef.current;

    const load = async () => {
      setRouteLoading(true);

      try {
        const result = await getPlannedRoute(
          driverLocation,
          target,
          token,
          controller.signal,
        );

        if (
          controller.signal.aborted ||
          requestId !== latestRequestRef.current
        ) {
          return;
        }

        setRoute(result);
        setRouteError(!result);

        lastRoutePositionRef.current =
          driverLocation;
        lastRouteAtRef.current = Date.now();
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error(
          "LIVE ROUTE ERROR:",
          error,
        );

        setRouteError(true);
      } finally {
        if (!controller.signal.aborted) {
          setRouteLoading(false);
        }
      }
    };

    void load();

    return () => {
      controller.abort();
    };
  }, [
    enabled,
    token,
    driverLocation?.lat,
    driverLocation?.lng,
    target?.lat,
    target?.lng,
  ]);

  // Update stale-location status.
  useEffect(() => {
    if (!enabled) return;

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [enabled]);

  const gpsFresh =
    lastGpsAt !== null &&
    now - lastGpsAt < GPS_STALE_MS;

  const progress =
    route && driverLocation
      ? routeProgress(
          route.points,
          driverLocation,
        )
      : null;

  return {
    driverLocation,
    heading,
    route,
    etaMinutes,
    distanceKm,
    lastGpsAt,
    gpsFresh,
    progress,
    routeLoading,
    routeError,
    acceptPosition,
  };
}
