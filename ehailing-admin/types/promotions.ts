import type { StatusTone } from "@/components/ui/StatusPill";
import { formatNaira } from "@/lib/format";
export type PromotionStatus = "Active" | "Scheduled" | "Paused" | "Expired";

export type DiscountType = "Percentage" | "Fixed";

// Avatar tone set (mirrors InitialsAvatar's tone prop).
export type PromotionTone = "brand" | "success" | "warning" | "info";

export interface Promotion {
  id: string;
  code: string;
  name: string;
  initials: string;
  tone: PromotionTone;
  discountType: DiscountType;
  // Percentage points (e.g. 20) or a naira amount for "Fixed" (e.g. 5000).
  discountValue: number;
  // Cap for percentage discounts in naira; null for fixed discounts.
  maxDiscount: number | null;
  usageLimit: number;
  usedCount: number;
  // ISO date strings (YYYY-MM-DD).
  startDate: string;
  endDate: string;
  status: PromotionStatus;
  lastUpdated: string;
}

export interface PromotionSummary {
  activeCampaigns: number;
  endingSoonNote: string;
  totalRedemptions: number;
  redemptionsDelta: string;
  discountValue: string;
  discountValueNote: string;
  conversionRate: string;
  conversionDelta: string;
}

export const PROMOTION_STATUS_TONE: Record<PromotionStatus, StatusTone> = {
  Active: "success",
  Scheduled: "info",
  Paused: "warning",
  Expired: "neutral",
};

// Status list for the toolbar select and the status tabs.
export const PROMOTION_STATUSES: PromotionStatus[] = [
  "Active",
  "Scheduled",
  "Paused",
  "Expired",
];

// Display string for the "Discount value" column / drawer field:
//   Percentage -> "20% • Max ₦2,000"; Fixed -> "₦5,000".
export function formatDiscount(promotion: {
  discountType: DiscountType;
  discountValue: number;
  maxDiscount: number | null;
}): string {
  if (promotion.discountType === "Fixed") {
    return formatNaira(promotion.discountValue);
  }
  const cap =
    promotion.maxDiscount !== null
      ? ` • Max ${formatNaira(promotion.maxDiscount)}`
      : "";
  return `${promotion.discountValue}%${cap}`;
}

// "01 Jun 2025" style, matching the table's date columns.
export function formatPromotionDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
