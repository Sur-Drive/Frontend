import type { Metadata } from "next";
import { OverviewView } from "@/components/admin/overview/OverviewView";

export const metadata: Metadata = {
  title: "Dashboard | E-HAILING Admin",
};

export default function AdminOverviewPage() {
  return <OverviewView />;
}
