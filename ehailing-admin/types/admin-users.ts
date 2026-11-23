import type { AdminRoleName } from "@/lib/constants";

export type AdminStatus = "Active" | "Invited" | "Deactivated";

export interface AccessEvent {
  title: string;
  detail: string;
}

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: AdminRoleName;
  lastLogin: string;
  status: AdminStatus;
  initials: string;
  tone: "brand" | "success" | "warning" | "info";
  twoFactor: boolean | null;
  events: AccessEvent[];
}

// The signed-in admin's email. Resolved live in adminViewHelpers via
// getCurrentUserEmail() (login-session localStorage); no hardcoded value.
export const CURRENT_ADMIN_EMAIL = "";

export const ADMIN_TABS = [
  { id: "admin-users", label: "Admin Users" },
  { id: "roles-permissions", label: "Roles & Permissions" },
] as const;

export type AdminTabId = (typeof ADMIN_TABS)[number]["id"];

export function isAdminTab(value: string | null | undefined): value is AdminTabId {
  return value === "admin-users" || value === "roles-permissions";
}

export const PERMISSIONS = [
  "Dashboard",
  "Rides",
  "Passengers",
  "Drivers",
  "Verification",
  "Finance",
  "Settlements",
  "Safety",
  "Support",
  "Settings",
  "Admin Users",
  "Activity Logs",
  "Analytics & Reports",
  "Notifications",
  "Ratings & Reviews",
  "Fraud & Risk",
] as const;

export type PermissionName = (typeof PERMISSIONS)[number];

// A selectable administrative role on the Roles & Permissions tab. The id is
// the stable key into the permission matrix, so renaming a role never breaks
// matrix lookups; custom roles created in-session use `custom-*` ids.
export interface RoleRecord {
  id: string;
  name: string;
  description: string;
}
