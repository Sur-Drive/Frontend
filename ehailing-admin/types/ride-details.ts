import type { StatusTone } from "@/components/ui/StatusPill";

// Presentation-agnostic model for the shared ride details drawer, so Ride
// Management, Scheduled Rides and Live Operations can all feed it.

export interface DetailItem {
  label: string;
  // null renders as an em dash.
  value: string | null;
  // When set, renders a StatusPill instead of the plain text value.
  pill?: { tone: StatusTone; label: string };
}

export interface TimelineStep {
  label: string;
  state: "done" | "current" | "upcoming" | "danger";
  tag?: { tone: StatusTone; label: string };
}

export interface RideDetailsModel {
  id: string;
  // The passenger name, used as the drawer title.
  title: string;
  from: string;
  to: string;
  distanceKm: number;
  durationMin: number;
  // Trip information cards, in render order.
  info: DetailItem[];
  timeline: TimelineStep[];
  payment: DetailItem[];
  supportEmptyText: string;
}
