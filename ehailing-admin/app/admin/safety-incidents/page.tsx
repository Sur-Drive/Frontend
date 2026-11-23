import type { Metadata } from "next";
import { SafetyIncidentsView } from "@/components/admin/trust/SafetyIncidentsView";

export const metadata: Metadata = {
  title: "Safety & Incidents | SUR-DRIVEHT Admin",
};

// Server shell only: the view fetches stats/list from the backend client-side
// (lib/safety-incidents.ts) — no mock data.
export default function SafetyIncidentsPage() {
  return <SafetyIncidentsView />;
}
