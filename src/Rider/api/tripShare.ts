import { driverFetch } from "./account";

const API_BASE = "https://backend-production-01de.up.railway.app";
const enc = encodeURIComponent;

export interface TripShare {
  shareId: string;
  token: string;
  sharedWith: string;
  /** Link the person can open to follow the trip. */
  url: string;
  raw: any;
}

/** Public page the share link opens (src/Rider/pages/SharedTripPage.tsx). */
export function buildTripUrl(token: string): string {
  return `${window.location.origin}/trip/${enc(token)}`;
}

function normalizeShare(body: any, sharedWith: string): TripShare {
  const d = body?.data ?? body?.share ?? body;
  const token = String(d?.token ?? d?.shareToken ?? d?.tripToken ?? "");
  const apiUrl = d?.url ?? d?.shareUrl ?? d?.link ?? d?.trackingUrl;
  return {
    shareId: String(d?.shareId ?? d?.id ?? d?._id ?? ""),
    token,
    sharedWith: d?.sharedWith ?? sharedWith,
    url: typeof apiUrl === "string" && apiUrl ? apiUrl : token ? buildTripUrl(token) : "",
    raw: d,
  };
}

/** POST /rides/:rideId/share { sharedWith } */
export async function shareRide(
  rideId: string,
  sharedWith: string,
): Promise<TripShare> {
  const body = await driverFetch(
    `/rides/${enc(rideId)}/share`,
    "POST",
    "Failed to share this trip",
    { sharedWith },
  );
  return normalizeShare(body, sharedWith);
}

/** DELETE /rides/shares/:shareId */
export const stopSharingRide = (shareId: string) =>
  driverFetch(
    `/rides/shares/${enc(shareId)}`,
    "DELETE",
    "Failed to stop sharing",
  );

/**
 * GET /rides/trip/:token — NO auth. Plain fetch on purpose: the person opening
 * the link has no account, so no Authorization header is sent.
 */
export async function getSharedTrip(token: string): Promise<any> {
  const res = await fetch(`${API_BASE}/rides/trip/${enc(token)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
    const err: Error & { status?: number } = new Error(
      res.status === 404 || res.status === 410
        ? "This trip link is no longer active."
        : msg || `Couldn't load this trip (${res.status})`,
    );
    err.status = res.status;
    throw err;
  }
  return data?.data ?? data;
}
