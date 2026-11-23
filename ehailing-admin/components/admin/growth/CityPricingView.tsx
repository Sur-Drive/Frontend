"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { Select } from "@/components/ui/Select";
import {
  RecordsError,
  RecordsSkeleton,
} from "@/components/admin/records/RecordsListState";
import { nairaOrDash } from "@/lib/pricing";
import type { CityRuleView } from "@/types/pricing-api";

interface CityPricingViewProps {
  // null = not loaded yet (skeleton); [] = loaded, no city rules exist.
  rules: CityRuleView[] | null;
  // Ride types that should get a row (from GET /pricing/categories).
  rideTypes: string[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onEditRule: (rule: CityRuleView) => void;
}

export function CityPricingView({
  rules,
  rideTypes,
  loading,
  error,
  onRetry,
  onEditRule,
}: CityPricingViewProps) {
  const [selectedCity, setSelectedCity] = useState("");

  if (loading && rules === null) {
    return (
      <div
        id="panel-city-pricing"
        role="tabpanel"
        aria-labelledby="tab-city-pricing"
        className="pt-5"
      >
        <RecordsSkeleton rows={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div
        id="panel-city-pricing"
        role="tabpanel"
        aria-labelledby="tab-city-pricing"
        className="pt-5"
      >
        <RecordsError message={error} onRetry={onRetry} />
      </div>
    );
  }

  const loadedRules = rules ?? [];
  // City options come from the backend list only (no invented cities).
  const cityOptions = [...new Set(loadedRules.map((rule) => rule.city))].sort();

  if (cityOptions.length === 0) {
    return (
      <div
        id="panel-city-pricing"
        role="tabpanel"
        aria-labelledby="tab-city-pricing"
        className="pt-5"
      >
        <p className="rounded-2xl border border-border bg-surface-muted px-4 py-8 text-center text-sm text-ink-muted">
          No city pricing rules yet.
        </p>
      </div>
    );
  }

  // Derived selection: if the loaded list no longer contains the picked city
  // (e.g. after a refetch), fall back to the first option without an effect.
  const city = cityOptions.includes(selectedCity) ? selectedCity : cityOptions[0];
  const cityRules = loadedRules.filter((rule) => rule.city === city);

  // One row per ride type: prefer the categories list, fall back to whatever
  // ride types this city actually has rules for.
  const rowTypes =
    rideTypes.length > 0
      ? rideTypes
      : [...new Set(cityRules.map((rule) => rule.rideType))];

  return (
    <div id="panel-city-pricing" role="tabpanel" aria-labelledby="tab-city-pricing" className="pt-5">
      <div className="flex items-center gap-3 mb-6">
        <Select
          label="City"
          options={cityOptions}
          value={city}
          onChange={(event) => setSelectedCity(event.target.value)}
        />
        <StatusPill tone="success" label="Active city" />
      </div>

      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-subtle mb-4">
        {city} pricing rules
      </h2>
      <p className="mt-0.5 mb-8 text-sm text-ink-muted">
        Category-specific operating rates
      </p>

      <div className="space-y-3">
        {rowTypes.map((rideType) => {
          const rule = cityRules.find((entry) => entry.rideType === rideType);
          const label = rule?.rideTypeLabel ?? rideType;

          return (
            <section
              key={rideType}
              className="flex min-w-0 items-start justify-between gap-3 rounded-2xl border border-border bg-surface p-5 shadow-sm"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand"
                >
                  <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V7zM4 7a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V7z"></path></svg>
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-base font-normal text-ink">
                    {label}
                  </h3>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {rule ? (
                      <>
                        Base {nairaOrDash(rule.baseFare)} •{" "}
                        {nairaOrDash(rule.perKm)}/km •{" "}
                        {nairaOrDash(rule.perMinute)}/min
                        {rule.version ? ` • ${rule.version}` : ""}
                        {rule.state ? ` • ${rule.state}` : ""}
                      </>
                    ) : (
                      `No active rule in ${city}`
                    )}
                  </p>
                </div>
              </div>
              <StatusPill
                tone={rule && rule.active ? "success" : "neutral"}
                label={rule ? (rule.active ? "Active" : "Inactive") : "No rule"}
              />
              {rule ? (
                <Button variant="secondary" onClick={() => onEditRule(rule)}>
                  Edit rates
                </Button>
              ) : (
                // POST /pricing/cities exists but this UI only edits existing
                // rules, so a missing rule has nothing to PATCH yet.
                <span
                  title="No active rule for this ride type in this city"
                  className="block"
                >
                  <Button variant="secondary" disabled>
                    Edit rates
                  </Button>
                </span>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
