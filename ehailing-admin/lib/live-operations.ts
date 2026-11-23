import { apiFetch } from "@/lib/api";
import { EM_DASH, formatNumber } from "@/lib/format";
import type { Person } from "@/types/rides";
import type {
  LiveOperationsItem,
  LiveOperationsResponse,
  LiveOperationsStats,
} from "@/types/live-operations-api";
import type { LiveQueueRow } from "@/types/live-operations";

// Confirmed query params: page, limit, search,
// rideStatus, category, pickupZone, pickupLat/pickupLng/radiusKm,
// driverAvailability. Only the params this screen wires are accepted here;
// nothing is invented.

export interface LiveOperationsQuery {
  page: number;
  limit: number;
  search?: string;
  rideStatus?: string;
}

// GET /admin/ride-hailing/live-operations — observed envelope:
// { stats, items, total, page, limit, totalPages } (stats added to the
// standard pagination envelope; observed 2026-11-12).
export async function fetchLiveOperations(
  query: LiveOperationsQuery,
  signal?: AbortSignal,
): Promise<LiveOperationsResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });
  if (query.search) params.set("search", query.search);
  if (query.rideStatus) params.set("rideStatus", query.rideStatus);
  return apiFetch<LiveOperationsResponse>(
    `/admin/ride-hailing/live-operations?${params.toString()}`,
    { signal },
  );
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

const AVATAR_TONES: Person["tone"][] = ["brand", "success", "warning", "info"];

// Deterministic avatar from the name (same convention as lib/rides.ts:
// same input -> same output on server and client, so hydration never
// mismatches). Only `name` is ever read from a person payload.
function makePerson(name: string | null | undefined): Person {
  const safeName = name && name.trim() ? name.trim() : EM_DASH;
  const words = safeName.split(/\s+/).filter((word) => /^[A-Za-z]/.test(word));
  const initials = words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
  let hash = 0;
  for (let index = 0; index < safeName.length; index += 1) {
    hash = (hash + safeName.charCodeAt(index)) % AVATAR_TONES.length;
  }
  return {
    name: safeName,
    initials: initials || EM_DASH,
    tone: AVATAR_TONES[hash],
  };
}

// Maps one live-operations item onto the queue row the table/cards render.
// Defensive on every field: undefined/null input yields "—" cells and a null
// driver, never a throw. Sensitive fields (userId, phoneNumber) are dropped
// here and never carried into UI state.
export function mapLiveQueueRow(
  item: LiveOperationsItem | null | undefined,
): LiveQueueRow {
  const record = item ?? {};
  return {
    id: asString(record.id) ?? EM_DASH,
    passenger: makePerson(asString(record.passenger?.name)),
    driver: record.driver ? makePerson(asString(record.driver.name)) : null,
    pickup: asString(record.pickupAddress) ?? EM_DASH,
    destination: asString(record.dropoffAddress) ?? EM_DASH,
    category: asString(record.category) ?? EM_DASH,
    status: asString(record.status) ?? EM_DASH,
    isDelayed: record.isDelayed === true,
  };
}

// Summary numbers for the glance cards. Deliberately NOT derived from the
// items array: activeRides is the endpoint's `total`, the rest are stats
// fields. Missing/failed -> null so the cards render "—" (never a fake 0);
// a loaded true zero stays 0.
export interface LiveGlance {
  activeRides: number | null;
  searching: number | null;
  inProgress: number | null;
  delayedRides: number | null;
}

export const EMPTY_GLANCE: LiveGlance = {
  activeRides: null,
  searching: null,
  inProgress: null,
  delayedRides: null,
};

export function mapLiveGlance(
  response: LiveOperationsResponse | null | undefined,
): LiveGlance {
  if (!response || typeof response !== "object") return { ...EMPTY_GLANCE };
  const stats: Partial<LiveOperationsStats> =
    response.stats && typeof response.stats === "object" ? response.stats : {};
  return {
    activeRides: asNumber(response.total),
    searching: asNumber(stats.matchingRides),
    inProgress: asNumber(stats.inProgress),
    delayedRides: asNumber(stats.delayed),
  };
}

// Stat label: null (unloaded / failed / missing field) is "—", a loaded true
// zero stays "0".
export function glanceLabel(value: number | null | undefined): string {
  return value === null || value === undefined ? EM_DASH : formatNumber(value);
}

// "Updated just now" for the first minute, then a coarse relative label;
// "Updated —" when nothing has ever loaded.
export function updatedLabel(at: number | null, now: number): string {
  if (at === null || !Number.isFinite(at)) return `Updated ${EM_DASH}`;
  const seconds = Math.max(0, Math.floor((now - at) / 1000));
  if (seconds < 60) return "Updated just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Updated ${minutes} min ago`;
  return `Updated ${Math.floor(minutes / 60)} hr ago`;
}

// Glance state machine: a successful refresh replaces everything; a failed
// refresh keeps the last good data and only flags staleness once something
// has loaded (unloaded stays "—", never a fabricated number).
export interface GlanceState {
  loaded: boolean;
  data: LiveGlance;
  updatedAt: number | null;
  error: string | null;
  stale: boolean;
}

export const initialGlanceState: GlanceState = {
  loaded: false,
  data: { ...EMPTY_GLANCE },
  updatedAt: null,
  error: null,
  stale: false,
};

export type GlanceAction =
  | { type: "success"; data: LiveGlance; at: number }
  | { type: "failure"; message: string };

export function glanceReducer(
  state: GlanceState,
  action: GlanceAction,
): GlanceState {
  if (action.type === "success") {
    return {
      loaded: true,
      data: action.data,
      updatedAt: action.at,
      error: null,
      stale: false,
    };
  }
  return { ...state, error: action.message, stale: state.loaded };
}

function errorMessage(cause: unknown): string {
  return cause instanceof Error && cause.message
    ? cause.message
    : "Request failed. Please try again.";
}

interface GlanceRefresher {
  // True while a glance request is in flight.
  readonly busy: boolean;
  // Starts one refresh; returns false when one is already in flight (the
  // poll never stacks requests).
  refresh(): boolean;
  // Resolves when the current (or last) refresh settles.
  settled(): Promise<void>;
  // Aborts the in-flight request (unmount); no state dispatch follows.
  abort(): void;
}

// Single-flight wrapper around the glance fetch: at most one request at a
// time, failures dispatch { type: "failure" } so the reducer keeps the last
// good data, aborts dispatch nothing.
export function createGlanceRefresher(
  load: (signal: AbortSignal) => Promise<LiveGlance>,
  dispatch: (action: GlanceAction) => void,
): GlanceRefresher {
  let controller: AbortController | null = null;
  let current: Promise<void> = Promise.resolve();
  return {
    get busy() {
      return controller !== null;
    },
    refresh() {
      if (controller !== null) return false;
      const flight = new AbortController();
      controller = flight;
      current = load(flight.signal)
        .then((data) => {
          if (flight.signal.aborted) return;
          dispatch({ type: "success", data, at: Date.now() });
        })
        .catch((cause: unknown) => {
          if (flight.signal.aborted) return;
          dispatch({ type: "failure", message: errorMessage(cause) });
        })
        .finally(() => {
          if (controller === flight) controller = null;
        });
      return true;
    },
    settled() {
      return current;
    },
    abort() {
      if (controller !== null) {
        controller.abort();
        controller = null;
      }
    },
  };
}

export const LIVE_POLL_INTERVAL_MS = 20_000;

interface LivePollerOptions {
  // One poll cycle (async; the poller does not await it).
  tick: () => void;
  // True while a request for this screen is in flight; ticks are skipped so
  // two live requests never overlap.
  isBusy?: () => boolean;
  intervalMs?: number;
}

interface LivePoller {
  start(): void;
  stop(): void;
  // Manual/initial cycle, subject to the same hidden/busy guards.
  refreshNow(): void;
}

// 20s polling with cleanup: paused while the tab is hidden (ticks no-op),
// immediate catch-up tick when the tab becomes visible again, skipped while
// isBusy(), and stop() clears the interval and the visibility listener so
// nothing runs after unmount.
export function createLivePoller({
  tick,
  isBusy,
  intervalMs = LIVE_POLL_INTERVAL_MS,
}: LivePollerOptions): LivePoller {
  let intervalId: number | null = null;
  function run() {
    if (typeof document !== "undefined" && document.hidden) return;
    if (isBusy?.()) return;
    tick();
  }
  function onVisibilityChange() {
    if (typeof document !== "undefined" && !document.hidden) run();
  }
  return {
    start() {
      if (intervalId !== null) return;
      intervalId = window.setInterval(run, intervalMs);
      document.addEventListener("visibilitychange", onVisibilityChange);
    },
    stop() {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
      document.removeEventListener("visibilitychange", onVisibilityChange);
    },
    refreshNow: run,
  };
}

