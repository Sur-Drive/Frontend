import { driverFetch } from "./account";

const enc = encodeURIComponent;
const act = (rideId: string, suffix: string, msg: string, body?: unknown) =>
  driverFetch(`/rides/${enc(rideId)}/${suffix}`, "POST", msg, body);

/** GET /docs/events.html — realtime events reference page (HTML). */
export async function getEventsDocs(): Promise<string> {
  const res = await driverFetch("/docs/events.html", "GET", "Failed to load events docs");
  return typeof res?.raw === "string" ? res.raw : JSON.stringify(res);
}

/* ---------------------------- Match (offer) ----------------------------- */

/** POST /rides/:rideId/match/accept */
export const acceptRideMatch = (rideId: string) =>
  act(rideId, "match/accept", "Failed to accept ride");

/** POST /rides/:rideId/match/decline { reason } */
export const declineRideMatch = (rideId: string, reason?: string) =>
  act(rideId, "match/decline", "Failed to decline ride", reason ? { reason } : {});

/** GET /rides/driver/:rideId */
export const getDriverRide = (rideId: string) =>
  driverFetch(`/rides/driver/${enc(rideId)}`, "GET", "Failed to load ride");

/* ------------------------------ Ride steps ------------------------------ */

/** POST /rides/:rideId/driver/en-route */
export const markEnRoute = (rideId: string) =>
  act(rideId, "driver/en-route", "Failed to update ride");

/** POST /rides/:rideId/driver/arrived */
export const markArrived = (rideId: string) =>
  act(rideId, "driver/arrived", "Failed to update ride");

/** POST /rides/:rideId/verify-pickup-code { code } */
export const verifyPickupCode = (rideId: string, code: string) =>
  act(rideId, "verify-pickup-code", "Pickup code is incorrect", { code });

/** POST /rides/:rideId/cancel { reason } */
export const cancelRide = (rideId: string, reason?: string) =>
  act(rideId, "cancel", "Failed to cancel ride", reason ? { reason } : {});

/** POST /rides/:rideId/driver/start */
export const startRide = (rideId: string) =>
  act(rideId, "driver/start", "Failed to start ride");

/** POST /rides/:rideId/driver/in-progress */
export const markInProgress = (rideId: string) =>
  act(rideId, "driver/in-progress", "Failed to update ride");

/** POST /rides/:rideId/driver/complete */
export const completeRide = (rideId: string) =>
  act(rideId, "driver/complete", "Failed to complete ride");

/* --------------------------------- ETA ---------------------------------- */

export interface EtaParams {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
}

/** GET /eta?originLat&originLng&destLat&destLng */
export function getEta(p: EtaParams) {
  const qs = new URLSearchParams({
    originLat: String(p.originLat),
    originLng: String(p.originLng),
    destLat: String(p.destLat),
    destLng: String(p.destLng),
  });
  return driverFetch(`/eta?${qs}`, "GET", "Failed to get ETA");
}
