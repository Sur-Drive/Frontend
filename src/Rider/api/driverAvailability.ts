import { driverFetch } from "./account";

/** Uses driverFetch (driver login token in localStorage "token"). */

export interface DriverCoords {
  lat: number;
  lng: number;
}

export interface DriverLocationPayload extends DriverCoords {
  /** degrees, 0-359 */
  heading?: number;
  /** speed as reported by the device (m/s from Geolocation) */
  speed?: number;
}

/** POST /ride-drivers/availability/online { lat, lng } */
export const goOnline = (payload: DriverCoords) =>
  driverFetch(
    "/ride-drivers/availability/online",
    "POST",
    "Failed to go online",
    payload,
  );

/** POST /ride-drivers/availability/offline { reason? } */
export const goOffline = (payload: { reason?: string } = {}) =>
  driverFetch(
    "/ride-drivers/availability/offline",
    "POST",
    "Failed to go offline",
    payload,
  );

/** POST /ride-drivers/availability/location { lat, lng, heading, speed } */
export const updateDriverLocation = (payload: DriverLocationPayload) =>
  driverFetch(
    "/ride-drivers/availability/location",
    "POST",
    "Failed to update location",
    payload,
  );

/** GET /ride-drivers/availability/status */
export const getAvailabilityStatus = () =>
  driverFetch(
    "/ride-drivers/availability/status",
    "GET",
    "Failed to load availability status",
  );

/** True when the status response says the driver is online (shape-tolerant). */
export function isStatusOnline(body: any): boolean {
  const r = body?.data ?? body ?? {};
  if (typeof r.isOnline === "boolean") return r.isOnline;
  if (typeof r.online === "boolean") return r.online;
  const s = String(r.status ?? r.availability ?? "").toLowerCase();
  return s === "online" || s === "available";
}
