export type UserRole = "driver" | "fleet_owner";

const ROLE_KEY = "userRole";

export function getStoredRole(): UserRole | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(ROLE_KEY);
  return value === "driver" || value === "fleet_owner" ? value : null;
}

export function setStoredRole(role: UserRole) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ROLE_KEY, role);
}

export function clearStoredRole() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ROLE_KEY);
}

export function resolveRoleFromAuthResponse(
  data: any,
  fallback: UserRole,
): UserRole {
  const serverRole = data?.user?.role ?? data?.role;
  return serverRole === "driver" || serverRole === "fleet_owner"
    ? serverRole
    : fallback;
}
