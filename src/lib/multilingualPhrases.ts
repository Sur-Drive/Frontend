import type { ManeuverStep, ManeuverType } from "./maneuvers";

// Mirrors the catalog documented at /multilingual/usage.html — keep in
// sync with the backend if that page changes.
export type PhraseKey =
  | "maneuver.turn_left"
  | "maneuver.turn_left_generic"
  | "maneuver.turn_right"
  | "maneuver.turn_right_generic"
  | "maneuver.slight_left"
  | "maneuver.slight_left_generic"
  | "maneuver.slight_right"
  | "maneuver.slight_right_generic"
  | "maneuver.sharp_left"
  | "maneuver.sharp_left_generic"
  | "maneuver.sharp_right"
  | "maneuver.sharp_right_generic"
  | "maneuver.highway_enter"
  | "maneuver.highway_enter_generic"
  | "maneuver.highway_exit"
  | "maneuver.highway_exit_generic"
  | "maneuver.continue"
  | "maneuver.uturn"
  | "maneuver.roundabout"
  | "maneuver.arrive"
  | "distance.in_meters"
  | "distance.in_kilometers"
  | "distance.now"
  | "trip.starting"
  | "trip.remaining_km"
  | "trip.eta_minutes"
  | "trip.off_route"
  | "trip.rerouting"
  | "trip.arrived"
  | "hazard.pothole"
  | "hazard.flood"
  | "hazard.accident"
  | "hazard.road_works"
  | "hazard.checkpoint"
  | "hazard.warning_ahead"
  | "road_name_fragment";

export interface ResolvedPhrase {
  key: PhraseKey;
  params: Record<string, string>;
}

// Maneuver types that have no distinct "with road name" phrasing in the
// catalog — continue/uturn/roundabout/arrive only ever have one form.
const MANEUVER_KEY_MAP: Record<
  ManeuverType,
  { withRoad: PhraseKey; generic: PhraseKey }
> = {
  straight: { withRoad: "maneuver.continue", generic: "maneuver.continue" },
  "slight-left": {
    withRoad: "maneuver.slight_left",
    generic: "maneuver.slight_left_generic",
  },
  "slight-right": {
    withRoad: "maneuver.slight_right",
    generic: "maneuver.slight_right_generic",
  },
  left: {
    withRoad: "maneuver.turn_left",
    generic: "maneuver.turn_left_generic",
  },
  right: {
    withRoad: "maneuver.turn_right",
    generic: "maneuver.turn_right_generic",
  },
  "sharp-left": {
    withRoad: "maneuver.sharp_left",
    generic: "maneuver.sharp_left_generic",
  },
  "sharp-right": {
    withRoad: "maneuver.sharp_right",
    generic: "maneuver.sharp_right_generic",
  },
  uturn: { withRoad: "maneuver.uturn", generic: "maneuver.uturn" },
  roundabout: {
    withRoad: "maneuver.roundabout",
    generic: "maneuver.roundabout",
  },
  "highway-enter": {
    withRoad: "maneuver.highway_enter",
    generic: "maneuver.highway_enter_generic",
  },
  "highway-exit": {
    withRoad: "maneuver.highway_exit",
    generic: "maneuver.highway_exit_generic",
  },
  arrive: { withRoad: "maneuver.arrive", generic: "maneuver.arrive" },
};

/** Resolve a turn-by-turn step + optional road name to a catalog phrase key. */
export function resolveManeuverPhrase(
  step: ManeuverStep,
  roadName?: string | null,
): ResolvedPhrase {
  const map = MANEUVER_KEY_MAP[step.type];
  if (roadName && map.withRoad !== map.generic) {
    return { key: map.withRoad, params: { road: roadName } };
  }
  if (roadName && (step.type === "highway-enter" || step.type === "highway-exit")) {
    // These share one key regardless of "generic" naming — the road is the
    // whole point of a highway call-out, so still pass it when we have one.
    return { key: map.withRoad, params: { road: roadName } };
  }
  return { key: map.generic, params: {} };
}

const HAZARD_KEY_MAP: Record<string, PhraseKey> = {
  POTHOLE: "hazard.pothole",
  FLOOD: "hazard.flood",
  ACCIDENT: "hazard.accident",
  ROAD_WORKS: "hazard.road_works",
  CHECKPOINT: "hazard.checkpoint",
};

/** Resolve a hazard type to a catalog phrase key, falling back to the generic warning key. */
export function resolveHazardPhrase(
  type: string | undefined,
  fallbackLabel: string,
): ResolvedPhrase {
  const upper = type?.toUpperCase();
  if (upper && HAZARD_KEY_MAP[upper]) {
    return { key: HAZARD_KEY_MAP[upper], params: {} };
  }
  return { key: "hazard.warning_ahead", params: { label: fallbackLabel } };
}

/** Build the params for distance.in_meters / distance.in_kilometers given a rounded distance and a resolved instruction phrase's own spoken text. */
export function resolveDistancePhrase(
  distanceMeters: number,
  instructionText: string,
): ResolvedPhrase {
  if (distanceMeters < 1000) {
    const meters = String(Math.max(0, Math.round(distanceMeters / 10) * 10));
    return {
      key: "distance.in_meters",
      params: { meters, instruction: instructionText },
    };
  }
  const km = (distanceMeters / 1000).toFixed(1);
  return {
    key: "distance.in_kilometers",
    params: { km, instruction: instructionText },
  };
}
