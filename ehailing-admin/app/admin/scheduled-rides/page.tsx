import type { Metadata } from "next";
import { getScheduledRidesData } from "@/lib/mock/scheduled-rides";
import { ScheduledRidesView } from "@/components/admin/scheduled-rides/ScheduledRidesView";

export const metadata: Metadata = {
  title: "Scheduled Rides | SUR-DRIVEHT Admin",
};

export default function ScheduledRidesPage() {
  const rides = getScheduledRidesData();
  return <ScheduledRidesView rides={rides} />;
}
