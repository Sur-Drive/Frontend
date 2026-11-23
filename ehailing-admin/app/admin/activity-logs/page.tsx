import type { Metadata } from "next";
import { ActivityLogsView } from "@/components/admin/activity-logs/ActivityLogsView";

export const metadata: Metadata = {
  title: "Activity Logs | SUR-DRIVEHT Admin",
};

export default function ActivityLogsPage() {
  return <ActivityLogsView />;
}

