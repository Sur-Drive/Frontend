import type { Metadata } from "next";
import { SettlementsView } from "@/components/admin/finance/SettlementsView";

export const metadata: Metadata = {
  title: "Driver Settlements | SUR-DRIVEHT Admin",
};

// The settlement stats cards, list and drawer fetch their live
// data client-side (lib/finance.ts) — no mock payload is passed in.
export default function DriverSettlementsPage() {
  return <SettlementsView />;
}

