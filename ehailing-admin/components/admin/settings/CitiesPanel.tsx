"use client";

import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import type { StatusTone } from "@/components/ui/StatusPill";
import type { CityStatus, OperatingCity, SectionErrors } from "@/types/platform-settings";

const CITY_TONE: Record<CityStatus, StatusTone> = {
  Active: "success",
  Pilot: "warning",
  Paused: "neutral",
};

interface CitiesPanelProps {
  cities: OperatingCity[];
  errors: SectionErrors;
  onManage: (city: OperatingCity) => void;
  onAdd: () => void;
}

export function CitiesPanel({ cities, errors, onManage, onAdd }: CitiesPanelProps) {
  return (
    <div>
      <ul className="divide-y divide-border">
        {cities.map((city) => (
          <li
            key={city.id}
            className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:gap-4"
          >
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft"
            >
              <MapPin className="size-5 text-brand" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{city.name}</p>
              <p className="mt-0.5 text-xs text-ink-muted">
                {city.serviceZones} service zones •{" "}
                {city.boundaryPoints.length > 0 ? "Saved prototype boundary" : "No boundary saved"}
              </p>
              {errors[`${city.id}.name`] ? (
                <p role="alert" className="mt-1 text-xs text-danger">
                  {errors[`${city.id}.name`]}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <StatusPill tone={CITY_TONE[city.status]} label={city.status} />
              <Button
                variant="secondary"
                onClick={() => onManage(city)}
                className="h-11! px-5!"
              >
                Manage boundaries
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <div className="border-t border-border pt-5">
        <Button onClick={onAdd} className="w-full sm:w-auto">
          <Plus className="size-4" aria-hidden="true" />
          Add operating city
        </Button>
      </div>
    </div>
  );
}
