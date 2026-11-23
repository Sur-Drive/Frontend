"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { LiveMap } from "./LiveMap";
import type { MapZoneFilter } from "./LiveMap";
import type { LiveMapData } from "@/types/live-operations";

interface LiveMapCardProps {
  map: LiveMapData;
  // Relative label from the last successful stats refresh ("Updated —"
  // before anything has loaded).
  updatedLabel: string;
}

const ZONE_OPTIONS: { value: MapZoneFilter; label: string }[] = [
  { value: "all", label: "All service zones" },
  { value: "mainland", label: "Mainland (Ikeja – Yaba)" },
  { value: "island", label: "Island (Lekki – Victoria Island)" },
];

export function LiveMapCard({ map, updatedLabel }: LiveMapCardProps) {
  const [zone, setZone] = useState<MapZoneFilter>("all");

  return (
    <Card className="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-base font-normal text-ink">
            Lagos Operations Map
          </h2>
          <p className="mt-0.5 text-xs text-ink-subtle">
            {/* No confirmed endpoint reports online drivers (see the glance
                card); the count renders "—" with the availability note. */}
            <span title="Not available yet">—</span> drivers online •{" "}
            {updatedLabel}
          </p>
        </div>
        <Select
          label="Filter by service zone"
          className="w-full sm:w-56"
          value={zone}
          onChange={(event) => setZone(event.target.value as MapZoneFilter)}
        >
          {ZONE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </header>

      <LiveMap map={map} zone={zone} />
    </Card>
  );
}

