"use client";

import { ChevronRight, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PERMISSIONS } from "@/types/admin-users";
import type { PermissionName, RoleRecord } from "@/types/admin-users";

interface RolesGridProps {
  roles: RoleRecord[];
  matrix: Record<PermissionName, Record<string, boolean>>;
  onCreate: () => void;
  onEdit: (role: RoleRecord) => void;
}

// "Administrative roles" section: one card per role with a module-count badge
// derived from the live permission matrix, so counts refresh the moment a
// drawer save or matrix toggle changes a role's permissions.
export function RolesGrid({ roles, matrix, onCreate, onEdit }: RolesGridProps) {
  return (
    <Card
      title="Administrative roles"
      subtitle="Select a role to edit its permissions"
      action={
        <Button onClick={onCreate} className="shrink-0">
          <Plus className="size-4" aria-hidden="true" />
          Create role
        </Button>
      }
      className="min-w-0"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {roles.map((role) => {
          const count = PERMISSIONS.filter((permission) => matrix[permission][role.id]).length;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onEdit(role)}
              className="group flex min-w-0 items-center gap-3 rounded-xl border border-border bg-surface px-4 py-4 text-left transition-colors hover:border-brand hover:bg-brand-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              <ShieldCheck className="size-5 shrink-0 text-brand" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">{role.name}</span>
                <span className="mt-0.5 block text-xs text-ink-subtle">
                  {count} module{count === 1 ? "" : "s"}
                </span>
              </span>
              <ChevronRight
                className="size-4 shrink-0 text-brand transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </Card>
  );
}