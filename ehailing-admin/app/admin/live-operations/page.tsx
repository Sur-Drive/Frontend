import type { Metadata } from "next";
import { MAP } from "@/lib/mock/live-operations-map";
import { LiveOperationsView } from "@/components/admin/live-operations/LiveOperationsView";

export const metadata: Metadata = {
  title: "Live Operations | SUR-DRIVEHT Admin",
};

// Server shell only: every number, row and drawer on this page comes from
// GET /admin/ride-hailing/live-operations (polled client-side).
export default function LiveOperationsPage() {
  return <LiveOperationsView map={MAP} />;
}

