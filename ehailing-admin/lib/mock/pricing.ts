import type { RideCategory } from "@/types/pricing";
import type { SurgeRule, CityPricing } from "@/types/pricing";
import { CITY_NAMES } from "@/types/pricing";

// Mock ride categories. Only Comfort's pricing-config values (commission,
// cancellation/waiting fees, surge toggle) come from the design; the other
// five categories reuse identical placeholder defaults until per-category
// config is specified.
export function getRideCategories(): RideCategory[] {
  return [
    {
      id: "cat-economy",
      name: "Economy",
      description: "Affordable everyday rides",
      status: "Active",
      tint: "brand",
      vehicleType: "Sedan",
      minimumVehicleYear: 2012,
      maxPassengers: 4,
      baseFare: 800,
      perKm: 180,
      perMinute: 35,
      bookingFee: 250,
      minimumFare: 1500,
      commissionPct: 15,
      cancellationFee: 1000,
      waitingFeePerMin: 60,
      surgeEnabled: true,
    },
    {
      id: "cat-comfort",
      name: "Comfort",
      description: "Extra comfort with working AC",
      status: "Active",
      tint: "accent",
      vehicleType: "Premium sedan",
      minimumVehicleYear: 2015,
      maxPassengers: 4,
      baseFare: 1200,
      perKm: 240,
      perMinute: 45,
      bookingFee: 300,
      minimumFare: 2000,
      commissionPct: 15,
      cancellationFee: 1000,
      waitingFeePerMin: 60,
      surgeEnabled: true,
    },
    {
      id: "cat-suv",
      name: "SUV",
      description: "Space and approved storage capacity",
      status: "Active",
      tint: "info",
      vehicleType: "Approved SUV",
      minimumVehicleYear: 2016,
      maxPassengers: 6,
      baseFare: 2000,
      perKm: 320,
      perMinute: 55,
      bookingFee: 400,
      minimumFare: 3200,
      commissionPct: 15,
      cancellationFee: 1000,
      waitingFeePerMin: 60,
      surgeEnabled: true,
    },
    {
      id: "cat-xl",
      name: "XL / Large",
      description: "Group travel with more seats",
      status: "Active",
      tint: "brand",
      vehicleType: "Minivan",
      minimumVehicleYear: 2017,
      maxPassengers: 7,
      baseFare: 2400,
      perKm: 350,
      perMinute: 60,
      bookingFee: 450,
      minimumFare: 3800,
      commissionPct: 15,
      cancellationFee: 1000,
      waitingFeePerMin: 60,
      surgeEnabled: true,
    },
    {
      id: "cat-premium",
      name: "Premium",
      description: "Executive cars and top-rated drivers",
      status: "Active",
      tint: "accent",
      vehicleType: "Luxury sedan",
      minimumVehicleYear: 2019,
      maxPassengers: 4,
      baseFare: 3500,
      perKm: 480,
      perMinute: 80,
      bookingFee: 600,
      minimumFare: 5500,
      commissionPct: 15,
      cancellationFee: 1000,
      waitingFeePerMin: 60,
      surgeEnabled: true,
    },
    {
      id: "cat-accessible",
      name: "Accessible",
      description: "Wheelchair-accessible transport",
      status: "Pilot",
      tint: "info",
      vehicleType: "Approved adapted vehicle",
      minimumVehicleYear: null,
      maxPassengers: 4,
      baseFare: 900,
      perKm: 180,
      perMinute: 35,
      bookingFee: 0,
      minimumFare: 1500,
      commissionPct: 15,
      cancellationFee: 1000,
      waitingFeePerMin: 60,
      surgeEnabled: true,
    },
  ];
}

// Surge-pricing rules mirroring the design screenshots.
export function getSurgeRules(): SurgeRule[] {
  return [
    {
      id: "sr-weekday-rush",
      name: "Weekday rush hour",
      description: "Demand exceeds supply by 30% in Airport zones",
      condition: "Mon–Fri • 5:00 PM–8:00 PM • Lagos Island",
      multiplier: "1.5x",
      active: true,
    },
    {
      id: "sr-airport-demand",
      name: "Airport demand",
      description: "Demand exceeds supply by 30% • Airport zones",
      condition: "Anytime • Airport zones",
      multiplier: "1.3x",
      active: true,
    },
    {
      id: "sr-rain-response",
      name: "Rain response",
      description: "Weather alert is active • All Lagos zones",
      condition: "Weather alert active • All Lagos zones",
      multiplier: "1.2x",
      active: false,
    },
    {
      id: "sr-new-rule",
      name: "New surge rule",
      description: "Configure condition • All zones",
      condition: "Configure condition • All zones",
      multiplier: "1.2x",
      active: false,
    },
  ];
}

// Default city pricing per city, keyed by category id. All cities start with
// the same base category rates (from getRideCategories); overrides can be
// saved per city.
export function getCityPricing(): CityPricing[] {
  const categories = getRideCategories();
  return CITY_NAMES.map((city) => ({
    city,
    rates: categories.map((cat) => ({
      categoryId: cat.id,
      baseFare: cat.baseFare,
      perKm: cat.perKm,
      perMinute: cat.perMinute,
      bookingFee: cat.bookingFee,
      minimumFare: cat.minimumFare,
    })),
  }));
}

export function getCityPricingByCity(city: string): CityPricing | undefined {
  return getCityPricing().find((cp) => cp.city === city);
}
