export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

// Full naira with thousands separators, e.g. 8400 -> "₦8,400".
export function formatNaira(value: number): string {
  return `₦${new Intl.NumberFormat("en-US").format(value)}`;
}

// Signed naira delta, e.g. 3 -> "+ ₦3", -50223 -> "− ₦50,223", 0 -> "₦0".
// Uses a real minus sign (U+2212) for negatives.
export function formatSignedNaira(value: number): string {
  if (value === 0) return "₦0";
  const magnitude = `₦${new Intl.NumberFormat("en-US").format(Math.abs(value))}`;
  return value > 0 ? `+ ${magnitude}` : `− ${magnitude}`;
}

// Masks an account number down to its last 4 digits, e.g. "4821" -> "•••• ••4821".
export function maskAccount(last4: string): string {
  return `•••• ••${last4}`;
}

// Chart axis covering 0..max in three intervals, each step rounded up to
// 1/2/2.5/5 × 10^n so ticks stay round numbers (505 rides -> 0/200/400/600).
export function niceAxisScale(max: number): { max: number; ticks: number[] } {
  const raw = max > 0 ? max / 3 : 1;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step =
    [1, 2, 2.5, 5, 10]
      .map((factor) => factor * magnitude)
      .find((candidate) => candidate >= raw - 1e-9) ??
    10 * magnitude;
  const round = (value: number) => Math.round(value * 1e6) / 1e6;
  const ticks = [0, step, step * 2, step * 3].map(round);
  return { max: ticks[3], ticks };
}

// Compact naira notation, e.g. 18_420_000 -> "₦18.42M", 6_800_000 with 1
// decimal -> "₦6.8M". Trailing zeros in the fraction are trimmed, so a whole
// number never renders as "₦6.0M".
export function formatNairaCompact(value: number, decimals = 2): string {
  const trim = (n: number): string => {
    const fixed = n.toFixed(decimals);
    return fixed.includes(".") ? fixed.replace(/\.?0+$/, "") : fixed;
  };
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `₦${trim(value / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `₦${trim(value / 1_000_000)}M`;
  if (abs >= 1_000) return `₦${trim(value / 1_000)}K`;
  return `₦${value}`;
}

// Placeholder for any missing/null value in live data.
export const EM_DASH = "—";

// Turns a raw backend enum-ish value into a display label: "on_ride" ->
// "On Ride", "driversLicense" -> "Drivers License". Nullish/blank -> "—".
export function humanize(value: string | null | undefined): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return EM_DASH;
  const spaced = raw
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();
  return spaced
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// "05 May 2023" style label for an ISO date string; "—" for missing/invalid.
export function formatDateLabel(value: string | null | undefined): string {
  if (!value) return EM_DASH;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EM_DASH;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// "14 February 2023" style label for an ISO date string; "—" for missing.
export function formatDateLong(value: string | null | undefined): string {
  if (!value) return EM_DASH;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EM_DASH;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// "14:30" style clock label for an ISO date-time string; "—" for missing.
export function formatTimeLabel(value: string | null | undefined): string {
  if (!value) return EM_DASH;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return EM_DASH;
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

