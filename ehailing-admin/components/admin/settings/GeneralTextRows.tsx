"use client";

import { TextField } from "@/components/ui/TextField";
import { Select } from "@/components/ui/Select";
import { SettingRow } from "@/components/admin/settings/SettingRow";
import { CURRENCIES, TIMEZONES } from "@/types/platform-settings";
import type { SectionErrors } from "@/types/platform-settings";
import type { GeneralPatch } from "@/components/admin/settings/GeneralPanel";

interface GeneralTextRowsProps {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  currency: string;
  timezone: string;
  savedCurrency: string;
  errors: SectionErrors;
  onChange: (patch: GeneralPatch) => void;
}

export function GeneralTextRows({
  platformName,
  supportEmail,
  supportPhone,
  currency,
  timezone,
  savedCurrency,
  errors,
  onChange,
}: GeneralTextRowsProps) {
  return (
    <>
      <SettingRow
        label="Platform name"
        helper="Your public-facing business name"
        controlId="settings-platform-name"
        error={errors.platformName}
      >
        <TextField
          id="settings-platform-name"
          label="Platform name"
          hideLabel
          value={platformName}
          maxLength={40}
          error={errors.platformName}
          onChange={(event) => onChange({ platformName: event.target.value })}
        />
      </SettingRow>
      <SettingRow
        label="Support email"
        helper="Primary passenger and driver support inbox"
        controlId="settings-support-email"
        error={errors.supportEmail}
      >
        <TextField
          id="settings-support-email"
          label="Support email"
          hideLabel
          type="email"
          autoComplete="email"
          value={supportEmail}
          error={errors.supportEmail}
          onChange={(event) => onChange({ supportEmail: event.target.value })}
        />
      </SettingRow>
      <SettingRow
        label="Support phone"
        helper="Shown in help and emergency contact surfaces"
        controlId="settings-support-phone"
        error={errors.supportPhone}
      >
        <TextField
          id="settings-support-phone"
          label="Support phone"
          hideLabel
          type="tel"
          autoComplete="tel"
          value={supportPhone}
          error={errors.supportPhone}
          onChange={(event) => onChange({ supportPhone: event.target.value })}
        />
      </SettingRow>
      <SettingRow
        label="Currency"
        helper="Default currency across fares and settlements"
        controlId="settings-currency"
        warning={
          currency !== savedCurrency
            ? "Changing the default currency affects fares and settlements."
            : undefined
        }
      >
        <Select
          id="settings-currency"
          label="Currency"
          options={CURRENCIES}
          value={currency}
          onChange={(event) => onChange({ currency: event.target.value })}
        />
      </SettingRow>
      <SettingRow
        label="Timezone"
        helper="Used for schedules, reports and audit logs"
        controlId="settings-timezone"
      >
        <Select
          id="settings-timezone"
          label="Timezone"
          options={TIMEZONES}
          value={timezone}
          onChange={(event) => onChange({ timezone: event.target.value })}
        />
      </SettingRow>
    </>
  );
}
