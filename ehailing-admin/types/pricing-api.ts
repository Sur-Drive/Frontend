// Observed shapes for the ride-pricing endpoints.
// Observed 2026-11-13 via GET probes; every field is optional/nullable on
// purpose — mappers read defensively so a missing or null value renders "—"
// and never throws. Enums (rideType, ruleType) are open-ended: the observed
// values are samples, never exhaustive, so unknown values fall back to a
// neutral humanised label.
//
// Envelopes observed (2026-11-13) — NOT uniform:
//   GET /pricing/categories      wrapped { items, availableRideTypes }
//   GET /pricing/categories/{t}  bare object + history[]
//   GET /pricing/defaults        bare object (null/empty when never set)
//   GET /pricing/cities          BARE ARRAY (empty filter -> empty body)
//   GET /pricing/surge-rules     BARE ARRAY
//
// Money units (settled by arithmetic against observed pairs, see the
// lib/pricing.ts header): every fare/fee field is NAIRA; commissionPercent
// and demandThresholdPercent are 0-100 percents; multipliers are plain
// factors (1.5 = 1.5x); waitingGraceMin is minutes; priority is an int.

// One active global pricing rule per ride type (observed: economy, comfort,
// suv — not treated as exhaustive).
export interface PricingCategoryItem {
  rideType?: string | null;
  scope?: string | null;
  city?: string | null;
  state?: string | null;
  active?: boolean | null;
  version?: string | null;
  baseFare?: number | null; // naira
  perKm?: number | null; // naira
  perMinute?: number | null; // naira
  bookingFee?: number | null; // naira
  minimumFare?: number | null; // naira
  cancellationFee?: number | null; // naira
  waitingFeePerMin?: number | null; // naira
  waitingGraceMin?: number | null; // minutes
  commissionPercent?: number | null; // 0-100
  surge?: { active?: boolean | null; multiplier?: number | null } | null;
  ruleId?: string | null;
  effectiveFrom?: string | null;
}

// Observed wrapped list response. Mappers also tolerate a bare array.
export interface PricingCategoriesResponse {
  items?: PricingCategoryItem[] | null;
  availableRideTypes?: string[] | null;
}

// GET /pricing/defaults — singleton fallback row; null when never configured.
export interface PricingDefaultsItem {
  id?: string | null;
  baseFare?: number | null; // naira
  perKm?: number | null; // naira
  perMinute?: number | null; // naira
  bookingFee?: number | null; // naira
  minimumFare?: number | null; // naira
  commissionPercent?: number | null; // 0-100
  updatedAt?: string | null;
}

// One city-scoped rule (list response carries only three money fields).
export interface CityPricingRuleItem {
  city?: string | null;
  state?: string | null;
  rideType?: string | null;
  baseFare?: number | null; // naira
  perKm?: number | null; // naira
  perMinute?: number | null; // naira
  active?: boolean | null;
  ruleId?: string | null;
  version?: string | null;
}

// Surge rule (list = all rules, active + inactive, priority DESC).
export interface SurgeRuleItem {
  id?: string | null;
  name?: string | null;
  description?: string | null;
  ruleType?: string | null; // time_window | demand | weather | zone observed
  multiplier?: number | null; // plain factor, e.g. 1.5
  isActive?: boolean | null;
  priority?: number | null;
  daysOfWeek?: number[] | null; // 0=Sun..6=Sat; null = all days
  startTime?: string | null; // HH:MM
  endTime?: string | null; // HH:MM
  state?: string | null;
  city?: string | null;
  demandThresholdPercent?: number | null; // 0-100
  weatherCondition?: string | null;
  validFrom?: string | null;
  validTo?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

// ---------------------------------------------------------------------------
// View models (mapped, null-safe; null money renders "—", never a fake 0)
// ---------------------------------------------------------------------------

export interface PricingCategoryView {
  rideType: string; // raw enum value, used in the PATCH path
  label: string; // display label ("Economy", "SUV", humanised fallback)
  scope: string | null;
  active: boolean;
  version: string | null;
  effectiveFrom: string | null;
  baseFare: number | null; // naira
  perKm: number | null; // naira
  perMinute: number | null; // naira
  bookingFee: number | null; // naira
  minimumFare: number | null; // naira
  cancellationFee: number | null; // naira
  waitingFeePerMin: number | null; // naira
  waitingGraceMin: number | null; // minutes
  commissionPercent: number | null; // 0-100
  surgeActive: boolean | null;
  surgeMultiplier: number | null; // plain factor
  ruleId: string | null;
}

export interface CityRuleView {
  city: string;
  state: string | null;
  rideType: string;
  rideTypeLabel: string;
  baseFare: number | null; // naira
  perKm: number | null; // naira
  perMinute: number | null; // naira
  active: boolean;
  ruleId: string | null;
  version: string | null;
}

export interface SurgeRuleView {
  id: string;
  name: string;
  description: string | null;
  ruleType: string;
  multiplier: number | null; // plain factor
  isActive: boolean;
  priority: number | null;
  daysOfWeek: number[] | null; // 0=Sun..6=Sat; null = all days
  startTime: string | null;
  endTime: string | null;
  city: string | null;
  state: string | null;
  demandThresholdPercent: number | null;
  weatherCondition: string | null;
  validFrom: string | null;
  validTo: string | null;
}

export interface PricingDefaultsView {
  baseFare: number | null; // naira
  perKm: number | null; // naira
  perMinute: number | null; // naira
  bookingFee: number | null; // naira
  minimumFare: number | null; // naira
  commissionPercent: number | null; // 0-100
  updatedAt: string | null;
}

// ---------------------------------------------------------------------------
// Mutation bodies (only fields the endpoints document)
// ---------------------------------------------------------------------------

// PATCH /pricing/categories/{rideType} — omitted fields carry forward.
export interface CategoryPatchBody {
  baseFare?: number;
  perKm?: number;
  perMinute?: number;
  bookingFee?: number;
  minimumFare?: number;
  cancellationFee?: number;
  waitingFeePerMin?: number;
  waitingGraceMin?: number;
  commissionPercent?: number;
}

// PATCH /pricing/defaults — upsert; all 6 fields required.
export interface DefaultsPatchBody {
  baseFare: number;
  perKm: number;
  perMinute: number;
  bookingFee: number;
  minimumFare: number;
  commissionPercent: number;
}

// PATCH /pricing/cities/{rideType}/{city} — partial; omitted carry forward.
// The documented example only shows these three fields, so only these three
// are ever collected or sent.
export interface CityPatchBody {
  baseFare?: number;
  perKm?: number;
  perMinute?: number;
}

// POST /pricing/surge-rules and PATCH /pricing/surge-rules/{id} share the
// documented field set. The PATCH is a FULL REPLACE: optional fields omitted
// default to null, so builders always send every value the draft holds and
// drop only empty ones (empty -> null).
export interface SurgeRuleBody {
  name: string;
  description?: string;
  ruleType: string;
  multiplier: number;
  priority: number;
  isActive?: boolean;
  daysOfWeek?: number[]; // omit = all days
  startTime?: string;
  endTime?: string;
  city?: string;
  state?: string;
  demandThresholdPercent?: number;
  weatherCondition?: string;
  validFrom?: string;
  validTo?: string;
}

// Everything the surge drawer edits. Strings keep the inputs controlled;
// buildSurgeBody parses them back and drops empty optionals.
export interface SurgeRuleDraft {
  name: string;
  description: string;
  ruleType: string;
  multiplier: string;
  priority: string;
  isActive: boolean;
  daysOfWeek: number[]; // selected days; [] = all days
  startTime: string;
  endTime: string;
  city: string;
  state: string;
  demandThresholdPercent: string;
  weatherCondition: string;
  validFrom: string; // datetime-local value ("2026-11-15T00:00")
  validTo: string;
}
