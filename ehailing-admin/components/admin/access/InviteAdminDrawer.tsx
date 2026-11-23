"use client";

import { useState } from "react";
import { SideSheet } from "@/components/ui/SideSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Select } from "@/components/ui/Select";

export interface InviteSave {
  name: string;
  email: string;
  role: string;
  message: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface InviteAdminDrawerProps {
  open: boolean;
  takenEmails: string[];
  allRoles: string[];
  initial: InviteSave | null;
  errors: { name?: string; email?: string; role?: string };
  onClose: () => void;
  onSubmit: (save: InviteSave) => void;
  onErrors: (errors: { name?: string; email?: string; role?: string }) => void;
}

export function InviteAdminDrawer(props: InviteAdminDrawerProps) {
  const fallbackRole = props.allRoles[0] ?? "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(fallbackRole);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const key = props.open ? (props.initial ? "restore" : "fresh") : null;
  if (props.open && loadedKey !== key) {
    setLoadedKey(key);
    setName(props.initial?.name ?? "");
    setEmail(props.initial?.email ?? "");
    setRole(props.initial?.role ?? fallbackRole);
  }

  function handleSubmit() {
    const next: { name?: string; email?: string; role?: string } = {};
    if (name.trim() === "") next.name = "Full name is required.";
    const trimmedEmail = email.trim();
    if (trimmedEmail === "") next.email = "Work email is required.";
    else if (!EMAIL_RE.test(trimmedEmail)) next.email = "Enter a valid email address.";
    else if (props.takenEmails.includes(trimmedEmail.toLowerCase()))
      next.email = "This email already belongs to an admin.";
    // Role options are the live backend roles; a role sent without an id is
    // rejected by the view before any request, so any listed value is valid.
    if (role.trim() === "" || !props.allRoles.includes(role)) next.role = "Choose a role.";
    props.onErrors(next);
    if (Object.keys(next).length > 0) return;
    // The backend invite body has no message field; the note stays local and
    // is never sent, so send name/email/role only.
    props.onSubmit({ name: name.trim(), email: trimmedEmail, role, message: "" });
  }

  return (
    <SideSheet
      open={props.open}
      onClose={props.onClose}
      eyebrow="NEW ADMINISTRATOR"
      title="Invite admin"
      subtitle="Send a secure invitation to join the portal."
      footer={
        <Button onClick={handleSubmit} className="w-full sm:w-auto">
          Send invitation
        </Button>
      }
    >
      <div className="flex min-w-0 flex-col gap-5">
        <TextField
          id="invite-name"
          label="Full name"
          placeholder="e.g. Kemi Adewale"
          value={name}
          error={props.errors.name}
          onChange={(event) => setName(event.target.value)}
        />
        <TextField
          id="invite-email"
          label="Work email"
          type="email"
          autoComplete="email"
          placeholder="name@surdriveht.ng"
          value={email}
          error={props.errors.email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <div>
          <label htmlFor="invite-role" className="text-sm font-medium text-ink">
            Administrative role
          </label>
          <div className="mt-1.5">
            <Select
              id="invite-role"
              label="Administrative role"
              options={props.allRoles}
              value={role}
              onChange={(event) => setRole(event.target.value)}
            />
          </div>
          {props.errors.role ? (
            <p role="alert" className="mt-1.5 text-xs text-danger">
              {props.errors.role}
            </p>
          ) : null}
          {role === "Super Administrator" ? (
            <p className="mt-1.5 text-xs text-warning">
              Super Administrators have full access, including settings and admin users.
            </p>
          ) : null}
        </div>
        <p className="text-xs text-ink-muted">
          The invitation email expires in 7 days.
        </p>
      </div>
    </SideSheet>
  );
}
