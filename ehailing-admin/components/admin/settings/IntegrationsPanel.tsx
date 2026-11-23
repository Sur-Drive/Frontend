"use client";

import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import type { StatusTone } from "@/components/ui/StatusPill";
import type {
  IntegrationSetting,
  IntegrationStatus,
} from "@/types/platform-settings";

const INTEGRATION_TONE: Record<IntegrationStatus, StatusTone> = {
  Connected: "success",
  Attention: "warning",
  Disabled: "neutral",
};

interface IntegrationsPanelProps {
  integrations: IntegrationSetting[];
  onConfigure: (integration: IntegrationSetting) => void;
}

export function IntegrationsPanel({
  integrations,
  onConfigure,
}: IntegrationsPanelProps) {
  return (
    <ul className="divide-y divide-border">
      {integrations.map((integration) => (
        <li
          key={integration.id}
          className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:gap-4"
        >
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-ink text-xs font-bold text-white"
          >
            {integration.initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">{integration.name}</p>
            <p className="mt-0.5 text-xs text-ink-muted">{integration.purpose}</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <StatusPill
              tone={INTEGRATION_TONE[integration.status]}
              label={integration.status}
            />
            <Button
              variant="secondary"
              onClick={() => onConfigure(integration)}
              className="h-11! px-5!"
            >
              Configure
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
