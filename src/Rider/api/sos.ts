import { driverFetch } from "./account";

export interface DriverSosPayload {
  latitude: number;
  longitude: number;
  /** Optional free-text note. */
  message?: string;
}

/** POST /sos { latitude, longitude, message? } — same endpoint the passenger SOS uses. */
export const triggerDriverSos = (payload: DriverSosPayload) =>
  driverFetch("/sos", "POST", "Failed to send SOS alert", payload);

/** POST /sos/:id/cancel */
export const cancelDriverSos = (sosId: string) =>
  driverFetch(`/sos/${sosId}/cancel`, "POST", "Failed to cancel SOS");
