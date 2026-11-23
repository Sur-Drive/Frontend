"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { downloadCsv, toCsv } from "@/lib/csv";
import { useConfirmedExport } from "@/lib/hooks/useConfirmedExport";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api";
import { getCurrentUserEmail } from "@/lib/auth";
import { ADMIN_TABS } from "@/types/admin-users";
import type { AdminTabId, AdminUserRecord } from "@/types/admin-users";
import { AdminProfileDrawer } from "@/components/admin/access/AdminProfileDrawer";
import { InviteAdminDrawer } from "@/components/admin/access/InviteAdminDrawer";
import type { InviteSave } from "@/components/admin/access/InviteAdminDrawer";
import { AdminsTab } from "@/components/admin/access/AdminsTab";
import { RbacRoleDrawer } from "@/components/admin/access/RbacRoleDrawer";
import { RbacRolesGrid } from "@/components/admin/access/RbacRolesGrid";
import { RbacMatrix } from "@/components/admin/access/RbacMatrix";
import { guardFor } from "@/components/admin/access/adminViewHelpers";
import type { PendingConfirm } from "@/components/admin/access/adminViewHelpers";
import {
  RecordsError,
  RecordsSkeleton,
} from "@/components/admin/records/RecordsListState";
import {
  countChangedCells,
  fetchRbacAdmins,
  fetchRbacInvites,
  fetchRbacRoles,
  mapRbacAdmin,
  mapRbacInvite,
  mapRbacRole,
  runRbacMutation,
} from "@/lib/rbac";

// Design permission vocabulary (16 UI modules) mapped onto backend modules.
// 15 UI rows map 1:1 onto a backend module; the Settings row has NO backend
// module (RBAC modules carry no settings key), so it renders disabled with
// "Not available yet" — input the backend can't store is never collected.
// pricing IS a backend module but the design has no row for it: it is never
// displayed and never written; the save rides the snapshot's existing pricing
// value along untouched so saving never grants or drops it.
const UI_PERMISSIONS = [
  "Dashboard", "Rides", "Passengers", "Drivers", "Verification", "Finance",
  "Settlements", "Safety", "Support", "Settings", "Admin Users",
  "Activity Logs", "Analytics & Reports", "Notifications",
  "Ratings & Reviews", "Fraud & Risk",
] as const;
type UiPermission = (typeof UI_PERMISSIONS)[number];
const MODULE_TO_UI: Record<string, UiPermission> = {
  dashboard: "Dashboard", rides: "Rides", passengers: "Passengers",
  drivers: "Drivers", verification: "Verification", finance: "Finance",
  settlements: "Settlements", safety: "Safety", support: "Support",
  admin_users: "Admin Users", activity_logs: "Activity Logs",
  analytics: "Analytics & Reports", notifications: "Notifications",
  ratings: "Ratings & Reviews", fraud: "Fraud & Risk",
};

type Matrix = Record<UiPermission, Record<string, boolean>>;

function emptyMatrix(): Matrix {
  const m = {} as Matrix;
  for (const p of UI_PERMISSIONS) m[p] = {};
  return m;
}

function matrixFromRoles(roles: { id: string; permissions: Record<string, string[]> }[]): Matrix {
  const m = emptyMatrix();
  for (const role of roles) {
    for (const p of UI_PERMISSIONS) {
      m[p][role.id] = Object.entries(role.permissions).some(
        ([mod, actions]) => actions.length > 0 && MODULE_TO_UI[mod] === p,
      );
    }
  }
  return m;
}

function initialsOf(name: string): string {
  const parts = name.split(" ");
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

const TONES = ["brand", "success", "warning", "info"] as const;

function toneFor(name: string): AdminUserRecord["tone"] {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = (h + name.charCodeAt(i)) % TONES.length;
  return TONES[h];
}

// Live RBAC view: roles + admins + invites load via apiFetch on mount.
// Pending invites render as admin rows with status "Invited"; accepted /
// expired / revoked invites stay out of the list (their admins appear via
// the admins endpoint). Emails render only in the admin table, drawer and
// CSV — the screens the design shows them on — never in logs or fixtures.
export function RbacView() {
  const toast = useToast();
  const confirmedExport = useConfirmedExport();
  const [activeTab, setActiveTab] = useState<AdminTabId>("admin-users");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [roleRows, setRoleRows] = useState<
    { id: string; name: string; description: string; isSystem: boolean; permissions: Record<string, string[]>; userCount: number }[]
  >([]);
  const [admins, setAdmins] = useState<AdminUserRecord[]>([]);
  const [matrix, setMatrix] = useState<Matrix>(() => emptyMatrix());
  const [savedMatrix, setSavedMatrix] = useState<Matrix>(() => emptyMatrix());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All roles");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteInitial, setInviteInitial] = useState<InviteSave | null>(null);
  const [inviteErrors, setInviteErrors] = useState<{ name?: string; email?: string; role?: string }>({});
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const matrixSnapshotRef = useRef<Matrix | null>(null);
  void matrixSnapshotRef;
  const snapshotPermsRef = useRef<Record<string, Record<string, string[]>>>({});
  const loadSeqRef = useRef(0);
  // The effect body never calls setState synchronously: loading starts true
  // and the retry handler below re-arms it before bumping retryToken.
  function retry() {
    setLoading(true);
    setLoadError(null);
    setRetryToken((t) => t + 1);
  }
  useEffect(() => {
    const seq = (loadSeqRef.current += 1);
    const controller = new AbortController();
    (async () => {
      try {
        const [rawRoles, rawAdmins, rawInvites] = await Promise.all([
          fetchRbacRoles(controller.signal),
          fetchRbacAdmins(controller.signal),
          fetchRbacInvites(controller.signal),
        ]);
        if (loadSeqRef.current !== seq || controller.signal.aborted) return;
        const mapped = rawRoles.map(mapRbacRole).filter((r) => r !== null);
        const mAdmins = rawAdmins.map(mapRbacAdmin).filter((a) => a !== null);
        const mInvites = rawInvites.map(mapRbacInvite).filter((i) => i !== null);
        const pendingInv = mInvites.filter((i) => i.status === "Pending");
        const pendingIds = new Set(pendingInv.map((i) => i.id));
        void pendingIds;
        const rows: AdminUserRecord[] = [
          ...mAdmins.map((a) => ({
            id: a.id,
            name: a.name,
            email: a.email ?? "—",
            role: a.roleName as AdminUserRecord["role"],
            lastLogin: a.lastLoginLabel,
            status: a.status as AdminUserRecord["status"],
            initials: initialsOf(a.name),
            tone: toneFor(a.name),
            twoFactor: (a.status === "Active" ? true : null) as boolean | null,
            events: [],
          })),
          ...pendingInv.map((i) => ({
            id: `invite:${i.id}`,
            name: i.name,
            email: i.email ?? "—",
            role: (mapped.find((r) => r.id === i.roleId)?.name ?? "—") as AdminUserRecord["role"],
            lastLogin: "Never",
            status: "Invited" as const,
            initials: initialsOf(i.name),
            tone: toneFor(i.name) as AdminUserRecord["tone"],
            twoFactor: null as boolean | null,
            events: [],
          })),
        ];
        const m = matrixFromRoles(mapped);
        const snap: Record<string, Record<string, string[]>> = {};
        for (const r of mapped) snap[r.id] = { ...r.permissions };
        snapshotPermsRef.current = snap;
        setRoleRows(mapped);
        setAdmins(rows);
        setMatrix(m);
        setSavedMatrix(m);
        setLoading(false);
      } catch (cause) {
        if (loadSeqRef.current !== seq || controller.signal.aborted) return;
        if (cause instanceof Error && cause.name === "AbortError") return;
        setLoadError(cause instanceof Error && cause.message ? cause.message : "Request failed. Please try again.");
        setLoading(false);
      }
    })();
    return () => controller.abort();
    // retryToken changes only via retry(); the row setters above land in the
    // async callback, never synchronously in this body.
  }, [retryToken]);
  const selected = admins.find((a) => a.id === selectedId) ?? null;
  const activeSuperCount = admins.filter(
    (a) => a.role === "Super Administrator" && a.status === "Active",
  ).length;
  const selectedGuard = selected ? guardFor(selected, activeSuperCount) : null;
  const roleChanged = selected !== null && selectedRole !== selected.role;
  function openAdmin(admin: AdminUserRecord) {
    setSelectedId(admin.id);
    setSelectedRole(admin.role);
  }
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return admins.filter((admin) => {
      if (roleFilter !== "All roles" && admin.role !== roleFilter) return false;
      if (statusFilter !== "All statuses" && admin.status !== statusFilter) return false;
      if (query === "") return true;
      return (
        admin.name.toLowerCase().includes(query) ||
        admin.email.toLowerCase().includes(query)
      );
    });
  }, [admins, search, roleFilter, statusFilter]);
  const changedCells = useMemo(() => {
    let count = 0;
    for (const p of UI_PERMISSIONS) {
      for (const r of roleRows) {
        if ((matrix[p][r.id] ?? false) !== (savedMatrix[p][r.id] ?? false)) count += 1;
      }
    }
    return count;
  }, [matrix, savedMatrix, roleRows]);
  useEffect(() => {
    if (changedCells === 0) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [changedCells]);
  function handleExport() {
    if (activeTab === "roles-permissions") {
      const snapshot = matrix;
      const snapshotRoles = roleRows;
      confirmedExport.requestExport("Confirm export", () => {
        // Export omits emails, ids and invite tokens — only what the design shows.
        const header = ["Permission", ...snapshotRoles.map((r) => r.name)];
        const rows = UI_PERMISSIONS.map((p) => [
          p,
          ...snapshotRoles.map((r) => ((snapshot[p]?.[r.id] ?? false) ? "Granted" : "Denied")),
        ]);
        downloadCsv("roles-permission-matrix.csv", toCsv(header, rows));
      });
      return;
    }
    const snapshot = filtered;
    confirmedExport.requestExport("Confirm export", () => {
      // Export omits emails, ids and invite tokens — only what the design shows.
      downloadCsv(
        "admin-users.csv",
        toCsv(
          ["Name", "Role", "Last login", "Status"],
          snapshot.map((a) => [a.name, a.role, a.lastLogin, a.status]),
        ),
      );
    });
  }
  function copyFor(kind: PendingConfirm["kind"]): { title: string; desc: string; tone: "brand" | "danger" } {
    switch (kind) {
      case "change-role":
        return { title: "Confirm change role", tone: "brand", desc: "Changing this admin's role changes what they can access." };
      case "deactivate":
        return { title: "Confirm deactivate admin", tone: "danger", desc: "Deactivating locks this admin out of the portal. You cannot deactivate your own account." };
      case "reactivate":
        return { title: "Confirm reactivate admin", tone: "brand", desc: "Reactivating restores this admin's access." };
      case "revoke":
        return { title: "Confirm revoke invitation", tone: "danger", desc: "Revoking cancels the pending invitation." };
      case "invite":
        return { title: "Confirm send invitation", tone: "brand", desc: "This sends an email with an accept link that expires in 7 days." };
      case "permissions":
        return { title: "Confirm save role permissions", tone: "brand", desc: "Saving applies the permission changes. Only custom roles are updated — system roles must be cloned." };
    }
  }
  async function handleConfirm() {
    if (!pending) return;
    if (confirmLoading) return;
    setConfirmLoading(true);
    setConfirmError(null);
    const kind = pending.kind;
    try {
      if (kind === "change-role") {
        const { admin, role } = pending;
        const target = roleRows.find((r) => r.name === role);
        if (!target) throw new Error("That role no longer exists. Refetch and try again.");
        if (admin.id.startsWith("invite:")) throw new Error("That invitation is still pending.");
        // Fail closed: without a readable stored login email we cannot prove
        // who is acting, so no access-changing mutation is ever sent (the UI
        // guard already blocks it; this is the request-level backstop).
        if (!getCurrentUserEmail()) throw new Error("Your account could not be identified");
        await runRbacMutation({
          run: () => import("@/lib/rbac").then((m) => m.reassignRbacAdmin(admin.id, { roleId: target.id })),
          onConfirmed: () => setRetryToken((t) => t + 1),
        });
        toast.success({ title: "Role updated", description: `${admin.name} is now ${role}.` });
      } else if (kind === "deactivate" || kind === "reactivate") {
        const { admin } = pending;
        if (admin.id.startsWith("invite:")) throw new Error("That invitation is still pending.");
        // Fail closed (same backstop as change-role): reactivate is included
        // because it also changes someone's access.
        if (!getCurrentUserEmail()) throw new Error("Your account could not be identified");
        await runRbacMutation({
          run: () =>
            import("@/lib/rbac").then((m) =>
              kind === "deactivate" ? m.deactivateRbacAdmin(admin.id) : m.reactivateRbacAdmin(admin.id),
            ),
          onConfirmed: () => setRetryToken((t) => t + 1),
        });
        toast.success(
          kind === "deactivate"
            ? { title: "Admin deactivated", description: `${admin.name} has been deactivated.` }
            : { title: "Admin reactivated", description: `${admin.name} has been reactivated.` },
        );
      } else if (kind === "revoke") {
        const { admin } = pending;
        if (!admin.id.startsWith("invite:")) throw new Error("Only pending invitations can be revoked.");
        const inviteId = admin.id.slice("invite:".length);
        await runRbacMutation({
          run: () => import("@/lib/rbac").then((m) => m.revokeRbacInvite(inviteId)),
          onConfirmed: () => setRetryToken((t) => t + 1),
        });
        if (selectedId === admin.id) setSelectedId(null);
        toast.success({ title: "Invitation revoked", description: `The invitation for ${admin.name} has been revoked.` });
      } else if (kind === "invite") {
        const save = pending.save;
        const target = roleRows.find((r) => r.name === save.role);
        if (!target) throw new Error("That role no longer exists. Refetch and try again.");
        await runRbacMutation({
          run: () =>
            import("@/lib/rbac").then((m) =>
              m.inviteRbacAdmin({ email: save.email, fullName: save.name, roleId: target.id }),
            ),
          onConfirmed: () => setRetryToken((t) => t + 1),
        });
        setInviteOpen(false);
        setInviteInitial(null);
        toast.success({ title: "Invitation sent", description: `An invitation was sent to ${save.email}.` });
      } else {
        // Boolean matrix -> action arrays: a module toggled ON keeps its
        // existing actions (or gains ["view"] when it had none); toggled OFF
        // clears all actions for that module. Modules with no UI row (pricing)
        // ride along untouched from the snapshot — the PATCH body starts as a
        // copy of it — so saving never grants or drops unshown permissions.
        // Only custom roles are PATCHed; the backend rejects system-role
        // updates. The Settings row has no backend module and cannot be
        // toggled, so it never reaches this loop.
        const perms = snapshotPermsRef.current;
        const dirtyCustom = roleRows.filter(
          (r) =>
            !r.isSystem &&
            UI_PERMISSIONS.some((p) => (matrix[p][r.id] ?? false) !== (savedMatrix[p][r.id] ?? false)),
        );
        if (dirtyCustom.length === 0) {
          const anyDirty = roleRows.some((r) =>
            UI_PERMISSIONS.some((p) => (matrix[p][r.id] ?? false) !== (savedMatrix[p][r.id] ?? false)),
          );
          throw new Error(
            anyDirty
              ? "Only custom roles can be updated. System roles must be cloned."
              : "No permission changes to save.",
          );
        }
        const before: Record<string, Record<string, string[]>> = {};
        const after: Record<string, Record<string, string[]>> = {};
        for (const r of dirtyCustom) {
          const current: Record<string, string[]> = { ...(perms[r.id] ?? {}) };
          before[r.id] = current;
          const next: Record<string, string[]> = { ...current };
          for (const [mod, ui] of Object.entries(MODULE_TO_UI)) {
            const granted = matrix[ui][r.id] ?? false;
            const had = (current[mod] ?? []).length > 0;
            if (granted && !had) next[mod] = ["view"];
            else if (!granted && had) delete next[mod];
          }
          after[r.id] = next;
        }
        const changed = countChangedCells(before, after);
        await runRbacMutation({
          run: async () => {
            const m = await import("@/lib/rbac");
            // Sequential PATCH per dirty custom role. PartialDecisionError
            // pattern: if at least one PATCH succeeded before a failure, the
            // view refetches so the UI shows the mixed server state, and the
            // message names the role that failed. The loop stops at the first
            // failure, so a retry never repeats a request that already
            // succeeded (the refetch re-syncs savedMatrix from the server).
            let succeeded = 0;
            for (const r of dirtyCustom) {
              try {
                await m.updateRbacRole(r.id, { permissions: after[r.id] });
                succeeded += 1;
              } catch (cause) {
                const backendMessage =
                  cause instanceof ApiError
                    ? cause.message
                    : cause instanceof Error && cause.message
                      ? cause.message
                      : "request failed";
                if (succeeded > 0) setRetryToken((t) => t + 1);
                throw new Error(
                  succeeded > 0
                    ? `Saved permissions for ${succeeded} role${succeeded === 1 ? "" : "s"}, but ${r.name} failed: ${backendMessage}`
                    : `${r.name}: ${backendMessage}`,
                );
              }
            }
          },
          onConfirmed: () => setRetryToken((t) => t + 1),
        });
        toast.success({
          title: "Role permissions saved",
          description: `${changed} permission${changed === 1 ? "" : "s"} updated.`,
        });
      }
      setPending(null);
    } catch (cause) {
      if (cause instanceof ApiError) setConfirmError(cause.message);
      else setConfirmError(cause instanceof Error && cause.message ? cause.message : "Something went wrong.");
    } finally {
      setConfirmLoading(false);
    }
  }
  // Roles-tab draft state (hooks stay above every early return).
  const [roleDraftState, setRoleDraftState] = useState<{
    roleId: string | null;
    name: string;
    description: string;
  } | null>(null);
  const [roleDrawerBusy, setRoleDrawerBusy] = useState(false);
  const [roleDrawerError, setRoleDrawerError] = useState<string | null>(null);
  const [roleDeleteId, setRoleDeleteId] = useState<string | null>(null);
  const [roleMatrixSaving, setRoleMatrixSaving] = useState(false);
  void setRoleMatrixSaving;
  void roleMatrixSaving;
  const copy = pending ? copyFor(pending.kind) : null;
  // Roles-tab derived data (no hooks below this line except the render).
  const matrixView = matrix as unknown as Record<string, Record<string, boolean>>;
  const gridRoles = roleRows.map((r) => ({
    id: r.id,
    name: r.name,
    isSystem: r.isSystem,
    moduleCount: UI_PERMISSIONS.filter((p) => matrix[p][r.id]).length,
    // Real per-role admin counts from the roles endpoint summary field —
    // gates the Delete button (backend refuses roles with assigned admins).
    userCount: r.userCount,
  }));
  // Design-ordered matrix rows: 15 live module rows plus the Settings row,
  // which is disabled because no backend RBAC module stores it. pricing is a
  // real backend module with no design row — hidden, preserved on save.
  const uiModules: { key: string; label: string; disabled: boolean; reason?: string }[] = [
    ...["dashboard", "rides", "passengers", "drivers", "verification", "finance", "settlements", "safety", "support"].map(
      (key) => ({ key, label: MODULE_TO_UI[key], disabled: false, reason: undefined }),
    ),
    { key: "settings", label: "Settings", disabled: true, reason: "Not available yet" },
    ...["admin_users", "activity_logs", "analytics", "notifications", "ratings", "fraud"].map(
      (key) => ({ key, label: MODULE_TO_UI[key], disabled: false, reason: undefined }),
    ),
  ];
  const roleDeleteRole = roleDeleteId ? roleRows.find((r) => r.id === roleDeleteId) ?? null : null;
  // Dialogs render in EVERY state: a partial permission save refetches while
  // the confirm dialog stays open showing which role failed — the early-return
  // skeleton must never unmount it mid-error.
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <PageHeader
        title="Admin Users & Roles"
        description="Manage administrative access and role-based permissions."
        actions={
          <>
            <Button variant="secondary" onClick={handleExport}>
              <Download className="size-4" aria-hidden="true" />
              Export
            </Button>
            <Button
              onClick={() => {
                setInviteInitial(null);
                setInviteErrors({});
                setInviteOpen(true);
              }}
            >
              <Plus className="size-4" aria-hidden="true" />
              Invite admin
            </Button>
          </>
        }
      />
      {loading ? (
        <RecordsSkeleton />
      ) : loadError ? (
        <RecordsError message={loadError} onRetry={retry} />
      ) : (
        <Card className="min-w-0">
        <div className="-mx-5 mb-4 px-5">
          <Tabs
            tabs={[...ADMIN_TABS]}
            value={activeTab}
            onChange={(id) => {
              if (id === "admin-users" || id === "roles-permissions") setActiveTab(id);
            }}
          />
        </div>
        {activeTab === "admin-users" ? (
          <AdminsTab
            rows={filtered}
            activeSuperCount={activeSuperCount}
            allRoles={roleRows.map((r) => r.name)}
            search={search}
            roleFilter={roleFilter}
            statusFilter={statusFilter}
            onSearch={setSearch}
            onRoleFilter={setRoleFilter}
            onStatusFilter={setStatusFilter}
            onOpen={openAdmin}
            onRequest={(admin: AdminUserRecord, request: { kind: string; role?: string }) => {
              if (request.kind === "change-role") {
                openAdmin(admin);
                return;
              }
              setPending({ kind: request.kind, admin } as PendingConfirm);
              setConfirmError(null);
            }}
          />
        ) : (
          <>
            <RbacRolesGrid
              roles={gridRoles}
              onCreate={() => {
                setRoleDrawerError(null);
                setRoleDraftState({ roleId: null, name: "", description: "" });
              }}
              onEdit={(roleId: string) => {
                const role = roleRows.find((r) => r.id === roleId);
                if (!role) return;
                if (role.isSystem) {
                  toast.success({ title: "System role", description: "System roles cannot be renamed. Clone the role instead." });
                  return;
                }
                setRoleDrawerError(null);
                setRoleDraftState({ roleId: role.id, name: role.name, description: role.description });
              }}
              onClone={(roleId: string) => {
                const role = roleRows.find((r) => r.id === roleId);
                if (!role) return;
                setRoleDrawerError(null);
                setRoleDraftState({ roleId: null, name: `${role.name} (copy)`, description: role.description });
              }}
              onDeleteRequest={(roleId: string) => {
                setRoleDrawerError(null);
                setRoleDeleteId(roleId);
              }}
            />
            <RbacMatrix
              roles={roleRows.map((r) => ({ id: r.id, name: r.name, isSystem: r.isSystem }))}
              modules={uiModules}
              matrix={matrixView}
              dirty={changedCells > 0}
              saving={false}
              onToggle={(modKey, roleId) => {
                const role = roleRows.find((r) => r.id === roleId);
                if (!role || role.isSystem) return;
                const ui = MODULE_TO_UI[modKey];
                if (!ui) return;
                setMatrix((current) => ({
                  ...current,
                  [ui]: { ...current[ui], [roleId]: !(current[ui]?.[roleId] ?? false) },
                }));
              }}
              onSave={() => {
                setPending({ kind: "permissions" });
                setConfirmError(null);
              }}
            />
          </>
        )}
          </Card>
        )}
      <AdminProfileDrawer
        admin={selected}
        selectedRole={selectedRole}
        guard={selectedGuard}
        roleOptions={roleRows.map((r) => r.name)}
        onSelectRole={setSelectedRole}
        onClose={() => setSelectedId(null)}
        onRequest={(request) => {
          if (!selected) return;
          if (request.kind === "change-role") {
            if (!roleChanged) return;
            setPending({ kind: "change-role", admin: selected, role: selectedRole });
          } else {
            setPending({ kind: request.kind, admin: selected } as PendingConfirm);
          }
          setConfirmError(null);
        }}
      />
      <InviteAdminDrawer
        open={inviteOpen}
        takenEmails={admins.map((admin) => admin.email.toLowerCase())}
        allRoles={roleRows.map((r) => r.name)}
        initial={inviteInitial}
        errors={inviteErrors}
        onClose={() => setInviteOpen(false)}
        onErrors={setInviteErrors}
        onSubmit={(save) => {
          setInviteInitial(save);
          setPending({ kind: "invite", save });
          setConfirmError(null);
        }}
      />
      {roleDraftState ? (
        <RbacRoleDrawer
          draft={roleDraftState}
          takenNames={roleRows.filter((r) => r.id !== roleDraftState.roleId).map((r) => r.name)}
          busy={roleDrawerBusy}
          error={roleDrawerError}
          onClose={() => {
            if (roleDrawerBusy) return;
            setRoleDraftState(null);
            setRoleDrawerError(null);
          }}
          onSubmit={(draft) => {
            void (async () => {
              setRoleDrawerBusy(true);
              setRoleDrawerError(null);
              try {
                if (draft.roleId === null) {
                  await runRbacMutation({
                    run: () =>
                      import("@/lib/rbac").then((m) =>
                        m.createRbacRole({ name: draft.name, description: draft.description, permissions: {} }),
                      ),
                    onConfirmed: () => setRetryToken((t) => t + 1),
                  });
                  toast.success({ title: "Role created", description: `${draft.name} has been created.` });
                } else {
                  await runRbacMutation({
                    run: () =>
                      import("@/lib/rbac").then((m) =>
                        m.updateRbacRole(draft.roleId as string, { name: draft.name, description: draft.description }),
                      ),
                    onConfirmed: () => setRetryToken((t) => t + 1),
                  });
                  toast.success({ title: "Role updated", description: `${draft.name} has been updated.` });
                }
                setRoleDraftState(null);
              } catch (cause) {
                setRoleDrawerError(
                  cause instanceof ApiError
                    ? cause.message
                    : cause instanceof Error && cause.message
                      ? cause.message
                      : "Something went wrong.",
                );
              } finally {
                setRoleDrawerBusy(false);
              }
            })();
          }}
        />
      ) : null}
      <ConfirmDialog
        open={roleDeleteRole !== null}
        title="Confirm delete role"
        description={
          roleDeleteRole
            ? `Deleting "${roleDeleteRole.name}" is permanent and cannot be undone. Roles with assigned admins cannot be deleted.`
            : ""
        }
        confirmTone="danger"
        loading={roleDrawerBusy}
        error={roleDrawerError}
        onConfirm={() => {
          if (!roleDeleteRole || roleDrawerBusy) return;
          void (async () => {
            setRoleDrawerBusy(true);
            setRoleDrawerError(null);
            try {
              await runRbacMutation({
                run: () => import("@/lib/rbac").then((m) => m.deleteRbacRole(roleDeleteRole.id)),
                onConfirmed: () => setRetryToken((t) => t + 1),
              });
              setRoleDeleteId(null);
              toast.success({ title: "Role deleted", description: `"${roleDeleteRole.name}" has been deleted.` });
            } catch (cause) {
              setRoleDrawerError(
                cause instanceof ApiError
                  ? cause.message
                  : cause instanceof Error && cause.message
                    ? cause.message
                    : "Something went wrong.",
              );
            } finally {
              setRoleDrawerBusy(false);
            }
          })();
        }}
        onCancel={() => {
          if (roleDrawerBusy) return;
          setRoleDeleteId(null);
          setRoleDrawerError(null);
        }}
      />
      <ConfirmDialog
        open={pending !== null}
        title={copy?.title ?? ""}
        description={copy?.desc ?? ""}
        confirmTone={copy?.tone ?? "brand"}
        loading={confirmLoading}
        error={confirmError}
        noteLabel="Internal note"
        noteDisabled
        onConfirm={() => void handleConfirm()}
        onCancel={() => {
          if (confirmLoading) return;
          if (pending?.kind === "invite") setInviteOpen(true);
          setPending(null);
          setConfirmError(null);
        }}
      />
      {confirmedExport.dialog}
    </div>
  );
}
