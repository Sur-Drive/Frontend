"use client";

import { Search } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { StatusPill } from "@/components/ui/StatusPill";
import type { StatusTone } from "@/components/ui/StatusPill";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { RecordsTable } from "@/components/admin/records/RecordsTable";
import type { Column } from "@/components/admin/records/RecordsTable";
import type { AdminStatus, AdminUserRecord } from "@/types/admin-users";
import { guardFor } from "@/components/admin/access/adminViewHelpers";
import { AdminRowMenu } from "@/components/admin/access/AdminRowMenu";
import type { ProfileRequest } from "@/components/admin/access/AdminProfileDrawer";

const STATUS_TONE: Record<AdminStatus, StatusTone> = {
  Active: "success",
  Invited: "info",
  Deactivated: "neutral",
};

interface AdminsTabProps {
  // Filter state is owned by the view so the tab's Export can use the same
  // filtered snapshot the table shows.
  rows: AdminUserRecord[];
  activeSuperCount: number;
  allRoles: string[];
  search: string;
  roleFilter: string;
  statusFilter: string;
  onSearch: (value: string) => void;
  onRoleFilter: (value: string) => void;
  onStatusFilter: (value: string) => void;
  onOpen: (admin: AdminUserRecord) => void;
  onRequest: (admin: AdminUserRecord, request: ProfileRequest) => void;
}

const COLUMNS: Column<AdminUserRecord>[] = [
  {
    key: "admin",
    header: "Admin",
    cell: (admin) => (
      <span className="flex min-w-0 items-center gap-3">
        <InitialsAvatar initials={admin.initials} tone={admin.tone} />
        <span className="truncate text-sm font-semibold text-ink">{admin.name}</span>
      </span>
    ),
  },
  {
    key: "email",
    header: "Email",
    cell: (admin) => (
      <span className="block max-w-52 truncate text-sm text-ink-muted">{admin.email}</span>
    ),
  },
  {
    key: "role",
    header: "Role",
    cell: (admin) => <span className="whitespace-nowrap text-sm text-ink-muted">{admin.role}</span>,
  },
  {
    key: "lastLogin",
    header: "Last login",
    cell: (admin) => <span className="whitespace-nowrap text-sm text-ink-muted">{admin.lastLogin}</span>,
  },
  {
    key: "status",
    header: "Status",
    cell: (admin) => <StatusPill tone={STATUS_TONE[admin.status]} label={admin.status} />,
  },
];

export function AdminsTab({
  rows,
  activeSuperCount,
  allRoles,
  search,
  roleFilter,
  statusFilter,
  onSearch,
  onRoleFilter,
  onStatusFilter,
  onOpen,
  onRequest,
}: AdminsTabProps) {
  return (
    <div className="min-w-0">
      <div className="mb-4 flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" aria-hidden="true" />
          <input
            type="search"
            value={search}
            placeholder="Search admin users..."
            aria-label="Search admin users"
            onChange={(event) => onSearch(event.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          />
        </label>
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
          <Select label="Filter by role" value={roleFilter} onChange={(event) => onRoleFilter(event.target.value)} className="sm:w-44">
            <option value="All roles">All roles</option>
            {allRoles.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </Select>
          <Select label="Filter by status" value={statusFilter} onChange={(event) => onStatusFilter(event.target.value)} className="sm:w-44">
            <option value="All statuses">All statuses</option>
            <option value="Active">Active</option>
            <option value="Invited">Invited</option>
            <option value="Deactivated">Deactivated</option>
          </Select>
        </div>
        <p className="shrink-0 text-sm text-ink-muted lg:ml-auto" aria-live="polite">
          {rows.length} administrator{rows.length === 1 ? "" : "s"}
        </p>
      </div>
      <RecordsTable
        columns={COLUMNS}
        rows={rows}
        getKey={(admin) => admin.id}
        onOpen={onOpen}
        rowLabel={(admin) => admin.name}
        minWidth={900}
        emptyMessage="No admin users match your filters."
        renderActions={(admin) => (
          <AdminRowMenu admin={admin} guard={guardFor(admin, activeSuperCount)} onOpen={() => onOpen(admin)} onRequest={(request) => onRequest(admin, request)} />
        )}
        renderCard={(admin) => (
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex items-center gap-3">
              <InitialsAvatar initials={admin.initials} tone={admin.tone} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{admin.name}</p>
                <p className="truncate text-xs text-ink-muted">{admin.email}</p>
              </div>
              <StatusPill tone={STATUS_TONE[admin.status]} label={admin.status} />
            </div>
            <p className="text-xs text-ink-muted">{admin.role} · {admin.lastLogin}</p>
          </div>
        )}
      />
    </div>
  );
}
