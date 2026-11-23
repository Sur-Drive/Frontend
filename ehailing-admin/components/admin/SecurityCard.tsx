"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { SettingToggleRow } from "@/components/admin/settings/SettingRow";
import { useToast } from "@/components/ui/Toast";
import { AUTH_NOT_CONNECTED_MESSAGE } from "@/lib/auth";

interface SecurityCardProps {
  className?: string;
}

// Shared Security card used by My Profile and Account Settings: 2FA status
// plus the two account-safety shortcuts. The shortcuts surface the existing
// auth wiring gap instead of being silent no-ops.
export function SecurityCard({ className = "" }: SecurityCardProps) {
  const toast = useToast();

  function notifyUnavailable() {
    toast.warning({
      title: "Not available yet",
      description: AUTH_NOT_CONNECTED_MESSAGE,
    });
  }

  return (
    <Card
      title="Security"
      subtitle="Protect access to your administrator account"
      className={className}
    >
      <div className="border-y border-border divide-y divide-border">
        <SettingToggleRow
          label="Two-factor authentication"
          helper="Required for every new device"
          control={<StatusPill tone="success" label="Enabled" />}
        />
        <SettingToggleRow
          label="Password"
          helper="Last changed 24 days ago"
          control={
            <Button variant="secondary" onClick={notifyUnavailable}>
              Change password
            </Button>
          }
        />
        <SettingToggleRow
          label="Active sessions"
          helper="2 authenticated devices"
          control={
            <Button variant="secondary" onClick={notifyUnavailable}>
              Review sessions
            </Button>
          }
        />
      </div>
    </Card>
  );
}