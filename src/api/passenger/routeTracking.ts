
import {
  normalizeRoute,
  type TrackingPoint,
  type TrackingRoute,
} from "../../lib/passenger/rideTracking";

const API_BASE =
  import.meta.env.VITE_API_URL ??
  "https://backend-production-01de.up.railway.app";

export async function getPlannedRoute(
  origin: TrackingPoint,
  destination: TrackingPoint,
  token: string,
  signal?: AbortSignal,
): Promise<TrackingRoute | null> {
  const response = await fetch(
    `${API_BASE}/route/plan`,
    {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        origin,
        destination,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Route planning failed: ${response.status}`,
    );
  }

  const json: unknown = await response.json();

  return normalizeRoute(json);
}
