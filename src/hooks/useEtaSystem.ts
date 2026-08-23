import { useEffect, useReducer, useRef } from "react";
import type { RouteOption } from "../types/routePlan";
import {
  describeTrafficDelta,
  formatClockTime,
  formatFreshness,
  type TrafficStatus,
} from "../lib/etaSystem";

export interface EtaSystemState {
  /** Whether there's a route to report an ETA for at all. */
  hasRoute: boolean;
  /** Minutes remaining from *now* — accounts for trip progress. */
  remainingMinutes: number;
  /** Distance remaining from *now*, in km — accounts for trip progress. */
  remainingKm: number;
  /** Live arrival clock time ("4:32 PM"), accounting for progress. Null once arrived/no route. */
  currentEtaClock: string | null;
  /** Arrival clock time for the full route duration (pre-progress) — the "Arrive by" the route was planned with. */
  plannedEtaClock: string | null;
  /** How the live, traffic-aware duration compares to the duration captured when this route (or reroute/stop change) was first planned. Null until a baseline exists. */
  traffic: TrafficStatus | null;
  /** "Updated Xs ago" — ticks every second so the ETA visibly stays live even between route refetches. */
  freshnessLabel: string;
}

interface UseEtaSystemArgs {
  route: RouteOption | undefined | null;
  /** 0..1 fraction of the route already travelled. */
  progress: number;
  isNavigating: boolean;
  hasArrived: boolean;
}

/**
 * Centralizes the ETA system: current ETA, remaining time/distance, and a
 * traffic-adjusted delta — all of which update continuously (every
 * second, and whenever `route`/`progress` change), and all of which
 * reset/recompute cleanly whenever the underlying route changes, whether
 * that's a live traffic re-plan, the driver picking an alternative route
 * (a reroute), or a stop being added/removed (which reshapes the route
 * via planRouteOptionsMulti).
 */
export function useEtaSystem({
  route,
  progress,
  isNavigating,
  hasArrived,
}: UseEtaSystemArgs): EtaSystemState {
  // Re-render once a second so freshness text / clock labels stay live
  // even when nothing upstream (GPS, traffic refetch) has changed yet.
  const [, tick] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  // A route "identity" that changes on a genuine reroute or stop change
  // (different path length / waypoint count) but NOT on a same-route
  // traffic-driven duration update — so the traffic baseline resets
  // exactly when it should, and accumulates against it otherwise.
  const routeKey = route
    ? `${route.path.length}:${route.waypoints}:${route.mode}`
    : null;

  const baselineRef = useRef<{
    key: string | null;
    durationMin: number | null;
    capturedAt: number;
  }>({
    key: null,
    durationMin: null,
    capturedAt: Date.now(),
  });
  const routeUpdatedAtRef = useRef<number>(Date.now());

  if (!route) {
    if (baselineRef.current.key !== null) {
      baselineRef.current = {
        key: null,
        durationMin: null,
        capturedAt: Date.now(),
      };
    }
  } else if (baselineRef.current.key !== routeKey) {
    baselineRef.current = {
      key: routeKey,
      durationMin: route.duration,
      capturedAt: Date.now(),
    };
    routeUpdatedAtRef.current = Date.now();
  } else if (baselineRef.current.durationMin !== route.duration) {
    // Same route, new duration — a live traffic re-plan came back.
    routeUpdatedAtRef.current = Date.now();
  }

  if (!route) {
    return {
      hasRoute: false,
      remainingMinutes: 0,
      remainingKm: 0,
      currentEtaClock: null,
      plannedEtaClock: null,
      traffic: null,
      freshnessLabel: formatFreshness(routeUpdatedAtRef.current),
    };
  }

  const clampedProgress = Math.min(1, Math.max(0, progress || 0));
  const remainingMinutes = hasArrived
    ? 0
    : Math.max(0, Math.round(route.duration * (1 - clampedProgress)));
  const remainingKm = hasArrived
    ? 0
    : Math.max(0, route.distance * (1 - clampedProgress));

  const currentEtaClock = formatClockTime(remainingMinutes);
  const plannedEtaClock = formatClockTime(route.duration);

  const baselineDuration = baselineRef.current.durationMin;
  const traffic =
    baselineDuration != null && isNavigating
      ? describeTrafficDelta(route.duration - baselineDuration)
      : null;

  return {
    hasRoute: true,
    remainingMinutes,
    remainingKm,
    currentEtaClock,
    plannedEtaClock,
    traffic,
    freshnessLabel: formatFreshness(routeUpdatedAtRef.current),
  };
}
