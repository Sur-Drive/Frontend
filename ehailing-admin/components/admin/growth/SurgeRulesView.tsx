"use client";

import { Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Toggle } from "./PricingConfigurationPanel";
import {
  RecordsError,
  RecordsSkeleton,
} from "@/components/admin/records/RecordsListState";
import {
  buildSurgeCondition,
  multiplierLabel,
} from "@/lib/pricing";
import { humanize } from "@/lib/format";
import type { SurgeRuleView } from "@/types/pricing-api";

interface SurgeRulesViewProps {
  // null = not loaded yet (skeleton); [] = loaded, no rules exist.
  rules: SurgeRuleView[] | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onAddRule: () => void;
  onEditRule: (rule: SurgeRuleView) => void;
  // Opens the shared confirm dialog; the parent PATCHes /toggle and refetches.
  onToggleRule: (rule: SurgeRuleView) => void;
}

export function SurgeRulesView({
  rules,
  loading,
  error,
  onRetry,
  onAddRule,
  onEditRule,
  onToggleRule,
}: SurgeRulesViewProps) {
  if (loading && rules === null) {
    return (
      <div
        id="panel-surge-rules"
        role="tabpanel"
        aria-labelledby="tab-surge-rules"
        className="pt-5"
      >
        <RecordsSkeleton rows={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div
        id="panel-surge-rules"
        role="tabpanel"
        aria-labelledby="tab-surge-rules"
        className="pt-5"
      >
        <RecordsError message={error} onRetry={onRetry} />
      </div>
    );
  }

  const loadedRules = rules ?? [];

  return (
    <div
      id="panel-surge-rules"
      role="tabpanel"
      aria-labelledby="tab-surge-rules"
      className="pt-5"
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-subtle mb-1">
            Surge-pricing rules
          </h2>
          <p className="text-sm text-ink-muted">
            Conditions are evaluated against live supply and demand
          </p>
        </div>
        <Button variant="primary" onClick={onAddRule}>
          <Plus className="size-4" aria-hidden="true" />
          Add rule
        </Button>
      </div>

      {loadedRules.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface-muted px-4 py-8 text-center text-sm text-ink-muted">
          No surge rules yet.
        </p>
      ) : (
        <div className="space-y-3">
          {loadedRules.map((rule) => (
            <section
              key={rule.id || rule.name}
              className="flex min-w-0 items-start justify-between gap-3 rounded-2xl border border-border bg-surface p-5 shadow-sm"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-warning-soft"
                >
                  <Zap className="size-5 text-warning" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-base font-normal text-ink">
                    {rule.name || "Unnamed rule"}
                  </h3>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {rule.description || humanize(rule.ruleType)}
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {buildSurgeCondition(rule)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`text-sm font-semibold ${rule.isActive ? "text-brand" : "text-ink-muted"}`}
                >
                  {multiplierLabel(rule.multiplier)}
                </span>
                <Toggle
                  checked={rule.isActive}
                  onChange={() => onToggleRule(rule)}
                  label={`Surge ${rule.name}`}
                />
                <Button
                  variant="secondary"
                  onClick={() => onEditRule(rule)}
                >
                  Edit
                </Button>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
