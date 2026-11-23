import type { Metadata } from "next";
import { VerificationView } from "@/components/admin/verification/VerificationView";

export const metadata: Metadata = {
  title: "Verification Centre | SUR-DRIVEHT Admin",
};

// Server shell only: the view fetches stats + the queue through apiFetch on
// the client, like the Drivers/Passengers/Vehicles pages.
export default function VerificationCentrePage() {
  return <VerificationView />;
}
