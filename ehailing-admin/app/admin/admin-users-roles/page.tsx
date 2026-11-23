import type { Metadata } from "next";
import { RbacView } from "@/components/admin/access/RbacView";

export const metadata: Metadata = {
  title: "Admin Users & Roles | SUR-DRIVEHT Admin",
};

// Server shell only: the view fetches roles + matrix + admins + invites via
// apiFetch on the client, like the Drivers/Passengers/Verification pages.
export default function AdminUsersRolesPage() {
  return <RbacView />;
}

