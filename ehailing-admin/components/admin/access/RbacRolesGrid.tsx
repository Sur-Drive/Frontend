"use client";

import { ChevronRight, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface RbacRolesGridProps {
  roles: { id: string; name: string; isSystem: boolean; moduleCount: number; userCount: number }[];
  onCreate: () => void;
  onEdit: (roleId: string) => void;
  onClone: (roleId: string) => void;
  onDeleteRequest: (roleId: string) => void;
}

// Role cards: system roles offer Clone (create prefilled) and no Delete;
// custom roles offer Edit + Delete (delete is confirm-gated by the caller and
// fails server-side while admins are still assigned).
export function RbacRolesGrid({ roles, onCreate, onEdit, onClone, onDeleteRequest }: RbacRolesGridProps) {
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
        {roles.map((role) => (
          <div
            key={role.id}
            className="flex min-w-0 flex-col gap-2 rounded-xl border border-border bg-surface px-4 py-4"
          >
            <div className="flex min-w-0 items-center gap-3">
              <ShieldCheck className="size-5 shrink-0 text-brand" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">{role.name}</span>
                <span className="mt-0.5 block text-xs text-ink-subtle">
                  {role.moduleCount} module{role.moduleCount === 1 ? "" : "s"} · {role.userCount} admin{role.userCount === 1 ? "" : "s"}
                  {role.isSystem ? " · System" : ""}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-brand" aria-hidden="true" />
            </div>
            <div className="flex flex-wrap gap-2">
              {role.isSystem ? (
                <Button variant="secondary" onClick={() => onClone(role.id)} className="h-9 px-3 text-xs">
                  Clone role
                </Button>
              ) : (
                <>
                  <Button variant="secondary" onClick={() => onEdit(role.id)} className="h-9 px-3 text-xs">
                    Edit
                  </Button>
                  <span title={role.userCount > 0 ? "Reassign its admins first" : undefined}>
                    <Button
                      variant="danger"
                      onClick={() => onDeleteRequest(role.id)}
                      disabled={role.userCount > 0}
                      className="h-9 px-3 text-xs"
                    >
                      Delete
                    </Button>
                  </span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
