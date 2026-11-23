// RBAC backend shapes — observed live (GET only) on 2026-11-15.
// Samples, not exhaustive: every field is optional
// and read defensively; unknown enums get neutral fallbacks downstream.
export interface RbacRoleResponse {
  id?: string | null;
  name?: string | null;
  description?: string | null;
  isSystem?: boolean | null;
  permissions?: Record<string, string[] | null> | null;
  userCount?: number | null;
  createdAt?: string | null;
}

export interface PermissionMatrixResponse {
  modules?: string[] | null;
  actions?: string[] | null;
  roles?: RbacRoleResponse[] | null;
}

// GET /admin/ride-hailing/rbac/admins — bare array. Observed 2026-11-15:
// status "active" in every row; email/roleId/roleName null in some rows;
// lastLoginAt null in every row. isSuperAdmin flags the super admin even
// when roleId/roleName are null.
export interface RbacAdminResponse {
  id?: string | null;
  fullName?: string | null;
  email?: string | null;
  roleId?: string | null;
  roleName?: string | null;
  isSuperAdmin?: boolean | null;
  lastLoginAt?: string | null;
  status?: string | null;
  createdAt?: string | null;
}

// GET /admin/ride-hailing/rbac/invites — observed 2026-11-15 as a SINGLE
// object (not an array) with an accepted status. The .http description says
// "returns all invites", so the fetcher accepts either shape. NEVER render,
// store, log, copy into the .http, or persist the token: the mapper strips it
// and the fixture canaries it.
export interface RbacInviteResponse {
  id?: string | null;
  email?: string | null;
  fullName?: string | null;
  roleId?: string | null;
  token?: string | null;
  status?: string | null;
  invitedBy?: string | null;
  expiresAt?: string | null;
  acceptedAt?: string | null;
  createdAt?: string | null;
}

export interface RbacCreateRoleBody {
  name: string;
  description: string;
  permissions: Record<string, string[]>;
}

export interface RbacUpdateRoleBody {
  name?: string;
  description?: string;
  permissions?: Record<string, string[]>;
}

export interface RbacReassignRoleBody {
  roleId: string;
}

export interface RbacInviteBody {
  email: string;
  fullName: string;
  roleId: string;
}
