"use client";

import { useState } from "react";
import { SideSheet } from "@/components/ui/SideSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Select } from "@/components/ui/Select";
import { INTEGRATION_ENVIRONMENTS } from "@/types/platform-settings";
import type {
  IntegrationEnvironment,
  IntegrationSetting,
} from "@/types/platform-settings";
import { Toggle } from "@/components/admin/growth/PricingConfigurationPanel";

export interface IntegrationSave {
  enabled: boolean;
  environment: IntegrationEnvironment;
  keyReplaced: boolean;
}

interface IntegrationDrawerProps {
  integration: IntegrationSetting | null;
  onClose: () => void;
  onSave: (save: IntegrationSave) => void;
}

export function IntegrationDrawer({
  integration,
  onClose,
  onSave,
}: IntegrationDrawerProps) {
  const [enabled, setEnabled] = useState(true);
  const [environment, setEnvironment] = useState<IntegrationEnvironment>("Live");
  const [replacing, setReplacing] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  if (integration && loadedFor !== integration.id) {
    setLoadedFor(integration.id);
    setEnabled(integration.enabled);
    setEnvironment(integration.environment);
    setReplacing(false);
    setNewKey("");
  }

  function handleSave() {
    // Real secrets are handled server-side only: only a "key replaced" flag
    // leaves this drawer, never the typed value.
    onSave({ enabled, environment, keyReplaced: replacing || integration?.keyReplaced === true });
  }

  return (
    <SideSheet
      open={integration !== null}
      onClose={onClose}
      eyebrow="INTEGRATION CONFIGURATION"
      title={integration?.name ?? ""}
      subtitle={integration?.purpose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleSave} className="sm:w-auto">
            Update integration
          </Button>
        </>
      }
    >
      {integration ? (
        <div className="flex flex-col gap-5">
          {integration.status === "Attention" ? (
            <p
              role="note"
              className="rounded-xl border border-warning bg-warning-soft px-4 py-3 text-sm text-warning"
            >
              This integration needs attention. Check the credentials and save
              again.
            </p>
          ) : null}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">Enabled</p>
              <p className="mt-0.5 text-xs text-ink-muted">
                Allow the platform to call this provider
              </p>
            </div>
            <Toggle
              checked={enabled}
              onChange={setEnabled}
              label={`Enable ${integration.name}`}
            />
          </div>
          <div>
            <label
              htmlFor="integration-environment"
              className="text-sm font-medium text-ink"
            >
              Environment
            </label>
            <div className="mt-1.5">
              <Select
                id="integration-environment"
                label="Environment"
                options={INTEGRATION_ENVIRONMENTS}
                value={environment}
                onChange={(event) =>
                  setEnvironment(event.target.value as IntegrationEnvironment)
                }
              />
            </div>
          </div>
          <div>
            <span className="text-sm font-medium text-ink">API key</span>
            <p className="mt-1.5 rounded-xl border border-border bg-surface-muted px-4 py-3 font-mono text-sm text-ink-muted">
              {integration.keyReplaced ? "Replaced — pending save" : integration.maskedKey}
            </p>
            {replacing ? (
              <div className="mt-3">
                <TextField
                  id="integration-new-key"
                  label="New API key"
                  type="password"
                  autoComplete="off"
                  value={newKey}
                  onChange={(event) => setNewKey(event.target.value)}
                />
              </div>
            ) : (
              <Button
                variant="secondary"
                onClick={() => setReplacing(true)}
                className="mt-3 h-11! px-5!"
              >
                Replace key
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </SideSheet>
  );
}
