"use client";

import { useState } from "react";
import { SideSheet } from "@/components/ui/SideSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import type { CategoryPatchBody, PricingCategoryView } from "@/types/pricing-api";

// Editable draft: every field is a string so the inputs stay controlled while
// the user types, then parsed back on save. Only fields the documented
// PATCH /pricing/categories/{rideType} body accepts are collected — name,
// description, status and vehicle eligibility have no backend field and are
// never shown as editable inputs.
interface Draft {
  baseFare: string;
  perKm: string;
  perMinute: string;
  bookingFee: string;
  minimumFare: string;
  cancellationFee: string;
  waitingFeePerMin: string;
  waitingGraceMin: string;
  commissionPercent: string;
}

function toDraft(category: PricingCategoryView): Draft {
  return {
    baseFare: category.baseFare === null ? "0" : String(category.baseFare),
    perKm: category.perKm === null ? "0" : String(category.perKm),
    perMinute: category.perMinute === null ? "0" : String(category.perMinute),
    bookingFee: category.bookingFee === null ? "0" : String(category.bookingFee),
    minimumFare: category.minimumFare === null ? "0" : String(category.minimumFare),
    cancellationFee:
      category.cancellationFee === null ? "0" : String(category.cancellationFee),
    waitingFeePerMin:
      category.waitingFeePerMin === null
        ? "0"
        : String(category.waitingFeePerMin),
    waitingGraceMin:
      category.waitingGraceMin === null ? "0" : String(category.waitingGraceMin),
    commissionPercent:
      category.commissionPercent === null
        ? "0"
        : String(category.commissionPercent),
  };
}

function parseCount(value: string, max?: number): number {
  const parsed = Number(value);
  const safe = Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : 0;
  return max === undefined ? safe : Math.min(safe, max);
}

interface EditCategoryDrawerProps {
  category: PricingCategoryView;
  // Stacked under the confirm dialog: false hands Escape/focus to the dialog.
  closeOnEscape?: boolean;
  trapFocus?: boolean;
  onClose: () => void;
  onSave: (body: CategoryPatchBody) => void;
}

export function EditCategoryDrawer({
  category,
  closeOnEscape = true,
  trapFocus = true,
  onClose,
  onSave,
}: EditCategoryDrawerProps) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(category));

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleSave() {
    // Omitted fields carry forward server-side, so only the edited values are
    // sent; waitingGraceMin is minutes and commissionPercent is 0–100.
    onSave({
      baseFare: parseCount(draft.baseFare),
      perKm: parseCount(draft.perKm),
      perMinute: parseCount(draft.perMinute),
      bookingFee: parseCount(draft.bookingFee),
      minimumFare: parseCount(draft.minimumFare),
      cancellationFee: parseCount(draft.cancellationFee),
      waitingFeePerMin: parseCount(draft.waitingFeePerMin),
      waitingGraceMin: parseCount(draft.waitingGraceMin),
      commissionPercent: parseCount(draft.commissionPercent, 100),
    });
  }

  const moneyFields = [
    { key: "baseFare", label: "Base fare (₦)" },
    { key: "perKm", label: "Per kilometre (₦)" },
    { key: "perMinute", label: "Per minute (₦)" },
    { key: "bookingFee", label: "Booking fee (₦)" },
    { key: "minimumFare", label: "Minimum fare (₦)" },
    { key: "cancellationFee", label: "Cancellation fee (₦)" },
    { key: "waitingFeePerMin", label: "Waiting fee / min (₦)" },
    { key: "waitingGraceMin", label: "Waiting grace (min)" },
    { key: "commissionPercent", label: "Commission (%)" },
  ] as const;

  return (
    <SideSheet
      open={true}
      onClose={onClose}
      closeOnEscape={closeOnEscape}
      trapFocus={trapFocus}
      eyebrow="RIDE CATEGORY PRICING"
      title={`Edit ${category.label} pricing`}
      subtitle="Saving creates a new pricing version; omitted fields carry forward. Required fields are validated before saving."
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
          id="category-ride-type"
          label="Ride type"
          value={category.label}
          disabled
        />
        <TextField
          id="category-version"
          label="Current version"
          value={category.version ?? "—"}
          disabled
        />

        <fieldset className="min-w-0 border-0 p-0">
          <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">
            Fees
          </legend>
          <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {moneyFields.map(({ key, label }) => (
              <TextField
                key={key}
                id={`category-${key}`}
                label={label}
                type="number"
                inputMode="numeric"
                min={0}
                max={key === "commissionPercent" ? 100 : undefined}
                value={draft[key]}
                onChange={(event) => update(key, event.target.value)}
              />
            ))}
          </div>
        </fieldset>
      </div>
    </SideSheet>
  );
}
