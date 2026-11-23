import type { Metadata } from "next";
import { DriversView } from "@/components/admin/drivers/DriversView";

export const metadata: Metadata = {
  title: "Driver Management | SUR-DRIVEHT Admin",
};

// Data is fetched client-side from GET /admin/ride-hailing/drivers (see
// lib/drivers.ts); the view owns pagination, search and filter state.
export default function DriversPage() {
  return <DriversView />;
}

