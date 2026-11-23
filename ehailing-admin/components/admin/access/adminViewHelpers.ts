"use client";

import { getCurrentUserEmail } from "@/lib/auth";
import type { AdminUserRecord } from "@/types/admin-users";
import type { InviteSave } from "@/components/admin/access/InviteAdminDrawer";

export type PendingConfirm =
  | { kind: "change-role"; admin: AdminUserRecord; role: string }
  | { kind: "deactivate"; admin: AdminUserRecord }
  | { kind: "reactivate"; admin: AdminUserRecord }
  | { kind: "revoke"; admin: AdminUserRecord }
  | { kind: "invite"; save: InviteSave }
  | { kind: "permissions" };

// Guard for profile mutations: own account, or the last active Super Admin.
// The current user is read live from the login session (localStorage), never
// from a hardcoded email — the backend also rejects self-deactivation.
// FAIL CLOSED: when the stored email is missing or unreadable we cannot prove
// who is acting, so every guarded action (deactivate, change role, reactivate)
// is blocked for EVERY admin with the "Your account could not be identified"
// tooltip. Revoking an invite stays available — it changes nobody's access.
export function guardFor(
  admin: AdminUserRecord,
  activeSuperCount: number,
): string | null {
  const self = getCurrentUserEmail();
  if (!self) return "Your account could not be identified";
  if (admin.email.toLowerCase() === self) return "You can't change your own access";
  if (admin.role === "Super Administrator" && admin.status === "Active" && activeSuperCount <= 1)
    return "At least one active Super Administrator is required";
  return null;
}
