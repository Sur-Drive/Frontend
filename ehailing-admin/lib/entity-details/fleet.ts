import { FLEET_STATUS_TONE } from "@/types/fleets";
import type { EntityDetailsModel } from "@/types/entity-details";
import type { Fleet } from "@/types/fleets";

const TIMELINE_STEPS = [
  { title: "Record created", time: "Today, 9:42 AM" },
  { title: "Assigned for review", time: "Today, 9:48 AM" },
  { title: "Latest status update", time: "10 minutes ago" },
];

// Renders purely from the row, so the drawer never needs its own fetching.
// The driver/vehicle-level data isn't modelled yet, so those tabs are empty
// states that will be replaced when an endpoint is confirmed.
export function buildFleetDetails(fleet: Fleet): EntityDetailsModel {
  const emptyTab = (label: string) => ({
    id: label.toLowerCase().replace(/ /g, "-"),
    label,
    sections: [
      {
        kind: "empty" as const,
        title: label,
        message: `${label} details will appear here once connected.`,
      },
    ],
  });

  return {
    entity: "fleet",
    id: fleet.id,
    eyebrow: "FLEET DETAILS",
    title: fleet.name,
    subtitle: `${fleet.id} • Last updated just now`,
    tabs: [
      {
        id: "overview",
        label: "Overview",
        sections: [
          {
            kind: "info",
            title: "Fleet information",
            items: [
              { label: "ID", value: fleet.id },
              { label: "Owner", value: fleet.owner },
              { label: "Drivers", value: String(fleet.drivers) },
              { label: "Vehicles", value: String(fleet.vehicles) },
              { label: "Rides", value: String(fleet.activeRides) },
              { label: "Compliance", value: `${fleet.compliance}%` },
              {
                label: "Status",
                value: null,
                pill: {
                  tone: FLEET_STATUS_TONE[fleet.status],
                  label: fleet.status,
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
      emptyTab("Drivers"),
      emptyTab("Vehicles"),
      emptyTab("Performance"),
      emptyTab("Earnings"),
      emptyTab("Documents"),
      emptyTab("Activity"),
    ],
    actions: [
      {
        id: "suspend",
        label: "Suspend",
        variant: "danger",
        dialogTitle: "Confirm suspend",
        confirmTone: "danger",
      },
      {
        id: "review-documents",
        label: "Review documents",
        variant: "outline",
        dialogTitle: "Confirm review documents",
      },
      {
        id: "approve-fleet",
        label: "Approve fleet",
        variant: "brand",
        dialogTitle: "Confirm approve fleet",
        confirmTone: "brand",
      },
    ],
  };
}
