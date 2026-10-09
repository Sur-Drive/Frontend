import { asList } from "./financeMap";

/**
 * GET /rides/:rideId/ratings can return both sides of a ride (the passenger
 * rating the driver, and the driver rating the passenger). Account → "Rate us"
 * shows only what PASSENGERS gave the driver. Field names are read
 * defensively — check the "[account] GET /rides/.../ratings" console log
 * once and tighten if needed.
 */

export interface ReceivedRating {
  id: string;
  rideId: string;
  stars: number;
  comment: string;
  tags: string[];
  passenger: string;
  dateRaw: string;
  date: string;
}

const dmy = (iso?: string) => {
  const d = iso ? new Date(iso) : null;
  return d && !isNaN(d.getTime())
    ? d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
    : "";
};

/** Which side of the ride a rating entry is about: "driver", "rider" or unknown. */
function aboutWho(r: any): "driver" | "rider" | undefined {
  const label = String(
    r.type ?? r.ratingType ?? r.direction ?? r.target ?? r.ratedRole ?? r.ratedType ?? r.role ?? "",
  ).toLowerCase();
  if (/driver/.test(label)) return "driver";
  if (/rider|passenger/.test(label)) return "rider";
  const by = String(r.raterRole ?? r.ratedByRole ?? r.fromRole ?? "").toLowerCase();
  if (/passenger|rider/.test(by)) return "driver";
  if (/driver/.test(by)) return "rider";
  return undefined;
}

const toRating = (r: any, rideId: string, fallbackPassenger: string): ReceivedRating => {
  const p = r.passenger ?? r.rider ?? r.ratedBy ?? r.rater ?? {};
  const name =
    [p.firstName, p.lastName].filter(Boolean).join(" ") || p.name || r.passengerName || fallbackPassenger;
  const raw = r.createdAt ?? r.ratedAt ?? r.date ?? "";
  return {
    id: String(r.id ?? r._id ?? `${rideId}-${Math.random()}`),
    rideId,
    stars: Number(r.stars ?? r.rating ?? r.score ?? 0),
    comment: String(r.comment ?? r.review ?? r.feedback ?? "").trim(),
    tags: Array.isArray(r.tags) ? r.tags.map(String) : [],
    passenger: name,
    dateRaw: raw,
    date: dmy(raw),
  };
};

/** Extracts the rating(s) the passenger gave the driver from one ride's response. */
export function normalizeRideRatings(
  res: any,
  rideId: string,
  fallbackPassenger = "Passenger",
  fallbackDate = "",
): ReceivedRating[] {
  const b = res?.data ?? res ?? {};

  // Object form: { driver: {...}, rider: {...} } / { driverRating, riderRating }
  const direct = b.driverRating ?? b.driver ?? b.toDriver ?? b.passengerToDriver;
  if (direct && typeof direct === "object" && !Array.isArray(direct)) {
    return [toRating(direct, rideId, fallbackPassenger)].filter((x) => x.stars > 0);
  }

  const list = asList(res, "ratings");
  const forDriver = list.filter((r) => aboutWho(r) !== "rider");
  return forDriver
    .map((r) => {
      const x = toRating(r, rideId, fallbackPassenger);
      if (!x.dateRaw && fallbackDate) return { ...x, dateRaw: fallbackDate, date: dmy(fallbackDate) };
      return x;
    })
    .filter((x) => x.stars > 0);
}
