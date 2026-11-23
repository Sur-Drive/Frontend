import type { Metadata } from "next";
import { PassengersView } from "@/components/admin/passengers/PassengersView";

export const metadata: Metadata = {
  title: "Passenger Management | SUR-DRIVEHT Admin",
};

// Data is fetched client-side from GET /admin/ride-hailing/passengers (see
// lib/passengers.ts); the view owns pagination, search and filter state.
export default function PassengersPage() {
  return <PassengersView />;
}

