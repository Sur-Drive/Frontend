"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import { formatNaira, formatNumber } from "@/lib/format";
import type { CategoryPatchBody, PricingCategoryView } from "@/types/pricing-api";

// The subset of a category that the pricing form edits. Field names match the
// entity so a finished form spreads straight back onto the category.
interface Form {
  baseFare: number;
  perKm: number;
  perMinute: number;
  bookingFee: number;
  minimumFare: number;
  commissionPct: number;
  cancellationFee: number;
  waitingFeePerMin: number;
  surgeEnabled: boolean;
}

const emptyForm: Form = {
  baseFare: 0,
  perKm: 0,
  perMinute: 0,
  bookingFee: 0,
  minimumFare: 0,
  commissionPct: 0,
  cancellationFee: 0,
  waitingFeePerMin: 0,
  surgeEnabled: true,
};

function toForm(category: PricingCategoryView): Form {
  return {
    baseFare: category.baseFare ?? 0,
    perKm: category.perKm ?? 0,
    perMinute: category.perMinute ?? 0,
    bookingFee: category.bookingFee ?? 0,
    minimumFare: category.minimumFare ?? 0,
    commissionPct: category.commissionPercent ?? 0,
    cancellationFee: category.cancellationFee ?? 0,
    waitingFeePerMin: category.waitingFeePerMin ?? 0,
    // Display only: PATCH /pricing/categories has no surge field, so the
    // toggle is disabled with "Not available yet" and never sent.
    surgeEnabled: category.surgeActive ?? false,
  };
}

function toPatchBody(form: Form): CategoryPatchBody {
  return {
    baseFare: form.baseFare,
    perKm: form.perKm,
    perMinute: form.perMinute,
    bookingFee: form.bookingFee,
    minimumFare: form.minimumFare,
    commissionPercent: form.commissionPct,
    cancellationFee: form.cancellationFee,
    waitingFeePerMin: form.waitingFeePerMin,
  };
}

// True when any PATCH-able field differs from the loaded server record.
// waitingGraceMin is not edited here (it lives in the edit drawer), so it is
// deliberately absent from the comparison.
function isFormDirty(form: Form, category: PricingCategoryView | undefined): boolean {
  if (!category) return false;
  return (
    form.baseFare !== (category.baseFare ?? 0) ||
    form.perKm !== (category.perKm ?? 0) ||
    form.perMinute !== (category.perMinute ?? 0) ||
    form.bookingFee !== (category.bookingFee ?? 0) ||
    form.minimumFare !== (category.minimumFare ?? 0) ||
    form.commissionPct !== (category.commissionPercent ?? 0) ||
    form.cancellationFee !== (category.cancellationFee ?? 0) ||
    form.waitingFeePerMin !== (category.waitingFeePerMin ?? 0)
  );
}


function clamp(value: number, min: number, max = Number.MAX_SAFE_INTEGER): number {
  return Math.min(Math.max(value, min), max);
}

// Thousands-formatted numeric field. Shows raw digits while focused (so the
// caret never fights grouping) and the grouped value when idle. Non-digits are
// stripped and the value clamped to [min, max] — no negatives, commission 0–100.
// Shared with Platform Settings (refund window); do not duplicate it there.
export function MoneyField({
  id,
  label,
  value,
  onChange,
  min = 0,
  max,
  hideLabel = false,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  hideLabel?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <TextField
      id={id}
      label={label}
      hideLabel={hideLabel}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={focused ? String(value) : formatNumber(value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(event) => {
        const digits = event.target.value.replace(/[^\d]/g, "");
        const parsed = digits === "" ? 0 : Number(digits);
        onChange(clamp(parsed, min, max));
      }}
    />
  );
}

// Accessible on/off switch. The white knob reads on both the muted (off) and
// brand (on) tracks in light and dark mode.
// Shared with Platform Settings; do not build another toggle there.
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full " +
        "transition-colors focus-visible:outline-none focus-visible:ring-2 " +
        "focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface " +
        (checked ? "bg-brand" : "border border-border bg-surface-muted")
      }
    >
      <span
        className={
          "inline-block size-5 transform rounded-full bg-white shadow transition-transform " +
          (checked ? "translate-x-5" : "translate-x-0.5")
        }
      />
    </button>
  );
}

interface PricingConfigurationPanelProps {
  categories: PricingCategoryView[];
  // Opens the shared confirm dialog; the parent PATCHes and refetches on
  // success (no local change is committed before the backend confirms).
  onRequestSave: (rideType: string, body: CategoryPatchBody) => void;
}

export function PricingConfigurationPanel({
  categories,
  onRequestSave,
}: PricingConfigurationPanelProps) {
  const defaultId =
    categories.find((category) => category.label === "Comfort")?.rideType ??
    categories[0]?.rideType ??
    "";
  const [selectedId, setSelectedId] = useState(defaultId);
  const [form, setForm] = useState<Form>(() => {
    const initial = categories.find((category) => category.rideType === defaultId);
    return initial ? toForm(initial) : emptyForm;
  });
  const [prevCategories, setPrevCategories] = useState(categories);
  const [distance, setDistance] = useState(2);
  const [duration, setDuration] = useState(38);

  // Re-seed the form from server truth whenever the categories list is
  // refetched (after a confirmed save or a retry) — never mid-typing, since
  // no refetch starts while the user edits. Render-time adjustment, matching
  // the pattern used by EntityDrawer/ConfirmDialog.
  if (categories !== prevCategories) {
    setPrevCategories(categories);
    const current =
      categories.find((category) => category.rideType === selectedId) ??
      categories[0];
    if (current) {
      setSelectedId(current.rideType);
      setForm(toForm(current));
    } else {
      setForm(emptyForm);
    }
  }

  const selected =
    categories.find((category) => category.rideType === selectedId) ??
    categories[0];

  function setField<K extends keyof Form>(key: K, value: Form[K]) {
    // Local draft only: the PATCH fires from the Save button's confirm
    // dialog, and the list refetches from the backend afterwards.
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSave() {
    if (!selected) return;
    onRequestSave(selected.rideType, toPatchBody(form));
  }

  // Live estimate from the unsaved form values so admins can preview first.
  const riderFare = Math.max(
    form.minimumFare,
    form.baseFare +
      distance * form.perKm +
      duration * form.perMinute +
      form.bookingFee,
  );
  const driverEarnings = riderFare * (1 - form.commissionPct / 100);

  if (!selected) return null;

  const dirty = isFormDirty(form, selected);

  return (
    <div
      id="panel-pricing-configuration"
      role="tabpanel"
      aria-labelledby="tab-pricing-configuration"
      className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-5"
    >
      <Card
        title={`${selected.label} pricing`}
        subtitle={`${selected.scope ? selected.scope : "Global"} rule • Prices shown in NGN`}
        className="min-w-0 lg:col-span-3"
        action={
          <Button
            variant="primary"
            disabled={!dirty}
            onClick={handleSave}
          >
            Save pricing
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <MoneyField
            id="cfg-base-fare"
            label="Base fare"
            value={form.baseFare}
            onChange={(value) => setField("baseFare", value)}
          />
          <MoneyField
            id="cfg-distance-rate"
            label="Distance rate / km"
            value={form.perKm}
            onChange={(value) => setField("perKm", value)}
          />
          <MoneyField
            id="cfg-time-rate"
            label="Time rate / min"
            value={form.perMinute}
            onChange={(value) => setField("perMinute", value)}
          />
          <MoneyField
            id="cfg-booking-fee"
            label="Booking fee"
            value={form.bookingFee}
            onChange={(value) => setField("bookingFee", value)}
          />
          <MoneyField
            id="cfg-minimum-fare"
            label="Minimum fare"
            value={form.minimumFare}
            onChange={(value) => setField("minimumFare", value)}
          />
          <MoneyField
            id="cfg-commission"
            label="Commission %"
            value={form.commissionPct}
            min={0}
            max={100}
            onChange={(value) => setField("commissionPct", value)}
          />
          <MoneyField
            id="cfg-cancellation-fee"
            label="Cancellation fee"
            value={form.cancellationFee}
            onChange={(value) => setField("cancellationFee", value)}
          />
          <MoneyField
            id="cfg-waiting-fee"
            label="Waiting fee / min"
            value={form.waitingFeePerMin}
            onChange={(value) => setField("waitingFeePerMin", value)}
          />
        </div>

        <div className="my-5 h-px w-full bg-border" aria-hidden="true" />

        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">Surge pricing</p>
            <p className="mt-0.5 text-xs text-ink-muted">
              Automatically adjust fares during high demand
            </p>
          </div>
          {/* PATCH /pricing/categories has no surge field: the toggle shows
              the loaded state but can never be changed or saved here. */}
          <span title="Not available yet" className="block">
            <Toggle
              checked={form.surgeEnabled}
              onChange={() => undefined}
              label="Surge pricing"
            />
          </span>
        </div>
      </Card>


      <Card
        title="Fare preview calculator"
        subtitle="Estimate a trip using current pricing"
        className="min-w-0 lg:col-span-2"
      >
        <div className="flex min-w-0 flex-col gap-5">
          <div className="min-w-0">
            <label htmlFor="calc-category" className="text-sm font-medium text-ink">
              Ride category
            </label>
            <select
              id="calc-category"
              value={selectedId}
              onChange={(event) => {
                // Reset the form in the event handler so the preview and the
                // Save button always reflect the newly selected ride type.
                const nextId = event.target.value;
                const next = categories.find(
                  (category) => category.rideType === nextId,
                );
                setSelectedId(nextId);
                setForm(next ? toForm(next) : emptyForm);
              }}
              className="mt-1.5 h-11 w-full appearance-none rounded-xl border border-border bg-surface px-3 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {categories.map((category) => (
                <option key={category.rideType} value={category.rideType}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink">
                Estimated distance
              </span>
              <span className="text-sm font-semibold text-ink">{distance} km</span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              step={1}
              value={distance}
              aria-label="Estimated distance in kilometres"
              onChange={(event) => setDistance(Number(event.target.value))}
              className="range-brand mt-3"
            />
          </div>

          <TextField
            id="calc-duration"
            label="Estimated duration"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={String(duration)}
            trailing={<span className="text-xs text-ink-muted">minutes</span>}
            onChange={(event) => {
              const digits = event.target.value.replace(/[^\d]/g, "");
              setDuration(digits === "" ? 0 : clamp(Number(digits), 0));
            }}
          />

          <div
            className="rounded-2xl bg-brand p-5 text-white"
            aria-live="polite"
          >
            <p className="text-xs text-white/80">Estimated rider fare</p>
            <p className="mt-1 text-3xl font-bold">
              {formatNaira(Math.round(riderFare))}
            </p>
            <p className="mt-2 text-xs text-white/80">
              Driver earns approximately{" "}
              {formatNaira(Math.round(driverEarnings))}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

