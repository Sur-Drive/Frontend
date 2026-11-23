"use client";

import { useState } from "react";
import { SideSheet } from "@/components/ui/SideSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

export interface RbacRoleDraft {
  roleId: string | null;
  name: string;
  description: string;
}

interface RbacRoleDrawerProps {
  draft: RbacRoleDraft;
  takenNames: string[];
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (draft: RbacRoleDraft) => void;
}

// Rename/create drawer only: permissions are toggled in the matrix, never
// here, so a rename can never silently drop actions. System roles are
// rename-blocked by the caller (edit opens only for custom roles).
export function RbacRoleDrawer({ draft, takenNames, busy, error, onClose, onSubmit }: RbacRoleDrawerProps) {
  const [name, setName] = useState(draft.name);
  const [description, setDescription] = useState(draft.description);
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  const isCreate = draft.roleId === null;

  function handleSubmit() {
    const next: { name?: string; description?: string } = {};
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    if (trimmedName === "") next.name = "Role name is required.";
    else if (takenNames.some((taken) => taken.toLowerCase() === trimmedName.toLowerCase()))
      next.name = "A role with this name already exists.";
    if (trimmedDescription === "") next.description = "Description is required.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSubmit({ roleId: draft.roleId, name: trimmedName, description: trimmedDescription });
  }

  return (
    <SideSheet
      open
      onClose={busy ? () => undefined : onClose}
      eyebrow="ROLE MANAGEMENT"
      title={isCreate ? "New role" : "Edit role"}
      subtitle="Configure the role name and description."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleSubmit} loading={busy} className="w-full sm:w-auto">
            Save changes
          </Button>
        </>
      }
    >
      <div className="flex min-w-0 flex-col gap-5">
        <TextField
          id="rbac-role-name"
          label="Role name *"
          placeholder="e.g. Operations Manager"
          value={name}
          error={errors.name}
          onChange={(event) => setName(event.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rbac-role-description" className="text-sm font-medium text-ink">
            Description *
          </label>
          <textarea
            id="rbac-role-description"
            value={description}
            placeholder="Describe the responsibilities of this role..."
            rows={4}
            aria-invalid={errors.description ? true : undefined}
            aria-describedby={errors.description ? "rbac-role-description-error" : undefined}
            onChange={(event) => setDescription(event.target.value)}
            className={
              "min-h-26 w-full resize-none rounded-xl border bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:text-sm " +
              (errors.description ? "border-danger" : "border-border")
            }
          />
          {errors.description ? (
            <p id="rbac-role-description-error" role="alert" className="text-xs text-danger">
              {errors.description}
            </p>
          ) : null}
        </div>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </SideSheet>
  );
}
