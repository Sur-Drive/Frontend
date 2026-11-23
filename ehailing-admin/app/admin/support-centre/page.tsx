import type { Metadata } from "next";
import { getSupportTicketsData } from "@/lib/mock/support-tickets";
import { SupportCentreView } from "@/components/admin/trust/SupportCentreView";

export const metadata: Metadata = {
  title: "Support Centre | SUR-DRIVEHT Admin",
};

export default function SupportCentrePage() {
  const { tickets } = getSupportTicketsData();
  return <SupportCentreView tickets={tickets} />;
}
