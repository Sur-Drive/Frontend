"use client";

import { useId, useState } from "react";
import { Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { PageHeader } from "@/components/admin/PageHeader";
import { SecurityCard } from "@/components/admin/SecurityCard";
import {
  SettingRow,
  SettingToggleRow,
} from "@/components/admin/settings/SettingRow";
import { Toggle } from "@/components/admin/growth/PricingConfigurationPanel";
import { useConfirmedExport } from "@/lib/hooks/useConfirmedExport";
import { downloadCsv, toCsv } from "@/lib/csv";
import { useToast } from "@/components/ui/Toast";

// Design select options ("All Cities" casing as shown).
const CITY_OPTIONS = ["All Cities", "Lagos", "Abuja", "Port Harcourt", "Ibadan"];
const LANGUAGE_OPTIONS = ["English"];

interface PreferencesDraft {
  emailNotifications: boolean;
  desktopNotifications: boolean;
  city: string;
  language: string;
}

export function AccountSettingsView() {
  const toast = useToast();
  const confirmedExport = useConfirmedExport();
  const ids = useId();

  // Local session state: edits stay put across re-renders and saves.
  const [prefs, setPrefs] = useState<PreferencesDraft>({
    emailNotifications: true,
    desktopNotifications: true,
    city: "All Cities",
    language: "English",
  });

  function update<K extends keyof PreferencesDraft>(
    key: K,
    value: PreferencesDraft[K],
  ) {
    setPrefs((current) => ({ ...current, [key]: value }));
  }

  function handleSave() {
    // Session-only save: there is no preferences endpoint, so nothing is sent.
    toast.success({
      title: "Settings saved",
      description: "Your account preferences have been saved for this session.",
    });
  }

  function handleExport() {
    downloadCsv(
      "account-settings.csv",
      toCsv(
        ["Preference", "Value"],
        [
          [
            "Email notifications",
            prefs.emailNotifications ? "On" : "Off",
          ],
          [
            "Desktop notifications",
            prefs.desktopNotifications ? "On" : "Off",
          ],
          ["Default dashboard city", prefs.city],
          ["Language", prefs.language],
        ],
      ),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Account Settings"
        description="Manage preferences and account security."
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
          title="Preferences"
          subtitle="Changes are stored only for this prototype session"
          className="lg:col-span-3"
        >
          <div className="border-y border-border divide-y divide-border">
            <SettingToggleRow
              label="Email notifications"
              helper="Receive operational summaries and alerts"
              control={
                <Toggle
                  checked={prefs.emailNotifications}
                  onChange={(checked) => update("emailNotifications", checked)}
                  label="Email notifications"
                />
              }
            />
            <SettingToggleRow
              label="Desktop notifications"
              helper="Show browser notifications"
              control={
                <Toggle
                  checked={prefs.desktopNotifications}
                  onChange={(checked) => update("desktopNotifications", checked)}
                  label="Desktop notifications"
                />
              }
            />
            <SettingRow
              label="Default dashboard city"
              helper="City selected when the portal opens"
              controlId={`${ids}-city`}
            >
              <Select
                label="Default dashboard city"
                value={prefs.city}
                onChange={(event) => update("city", event.target.value)}
              >
                {CITY_OPTIONS.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </Select>
            </SettingRow>
            <SettingRow
              label="Language"
              helper="Portal display language"
              controlId={`${ids}-language`}
            >
              <Select
                label="Language"
                value={prefs.language}
                onChange={(event) => update("language", event.target.value)}
              >
                {LANGUAGE_OPTIONS.map((language) => (
                  <option key={language} value={language}>
                    {language}
                  </option>
                ))}
              </Select>
            </SettingRow>
          </div>
        </Card>

        <SecurityCard className="lg:col-span-2" />
      </div>

      {confirmedExport.dialog}
    </div>
  );
}