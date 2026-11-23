import type { Metadata } from "next";
import { getPromotionsData } from "@/lib/mock/promotions";
import { PromotionsView } from "@/components/admin/promotions/PromotionsView";

export const metadata: Metadata = {
  title: "Promotions | SUR-DRIVEHT Admin",
};

export default function PromotionsPage() {
  const { summary, promotions } = getPromotionsData();
  return (
    <PromotionsView promotions={promotions} summary={summary} />
  );
}
