import { describeToken } from "../lib/driverSession";

const API_BASE = "https://backend-production-01de.up.railway.app";

export interface RideDriverProfile {
  firstName: string;
  lastName: string;
  /** firstName + lastName, or the API's own full name if it sends one. */
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  /** Raw value from the API (usually YYYY-MM-DD or an ISO timestamp). */
  dateOfBirth: string;
  /** Whatever the API returned, untouched, in case a screen needs more. */
  raw: any;
}

/**
 * GET /ride-drivers/profile
 *
 * Uses the driver's login token ("token" in localStorage, saved by SiginPage).
 * Deliberately NOT going through lib/apiClient.ts: that client refreshes and
 * clears the session using the passenger /auth/* endpoints, which would log a
 * driver out on any 401.
 */
export async function getRideDriverProfile(): Promise<RideDriverProfile> {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}/ride-drivers/profile`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const text = await res.text();
  let body: any = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  // TEMP DEBUG LOGGING — remove once the response shape is confirmed.
  console.log("[profile] GET /ride-drivers/profile", {
    token: describeToken(token),
    status: res.status,
    body,
  });

  if (!res.ok) {
    throw new Error(
      body?.message ||
        body?.error ||
        (res.status === 401
          ? "Your session has expired. Please sign in again."
          : `Failed to load profile (${res.status})`),
    );
  }

  return normalizeProfile(body);
}

// The response might be the profile itself or wrapped in data/profile/user,
// and phone/name fields go by a few names — accept the common ones.
function normalizeProfile(body: any): RideDriverProfile {
  const p = body?.data ?? body?.profile ?? body?.user ?? body ?? {};
  const inner = p?.profile ?? p?.user ?? p;

  const pick = (...keys: string[]): string => {
    for (const src of [inner, p, body]) {
      for (const k of keys) {
        const v = src?.[k];
        if (typeof v === "string" && v.trim()) return v.trim();
      }
    }
    return "";
  };

  const firstName = pick("firstName", "first_name");
  const lastName = pick("lastName", "last_name");
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    pick("fullName", "full_name", "name");

  return {
    firstName,
    lastName,
    fullName,
    email: pick("email", "emailAddress"),
    phone: pick("phoneNumber", "phone", "phone_number", "mobile"),
    gender: pick("gender"),
    dateOfBirth: pick("dateOfBirth", "dob", "date_of_birth"),
    raw: body,
  };
}
