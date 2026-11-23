import type { StatusTone } from "@/components/ui/StatusPill";

export type CategoryStatus = "Active" | "Pilot" | "Inactive";

// Icon-tile tint cycles purple → yellow → blue across the category cards.
export type CategoryTint = "brand" | "accent" | "info";

export interface RideCategory {
  id: string;
  name: string;
  description: string;
  status: CategoryStatus;
  tint: CategoryTint;
  // Vehicle eligibility.
  vehicleType: string;
  // Minimum acceptable model year, or null when a year doesn't apply
  // (e.g. adapted vehicles) so the card renders no "• <year> or newer".
  minimumVehicleYear: number | null;
  maxPassengers: number;
  // Fees in naira.
  baseFare: number;
  perKm: number;
  perMinute: number;
  bookingFee: number;
  minimumFare: number;
  // Platform fee / behaviour config (Pricing Configuration tab).
  commissionPct: number;
  cancellationFee: number;
  waitingFeePerMin: number;
  surgeEnabled: boolean;
}

export const CATEGORY_STATUS_TONE: Record<CategoryStatus, StatusTone> = {
  Active: "success",
  Pilot: "warning",
  Inactive: "neutral",
};

export const CATEGORY_STATUSES: CategoryStatus[] = [
  "Active",
  "Pilot",
  "Inactive",
];

// Single source for the city shown on the Pricing Configuration card. Kept as
// one constant so the City Pricing tab can adopt/replace it in one place.
export const DEFAULT_CITY = "Lagos";

export const CITY_NAMES = ["Lagos", "Abuja", "Port Harcourt"] as const;

export type CityName = (typeof CITY_NAMES)[number];

// A surge-pricing rule. Multiplier is stored as a string like "1.5x" so the
// input stays controlled while the user types; parsed back on save.
export interface SurgeRule {
  id: string;
  name: string;
  description: string;
  condition: string; // e.g. "Mon-Fri • 5:00 PM-8:00 PM • Lagos Island"
  multiplier: string; // e.g. "1.5x"
  active: boolean;
}

// City-specific pricing overrides for ride categories.
export interface CityCategoryRate {
  categoryId: string;
  baseFare: number;
  perKm: number;
  perMinute: number;
  bookingFee: number;
  minimumFare: number;
}

export interface CityPricing {
  city: CityName;
  rates: CityCategoryRate[];
}
