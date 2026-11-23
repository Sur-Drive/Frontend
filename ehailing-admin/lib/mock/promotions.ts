import type { Promotion, PromotionSummary } from "@/types/promotions";

// Placeholder until endpoints are confirmed.
export function getPromotionsData(): {
  summary: PromotionSummary;
  promotions: Promotion[];
} {
  const summary: PromotionSummary = {
    activeCampaigns: 8,
    endingSoonNote: "3 ending soon",
    totalRedemptions: 12482,
    redemptionsDelta: "+24.8%",
    discountValue: "₦8.42M",
    discountValueNote: "This month",
    conversionRate: "18.6%",
    conversionDelta: "+2.4%",
  };

  const promotions: Promotion[] = [
    {
      id: "promo-lagos20",
      code: "LAGOS20",
      name: "Lagos Weekday Saver",
      initials: "LW",
      tone: "brand",
      discountType: "Percentage",
      discountValue: 20,
      maxDiscount: 2000,
      usageLimit: 5000,
      usedCount: 3842,
      startDate: "2025-06-01",
      endDate: "2025-06-30",
      status: "Active",
      lastUpdated: "just now",
    },
    {
      id: "promo-welcome25",
      code: "WELCOME25",
      name: "New Rider Welcome",
      initials: "NR",
      tone: "warning",
      discountType: "Percentage",
      discountValue: 25,
      maxDiscount: 3000,
      usageLimit: 10000,
      usedCount: 6104,
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      status: "Active",
      lastUpdated: "just now",
    },
    {
      id: "promo-airport5k",
      code: "AIRPORT5K",
      name: "Airport Transfer Offer",
      initials: "AT",
      tone: "info",
      discountType: "Fixed",
      discountValue: 5000,
      maxDiscount: null,
      usageLimit: 1000,
      usedCount: 892,
      startDate: "2025-05-15",
      endDate: "2025-07-15",
      status: "Paused",
      lastUpdated: "just now",
    },
    {
      id: "promo-comfort15",
      code: "COMFORT15",
      name: "Comfort Class Week",
      initials: "CC",
      tone: "success",
      discountType: "Percentage",
      discountValue: 15,
      maxDiscount: 1500,
      usageLimit: 2500,
      usedCount: 2500,
      startDate: "2025-05-01",
      endDate: "2025-05-31",
      status: "Expired",
      lastUpdated: "just now",
    },
  ];

  return { summary, promotions };
}
