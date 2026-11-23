import type { Metadata } from "next";
import { getRideCategories } from "@/lib/mock/pricing";
import { getDefaultPlatformSettings } from "@/lib/mock/platform-settings";
import { PlatformSettingsView } from "@/components/admin/settings/PlatformSettingsView";
import { isSettingSection } from "@/types/platform-settings";

export const metadata: Metadata = {
  title: "Platform Settings | SUR-DRIVEHT Admin",
};

export default async function PlatformSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ section?: string | string[] }>;
}) {
  const settings = getDefaultPlatformSettings();
  const categories = getRideCategories();
  const params = searchParams ? await searchParams : undefined;
  const sectionParam = params?.section;
  const initialSection = Array.isArray(sectionParam)
    ? sectionParam[0]
    : sectionParam;
  const largestCapacity = Math.max(
    ...categories.map((category) => category.maxPassengers),
  );
  return (
    <PlatformSettingsView
      initialSettings={settings}
      initialSection={
        isSettingSection(initialSection ?? null) ? initialSection : "general"
      }
      categoryNames={categories.map((category) => category.name)}
      maxCategoryCapacity={largestCapacity}
    />
  );
}
