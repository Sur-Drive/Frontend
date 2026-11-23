// Canonical admin role list, shared by the Activity Logs filters and the
// Admin Users & Roles page.
export const ADMIN_ROLES = [
  "Super Administrator",
  "Operations Manager",
  "Finance Administrator",
  "Verification Officer",
  "Safety Officer",
  "Support Agent",
  "Analytics Viewer",
] as const;

export type AdminRoleName = (typeof ADMIN_ROLES)[number];

// Short column labels for the permission matrix header.
export const ADMIN_ROLE_META: { id: string; name: AdminRoleName; label: string }[] = [
  { id: "super-admin", name: "Super Administrator", label: "Super Admin" },
  { id: "operations-mgr", name: "Operations Manager", label: "Operations Manager" },
  { id: "finance-admin", name: "Finance Administrator", label: "Finance Admin" },
  { id: "verification-officer", name: "Verification Officer", label: "Verification Officer" },
  { id: "safety-officer", name: "Safety Officer", label: "Safety Officer" },
  { id: "support-agent", name: "Support Agent", label: "Support Agent" },
  { id: "analytics-viewer", name: "Analytics Viewer", label: "Analytics Viewer" },
];

// Short column header for the permission matrix. Canonical roles use the
// design's short label (e.g. "Super Administrator" → "Super Admin"); roles
// renamed or created in-session fall back to their current name.
export function matrixRoleLabel(name: string): string {
  return ADMIN_ROLE_META.find((meta) => meta.name === name)?.label ?? name;
}

export function isAdminRole(value: string | null | undefined): value is AdminRoleName {
  return (
    typeof value === "string" &&
    (ADMIN_ROLES as readonly string[]).includes(value)
  );
}

