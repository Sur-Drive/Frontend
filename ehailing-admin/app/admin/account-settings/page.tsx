import type { Metadata } from "next";
import { AccountSettingsView } from "@/components/admin/account-settings/AccountSettingsView";

export const metadata: Metadata = {
  title: "Account Settings | SUR-DRIVEHT Admin",
};

export default function AccountSettingsPage() {
  return <AccountSettingsView />;
}