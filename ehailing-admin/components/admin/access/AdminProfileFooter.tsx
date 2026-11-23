"use client";

import { Button } from "@/components/ui/Button";
import type { AdminUserRecord } from "@/types/admin-users";
import type { ProfileRequest } from "@/components/admin/access/AdminProfileDrawer";

// First-slot tone is red for every status by design; change FIRST_TONE once to
// restyle it everywhere.
const FIRST_TONE = "danger" as const;

interface ProfileFooterProps {
  admin: AdminUserRecord;
  roleChanged: boolean;
  guard: string | null;
  onRequest: (request: ProfileRequest) => void;
}

export function ProfileFooter({ admin, roleChanged, guard, onRequest }: ProfileFooterProps) {
  const saveTitle = guard ?? (roleChanged ? undefined : "No changes to save");
  return (
    <>
      {admin.status === "Invited" ? (
        <>
          <Button variant={FIRST_TONE} onClick={() => onRequest({ kind: "revoke" })} className="sm:w-auto">
            Revoke invitation
          </Button>
          {/* No resend-invite endpoint is documented. */}
          <span title="Not available yet">
            <Button variant="secondary" disabled className="sm:w-auto">
              Resend invitation
            </Button>
          </span>
        </>
      ) : (
        <Button
          variant={FIRST_TONE}
          disabled={guard !== null}
          title={guard ?? undefined}
          onClick={() => onRequest(admin.status === "Active" ? { kind: "deactivate" } : { kind: "reactivate" })}
          className="sm:w-auto"
        >
          {admin.status === "Active" ? "Deactivate" : "Reactivate"}
        </Button>
      )}
      <Button
        disabled={guard !== null || !roleChanged}
        title={saveTitle ?? undefined}
        onClick={() => onRequest({ kind: "change-role", role: admin.role })}
        className="sm:w-auto"
      >
        Save changes
      </Button>
    </>
  );
}
