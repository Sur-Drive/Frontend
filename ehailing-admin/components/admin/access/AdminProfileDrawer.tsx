"use client";

import { SideSheet } from "@/components/ui/SideSheet";
import { Select } from "@/components/ui/Select";
import { StatusPill } from "@/components/ui/StatusPill";
import type { StatusTone } from "@/components/ui/StatusPill";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { ProfileFooter } from "@/components/admin/access/AdminProfileFooter";
import { ADMIN_ROLES, isAdminRole } from "@/lib/constants";
import type { AdminStatus, AdminUserRecord } from "@/types/admin-users";

const STATUS_TONE: Record<AdminStatus, StatusTone> = {
  Active: "success",
  Invited: "info",
  Deactivated: "neutral",
};

export type ProfileRequest =
  | { kind: "change-role"; role: string }
  | { kind: "deactivate" }
  | { kind: "reactivate" }
  | { kind: "revoke" };

interface AdminProfileDrawerProps {
  admin: AdminUserRecord | null;
  selectedRole: string;
  guard: string | null;
  // Live backend role names; empty while loading disables the select.
  roleOptions?: string[];
  onSelectRole: (role: string) => void;
  onClose: () => void;
  onRequest: (request: ProfileRequest) => void;
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted px-4 py-3">
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

export function AdminProfileDrawer(props: AdminProfileDrawerProps) {
  const { admin, selectedRole, guard } = props;
  const roleOptions = props.roleOptions ?? [...ADMIN_ROLES];
  const roleChanged = admin !== null && selectedRole !== admin.role;
  const showSuperWarning = isAdminRole(selectedRole)
    && selectedRole === "Super Administrator"
    && admin !== null
    && admin.role !== "Super Administrator";

  return (
    <SideSheet
      open={admin !== null}
      onClose={props.onClose}
      eyebrow="ADMINISTRATOR PROFILE"
      title={admin?.name ?? ""}
      subtitle={admin?.email}
      footer={admin ? (
        <ProfileFooter
          admin={admin}
          roleChanged={roleChanged}
          guard={guard}
          onRequest={props.onRequest}
        />
      ) : undefined}
    >
      {admin ? (
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex items-center gap-4 rounded-2xl bg-brand-soft px-5 py-4">
            <InitialsAvatar initials={admin.initials} tone={admin.tone} size="xl" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-ink">{admin.name}</p>
              <p className="truncate text-sm text-ink-muted">{admin.email}</p>
            </div>
            <StatusPill tone={STATUS_TONE[admin.status]} label={admin.status} />
          </div>
          <section aria-label="Access details">
            <h3 className="text-lg font-normal text-ink">Access details</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoCell label="Role" value={admin.role} />
              <InfoCell label="Last login" value={admin.lastLogin} />
              <InfoCell label="Account status" value={admin.status} />
              <InfoCell
                label="Two-factor authentication"
                value={admin.twoFactor === true ? "Enabled" : "Not set up yet"}
              />
            </div>
          </section>
          <div>
            <label htmlFor="admin-change-role" className="text-sm font-medium text-ink">
              Change role
            </label>
            <div className="mt-1.5" title={guard ?? (roleOptions.length === 0 ? "Roles are still loading" : undefined)}>
              <Select
                id="admin-change-role"
                label="Change role"
                options={roleOptions.length > 0 ? roleOptions : [selectedRole]}
                value={selectedRole}
                disabled={guard !== null || roleOptions.length === 0}
                onChange={(event) => props.onSelectRole(event.target.value)}
              />
            </div>
            {showSuperWarning ? (
              <p className="mt-1.5 text-xs text-warning">
                Super Administrators have full access, including settings and admin users.
              </p>
            ) : null}
          </div>
          <section aria-label="Recent access">
            <h3 className="text-lg font-normal text-ink">Recent access</h3>
            {admin.events.length > 0 ? (
              <ol className="mt-3 flex flex-col gap-4">
                {admin.events.map((event) => (
                  <li key={event.title} className="relative pl-6">
                    <span
                      aria-hidden="true"
                      className="absolute left-1 top-1.5 size-2.5 rounded-full border-2 border-success bg-surface"
                    />
                    <p className="text-sm font-semibold text-ink">{event.title}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{event.detail}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-ink-muted">
                No sign-ins yet. Invitation sent recently.
              </p>
            )}
          </section>
        </div>
      ) : null}
    </SideSheet>
  );
}
