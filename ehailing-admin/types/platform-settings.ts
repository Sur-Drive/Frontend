export const SETTING_SECTION_IDS = [
  "general",
  "cities",
  "payments",
  "ride",
  "safety",
  "integrations",
] as const;

export type SettingSectionId = (typeof SETTING_SECTION_IDS)[number];

export function isSettingSection(
  value: string | null | undefined,
): value is SettingSectionId {
  return (
    typeof value === "string" &&
    (SETTING_SECTION_IDS as readonly string[]).includes(value)
  );
}

export interface SettingSectionMeta {
  id: SettingSectionId;
  title: string;
  description: string;
}

export const SETTING_SECTIONS: SettingSectionMeta[] = [
  { id: "general", title: "General", description: "Platform identity, support contacts and regional defaults" },
  { id: "cities", title: "Cities & Service Areas", description: "Operating cities, service boundaries and restricted zones" },
  { id: "payments", title: "Payments", description: "Payment methods, providers and refund policies" },
  { id: "ride", title: "Ride Settings", description: "Categories, capacity, cancellation and wait time" },
  { id: "safety", title: "Safety", description: "SOS escalation, emergency contacts and incident routing" },
  { id: "integrations", title: "Integrations", description: "Maps, OTP, gateways and communication providers" },
];

export type CityStatus = "Active" | "Pilot" | "Paused";
export const CITY_STATUSES: CityStatus[] = ["Active", "Pilot", "Paused"];

export type IntegrationStatus = "Connected" | "Attention" | "Disabled";
export type IntegrationEnvironment = "Live" | "Sandbox";

// A single service-boundary vertex in the boundary editor's 800×360 SVG
// coordinate space (see BoundaryDrawer).
export interface BoundaryPoint {
  x: number;
  y: number;
}

export interface OperatingCity {
  id: string;
  name: string;
  serviceZones: number;
  restrictedZones: number;
  status: CityStatus;
  // Saved service boundary. Kept out of countChangedFields/validateSettings:
  // the Manage Boundaries drawer saves (and audits) these independently of the
  // page's main Save changes flow.
  boundaryName: string;
  boundaryPoints: BoundaryPoint[];
}

export interface IntegrationSetting {
  id: string;
  name: string;
  purpose: string;
  initials: string;
  status: IntegrationStatus;
  enabled: boolean;
  environment: IntegrationEnvironment;
  maskedKey: string;
  keyReplaced: boolean;
}

export interface PlatformSettingsDraft {
  general: {
    logoName: string | null;
    platformName: string;
    supportEmail: string;
    supportPhone: string;
    currency: string;
    timezone: string;
  };
  cities: OperatingCity[];
  payments: {
    card: boolean;
    bankTransfer: boolean;
    wallet: boolean;
    cash: boolean;
    provider: string;
    refundWindow: number;
  };
  ride: {
    maxCapacity: number;
    freeCancelMinutes: number;
    waitMinutes: number;
    searchRadiusKm: number;
  };
  safety: {
    sosEscalation: boolean;
    emergencyLine: string;
    policeLine: string;
    routing: string;
    tripSharing: boolean;
  };
  integrations: IntegrationSetting[];
}

export const CURRENCIES = [
  "NGN — Nigerian Naira",
  "GHS — Ghanaian Cedi",
  "KES — Kenyan Shilling",
  "USD — US Dollar",
];

export const TIMEZONES = [
  "Africa/Lagos (WAT, UTC+1)",
  "Africa/Accra (GMT, UTC+0)",
  "Africa/Nairobi (EAT, UTC+3)",
  "UTC",
];

export const PAYMENT_PROVIDERS = ["Paystack — Live", "Flutterwave — Backup"];
export const CAPACITY_OPTIONS = [4, 5, 6, 7, 8];
export const SAFETY_ROUTINGS = ["Safety Response — Lagos", "National Escalations"];
export const INTEGRATION_ENVIRONMENTS: IntegrationEnvironment[] = ["Live", "Sandbox"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[A-Za-z0-9+\-() ]{7,20}$/;
const POLICE_RE = /^\d{3,15}$/;

export type SectionErrors = Record<string, string>;
export type SettingsErrors = Record<SettingSectionId, SectionErrors>;

export const EMPTY_ERRORS: SettingsErrors = {
  general: {}, cities: {}, payments: {}, ride: {}, safety: {}, integrations: {},
};

export function validateSettings(
  draft: PlatformSettingsDraft,
  maxCategoryCapacity: number,
): SettingsErrors {
  const errors: SettingsErrors = {
    general: {}, cities: {}, payments: {}, ride: {}, safety: {}, integrations: {},
  };
  const name = draft.general.platformName.trim();
  if (name === "") errors.general.platformName = "Platform name is required.";
  else if (name.length > 40) errors.general.platformName = "Keep the name to 40 characters.";
  if (!EMAIL_RE.test(draft.general.supportEmail.trim()))
    errors.general.supportEmail = "Enter a valid email address.";
  if (!PHONE_RE.test(draft.general.supportPhone.trim()))
    errors.general.supportPhone = "Use 7–20 letters, digits, spaces or + - ( ).";
  const seen = new Set<string>();
  for (const city of draft.cities) {
    const key = city.name.trim().toLowerCase();
    if (city.name.trim() === "") errors.cities[`${city.id}.name`] = "City name is required.";
    else if (seen.has(key)) errors.cities[`${city.id}.name`] = "City names must be unique.";
    else seen.add(key);
    if (!Number.isInteger(city.serviceZones) || city.serviceZones < 0)
      errors.cities[`${city.id}.serviceZones`] = "Must be 0 or more.";
    if (!Number.isInteger(city.restrictedZones) || city.restrictedZones < 0)
      errors.cities[`${city.id}.restrictedZones`] = "Must be 0 or more.";
  }
  if (!draft.payments.card && !draft.payments.bankTransfer && !draft.payments.wallet && !draft.payments.cash)
    errors.payments.methods = "Keep at least one payment method enabled.";
  if (!Number.isInteger(draft.payments.refundWindow) || draft.payments.refundWindow < 0)
    errors.payments.refundWindow = "Enter 0 or more.";
  if (draft.ride.maxCapacity < maxCategoryCapacity)
    errors.ride.maxCapacity = `Cannot be lower than the largest ride category capacity (${maxCategoryCapacity} passengers).`;
  if (!Number.isInteger(draft.ride.freeCancelMinutes) || draft.ride.freeCancelMinutes < 0 || draft.ride.freeCancelMinutes > 15)
    errors.ride.freeCancelMinutes = "Enter 0–15 minutes.";
  if (!Number.isInteger(draft.ride.waitMinutes) || draft.ride.waitMinutes < 0 || draft.ride.waitMinutes > 30)
    errors.ride.waitMinutes = "Enter 0–30 minutes.";
  if (!Number.isInteger(draft.ride.searchRadiusKm) || draft.ride.searchRadiusKm < 1 || draft.ride.searchRadiusKm > 50)
    errors.ride.searchRadiusKm = "Enter 1–50 kilometres.";
  if (!PHONE_RE.test(draft.safety.emergencyLine.trim()))
    errors.safety.emergencyLine = "Use 7–20 letters, digits, spaces or + - ( ).";
  if (!POLICE_RE.test(draft.safety.policeLine.trim()))
    errors.safety.policeLine = "Use 3–15 digits.";
  return errors;
}

export function countChangedFields(
  saved: PlatformSettingsDraft,
  draft: PlatformSettingsDraft,
): number {
  let count = 0;
  const gKeys: (keyof PlatformSettingsDraft["general"])[] =
    ["logoName", "platformName", "supportEmail", "supportPhone", "currency", "timezone"];
  for (const key of gKeys) if (saved.general[key] !== draft.general[key]) count += 1;
  const savedCities = new Map(saved.cities.map((c) => [c.id, c]));
  for (const city of draft.cities) {
    const prev = savedCities.get(city.id);
    if (!prev) count += 1;
    else if (prev.name !== city.name || prev.serviceZones !== city.serviceZones ||
      prev.restrictedZones !== city.restrictedZones || prev.status !== city.status) count += 1;
  }
  const pKeys: (keyof PlatformSettingsDraft["payments"])[] =
    ["card", "bankTransfer", "wallet", "cash", "provider", "refundWindow"];
  for (const key of pKeys) if (saved.payments[key] !== draft.payments[key]) count += 1;
  const rKeys: (keyof PlatformSettingsDraft["ride"])[] =
    ["maxCapacity", "freeCancelMinutes", "waitMinutes", "searchRadiusKm"];
  for (const key of rKeys) if (saved.ride[key] !== draft.ride[key]) count += 1;
  const sKeys: (keyof PlatformSettingsDraft["safety"])[] =
    ["sosEscalation", "emergencyLine", "policeLine", "routing", "tripSharing"];
  for (const key of sKeys) if (saved.safety[key] !== draft.safety[key]) count += 1;
  const savedInts = new Map(saved.integrations.map((i) => [i.id, i]));
  for (const integration of draft.integrations) {
    const prev = savedInts.get(integration.id);
    if (!prev) count += 1;
    else if (prev.enabled !== integration.enabled || prev.environment !== integration.environment ||
      prev.keyReplaced !== integration.keyReplaced) count += 1;
  }
  return count;
}
