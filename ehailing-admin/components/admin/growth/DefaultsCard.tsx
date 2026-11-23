"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MoneyField } from "@/components/admin/growth/PricingConfigurationPanel";
import { formatDateLabel, EM_DASH } from "@/lib/format";
import type {
  DefaultsPatchBody,
  PricingDefaultsView,
} from "@/types/pricing-api";

interface DefaultsCardProps {
  // null = the endpoint reported "never configured" (loaded state).
  defaults: PricingDefaultsView | null;
  // Opens the shared confirm dialog; the parent PATCHes and refetches.
  onRequestSave: (body: DefaultsPatchBody) => void;
}

function seed(defaults: PricingDefaultsView | null): DefaultsPatchBody {
  return {
    baseFare: defaults?.baseFare ?? 0,
    perKm: defaults?.perKm ?? 0,
    perMinute: defaults?.perMinute ?? 0,
    bookingFee: defaults?.bookingFee ?? 0,
    minimumFare: defaults?.minimumFare ?? 0,
    commissionPercent: defaults?.commissionPercent ?? 0,
  };
}

function isDirty(form: DefaultsPatchBody, defaults: PricingDefaultsView | null): boolean {
  if (!defaults) return true; // never configured: any save creates the row
  return (
    form.baseFare !== (defaults.baseFare ?? 0) ||
    form.perKm !== (defaults.perKm ?? 0) ||
    form.perMinute !== (defaults.perMinute ?? 0) ||
    form.bookingFee !== (defaults.bookingFee ?? 0) ||
    form.minimumFare !== (defaults.minimumFare ?? 0) ||
    form.commissionPercent !== (defaults.commissionPercent ?? 0)
  );
}

// Singleton fallback pricing used when no city or global rule exists for a
// ride type (GET/PATCH /pricing/defaults). PATCH requires all 6 fields, so
// the form always sends the complete set. Shown under the Pricing
// Configuration tab; the parent owns loading/error state around this card.
export function DefaultsCard({ defaults, onRequestSave }: DefaultsCardProps) {
  const [form, setForm] = useState<DefaultsPatchBody>(() => seed(defaults));
  const [prevDefaults, setPrevDefaults] = useState(defaults);

  // Re-seed from server truth after each confirmed save/refetch (identity
  // changes only then — never mid-typing). Render-time adjustment, matching
  // EntityDrawer/ConfirmDialog.
  if (defaults !== prevDefaults) {
    setPrevDefaults(defaults);
    setForm(seed(defaults));
  }

  function setField<K extends keyof DefaultsPatchBody>(
    key: K,
    value: DefaultsPatchBody[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const fields: {
    key: keyof DefaultsPatchBody;
    label: string;
    max?: number;
  }[] = [
    { key: "baseFare", label: "Base fare (₦)" },
    { key: "perKm", label: "Distance rate / km (₦)" },
    { key: "perMinute", label: "Time rate / min (₦)" },
    { key: "bookingFee", label: "Booking fee (₦)" },
    { key: "minimumFare", label: "Minimum fare (₦)" },
    { key: "commissionPercent", label: "Commission (%)", max: 100 },
  ];

  return (
    <Card
      title="Fallback defaults"
      subtitle={
        defaults
          ? `Used when no city or global rule exists • Updated ${defaults.updatedAt ? formatDateLabel(defaults.updatedAt) : EM_DASH}`
          : "Never configured — saving creates the defaults row"
      }
      className="min-w-0"
      action={
        <Button
          variant="primary"
          disabled={!isDirty(form, defaults)}
          onClick={() => onRequestSave(form)}
        >
          Save defaults
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map(({ key, label, max }) => (
          <MoneyField
            key={key}
            id={`defaults-${key}`}
            label={label}
            value={form[key] ?? 0}
            min={0}
            max={max}
            onChange={(value) => setField(key, value)}
          />
        ))}
      </div>
    </Card>
  );
}
