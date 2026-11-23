"use client";

import { Check, ShieldCheck, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { matrixRoleLabel } from "@/lib/constants";
import { PERMISSIONS } from "@/types/admin-users";
import type { PermissionName, RoleRecord } from "@/types/admin-users";

const CAPABILITY_SUBTEXT = "View • Create • Edit • Delete • Assign • Manage";

interface PermissionMatrixProps {
  roles: RoleRecord[];
  matrix: Record<PermissionName, Record<string, boolean>>;
  onToggle: (permission: PermissionName, roleId: string) => void;
  onSave: () => void;
}

export function PermissionMatrix({ roles, matrix, onToggle, onSave }: PermissionMatrixProps) {
  return (
    <Card
      title="Complete Permission Matrix"
      subtitle="Module access summary for every role"
      className="min-w-0"
    >
      <div className="w-full max-w-full min-w-0 overflow-x-auto">
        <table className="w-full border-collapse text-left" style={{ minWidth: 920 }}>
          <thead>
            <tr className="border-b border-border">
              <th
                scope="col"
                className="sticky left-0 bg-surface px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted"
              >
                Module
              </th>
              {roles.map((role) => (
                <th
                  key={role.id}
                  scope="col"
                  className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-ink-muted"
                >
                  {matrixRoleLabel(role.name)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {PERMISSIONS.map((permission) => (
              <tr key={permission}>
                <th
                  scope="row"
                  className="sticky left-0 bg-surface px-4 py-3 text-left align-top"
                >
                  <span className="block text-sm font-semibold text-ink">{permission}</span>
                  <span className="mt-0.5 block text-xs font-normal text-ink-subtle">
                    {CAPABILITY_SUBTEXT}
                  </span>
                </th>
                {roles.map((role) => {
                  const granted = matrix[permission][role.id] === true;
                  return (
                    <td key={role.id} className="px-4 py-3 text-center align-top">
                      <button
                        type="button"
                        aria-pressed={granted}
                        aria-label={`${role.name}: ${permission}, ${granted ? "granted" : "denied"}`}
                        onClick={() => onToggle(permission, role.id)}
                        className={
                          "inline-flex size-8 items-center justify-center rounded-lg transition-colors " +
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand " +
                          (granted
                            ? "bg-success-soft text-success hover:bg-success-soft/70"
                            : "bg-surface-muted text-ink-subtle hover:bg-border")
                        }
                      >
                        {granted ? (
                          <Check className="size-4" aria-hidden="true" />
                        ) : (
                          <X className="size-4" aria-hidden="true" />
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-xs text-ink-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Permission changes in this prototype are local and are not enforced by a backend.
        </p>
        <Button onClick={onSave} className="shrink-0 sm:w-auto">
          Save permissions
        </Button>
      </div>
    </Card>
  );
}