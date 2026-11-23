import type { Metadata } from "next";
import { NotificationsView } from "@/components/admin/notifications/NotificationsView";
import { isNotificationTab } from "@/types/notifications";

export const metadata: Metadata = {
  title: "Notifications | SUR-DRIVEHT Admin",
};

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string | string[] }>;
}) {
  const params = searchParams ? await searchParams : undefined;
  const tabParam = params?.tab;
  const rawTab = Array.isArray(tabParam) ? tabParam[0] : tabParam;
  const initialTab = isNotificationTab(rawTab) ? rawTab : undefined;
  return <NotificationsView initialTab={initialTab} />;
}
