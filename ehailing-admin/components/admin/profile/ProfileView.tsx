"use client";

import { useId, useState } from "react";
import { Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { StatusPill } from "@/components/ui/StatusPill";
import { TextField } from "@/components/ui/TextField";
import { PageHeader } from "@/components/admin/PageHeader";
import { SecurityCard } from "@/components/admin/SecurityCard";
import { useAdminUser } from "@/components/admin/AdminUserContext";
import { useConfirmedExport } from "@/lib/hooks/useConfirmedExport";
import { downloadCsv, toCsv } from "@/lib/csv";
import { useToast } from "@/components/ui/Toast";

// The design banner shows the canonical role; ADMIN_USER keeps the short
// topbar form ("Super Admin").
const DISPLAY_ROLE = "Super Administrator";

// Design-provided contact seed (no profile endpoint exists yet).
const SEED = {
  email: "emmanuel.okafor@surdriveht.ng",
  phone: "+234 803 000 4821",
  department: "Platform Administration",
  location: "Lagos, Nigeria",
};

interface ProfileDraft {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  location: string;
}

export function ProfileView() {
  const { user } = useAdminUser();
  const toast = useToast();
  const confirmedExport = useConfirmedExport();
  const ids = useId();

  // Local session state: edits stay put across re-renders and saves.
  const [draft, setDraft] = useState<ProfileDraft>(() => ({
    firstName: user.firstName,
    lastName: user.lastName,
    ...SEED,
  }));

  const initials =
    `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  function update<K extends keyof ProfileDraft>(key: K, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleSave() {
    // Session-only save: there is no profile endpoint, so nothing is sent.
    toast.success({
      title: "Profile saved",
      description: "Your profile changes have been saved for this session.",
    });
  }

  function handleExport() {
    downloadCsv(
      "my-profile.csv",
      toCsv(
        ["First name", "Last name", "Work email", "Phone", "Department", "Location"],
        [
          [
            draft.firstName,
            draft.lastName,
            draft.email,
            draft.phone,
            draft.department,
            draft.location,
          ],
        ],
      ),
    );
  }

  const field = (
    key: keyof ProfileDraft,
    label: string,
    type?: "email" | "tel",
  ) => (
    <TextField
      id={`${ids}-${key}`}
      label={label}
      type={type}
      value={draft[key]}
      onChange={(event) => update(key, event.target.value)}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Profile"
        description="View and edit your administrator profile."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                confirmedExport.requestExport("Confirm export", handleExport)
              }
            >
              <Download className="size-4" aria-hidden="true" />
              Export
            </Button>
            <Button onClick={handleSave}>
              <Plus className="size-4" aria-hidden="true" />
              Save changes
            </Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-5">
        <Card
          title="Personal details"
          subtitle="Changes are stored only for this prototype session"
          className="lg:col-span-3"
        >
          <div className="flex items-center gap-4 rounded-xl bg-brand-soft p-4 sm:p-5">
            <InitialsAvatar initials={initials} tone="brand" size="xl" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-medium text-ink">
                {user.firstName} {user.lastName}
              </p>
              <p className="mt-0.5 truncate text-sm text-ink-muted">
                {DISPLAY_ROLE}
              </p>
            </div>
            <StatusPill tone="success" label="Active" />
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {field("firstName", "First name")}
            {field("lastName", "Last name")}
            {field("email", "Work email", "email")}
            {field("phone", "Phone", "tel")}
            {field("department", "Department")}
            {field("location", "Location")}
          </div>
        </Card>

        <SecurityCard className="lg:col-span-2" />
      </div>

      {confirmedExport.dialog}
    </div>
  );
}