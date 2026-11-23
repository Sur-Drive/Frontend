import type { Metadata } from "next";
import { ProfileView } from "@/components/admin/profile/ProfileView";

export const metadata: Metadata = {
  title: "My Profile | SUR-DRIVEHT Admin",
};

export default function ProfilePage() {
  return <ProfileView />;
}