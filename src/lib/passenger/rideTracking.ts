
export type TrackingPoint = {
  lat: number;
  lng: number;
};

export type TrackingStage =
  | "pickup"
  | "trip";

export type TrackingEta = {
  minutes: number | null;
  distanceKm: number | null;
};

export type TrackingRoute = {
  points: TrackingPoint[];
  eta: TrackingEta;
};

export type DriverGpsUpdate = {
  position: TrackingPoint;
  timestamp: number;
  heading?: number;
};

export function validPoint(
  value: unknown,
): value is TrackingPoint {
  if (!value || typeof value !== "object") {
    return false;
  }

  const point = value as Record<string, unknown>;

  return (
    typeof point.lat === "number" &&
    typeof point.lng === "number" &&
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    point.lng >= -180 &&
    point.lng <= 180
  );
}

export function parseGps(
  payload: unknown,
): TrackingPoint | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const data = payload as Record<string, unknown>;

  const location =
    data.location &&
    typeof data.location === "object"
      ? data.location as Record<string, unknown>
      : data;

  const lat = location.lat ?? location.latitude;
  const lng = location.lng ?? location.longitude;

  const point = { lat, lng };

  return validPoint(point) ? point : null;
}

export function bearingBetween(
  from: TrackingPoint,
  to: TrackingPoint,
): number {
  const toRadians = (degrees: number) =>
    (degrees * Math.PI) / 180;

  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const deltaLng = toRadians(to.lng - from.lng);

  const y =
    Math.sin(deltaLng) * Math.cos(lat2);

  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) *
      Math.cos(lat2) *
      Math.cos(deltaLng);

  return (
    (Math.atan2(y, x) * 180) / Math.PI +
    360
  ) % 360;
}

export function distanceMeters(
  a: TrackingPoint,
  b: TrackingPoint,
): number {
  const radius = 6371000;
  const radians = (n: number) =>
    (n * Math.PI) / 180;

  const dLat = radians(b.lat - a.lat);
  const dLng = radians(b.lng - a.lng);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(a.lat)) *
      Math.cos(radians(b.lat)) *
      Math.sin(dLng / 2) ** 2;

  return (
    2 *
    radius *
    Math.asin(Math.min(1, Math.sqrt(h)))
  );
}

export function decodePolyline(
  encoded: string,
): TrackingPoint[] {
  const result: TrackingPoint[] = [];

  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    const values: number[] = [];

    for (let coordinate = 0; coordinate < 2; coordinate++) {
      let shift = 0;
      let value = 0;
      let byte: number;

      do {
        if (index >= encoded.length) {
          return [];
        }

        byte = encoded.charCodeAt(index++) - 63;

        value |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      values.push(
        value & 1
          ? ~(value >> 1)
          : value >> 1,
      );
    }

    lat += values[0];
    lng += values[1];

    result.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return result;
}

export function normalizeRoute(
  response: unknown,
): TrackingRoute | null {
  if (!response || typeof response !== "object") {
    return null;
  }

  const root = response as Record<string, unknown>;

  const data =
    root.data &&
    typeof root.data === "object"
      ? root.data as Record<string, unknown>
      : root;

  const route =
    data.route &&
    typeof data.route === "object"
      ? data.route as Record<string, unknown>
      : data;

  const rawPoints =
    route.points ??
    route.coordinates ??
    route.path;

  let points: TrackingPoint[] = [];

  if (Array.isArray(rawPoints)) {
    points = rawPoints
      .map((item) => {
        if (Array.isArray(item) && item.length >= 2) {
          // GeoJSON coordinates: [longitude, latitude]
          return {
            lat: item[1],
            lng: item[0],
          };
        }

        return item;
      })
      .filter(validPoint);
  } else {
    const encoded =
      route.encodedPolyline ??
      route.polyline;

    if (typeof encoded === "string") {
      points = decodePolyline(encoded);
    } else if (
      encoded &&
      typeof encoded === "object" &&
      "points" in encoded &&
      typeof encoded.points === "string"
    ) {
      points = decodePolyline(encoded.points);
    }
  }

  if (points.length < 2) return null;

  const minutes =
    typeof route.durationMinutes === "number"
      ? route.durationMinutes
      : typeof route.durationMin === "number"
        ? route.durationMin
        : null;

  const distanceKm =
    typeof route.distanceKm === "number"
      ? route.distanceKm
      : null;

  return {
    points,
    eta: {
      minutes,
      distanceKm,
    },
  };
}

export function routeProgress(
  route: TrackingPoint[],
  position: TrackingPoint,
): number {
  if (route.length < 2) return 0;

  const lengths: number[] = [];
  let total = 0;

  for (let i = 1; i < route.length; i++) {
    const length = distanceMeters(
      route[i - 1],
      route[i],
    );

    lengths.push(length);
    total += length;
  }

  if (total === 0) return 0;

  let travelled = 0;
  let closestProgress = 0;
  let closestDistance = Infinity;

  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1];
    const b = route[i];

    const midLat = (a.lat + b.lat) / 2;
    const xScale =
      111320 *
      Math.cos((midLat * Math.PI) / 180);
    const yScale = 111320;

    const dx = (b.lng - a.lng) * xScale;
    const dy = (b.lat - a.lat) * yScale;
    const px = (position.lng - a.lng) * xScale;
    const py = (position.lat - a.lat) * yScale;

    const lengthSquared = dx * dx + dy * dy;

    const t =
      lengthSquared > 0
        ? Math.max(
            0,
            Math.min(
              1,
              (px * dx + py * dy) / lengthSquared,
            ),
          )
        : 0;

    const distance = Math.hypot(
      px - t * dx,
      py - t * dy,
    );

    if (distance < closestDistance) {
      closestDistance = distance;
      closestProgress =
        (travelled + t * lengths[i - 1]) /
        total;
    }

    travelled += lengths[i - 1];
  }

  return Math.max(
    0,
    Math.min(1, closestProgress),
  );
}
