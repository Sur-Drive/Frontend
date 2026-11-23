import type { Metadata } from "next";
import { PricingCategoriesView } from "@/components/admin/growth/PricingCategoriesView";

export const metadata: Metadata = {
  title: "Pricing & Categories | SUR-DRIVEHT Admin",
};

export default async function PricingCategoriesPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string | string[] }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const tabParam = params?.tab;
  const initialTab = Array.isArray(tabParam) ? tabParam[0] : tabParam;
  return <PricingCategoriesView initialTab={initialTab} />;
}

