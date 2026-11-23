"use client";

import { useState } from "react";
import { SideSheet } from "@/components/ui/SideSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import type { CityPatchBody, CityRuleView } from "@/types/pricing-api";

// Draft fields for editing city rates of a single category. Only the three
// money fields the list response carries AND the documented PATCH example
// shows — bookingFee/minimumFare are not in either, so they are never
// collected (collecting them would throw the input away).
interface Draft {
  baseFare: string;
  perKm: string;
  perMinute: string;
}

function toDraft(rule: CityRuleView): Draft {
  return {
    baseFare: rule.baseFare === null ? "0" : String(rule.baseFare),
    perKm: rule.perKm === null ? "0" : String(rule.perKm),
    perMinute: rule.perMinute === null ? "0" : String(rule.perMinute),
  };
}

function parseCount(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : 0;
}

interface EditCityRatesDrawerProps {
  rule: CityRuleView;
  // Stacked under the confirm dialog: false hands Escape/focus to the dialog.
  closeOnEscape?: boolean;
  trapFocus?: boolean;
  onClose: () => void;
  onSave: (body: CityPatchBody) => void;
}

export function EditCityRatesDrawer({
  rule,
  closeOnEscape = true,
  trapFocus = true,
  onClose,
  onSave,
}: EditCityRatesDrawerProps) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(rule));

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleSave() {
    onSave({
      baseFare: parseCount(draft.baseFare),
      perKm: parseCount(draft.perKm),
      perMinute: parseCount(draft.perMinute),
    });
  }

  const moneyFields = [
    { key: "baseFare", label: "Base fare (₦)" },
    { key: "perKm", label: "Per kilometre (₦)" },
    { key: "perMinute", label: "Per minute (₦)" },
  ] as const;

  return (
    <SideSheet
      open={true}
      onClose={onClose}
      closeOnEscape={closeOnEscape}
      trapFocus={trapFocus}
      eyebrow="CITY PRICING CONFIGURATION"
      title={`Edit ${rule.rideTypeLabel} rates — ${rule.city}`}
      subtitle="Update category-specific operating rates for this city. Saving creates a new rule version."
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} className="h-11! px-6! sm:flex-none">
            Cancel
          </Button>
          <Button onClick={handleSave} className="h-11! px-6! sm:flex-none">
            Save changes
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <TextField
          id="city-category-name"
          label="Ride type"
          value={rule.rideTypeLabel}
          disabled
        />
        <TextField
          id="city-rule-version"
          label="Current version"
          value={rule.version ?? "—"}
          disabled
        />

        <fieldset className="min-w-0 border-0 p-0">
          <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">
            City rates (₦)
          </legend>
          <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {moneyFields.map(({ key, label }) => (
              <TextField
                key={key}
                id={`city-rate-${key}`}
                label={label}
                type="number"
                inputMode="numeric"
                min={0}
                value={draft[key]}
                onChange={(event) => update(key, event.target.value)}
              />
            ))}
          </div>
        </fieldset>

        <p className="mt-4 text-xs text-ink-muted">
          Changes apply only to <strong>{rule.city}</strong> for{" "}
          <strong>{rule.rideTypeLabel}</strong>. Other cities keep their own
          rates. Omitted fields carry forward.
        </p>
      </div>
    </SideSheet>
  );
}
