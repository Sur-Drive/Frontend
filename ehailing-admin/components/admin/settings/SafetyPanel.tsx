"use client";

import { TextField } from "@/components/ui/TextField";
import { Select } from "@/components/ui/Select";
import { SettingRow, SettingToggleRow } from "@/components/admin/settings/SettingRow";
import { SAFETY_ROUTINGS } from "@/types/platform-settings";
import type { SectionErrors } from "@/types/platform-settings";
import { Toggle } from "@/components/admin/growth/PricingConfigurationPanel";

interface SafetyPanelProps {
  sosEscalation: boolean;
  emergencyLine: string;
  policeLine: string;
  routing: string;
  tripSharing: boolean;
  errors: SectionErrors;
  onToggle: (key: "sosEscalation" | "tripSharing", value: boolean) => void;
  onText: (key: "emergencyLine" | "policeLine", value: string) => void;
  onRouting: (value: string) => void;
}

export function SafetyPanel(props: SafetyPanelProps) {
  const { errors } = props;
  return (
    <div className="divide-y divide-border">
      <SettingToggleRow
        label="Automatic SOS escalation"
        helper="Escalate unacknowledged SOS alerts after 60 seconds"
        control={
          <Toggle
            checked={props.sosEscalation}
            onChange={(value) => props.onToggle("sosEscalation", value)}
            label="Automatic SOS escalation"
          />
        }
      />
      <SettingRow
        label="Emergency response line"
        helper="24/7 safety operations contact"
        controlId="settings-emergency-line"
        error={errors.emergencyLine}
      >
        <TextField
          id="settings-emergency-line"
          label="Emergency response line"
          hideLabel
          type="tel"
          autoComplete="tel"
          value={props.emergencyLine}
          error={errors.emergencyLine}
          onChange={(event) => props.onText("emergencyLine", event.target.value)}
        />
      </SettingRow>
      <SettingRow
        label="Nigeria Police emergency"
        helper="National emergency contact surfaced to users"
        controlId="settings-police-line"
        error={errors.policeLine}
      >
        <TextField
          id="settings-police-line"
          label="Nigeria Police emergency"
          hideLabel
          type="tel"
          value={props.policeLine}
          error={errors.policeLine}
          onChange={(event) => props.onText("policeLine", event.target.value)}
        />
      </SettingRow>
      <SettingRow
        label="Critical incident routing"
        helper="Default team for critical safety reports"
        controlId="settings-routing"
      >
        <Select
          id="settings-routing"
          label="Critical incident routing"
          options={SAFETY_ROUTINGS}
          value={props.routing}
          onChange={(event) => props.onRouting(event.target.value)}
        />
      </SettingRow>
      <SettingToggleRow
        label="Live trip sharing"
        helper="Allow passengers to share live trip status"
        control={
          <Toggle
            checked={props.tripSharing}
            onChange={(value) => props.onToggle("tripSharing", value)}
            label="Live trip sharing"
          />
        }
      />
    </div>
  );
}
