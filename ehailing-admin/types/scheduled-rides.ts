import type { StatusTone } from "@/components/ui/StatusPill";
import type { Person, RideCategory } from "@/types/rides";

export type ScheduledStatus =
  | "Confirmed"
  | "Pending Assignment"
  | "Cancelled";

export type WhenBucket = "today" | "tomorrow" | "later";

export interface ScheduledRide {
  id: string;
  passenger: Person;
  pickup: string;
  destination: string;
  whenLabel: string;
  whenBucket: WhenBucket;
  // null when no driver has been assigned yet.
  driverName: string | null;
  status: ScheduledStatus;
  category: RideCategory;
  estimatedFare: number;
  distanceKm: number;
  durationMin: number;
  vehicle: string | null;
}

export const SCHEDULED_STATUS_TONE: Record<ScheduledStatus, StatusTone> = {
  Confirmed: "success",
  "Pending Assignment": "warning",
  Cancelled: "neutral",
};
