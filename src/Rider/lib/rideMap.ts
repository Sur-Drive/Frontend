/**
 * Turns whatever the backend returns for a ride into one flat shape the
 * driver screens can render. Field names are matched defensively because the
 * exact response shape isn't documented — open the console, look at the
 * "[ride] raw" log, and if something shows "—" add its real key below.
 */
export interface DriverRideView {
  id?: string;
  status?: string;
  fare?: number;
  tip?: number;
  currency: string;
  passengerName: string;
  passengerInitials: string;
  passengerRating?: number;
  passengerTrips?: number;
  passengerPhone?: string;
  passengerPhoto?: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupCoords?: { lat: number; lng: number };
  dropoffCoords?: { lat: number; lng: number };
  pickupShort: string;
  dropoffShort: string;
  distanceToPickup?: string;
  durationToPickup?: string;
  tripDistance?: string;
  tripDuration?: string;
}

const pick = (...vals: any[]) =>
  vals.find((v) => v !== undefined && v !== null && v !== "");

const addrOf = (p: any): string | undefined =>
  typeof p === "string"
    ? p
    : pick(p?.address, p?.formattedAddress, p?.name, p?.label, p?.description);

const num = (v: any): number | undefined => {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return typeof n === "number" && !isNaN(n) ? n : undefined;
};

const km = (v: any) => {
  const n = num(v);
  if (n === undefined) return undefined;
  // metres vs km: backends usually send metres for big numbers
  return n > 100 ? `${(n / 1000).toFixed(1)} km` : `${n.toFixed(1)} km`;
};
const mins = (v: any) => {
  const n = num(v);
  if (n === undefined) return undefined;
  return n > 300 ? `${Math.round(n / 60)} min` : `${Math.round(n)} min`; // secs vs mins
};

const coordsOf = (o: any, latKeys: string[], lngKeys: string[]) => {
  if (!o) return undefined;
  const lat = num(pick(...latKeys.map((k) => o[k])));
  const lng = num(pick(...lngKeys.map((k) => o[k])));
  return lat !== undefined && lng !== undefined ? { lat, lng } : undefined;
};

export const unwrapRide = (raw: any) => raw?.data?.ride ?? raw?.ride ?? raw?.data ?? raw;

export function mapRide(raw: any): DriverRideView {
  const r = unwrapRide(raw) ?? {};
  const pax = pick(r.passenger, r.rider, r.user, r.customer) ?? {};
  const name =
    pick(
      pax.name,
      pax.fullName,
      [pax.firstName, pax.lastName].filter(Boolean).join(" ") || undefined,
      r.passengerName,
      r.riderName,
    ) ?? "Passenger";

  const pickupAddress =
    addrOf(pick(r.pickup, r.pickupLocation, r.origin, r.from)) ??
    pick(r.pickupAddress, r.originAddress) ??
    "—";
  const dropoffAddress =
    addrOf(pick(r.dropoff, r.dropoffLocation, r.destination, r.to)) ??
    pick(r.dropoffAddress, r.destinationAddress) ??
    "—";

  const pk = pick(r.pickup, r.pickupLocation, r.origin, r.from);
  const dp = pick(r.dropoff, r.dropoffLocation, r.destination, r.to);
  const pickupCoords =
    coordsOf(pk, ["lat", "latitude"], ["lng", "lon", "longitude"]) ??
    coordsOf(r, ["pickupLat", "pickupLatitude", "originLat"], ["pickupLng", "pickupLongitude", "originLng"]);
  const dropoffCoords =
    coordsOf(dp, ["lat", "latitude"], ["lng", "lon", "longitude"]) ??
    coordsOf(r, ["dropoffLat", "dropoffLatitude", "destLat", "destinationLat"], ["dropoffLng", "dropoffLongitude", "destLng", "destinationLng"]);

  const short = (a: string) => (a === "—" ? a : a.split(",")[0]);

  return {
    id: pick(r.id, r._id, r.rideId),
    status: pick(r.status, r.state),
    fare: num(pick(r.fare, r.estimatedFare, r.totalFare, r.price, r.amount, r.pricing?.total)),
    tip: num(pick(r.tip, r.tipAmount)),
    currency: pick(r.currency, "NGN") as string,
    passengerName: name,
    passengerInitials:
      name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w: string) => w[0]?.toUpperCase())
        .join("") || "P",
    passengerRating: num(pick(pax.rating, pax.averageRating, r.passengerRating)),
    passengerPhone: pick(pax.phoneNumber, pax.phone, r.passengerPhone, r.riderPhone),
    passengerPhoto: pick(pax.profilePicture, pax.photo, pax.avatar, pax.imageUrl),
    passengerTrips: num(pick(pax.totalRides, pax.completedRides, pax.tripsCompleted)),
    pickupAddress,
    dropoffAddress,
    pickupCoords,
    dropoffCoords,
    pickupShort: short(pickupAddress),
    dropoffShort: short(dropoffAddress),
    distanceToPickup: km(pick(r.pickupDistance, r.distanceToPickup, r.driverDistance)),
    durationToPickup: mins(pick(r.pickupEta, r.etaToPickup, r.driverEta, r.etaMinutes)),
    tripDistance: km(pick(r.distance, r.distanceKm, r.estimatedDistance, r.tripDistance)),
    tripDuration: mins(pick(r.duration, r.durationMinutes, r.estimatedDuration, r.tripDuration)),
  };
}

export const naira = (n?: number) =>
  n === undefined ? "—" : `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;

/** Which screen step a ride's backend status corresponds to. */
export function stepForStatus(s?: string) {
  switch (s) {
    case "driver_en_route":
      return "details";
    case "driver_arrived":
      return "notified";
    case "ride_started":
    case "ride_in_progress":
      return "dropoff";
    case "ride_completed":
    case "payment_pending":
    case "paid":
      return "confirm";
    default:
      return "request";
  }
}

export const ACTIVE_STATUSES = [
  "driver_assigned",
  "driver_en_route",
  "driver_arrived",
  "ride_started",
  "ride_in_progress",
] as const;

/** Reads GET /eta whatever it nests under; returns display strings. */
export function mapEta(raw: any): { duration?: string; distance?: string } {
  const r = raw?.data ?? raw ?? {};
  const secs = num(pick(r.durationSeconds, r.etaSeconds, r.duration?.value));
  const durRaw = pick(r.etaMinutes, r.durationMinutes, r.eta, r.duration, r.durationText);
  const distRaw = pick(r.distanceMeters, r.distanceKm, r.distance?.value, r.distance, r.distanceText);
  return {
    duration:
      secs !== undefined
        ? `${Math.max(1, Math.round(secs / 60))} min`
        : typeof durRaw === "string" && isNaN(Number(durRaw))
          ? durRaw
          : mins(durRaw),
    distance:
      typeof distRaw === "string" && isNaN(Number(distRaw)) ? distRaw : km(distRaw),
  };
}
