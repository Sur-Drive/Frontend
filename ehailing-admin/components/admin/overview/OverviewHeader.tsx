"use client";

import { useSyncExternalStore } from "react";
import { useAdminUser } from "@/components/admin/AdminUserContext";
import { Select } from "@/components/ui/Select";
import { CITY_SCOPES, CITY_SCOPE_LABELS, isCityScope } from "@/types/overview";
import type { CityScope } from "@/types/overview";

interface OverviewHeaderProps {
  scope: CityScope;
  onScopeChange: (scope: CityScope) => void;
}

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const subscribe = () => () => {};
const getServerGreeting = () => "Good morning";
const getClientGreeting = () => greetingFor(new Date().getHours());

export function OverviewHeader({ scope, onScopeChange }: OverviewHeaderProps) {
  const { user } = useAdminUser();
  // Greeting depends on the browser's local time. useSyncExternalStore keeps SSR
  // and the first client render identical, then swaps to the local value with no
  // hydration mismatch and no setState-in-effect.
  const greeting = useSyncExternalStore(
    subscribe,
    getClientGreeting,
    getServerGreeting,
  );
  const scopeLabel = CITY_SCOPE_LABELS[scope];
  // Probed behaviour of GET /admin/ride-hailing/dashboard: ?city scopes the
  // hourly series (and window.city echo) but the KPI stats stay platform-wide,
  // so a city scope must not claim to scope the totals.
  const subtitle =
    scope === "all"
      ? "Platform performance across all operating cities."
      : `Hourly ride activity in ${scopeLabel}. KPI totals stay platform-wide.`;

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-normal tracking-tight text-ink">
          {greeting}, {user.firstName}.
        </h1>
        <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
      </div>

      <div className="flex w-full flex-wrap items-center gap-3 sm:justify-end md:w-auto">
        <Select
          label="Filter by city"
          className="w-full sm:w-44"
          value={scope}
          onChange={(event) => {
            const next = event.target.value;
            if (isCityScope(next)) onScopeChange(next);
          }}
        >
          {CITY_SCOPES.map((value) => (
            <option key={value} value={value}>
              {CITY_SCOPE_LABELS[value]}
            </option>
          ))}
        </Select>

        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-xs font-medium text-ink">
          <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
          {scopeLabel}
        </span>
      </div>
    </div>
  );
}

