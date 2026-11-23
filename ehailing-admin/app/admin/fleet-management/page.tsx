import type { Metadata } from "next";
import { getFleetsData } from "@/lib/mock/fleets";
import { FleetsView } from "@/components/admin/fleets/FleetsView";

export const metadata: Metadata = {
  title: "Fleet Management | SUR-DRIVEHT Admin",
};

export default function FleetManagementPage() {
  const { summary, fleets } = getFleetsData();
  return <FleetsView fleets={fleets} summary={summary} />;
}
