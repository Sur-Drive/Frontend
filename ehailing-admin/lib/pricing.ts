// Ride pricing data layer: confirmed apiFetch calls (GET lists, PATCH/POST
// mutations) plus the mapping layer from backend records to the design's
// cards/drawers and the surge draft builders.
//
// Confirmed endpoints (probed 2026-11-13):
//   GET   /admin/ride-hailing/pricing/categories        wrapped { items, availableRideTypes }
//   GET   /admin/ride-hailing/pricing/categories/{t}    bare object + history[] (not wired: no UI affordance)
//   PATCH /admin/ride-hailing/pricing/categories/{t}    new version; omitted fields carry forward
//   GET   /admin/ride-hailing/pricing/defaults          bare object (null when never configured)
//   PATCH /admin/ride-hailing/pricing/defaults          upsert; all 6 fields required
//   GET   /admin/ride-hailing/pricing/cities            BARE ARRAY (city= filter; empty -> empty body)
//   PATCH /admin/ride-hailing/pricing/cities/{t}/{city}  partial; example shows baseFare/perKm/perMinute only
//   POST  /admin/ride-hailing/pricing/cities            documented, NOT wired (no create affordance in the UI)
//   GET   /admin/ride-hailing/pricing/surge-rules       BARE ARRAY
//   POST  /admin/ride-hailing/pricing/surge-rules       create
//   PATCH /admin/ride-hailing/pricing/surge-rules/{id}  FULL REPLACE (omitted optionals -> null)
//   PATCH /admin/ride-hailing/pricing/surge-rules/{id}/toggle  flips isActive, no body
//   DELETE .../pricing/cities/{t}/{city} and DELETE .../pricing/surge-rules/{id}
//       documented but NEVER wired: no code path in this file or the pricing
//       UI issues a DELETE (fixture canary enforces it).
//
// Money units — settled by GET probes 2026-11-13, not guessed:
//   * Pricing money fields are NAIRA. Evidence: a comfort ride's
//     fareBreakdown was baseFare=500, distanceCharge=1262.91 over 7.893km
//     (≈160/km), timeCharge=20 over 1min, bookingFee=150 — exactly the
//     global comfort rule (500/160/20/150) from GET /pricing/categories, and
//     fareBreakdown totals are established naira. Observed ride totals were
//     1932.91 / 40248.98 naira, so a kobo reading of baseFare=300..2000
//     (₦3–20) is impossible.
//   * Kobo contrast on the same ride: list fare=40248.98 ==
//     payment summary.finalFare=40248.98 (naira) while
//     transactions[0].amount=4024898 (kobo, = ×100).
//   * commissionPercent is 0–100: platformCommission 8049.8 =
//     40248.98 × 20/100 exactly for the 20% rule.
//   * surge.multiplier (category) = fareBreakdown.surgeMultiplier = 1 → plain
//     factor; surge-rule multiplier 1.5/1.2 likewise plain factors.
//   * waitingGraceMin=5 minutes, priority=10 integer, demandThresholdPercent
//     0–100 (names + observed ranges).
//
// Trap findings:
//   - GET /pricing/categories is wrapped, NOT a bare array (contrary to a
//     uniform-bare-array assumption); cities and surge-rules ARE bare arrays.
//     Mappers tolerate both shapes anyway.
//   - GET /pricing/cities?city=Abuja returns 200 with an EMPTY body (not
//     "[]"); fetchers/mappers treat a null body as an empty loaded list.
//   - City list only carries baseFare/perKm/perMinute, and the PATCH example
//     only documents those three — the drawer collects exactly those, never
//     bookingFee/minimumFare (which would be thrown away).
//   - Surge PATCH is a full replace, not a partial patch: empty draft fields
//     are omitted so the backend nulls them.
//   - The confirm dialog's internal note has no backend field: never sent.
//   - No mutation in this section sends notifications to people or devices.
import { apiFetch } from "@/lib/api";
import { EM_DASH, formatDateLabel, formatNaira, humanize } from "@/lib/format";
import type {
  CategoryPatchBody,
  CityPatchBody,
  CityPricingRuleItem,
  CityRuleView,
  DefaultsPatchBody,
  PricingCategoriesResponse,
  PricingCategoryItem,
  PricingCategoryView,
  PricingDefaultsItem,
  PricingDefaultsView,
  SurgeRuleBody,
  SurgeRuleDraft,
  SurgeRuleItem,
  SurgeRuleView,
} from "@/types/pricing-api";

// ---------------------------------------------------------------------------
// Fetchers (GET only — never called from the terminal)
// ---------------------------------------------------------------------------

// GET /pricing/categories — observed wrapped { items, availableRideTypes }.
export async function fetchPricingCategories(
  signal?: AbortSignal,
): Promise<PricingCategoriesResponse> {
  return apiFetch<PricingCategoriesResponse>(
    "/admin/ride-hailing/pricing/categories",
    { signal },
  );
}

// GET /pricing/defaults — bare object, or null/empty when never configured.
export async function fetchPricingDefaults(
  signal?: AbortSignal,
): Promise<PricingDefaultsItem | null> {
  return apiFetch<PricingDefaultsItem | null>(
    "/admin/ride-hailing/pricing/defaults",
    { signal },
  );
}

// GET /pricing/cities — BARE ARRAY of active city rules (observed 2026-11-13).
// Typed as unknown because an empty filter response arrives as an empty body.
export async function fetchCityPricingRules(
  signal?: AbortSignal,
): Promise<unknown> {
  return apiFetch<unknown>("/admin/ride-hailing/pricing/cities", { signal });
}

// GET /pricing/surge-rules — BARE ARRAY of all rules (active + inactive).
export async function fetchSurgeRules(signal?: AbortSignal): Promise<unknown> {
  return apiFetch<unknown>("/admin/ride-hailing/pricing/surge-rules", {
    signal,
  });
}

// ---------------------------------------------------------------------------
// Mutations — only the confirmed endpoints. Never called
// from the terminal; only from a user-confirmed dialog. Each returns the
// backend's response so failures surface the backend message unchanged.
// ---------------------------------------------------------------------------

// PATCH /pricing/categories/{rideType} — creates a new version; omitted
// fields carry forward from the current rule.
export async function updateCategoryPricing(
  rideType: string,
  body: CategoryPatchBody,
): Promise<unknown> {
  return apiFetch<unknown>(
    `/admin/ride-hailing/pricing/categories/${encodeURIComponent(rideType)}`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
}

// PATCH /pricing/defaults — upserts the singleton row; all 6 fields required.
export async function updatePricingDefaults(
  body: DefaultsPatchBody,
): Promise<unknown> {
  return apiFetch<unknown>("/admin/ride-hailing/pricing/defaults", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

// PATCH /pricing/cities/{rideType}/{city} — partial update; omitted fields
// carry forward. Only the three fields the documented example shows.
export async function updateCityPricingRule(
  rideType: string,
  city: string,
  body: CityPatchBody,
): Promise<unknown> {
  return apiFetch<unknown>(
    `/admin/ride-hailing/pricing/cities/${encodeURIComponent(rideType)}/${encodeURIComponent(city)}`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
}

// POST /pricing/surge-rules — creates a rule. buildSurgeBody drops empty
// optionals; the drawer always sends isActive explicitly (new rules default
// to staged/inactive so a fresh rule never fires before review).
export async function createSurgeRule(
  body: SurgeRuleBody,
): Promise<unknown> {
  return apiFetch<unknown>("/admin/ride-hailing/pricing/surge-rules", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// PATCH /pricing/surge-rules/{id} — FULL REPLACE, not a partial patch:
// optional fields omitted default to null. buildSurgeBody therefore sends
// every non-empty draft value and omits cleared ones (omitted == null).
export async function updateSurgeRule(
  id: string,
  body: SurgeRuleBody,
): Promise<unknown> {
  return apiFetch<unknown>(
    `/admin/ride-hailing/pricing/surge-rules/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
}

// PATCH /pricing/surge-rules/{id}/toggle — flips isActive; no body required.
export async function toggleSurgeRule(id: string): Promise<unknown> {
  return apiFetch<unknown>(
    `/admin/ride-hailing/pricing/surge-rules/${encodeURIComponent(id)}/toggle`,
    { method: "PATCH" },
  );
}

// ---------------------------------------------------------------------------
// Mappers — read every field defensively: missing/null renders "—" (never a
// fabricated 0) and unknown enum values get a neutral humanised label.
// ---------------------------------------------------------------------------

function asString(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function asNullableString(value: unknown): string | null {
  const raw = asString(value);
  return raw || null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

// Known ride-type labels; anything else falls back to humanize() so an
// unobserved enum value still renders as a readable neutral chip.
const RIDE_TYPE_LABELS: Record<string, string> = {
  economy: "Economy",
  comfort: "Comfort",
  suv: "SUV",
};

export function rideTypeLabel(value: string | null | undefined): string {
  const raw = asString(value);
  if (!raw) return EM_DASH;
  return RIDE_TYPE_LABELS[raw.toLowerCase()] ?? humanize(raw);
}

export function mapPricingCategory(item: PricingCategoryItem): PricingCategoryView {
  const record = item ?? {};
  const surge = record.surge ?? {};
  return {
    rideType: asString(record.rideType),
    label: rideTypeLabel(record.rideType),
    scope: asNullableString(record.scope),
    active: asBoolean(record.active),
    version: asNullableString(record.version),
    effectiveFrom: asNullableString(record.effectiveFrom),
    baseFare: asNumber(record.baseFare),
    perKm: asNumber(record.perKm),
    perMinute: asNumber(record.perMinute),
    bookingFee: asNumber(record.bookingFee),
    minimumFare: asNumber(record.minimumFare),
    cancellationFee: asNumber(record.cancellationFee),
    waitingFeePerMin: asNumber(record.waitingFeePerMin),
    waitingGraceMin: asNumber(record.waitingGraceMin),
    commissionPercent: asNumber(record.commissionPercent),
    surgeActive:
      record.surge === undefined || record.surge === null
        ? null
        : asBoolean(surge.active, false),
    surgeMultiplier: asNumber(surge.multiplier),
    ruleId: asNullableString(record.ruleId),
  };
}

// Tolerates the observed wrapped { items } envelope and a bare array.
export function mapPricingCategories(raw: unknown): {
  items: PricingCategoryView[];
  availableRideTypes: string[];
} {
  const source: unknown[] = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { items?: unknown }).items)
      ? (raw as { items: unknown[] }).items
      : [];
  const available: unknown =
    raw && !Array.isArray(raw) && typeof raw === "object"
      ? (raw as { availableRideTypes?: unknown }).availableRideTypes
      : undefined;
  return {
    items: source.map((entry) =>
      mapPricingCategory((entry ?? {}) as PricingCategoryItem),
    ),
    availableRideTypes: Array.isArray(available)
      ? available.filter((entry): entry is string => typeof entry === "string")
      : [],
  };
}

export function mapCityRule(item: CityPricingRuleItem): CityRuleView {
  const record = item ?? {};
  const rideType = asString(record.rideType);
  return {
    city: asString(record.city),
    state: asNullableString(record.state),
    rideType,
    rideTypeLabel: rideTypeLabel(rideType),
    baseFare: asNumber(record.baseFare),
    perKm: asNumber(record.perKm),
    perMinute: asNumber(record.perMinute),
    active: asBoolean(record.active),
    ruleId: asNullableString(record.ruleId),
    version: asNullableString(record.version),
  };
}

// Bare array observed; also tolerates { items } and an empty body (null).
export function mapCityRules(raw: unknown): CityRuleView[] {
  const source: unknown[] = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { items?: unknown }).items)
      ? (raw as { items: unknown[] }).items
      : [];
  return source.map((entry) => mapCityRule((entry ?? {}) as CityPricingRuleItem));
}

function asNumberArray(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  const days = value
    .filter((entry): entry is number => typeof entry === "number" && Number.isFinite(entry))
    .map((entry) => Math.trunc(entry));
  return days.length ? [...new Set(days)].sort((a, b) => a - b) : null;
}

export function mapSurgeRule(item: SurgeRuleItem): SurgeRuleView {
  const record = item ?? {};
  return {
    id: asString(record.id),
    name: asString(record.name),
    description: asNullableString(record.description),
    ruleType: asString(record.ruleType),
    multiplier: asNumber(record.multiplier),
    isActive: asBoolean(record.isActive),
    priority: asNumber(record.priority),
    daysOfWeek: asNumberArray(record.daysOfWeek),
    startTime: asNullableString(record.startTime),
    endTime: asNullableString(record.endTime),
    city: asNullableString(record.city),
    state: asNullableString(record.state),
    demandThresholdPercent: asNumber(record.demandThresholdPercent),
    weatherCondition: asNullableString(record.weatherCondition),
    validFrom: asNullableString(record.validFrom),
    validTo: asNullableString(record.validTo),
  };
}

// Bare array observed; also tolerates { items } and an empty body (null).
export function mapSurgeRules(raw: unknown): SurgeRuleView[] {
  const source: unknown[] = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as { items?: unknown }).items)
      ? (raw as { items: unknown[] }).items
      : [];
  return source.map((entry) => mapSurgeRule((entry ?? {}) as SurgeRuleItem));
}

// null / empty body = never configured (documented). Loaded-but-null stays
// null at the call site so the UI can show "Never configured" instead of "—".
export function mapDefaults(raw: unknown): PricingDefaultsView | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as PricingDefaultsItem;
  return {
    baseFare: asNumber(record.baseFare),
    perKm: asNumber(record.perKm),
    perMinute: asNumber(record.perMinute),
    bookingFee: asNumber(record.bookingFee),
    minimumFare: asNumber(record.minimumFare),
    commissionPercent: asNumber(record.commissionPercent),
    updatedAt: asNullableString(record.updatedAt),
  };
}

// ---------------------------------------------------------------------------
// Display helpers — every money formatter takes naira as-is (never /100 or
// ×100: the kobo/naira split is settled per field in the header comment).
// ---------------------------------------------------------------------------

export function nairaOrDash(value: number | null | undefined): string {
  return value === null || value === undefined ? EM_DASH : formatNaira(value);
}

export function percentOrDash(value: number | null | undefined): string {
  return value === null || value === undefined ? EM_DASH : `${value}%`;
}

// Plain multiplier as a factor label: 1.5 -> "1.5×".
export function multiplierLabel(value: number | null | undefined): string {
  return value === null || value === undefined ? EM_DASH : `${value}×`;
}

export function effectiveLabel(value: string | null): string {
  return value ? formatDateLabel(value) : EM_DASH;
}

// ---------------------------------------------------------------------------
// Surge rule display + draft builders
// ---------------------------------------------------------------------------

// 0=Sun..6=Sat. Observed daysOfWeek: [1..5].
export const DAY_LABELS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export const SURGE_RULE_TYPES = [
  "time_window",
  "demand",
  "weather",
  "zone",
] as const;

function formatDays(days: number[] | null): string | null {
  if (!days || !days.length) return null;
  const sorted = [...days].sort((a, b) => a - b);
  const labels = sorted.map((day) => DAY_LABELS[day] ?? String(day));
  // Collapse a contiguous run into "Mon–Fri"; otherwise join with commas.
  const isContiguous =
    sorted.length > 2 &&
    sorted.every((day, index) => index === 0 || day === sorted[index - 1] + 1);
  if (isContiguous) {
    return `${labels[0]}–${labels[labels.length - 1]}`;
  }
  return labels.join(", ");
}

function formatScope(rule: SurgeRuleView): string {
  if (rule.city && rule.state && rule.city !== rule.state) {
    return `${rule.city}, ${rule.state}`;
  }
  return rule.city ?? rule.state ?? "All zones";
}

// One-line condition summary derived ONLY from backend fields (the old mock
// "condition" free text has no backend counterpart and is not collected).
// Unknown ruleType values stay visible via humanize() (open-ended enum).
export function buildSurgeCondition(rule: SurgeRuleView): string {
  const parts: string[] = [];
  const type = rule.ruleType ? humanize(rule.ruleType) : EM_DASH;
  if (rule.ruleType === "time_window") {
    const days = formatDays(rule.daysOfWeek) ?? "All days";
    const window =
      rule.startTime && rule.endTime
        ? `${rule.startTime}–${rule.endTime}`
        : EM_DASH;
    parts.push(days, window, formatScope(rule));
  } else if (rule.ruleType === "demand") {
    const threshold =
      rule.demandThresholdPercent === null
        ? EM_DASH
        : `Demand ≥ +${rule.demandThresholdPercent}%`;
    parts.push(threshold, formatScope(rule));
  } else if (rule.ruleType === "weather") {
    const condition = rule.weatherCondition
      ? `Weather: ${humanize(rule.weatherCondition)}`
      : `Weather: ${EM_DASH}`;
    parts.push(condition, formatScope(rule));
  } else if (rule.ruleType === "zone") {
    const window =
      rule.validFrom || rule.validTo
        ? `${rule.validFrom ? formatDateLabel(rule.validFrom) : EM_DASH} – ${rule.validTo ? formatDateLabel(rule.validTo) : EM_DASH}`
        : "No fixed window";
    parts.push(window, formatScope(rule));
  } else {
    parts.push(type, formatScope(rule));
  }
  return parts.join(" • ");
}

function parseFinite(value: string): number | null {
  const parsed = Number(value.trim());
  return value.trim() !== "" && Number.isFinite(parsed) ? parsed : null;
}

// datetime-local value ("2026-11-15T00:00") -> ISO-8601 as documented in the
// .http examples ("...Z"); longer/already-ISO values pass through unchanged.
function toIso(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  return raw.length === 16 ? `${raw}:00Z` : raw;
}

// Staged-by-default draft for the create drawer: inactive + multiplier 1.0 so
// a fresh rule can never be the riskiest option by accident.
export function emptySurgeDraft(): SurgeRuleDraft {
  return {
    name: "",
    description: "",
    ruleType: "time_window",
    multiplier: "1.0",
    priority: "0",
    isActive: false,
    daysOfWeek: [],
    startTime: "",
    endTime: "",
    city: "",
    state: "",
    demandThresholdPercent: "",
    weatherCondition: "",
    validFrom: "",
    validTo: "",
  };
}

export function surgeDraftFromRule(rule: SurgeRuleView): SurgeRuleDraft {
  return {
    name: rule.name,
    description: rule.description ?? "",
    ruleType: rule.ruleType,
    multiplier: rule.multiplier === null ? "1.0" : String(rule.multiplier),
    priority: rule.priority === null ? "0" : String(rule.priority),
    isActive: rule.isActive,
    daysOfWeek: rule.daysOfWeek ? [...rule.daysOfWeek] : [],
    startTime: rule.startTime ?? "",
    endTime: rule.endTime ?? "",
    city: rule.city ?? "",
    state: rule.state ?? "",
    demandThresholdPercent:
      rule.demandThresholdPercent === null
        ? ""
        : String(rule.demandThresholdPercent),
    weatherCondition: rule.weatherCondition ?? "",
    validFrom: rule.validFrom ? rule.validFrom.slice(0, 16) : "",
    validTo: rule.validTo ? rule.validTo.slice(0, 16) : "",
  };
}

// Required fields per ruleType:
//   time_window: startTime, endTime
//   demand:      demandThresholdPercent
//   weather:     weatherCondition
//   zone:        city or state
// name is required for every create/update.
export function surgeDraftIsValid(draft: SurgeRuleDraft): boolean {
  if (!draft.name.trim()) return false;
  if (parseFinite(draft.multiplier) === null) return false;
  switch (draft.ruleType) {
    case "time_window":
      return Boolean(draft.startTime.trim() && draft.endTime.trim());
    case "demand":
      return parseFinite(draft.demandThresholdPercent) !== null;
    case "weather":
      return Boolean(draft.weatherCondition.trim());
    case "zone":
      return Boolean(draft.city.trim() || draft.state.trim());
    default:
      // Unknown/new ruleType: only the universal requirements are enforced;
      // the backend message surfaces anything else on confirm.
      return true;
  }
}

// Draft -> POST/PATCH body. Empty optional fields are dropped entirely:
// on PATCH (full replace) an omitted optional defaults to null, so clearing
// a field in the drawer nulls it server-side. Days are sorted; [] means all
// days and is dropped. multiplier falls back to 1 (no surge) if unparsable —
// never a surprise high value.
export function buildSurgeBody(draft: SurgeRuleDraft): SurgeRuleBody {
  const body: SurgeRuleBody = {
    name: draft.name.trim(),
    ruleType: draft.ruleType,
    multiplier: parseFinite(draft.multiplier) ?? 1,
    priority: parseFinite(draft.priority) ?? 0,
    isActive: draft.isActive,
  };
  const description = draft.description.trim();
  if (description) body.description = description;
  if (draft.daysOfWeek.length) {
    body.daysOfWeek = [...draft.daysOfWeek].sort((a, b) => a - b);
  }
  const startTime = draft.startTime.trim();
  const endTime = draft.endTime.trim();
  if (startTime) body.startTime = startTime;
  if (endTime) body.endTime = endTime;
  const city = draft.city.trim();
  const state = draft.state.trim();
  if (city) body.city = city;
  if (state) body.state = state;
  const threshold = parseFinite(draft.demandThresholdPercent);
  if (threshold !== null) body.demandThresholdPercent = threshold;
  const weather = draft.weatherCondition.trim();
  if (weather) body.weatherCondition = weather;
  const validFrom = toIso(draft.validFrom);
  const validTo = toIso(draft.validTo);
  if (validFrom) body.validFrom = validFrom;
  if (validTo) body.validTo = validTo;
  return body;
}

