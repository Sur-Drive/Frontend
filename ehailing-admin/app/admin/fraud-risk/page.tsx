import type { Metadata } from "next";
import { FraudRiskView } from "@/components/admin/trust/FraudRiskView";

export const metadata: Metadata = {
  title: "Fraud & Risk | SUR-DRIVEHT Admin",
};

// Server shell only: the view fetches stats/list from the backend client-side
// (lib/fraud.ts) — no mock data.
export default function FraudRiskPage() {
  return <FraudRiskView />;
}
