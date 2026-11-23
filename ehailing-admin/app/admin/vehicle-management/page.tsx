import type { Metadata } from "next";
import { VehiclesView } from "@/components/admin/vehicles/VehiclesView";

export const metadata: Metadata = {
  title: "Vehicle Management | SUR-DRIVEHT Admin",
};

// Data is fetched client-side from GET /admin/ride-hailing/vehicles (see
// lib/vehicles.ts); the view owns pagination, search and filter state.
export default function VehicleManagementPage() {
  return <VehiclesView />;
}
