import type { Metadata } from "next";
import { PaymentsView } from "@/components/admin/finance/PaymentsView";

export const metadata: Metadata = {
  title: "Payments & Transactions | SUR-DRIVEHT Admin",
};

// Finance 1/4: the overview cards and transactions table/drawer fetch their
// live data client-side (lib/finance.ts) — no mock payload is passed in.
export default function PaymentsTransactionsPage() {
  return <PaymentsView />;
}
