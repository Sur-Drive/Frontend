const API_BASE = "https://backend-production-01de.up.railway.app";

export interface LocationOption {
  id: string;
  name: string;
}

async function getJson(path: string, fallbackMessage: string) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  const text = await res.text();
  let body: any = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    throw new Error(body.message || body.error || `${fallbackMessage} (${res.status})`);
  }
  return body;
}

/** Accepts [..], {data:[..]}, {states:[..]}, {cities:[..]}, {data:{states:[..]}} */
function toList(body: any): any[] {
  if (Array.isArray(body)) return body;
  for (const key of ["data", "states", "cities", "items", "results"]) {
    const v = body?.[key];
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") {
      const nested = toList(v);
      if (nested.length) return nested;
    }
  }
  return [];
}

function normalize(list: any[]): LocationOption[] {
  return list
    .map((item) => {
      if (typeof item === "string") return { id: item, name: item };
      const id = item.id ?? item._id ?? item.stateId ?? item.cityId ?? item.name;
      const name = item.name ?? item.stateName ?? item.cityName ?? item.title;
      return id && name ? { id: String(id), name: String(name) } : null;
    })
    .filter((x): x is LocationOption => x !== null);
}

/** GET /locations/states */
export async function fetchStates(): Promise<LocationOption[]> {
  const body = await getJson("/locations/states", "Failed to load states");
  return normalize(toList(body));
}

/** GET /locations/:stateId/cities */
export async function fetchCities(stateId: string): Promise<LocationOption[]> {
  const body = await getJson(
    `/locations/${encodeURIComponent(stateId)}/cities`,
    "Failed to load cities",
  );
  return normalize(toList(body));
}
