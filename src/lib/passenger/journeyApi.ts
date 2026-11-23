
export type GeoPoint = {
  lat: number;
  lng: number;
};

export interface DriverEta {
  distanceKm: number;
  distanceText: string;
  durationMin: number;
  durationText: string;
  durationInTrafficMin?: number;
  durationInTrafficText?: string;
  driverId: string;
  driverLocation: GeoPoint & {
    updatedAt?: string;
  };
}

export interface DrivingRoute {
  points: GeoPoint[];
  distanceKm: number;
  durationMin: number;
  durationInSeconds: number;
}

interface PlanRouteResponse {
  routes?: {
    driving?: {
      mode?: string;
      distance?: number;
      duration?: number;
      durationInSeconds?: number;
      path?: [number, number][];
    };
  };
}

export interface PlanRoutePayload {
  origin: GeoPoint;
  destination: GeoPoint;
}

const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  "https://backend-production-01de.up.railway.app"
).replace(/\/$/, "");

export function isValidPoint(
  point: GeoPoint | null | undefined,
): point is GeoPoint {
  return Boolean(
    point &&
      Number.isFinite(point.lat) &&
      Number.isFinite(point.lng) &&
      Math.abs(point.lat) <= 90 &&
      Math.abs(point.lng) <= 180
  );
}

async function requestJson<T>(
  url: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Journey request failed: ${response.status}`
    );
  }

  return (await response.json()) as T;
}

export async function getDriverEta(
  driverId: string,
  destination: GeoPoint,
  token: string,
  signal?: AbortSignal,
): Promise<DriverEta> {
  if (!isValidPoint(destination)) {
    throw new Error("Invalid ETA destination");
  }

  const query = new URLSearchParams({
    destLat: String(destination.lat),
    destLng: String(destination.lng),
  });

  const data = await requestJson<DriverEta>(
    `${BASE_URL}/eta/driver/${encodeURIComponent(
      driverId
    )}?${query}`,
    token,
    { signal }
  );

  if (!isValidPoint(data.driverLocation)) {
    throw new Error(
      "ETA response has no valid driver location"
    );
  }

  return data;
}

export async function planDrivingRoute(
  origin: GeoPoint,
  destination: GeoPoint,
  token: string,
  signal?: AbortSignal,
): Promise<DrivingRoute> {
  if (
    !isValidPoint(origin) ||
    !isValidPoint(destination)
  ) {
    throw new Error("Invalid route coordinates");
  }

  const payload: PlanRoutePayload = {
    origin: {
      lat: origin.lat,
      lng: origin.lng,
    },
    destination: {
      lat: destination.lat,
      lng: destination.lng,
    },
  };

  console.debug(
    "[SurDrive] Planning route:",
    payload
  );

  const response =
    await requestJson<PlanRouteResponse>(
      `${BASE_URL}/route/plan`,
      token,
      {
        method: "POST",
        body: JSON.stringify(payload),
        signal,
      }
    );

  const driving = response.routes?.driving;

  if (!driving?.path?.length) {
    throw new Error("Driving route not available");
  }

  // Backend uses [longitude, latitude].
  const points = driving.path
    .map(([lng, lat]) => ({
      lat,
      lng,
    }))
    .filter(isValidPoint);

  if (points.length < 2) {
    throw new Error(
      "Invalid driving route geometry"
    );
  }

  return {
    points,
    distanceKm: driving.distance ?? 0,
    durationMin: driving.duration ?? 0,
    durationInSeconds:
      driving.durationInSeconds ??
      (driving.duration ?? 0) * 60,
  };
}
