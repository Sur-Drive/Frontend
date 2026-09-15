// Fallback used ONLY when the browser's real GPS/geolocation fails
// (permission denied, unsupported, timed out, etc). It asks a free
// IP-geolocation service to approximate the user's city from their
// network address. It's far coarser than GPS (city-level, sometimes
// off if they're on a VPN or their ISP routes through another city)
// but it's much closer to "real location" than a single hardcoded
// fallback point ever was.
//
// Two providers are tried in order (both free, no API key, both send
// CORS headers so they work directly from the browser). If both fail
// (offline, blocked by an extension, etc.) callers should fall back to
// a hardcoded default themselves.
export interface IpLocation {
  latitude: number;
  longitude: number;
}

interface Provider {
  url: string;
  parse: (data: any) => IpLocation | null;
}

const PROVIDERS: Provider[] = [
  {
    url: "https://ipapi.co/json/",
    parse: (data) =>
      typeof data?.latitude === "number" && typeof data?.longitude === "number"
        ? { latitude: data.latitude, longitude: data.longitude }
        : null,
  },
  {
    url: "https://ipwho.is/",
    parse: (data) =>
      data?.success !== false &&
      typeof data?.latitude === "number" &&
      typeof data?.longitude === "number"
        ? { latitude: data.latitude, longitude: data.longitude }
        : null,
  },
];

export async function getIpLocation(): Promise<IpLocation | null> {
  for (const provider of PROVIDERS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(provider.url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) continue;
      const data = await res.json();
      const parsed = provider.parse(data);
      if (parsed) return parsed;
    } catch {
      // Network error, timeout, or blocked request — try the next
      // provider rather than failing the whole lookup.
    }
  }
  return null;
}
