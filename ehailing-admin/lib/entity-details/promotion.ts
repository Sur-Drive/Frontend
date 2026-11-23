import {
  PROMOTION_STATUS_TONE,
  formatDiscount,
  formatPromotionDate,
} from "@/types/promotions";
import type { Promotion } from "@/types/promotions";
import type { EntityDetailsModel } from "@/types/entity-details";

const TIMELINE_STEPS = [
  { title: "Record created", time: "Today, 9:42 AM" },
  { title: "Assigned for review", time: "Today, 9:48 AM" },
  { title: "Latest status update", time: "10 minutes ago" },
];

// Renders purely from the row, so the drawer never needs its own fetching.
// The Timeline/History/Notes data isn't modelled yet, so Timeline and History
// are empty states that will be replaced when an endpoint is confirmed.
export function buildPromotionDetails(promotion: Promotion): EntityDetailsModel {
  const emptyTab = (label: string) => ({
    id: label.toLowerCase(),
    label,
    sections: [
      {
        kind: "empty" as const,
        title: label,
        message: `${label} will appear here once connected.`,
      },
    ],
  });

  return {
    entity: "promotion",
    id: promotion.id,
    eyebrow: "PROMOTION DETAILS",
    title: promotion.name,
    subtitle: `${promotion.code} • Last updated ${promotion.lastUpdated}`,
    tabs: [
      {
        id: "overview",
        label: "Overview",
        sections: [
          {
            kind: "info",
            title: "Promotion information",
            items: [
              { label: "Promo code", value: promotion.code },
              { label: "Type", value: promotion.discountType },
              {
                label: "Value",
                value: formatDiscount(promotion),
              },
              {
                label: "Limit",
                value: promotion.usageLimit.toLocaleString("en-US"),
              },
              {
                label: "Used",
                value: promotion.usedCount.toLocaleString("en-US"),
              },
              { label: "Start date", value: formatPromotionDate(promotion.startDate) },
              { label: "End date", value: formatPromotionDate(promotion.endDate) },
              {
                label: "Status",
                value: null,
                pill: {
                  tone: PROMOTION_STATUS_TONE[promotion.status],
                  label: promotion.status,
                },
              },
            ],
          },
          {
            kind: "timeline",
            title: "Activity timeline",
            steps: TIMELINE_STEPS,
          },
        ],
      },
      emptyTab("Timeline"),
      emptyTab("History"),
      {
        id: "notes",
        label: "Notes",
        sections: [
          {
            kind: "notes",
            title: "Internal notes",
            placeholder: "Add an internal note about this campaign...",
          },
        ],
      },
    ],
    actions: promotionActions(promotion),
  };
}

// Footer actions for the drawer, in order: Expire (danger), Pause (outline),
// Activate (brand). Disabled (not hidden) when not valid for the status, each
// with a tooltip explaining why. Expired disables all three.
function promotionActions(promotion: Promotion) {
  const status = promotion.status;
  const expired = status === "Expired";
  return [
    {
      id: "expire",
      label: "Expire campaign",
      variant: "danger" as const,
      dialogTitle: "Confirm expire campaign",
      confirmTone: "danger" as const,
      disabled: expired,
      disabledReason: expired ? "Campaign is already expired." : undefined,
    },
    {
      id: "pause",
      label: "Pause campaign",
      variant: "outline" as const,
      dialogTitle: "Confirm pause campaign",
      disabled: status === "Paused" || expired,
      disabledReason: expired
        ? "Expired campaigns cannot be paused."
        : status === "Paused"
          ? "Campaign is already paused."
          : undefined,
    },
    {
      id: "activate",
      label: "Activate campaign",
      variant: "brand" as const,
      dialogTitle: "Confirm activate campaign",
      disabled: status === "Active" || expired,
      disabledReason: expired
        ? "Expired campaigns cannot be activated."
        : status === "Active"
          ? "Campaign is already active."
          : undefined,
    },
  ];
}
