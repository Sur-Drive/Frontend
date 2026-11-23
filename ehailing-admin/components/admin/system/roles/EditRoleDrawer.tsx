"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { SideSheet } from "@/components/ui/SideSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { PERMISSIONS } from "@/types/admin-users";
import type { PermissionName } from "@/types/admin-users";

export interface RoleDraft {
  // null = create mode; otherwise the RoleRecord id being edited.
  roleId: string | null;
  name: string;
  description: string;
  permissions: Record<PermissionName, boolean>;
}

interface EditRoleDrawerProps {
  draft: RoleDraft;
  // Other roles' names, for duplicate-name validation on submit.
  takenNames: string[];
  onClose: () => void;
  onSubmit: (draft: RoleDraft) => void;
  // Fires on every module toggle so the parent applies edits live and the role
  // card's module count updates in real time; ignored while creating.
  onPermissionsChange: (permissions: Record<PermissionName, boolean>) => void;
}

export function EditRoleDrawer({
  draft,
  takenNames,
  onClose,
  onSubmit,
  onPermissionsChange,
}: EditRoleDrawerProps) {
  const [name, setName] = useState(draft.name);
  const [description, setDescription] = useState(draft.description);
  const [permissions, setPermissions] = useState(draft.permissions);
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  const isCreate = draft.roleId === null;

  function toggleModule(permission: PermissionName) {
    const next = { ...permissions, [permission]: !permissions[permission] };
    setPermissions(next);
    onPermissionsChange(next);
  }

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
    onSubmit({
      roleId: draft.roleId,
      name: trimmedName,
      description: trimmedDescription,
      permissions,
    });
  }

  return (
    <SideSheet
      open
      onClose={onClose}
      eyebrow="ROLE MANAGEMENT"
      title={isCreate ? "New role" : "Edit role"}
      subtitle="Configure the role name, description, and module permissions."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="w-full sm:w-auto">
            Save changes
          </Button>
        </>
      }
    >
      <div className="flex min-w-0 flex-col gap-5">
        <TextField
          id="role-name"
          label="Role name *"
          placeholder="e.g. Operations Manager"
          value={name}
          error={errors.name}
          onChange={(event) => setName(event.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="role-description" className="text-sm font-medium text-ink">
            Description *
          </label>
          <textarea
            id="role-description"
            value={description}
            placeholder="Describe the responsibilities of this role..."
            rows={4}
            aria-invalid={errors.description ? true : undefined}
            aria-describedby={errors.description ? "role-description-error" : undefined}
            onChange={(event) => setDescription(event.target.value)}
            className={
              "min-h-26 w-full resize-none rounded-xl border bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:text-sm " +
              (errors.description ? "border-danger" : "border-border")
            }
          />
          {errors.description ? (
            <p id="role-description-error" role="alert" className="text-xs text-danger">
              {errors.description}
            </p>
          ) : null}
        </div>
        <fieldset className="min-w-0 border-0 p-0">
          <legend className="mb-3 p-0 text-xl font-normal text-ink">Module permissions</legend>
          <div className="grid grid-cols-2 gap-3">
            {PERMISSIONS.map((permission) => {
              const checked = permissions[permission];
              return (
                <label
                  key={permission}
                  className="flex cursor-pointer flex-col items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-4 text-center transition-colors hover:bg-surface-muted/60 focus-within:ring-2 focus-within:ring-brand focus-within:ring-offset-2 focus-within:ring-offset-bg"
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => toggleModule(permission)}
                  />
                  <span
                    aria-hidden="true"
                    className={
                      "flex size-5 items-center justify-center rounded-md border-2 transition-colors " +
                      (checked
                        ? "border-brand bg-brand text-white"
                        : "border-border bg-surface text-transparent")
                    }
                  >
                    <Check className="size-3.5" />
                  </span>
                  <span className="text-sm text-ink">{permission}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>
    </SideSheet>
  );
}