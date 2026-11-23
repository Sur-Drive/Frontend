"use client";

import { useState } from "react";
import { SideSheet } from "@/components/ui/SideSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Select } from "@/components/ui/Select";
import { Toggle } from "./PricingConfigurationPanel";
import {
  DAY_LABELS,
  SURGE_RULE_TYPES,
  buildSurgeBody,
  emptySurgeDraft,
  surgeDraftFromRule,
  surgeDraftIsValid,
} from "@/lib/pricing";
import { humanize } from "@/lib/format";
import type {
  SurgeRuleBody,
  SurgeRuleDraft,
  SurgeRuleView,
} from "@/types/pricing-api";

interface EditSurgeRuleDrawerProps {
  // null = create mode; otherwise a full-replace edit of this rule.
  rule: SurgeRuleView | null;
  // Stacked under the confirm dialog: false hands Escape/focus to the dialog.
  closeOnEscape?: boolean;
  trapFocus?: boolean;
  onClose: () => void;
  // Receives the built POST/PATCH body; the parent owns the confirm dialog.
  onSave: (body: SurgeRuleBody) => void;
}

// Every documented field, per ruleType. Free-text "condition"/"cities"
// have no backend field, so list conditions are derived from these
// structured fields instead.
export function EditSurgeRuleDrawer({
  rule,
  closeOnEscape = true,
  trapFocus = true,
  onClose,
  onSave,
}: EditSurgeRuleDrawerProps) {
  const [draft, setDraft] = useState<SurgeRuleDraft>(() =>
    rule ? surgeDraftFromRule(rule) : emptySurgeDraft(),
  );

  function update<K extends keyof SurgeRuleDraft>(
    key: K,
    value: SurgeRuleDraft[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function toggleDay(day: number) {
    setDraft((current) => ({
      ...current,
      daysOfWeek: current.daysOfWeek.includes(day)
        ? current.daysOfWeek.filter((entry) => entry !== day)
        : [...current.daysOfWeek, day].sort((a, b) => a - b),
    }));
  }

  const valid = surgeDraftIsValid(draft);

  return (
    <SideSheet
      open={true}
      onClose={onClose}
      closeOnEscape={closeOnEscape}
      trapFocus={trapFocus}
      eyebrow="SURGE RULE CONFIGURATION"
      title={rule ? `Edit ${rule.name}` : "New surge rule"}
      subtitle="Required fields are validated before saving. Editing replaces the whole rule: cleared optional fields are removed."
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} className="h-11! px-6! sm:flex-none">
            Cancel
          </Button>
          <Button
            disabled={!valid}
            onClick={() => onSave(buildSurgeBody(draft))}
            className="h-11! px-6! sm:flex-none"
          >
            Save changes
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <TextField
          id="surge-rule-name"
          label="Rule name"
          value={draft.name}
          onChange={(event) => update("name", event.target.value)}
        />
        <TextField
          id="surge-rule-description"
          label="Description"
          value={draft.description}
          onChange={(event) => update("description", event.target.value)}
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Select
            id="surge-rule-type"
            label="Rule type"
            value={draft.ruleType}
            onChange={(event) => update("ruleType", event.target.value)}
          >
            {SURGE_RULE_TYPES.map((type) => (
              <option key={type} value={type}>
                {humanize(type)}
              </option>
            ))}
          </Select>
          <TextField
            id="surge-rule-multiplier"
            label="Surge multiplier"
            type="text"
            inputMode="decimal"
            value={draft.multiplier}
            trailing={
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted">
                ×
              </span>
            }
            onChange={(event) =>
              update("multiplier", event.target.value.replace(/[^\d.]/g, ""))
            }
          />
          <TextField
            id="surge-rule-priority"
            label="Priority (higher fires first)"
            type="number"
            inputMode="numeric"
            min={0}
            value={draft.priority}
            onChange={(event) =>
              update("priority", event.target.value.replace(/[^\d]/g, ""))
            }
          />
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-ink">Status</span>
            <div className="mt-1.5">
              <Toggle
                checked={draft.isActive}
                onChange={(checked) => update("isActive", checked)}
                label="Surge rule active"
              />
            </div>
          </div>
        </div>

        {draft.ruleType === "time_window" ? (
          <fieldset className="min-w-0 border-0 p-0">
            <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">
              Schedule (required)
            </legend>
            <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <TextField
                id="surge-start-time"
                label="Start time"
                type="time"
                value={draft.startTime}
                onChange={(event) => update("startTime", event.target.value)}
              />
              <TextField
                id="surge-end-time"
                label="End time"
                type="time"
                value={draft.endTime}
                onChange={(event) => update("endTime", event.target.value)}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {DAY_LABELS.map((label, day) => {
                const selected = draft.daysOfWeek.includes(day);
                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleDay(day)}
                    className={
                      "rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand " +
                      (selected
                        ? "border-brand bg-brand text-white"
                        : "border-border bg-surface text-ink-muted")
                    }
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-ink-muted">
              No days selected applies every day. Cross-midnight windows
              (22:00–02:00) are supported.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <TextField
                id="surge-city"
                label="City (optional zone filter)"
                value={draft.city}
                onChange={(event) => update("city", event.target.value)}
              />
              <TextField
                id="surge-state"
                label="State (optional zone filter)"
                value={draft.state}
                onChange={(event) => update("state", event.target.value)}
              />
            </div>
          </fieldset>
        ) : null}

        {draft.ruleType === "demand" ? (
          <fieldset className="min-w-0 border-0 p-0">
            <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">
              Demand trigger (required)
            </legend>
            <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <TextField
                id="surge-demand-threshold"
                label="Demand threshold (%)"
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                value={draft.demandThresholdPercent}
                onChange={(event) =>
                  update(
                    "demandThresholdPercent",
                    event.target.value.replace(/[^\d]/g, ""),
                  )
                }
              />
              <TextField
                id="surge-demand-city"
                label="City (optional)"
                value={draft.city}
                onChange={(event) => update("city", event.target.value)}
              />
            </div>
          </fieldset>
        ) : null}

        {draft.ruleType === "weather" ? (
          <fieldset className="min-w-0 border-0 p-0">
            <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">
              Weather trigger (required)
            </legend>
            <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <TextField
                id="surge-weather-condition"
                label="Weather condition (e.g. rain)"
                value={draft.weatherCondition}
                onChange={(event) =>
                  update("weatherCondition", event.target.value)
                }
              />
              <TextField
                id="surge-weather-state"
                label="State (optional)"
                value={draft.state}
                onChange={(event) => update("state", event.target.value)}
              />
            </div>
          </fieldset>
        ) : null}

        {draft.ruleType === "zone" ? (
          <fieldset className="min-w-0 border-0 p-0">
            <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">
              Zone (city or state required) + optional lifetime
            </legend>
            <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <TextField
                id="surge-zone-city"
                label="City"
                value={draft.city}
                onChange={(event) => update("city", event.target.value)}
              />
              <TextField
                id="surge-zone-state"
                label="State"
                value={draft.state}
                onChange={(event) => update("state", event.target.value)}
              />
              <TextField
                id="surge-valid-from"
                label="Valid from (optional)"
                type="datetime-local"
                value={draft.validFrom}
                onChange={(event) => update("validFrom", event.target.value)}
              />
              <TextField
                id="surge-valid-to"
                label="Valid to (optional)"
                type="datetime-local"
                value={draft.validTo}
                onChange={(event) => update("validTo", event.target.value)}
              />
            </div>
          </fieldset>
        ) : null}

        {!valid ? (
          <p className="text-xs text-ink-muted">
            Fill the required fields for this rule type before saving.
          </p>
        ) : null}
      </div>
    </SideSheet>
  );
}
