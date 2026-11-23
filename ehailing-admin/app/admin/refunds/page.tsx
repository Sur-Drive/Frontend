import type { Metadata } from "next";
import { RefundsView } from "@/components/admin/finance/RefundsView";

export const metadata: Metadata = {
  title: "Refunds | SUR-DRIVEHT Admin",
};

// The refund stats cards, list and drawer fetch their live data
// client-side (lib/finance.ts) — no mock payload is passed in.
export default function RefundsPage() {
  return <RefundsView />;
}
