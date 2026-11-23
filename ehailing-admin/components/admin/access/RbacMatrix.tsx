"use client";

import { Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export type RbacMatrix = Record<string, Record<string, boolean>>;

interface RbacMatrixProps {
  roles: { id: string; name: string; isSystem: boolean }[];
  modules: { key: string; label: string; disabled: boolean; reason?: string }[];
  matrix: RbacMatrix;
  dirty: boolean;
  saving: boolean;
  onToggle: (module: string, roleId: string) => void;
  onSave: () => void;
}

// Module x role toggle grid. pricing is not a backend module, so its row is
// visible but disabled with "Not available yet". System-role cells are
// disabled with the clone hint — the backend rejects system-role updates.
export function RbacMatrix({ roles, modules, matrix, dirty, saving, onToggle, onSave }: RbacMatrixProps) {
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
                  {role.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {modules.map((mod) => (
              <tr key={mod.key}>
                <th
                  scope="row"
                  className="sticky left-0 bg-surface px-4 py-3 text-left align-top"
                >
                  <span className="block text-sm font-semibold text-ink">{mod.label}</span>
                  <span className="mt-0.5 block text-xs font-normal text-ink-subtle">
                    Module access
                  </span>
                </th>
                {roles.map((role) => {
                  const granted = matrix[mod.key]?.[role.id] === true;
                  const disabled = mod.disabled || role.isSystem;
                  const reason = mod.disabled
                    ? mod.reason ?? "Not available yet"
                    : "System roles must be cloned to change permissions.";
                  return (
                    <td key={role.id} className="px-4 py-3 text-center align-top">
                      <span title={disabled ? reason : undefined} className="inline-block">
                        <button
                          type="button"
                          aria-pressed={granted}
                          aria-label={`${role.name}: ${mod.label}, ${granted ? "granted" : "denied"}`}
                          disabled={disabled}
                          onClick={() => onToggle(mod.key, role.id)}
                          className={
                            "inline-flex size-8 items-center justify-center rounded-lg transition-colors " +
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50 " +
                            (granted
                              ? "bg-success-soft text-success hover:bg-success-soft/70"
                              : "bg-surface-muted text-ink-subtle hover:bg-border")
                          }
                        >
                          {granted ? (
                            <Check className="size-4" aria-hidden="true" />
                          ) : (
                            <span aria-hidden="true" className="text-xs font-bold">—</span>
                          )}
                        </button>
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-muted">
          Only custom roles can be updated. Changes you make above apply on save.
        </p>
        <Button onClick={onSave} loading={saving} disabled={!dirty || saving} className="shrink-0 sm:w-auto">
          Save permissions
        </Button>
      </div>
    </Card>
  );
}
