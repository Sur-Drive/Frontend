// RBAC data layer: confirmed apiFetch calls (GET lists + mutations).
// Confirmed endpoints (observed live 2026-11-15 via GET only):
//   GET roles, GET roles/{id}, GET permission-matrix, GET admins,
//   GET invites (single object OR array), POST roles, PATCH roles/{id},
//   DELETE roles/{id}, PATCH admins/{id}/role, PATCH admins/{id}/deactivate,
//   PATCH admins/{id}/reactivate, POST invites, DELETE invites/{id}.
// Resend-invite and public peek/accept are NOT wired (no design surface / no
// endpoint documented); Resend stays disabled with "Not available yet".
import { apiFetch } from "@/lib/api";
import type {
  PermissionMatrixResponse,
  RbacAdminResponse,
  RbacCreateRoleBody,
  RbacInviteBody,
  RbacInviteResponse,
  RbacReassignRoleBody,
  RbacRoleResponse,
  RbacUpdateRoleBody,
} from "@/types/rbac-api";

export type { RbacRoleResponse } from "@/types/rbac-api";

export async function fetchRbacRoles(signal?: AbortSignal): Promise<RbacRoleResponse[]> {
  const data = await apiFetch<RbacRoleResponse[] | { roles?: RbacRoleResponse[] }>(
    "/admin/ride-hailing/rbac/roles",
    { signal },
  );
  if (Array.isArray(data)) return data.filter((r) => r && typeof r === "object");
  if (data && Array.isArray(data.roles)) return data.roles;
  return [];
}

export async function fetchRbacRole(id: string, signal?: AbortSignal): Promise<RbacRoleResponse> {
  return apiFetch<RbacRoleResponse>(`/admin/ride-hailing/rbac/roles/${encodeURIComponent(id)}`, {
    signal,
  });
}

export async function fetchRbacMatrix(signal?: AbortSignal): Promise<PermissionMatrixResponse> {
  return apiFetch<PermissionMatrixResponse>("/admin/ride-hailing/rbac/permission-matrix", {
    signal,
  });
}

export async function fetchRbacAdmins(signal?: AbortSignal): Promise<RbacAdminResponse[]> {
  const data = await apiFetch<RbacAdminResponse[] | { items?: RbacAdminResponse[] }>(
    "/admin/ride-hailing/rbac/admins",
    { signal },
  );
  if (Array.isArray(data)) return data.filter((a) => a && typeof a === "object");
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}

export async function fetchRbacInvites(signal?: AbortSignal): Promise<RbacInviteResponse[]> {
  const data = await apiFetch<RbacInviteResponse | RbacInviteResponse[]>(
    "/admin/ride-hailing/rbac/invites",
    { signal },
  );
  if (Array.isArray(data)) return data.filter((i) => i && typeof i === "object");
  if (data && typeof data === "object") return [data];
  return [];
}

export function createRbacRole(body: RbacCreateRoleBody): Promise<RbacRoleResponse> {
  return apiFetch<RbacRoleResponse>("/admin/ride-hailing/rbac/roles", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateRbacRole(id: string, body: RbacUpdateRoleBody): Promise<RbacRoleResponse> {
  return apiFetch<RbacRoleResponse>(`/admin/ride-hailing/rbac/roles/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteRbacRole(id: string): Promise<void> {
  return apiFetch<void>(`/admin/ride-hailing/rbac/roles/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function reassignRbacAdmin(id: string, body: RbacReassignRoleBody): Promise<RbacAdminResponse> {
  return apiFetch<RbacAdminResponse>(
    `/admin/ride-hailing/rbac/admins/${encodeURIComponent(id)}/role`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
}

export function deactivateRbacAdmin(id: string): Promise<RbacAdminResponse> {
  return apiFetch<RbacAdminResponse>(
    `/admin/ride-hailing/rbac/admins/${encodeURIComponent(id)}/deactivate`,
    { method: "PATCH" },
  );
}

export function reactivateRbacAdmin(id: string): Promise<RbacAdminResponse> {
  return apiFetch<RbacAdminResponse>(
    `/admin/ride-hailing/rbac/admins/${encodeURIComponent(id)}/reactivate`,
    { method: "PATCH" },
  );
}

export function inviteRbacAdmin(body: RbacInviteBody): Promise<RbacInviteResponse> {
  return apiFetch<RbacInviteResponse>("/admin/ride-hailing/rbac/invites", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function revokeRbacInvite(id: string): Promise<void> {
  return apiFetch<void>(`/admin/ride-hailing/rbac/invites/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

let mutationInFlight = false;

export interface RbacMutationRequest {
  run: () => Promise<unknown>;
  onConfirmed: () => void;
}

export async function runRbacMutation(request: RbacMutationRequest): Promise<void> {
  if (mutationInFlight) throw new Error("An admin change is already in progress.");
  mutationInFlight = true;
  try {
    await request.run();
    request.onConfirmed();
  } finally {
    mutationInFlight = false;
  }
}
// __MAPPERS-A__
import { EM_DASH, formatDateLabel, humanize } from "@/lib/format";

export const RBAC_MODULES = ["dashboard","rides","passengers","drivers","vehicles","verification","finance","settlements","safety","support","pricing","admin_users","activity_logs","analytics","notifications","ratings","fraud"] as const;
export type RbacModule = (typeof RBAC_MODULES)[number];
export const RBAC_ACTIONS: string[] = ["view","create","edit","delete","assign","manage"];
export type RbacAction = string;
const VALID_MODULES: Set<string> = new Set([...RBAC_MODULES]);
const VALID_ACTIONS: Set<string> = new Set([...RBAC_ACTIONS]);
export function isRbacModule(value: unknown): value is RbacModule {
  return typeof value === "string" && VALID_MODULES.has(value);
}
export function moduleLabel(module: string): string {
  if (module === "admin_users") return "Admin Users";
  if (module === "activity_logs") return "Activity Logs";
  return humanize(module);
}
export function adminStatusLabel(status: unknown): string {
  if (typeof status !== "string" || !status.trim()) return EM_DASH;
  const lower = status.trim().toLowerCase();
  if (lower === "active") return "Active";
  if (lower === "deactivated") return "Deactivated";
  return humanize(status);
}
export function inviteStatusLabel(status: unknown): string {
  if (typeof status !== "string" || !status.trim()) return EM_DASH;
  const lower = status.trim().toLowerCase();
  if (lower === "pending") return "Pending";
  if (lower === "accepted") return "Accepted";
  if (lower === "expired") return "Expired";
  if (lower === "revoked") return "Revoked";
  return humanize(status);
}
export function normalisePermissions(raw: RbacRoleResponse["permissions"]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [module, actions] of Object.entries(raw)) {
    if (!isRbacModule(module) || !Array.isArray(actions)) continue;
    const clean = actions.filter((a): a is RbacAction => typeof a === "string" && VALID_ACTIONS.has(a));
    if (clean.length > 0) out[module] = [...new Set(clean)];
  }
  return out;
}
function asId(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}
function asName(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim() : EM_DASH;
}
export interface MappedRole {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: Record<string, string[]>;
  userCount: number;
  createdAt: string | null;
}
export function mapRbacRole(role: RbacRoleResponse): MappedRole | null {
  const id = asId(role?.id);
  if (!id) return null;
  const rawName = typeof role?.name === "string" ? role.name.trim() : "";
  const n = typeof role?.userCount === "number" && role.userCount >= 0 ? role.userCount : 0;
  return {
    id, name: rawName || "Unnamed role",
    description: typeof role?.description === "string" ? role.description : "",
    isSystem: role?.isSystem === true, permissions: normalisePermissions(role?.permissions),
    userCount: n, createdAt: typeof role?.createdAt === "string" ? role.createdAt : null,
  };
}
export function moduleGranted(p: Record<string, string[]>, m: string): boolean {
  return Array.isArray(p[m]) && p[m].length > 0;
}
export interface MappedAdmin {
  id: string; name: string; email: string | null; roleId: string | null;
  roleName: string; isSuperAdmin: boolean; status: string;
  lastLoginLabel: string; createdLabel: string;
}
export function mapRbacAdmin(a: RbacAdminResponse): MappedAdmin | null {
  const id = asId(a?.id);
  if (!id) return null;
  const email = typeof a?.email === "string" && a.email.trim() ? a.email.trim() : null;
  const rn = typeof a?.roleName === "string" && a.roleName.trim() ? a.roleName.trim() : "";
  return {
    id, name: asName(a?.fullName), email, roleId: asId(a?.roleId) || null,
    roleName: rn || (a?.isSuperAdmin ? "Super Administrator" : EM_DASH),
    isSuperAdmin: a?.isSuperAdmin === true, status: adminStatusLabel(a?.status),
    lastLoginLabel: typeof a?.lastLoginAt === "string" && a.lastLoginAt.trim() ? formatDateLabel(a.lastLoginAt) : "Never",
    createdLabel: typeof a?.createdAt === "string" && a.createdAt.trim() ? formatDateLabel(a.createdAt) : EM_DASH,
  };
}
export interface MappedInvite {
  id: string; email: string | null; name: string; roleId: string | null;
  status: string; expiresLabel: string; createdLabel: string; acceptedLabel: string | null;
}
export function mapRbacInvite(inv: RbacInviteResponse): MappedInvite | null {
  const id = asId(inv?.id);
  if (!id) return null;
  void (inv as { token?: unknown } | null)?.token;
  return {
    id, email: typeof inv?.email === "string" && inv.email.trim() ? inv.email.trim() : null,
    name: asName(inv?.fullName), roleId: asId(inv?.roleId) || null,
    status: inviteStatusLabel(inv?.status),
    expiresLabel: typeof inv?.expiresAt === "string" && inv.expiresAt.trim() ? formatDateLabel(inv.expiresAt) : EM_DASH,
    createdLabel: typeof inv?.createdAt === "string" && inv.createdAt.trim() ? formatDateLabel(inv.createdAt) : EM_DASH,
    acceptedLabel: typeof inv?.acceptedAt === "string" && inv.acceptedAt.trim() ? formatDateLabel(inv.acceptedAt) : null,
  };
}
export function countChangedCells(
  before: Record<string, Record<string, string[]>>,
  after: Record<string, Record<string, string[]>>,
): number {
  let count = 0;
  const ids = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const id of ids) {
    const mods = new Set([...Object.keys(before[id] ?? {}), ...Object.keys(after[id] ?? {})]);
    for (const m of mods) {
      const a = [...(before[id]?.[m] ?? [])].sort().join(",");
      const b = [...(after[id]?.[m] ?? [])].sort().join(",");
      if (a !== b) count += 1;
    }
  }
  return count;
}

