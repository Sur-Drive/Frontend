export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_METERS = 6371000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function toLatLngPath(
  raw: ReadonlyArray<readonly [number, number]>,
): LatLng[] {
  const out: LatLng[] = [];

  for (const [lng, lat] of raw) {
    const prev = out[out.length - 1];
    if (prev && prev.lat === lat && prev.lng === lng) continue;
    out.push({ lat, lng });
  }

  return out;
}

export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function bearingBetween(a: LatLng, b: LatLng): number {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function cumulativeDistances(path: LatLng[]): number[] {
  const cum = [0];

  for (let i = 1; i < path.length; i++) {
    cum.push(cum[i - 1] + haversineMeters(path[i - 1], path[i]));
  }

  return cum;
}

export function totalLength(cum: number[]): number {
  return cum[cum.length - 1] ?? 0;
}

export interface PathSample {
  position: LatLng;
  /** compass heading in degrees (0 = north), for rotating a direction marker */
  heading: number;
  /** index of the path vertex at or immediately before this sample */
  index: number;
}

export function pointAtFraction(
  path: LatLng[],
  cum: number[],
  fraction: number,
): PathSample {
  const clamped = Math.min(1, Math.max(0, fraction));

  if (path.length === 0) {
    return { position: { lat: 0, lng: 0 }, heading: 0, index: 0 };
  }

  if (path.length === 1) {
    return { position: path[0], heading: 0, index: 0 };
  }

  const target = clamped * totalLength(cum);

  let lo = 0;
  let hi = cum.length - 1;

  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] < target) lo = mid + 1;
    else hi = mid;
  }

  const upperIndex = Math.max(1, lo);
  const lowerIndex = upperIndex - 1;

  const segStart = cum[lowerIndex];
  const segEnd = cum[upperIndex];
  const segLength = segEnd - segStart;
  const t = segLength > 0 ? (target - segStart) / segLength : 0;

  const a = path[lowerIndex];
  const b = path[upperIndex];

  const position: LatLng = {
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
  };

  return {
    position,
    heading: bearingBetween(a, b),
    index: lowerIndex,
  };
}

export interface PathProjection {
  point: LatLng;

  fraction: number;

  distanceMeters: number;

  index: number;
}

export function projectPointOntoPath(
  path: LatLng[],
  cum: number[],
  raw: LatLng,
): PathProjection {
  if (path.length === 0) {
    return { point: raw, fraction: 0, distanceMeters: 0, index: 0 };
  }

  if (path.length === 1) {
    return {
      point: path[0],
      fraction: 0,
      distanceMeters: haversineMeters(raw, path[0]),
      index: 0,
    };
  }

  const latRad = toRad(raw.lat);
  const metersPerDegLat = (Math.PI / 180) * EARTH_RADIUS_METERS;
  const metersPerDegLng = metersPerDegLat * Math.cos(latRad);

  const toXY = (p: LatLng) => ({
    x: (p.lng - raw.lng) * metersPerDegLng,
    y: (p.lat - raw.lat) * metersPerDegLat,
  });

  let bestDistSq = Infinity;
  let bestIndex = 0;
  let bestT = 0;
  let bestPoint: LatLng = path[0];

  for (let i = 0; i < path.length - 1; i++) {
    const a = toXY(path[i]);
    const b = toXY(path[i + 1]);

    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const lenSq = abx * abx + aby * aby;

    let t = 0;
    if (lenSq > 0) {
      t = (-a.x * abx + -a.y * aby) / lenSq;
      t = Math.min(1, Math.max(0, t));
    }

    const projX = a.x + abx * t;
    const projY = a.y + aby * t;
    const distSq = projX * projX + projY * projY;

    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      bestIndex = i;
      bestT = t;
      bestPoint = {
        lat: path[i].lat + (path[i + 1].lat - path[i].lat) * t,
        lng: path[i].lng + (path[i + 1].lng - path[i].lng) * t,
      };
    }
  }

  const segStart = cum[bestIndex];
  const segLength = cum[bestIndex + 1] - segStart;
  const distanceAlong = segStart + segLength * bestT;
  const total = totalLength(cum);

  return {
    point: bestPoint,
    fraction: total > 0 ? distanceAlong / total : 0,
    distanceMeters: haversineMeters(raw, bestPoint),
    index: bestIndex,
  };
}

export function splitPathAtFraction(
  path: LatLng[],
  cum: number[],
  fraction: number,
): { traveled: LatLng[]; remaining: LatLng[]; sample: PathSample } {
  const sample = pointAtFraction(path, cum, fraction);

  const traveled = [...path.slice(0, sample.index + 1), sample.position];
  const remaining = [sample.position, ...path.slice(sample.index + 1)];

  return { traveled, remaining, sample };
}
