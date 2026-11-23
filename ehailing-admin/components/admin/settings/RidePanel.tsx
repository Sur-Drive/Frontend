"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Select } from "@/components/ui/Select";
import { SettingRow } from "@/components/admin/settings/SettingRow";
import { CAPACITY_OPTIONS } from "@/types/platform-settings";
import type { SectionErrors } from "@/types/platform-settings";

interface RidePanelProps {
  categoryNames: string[];
  maxCapacity: number;
  freeCancelMinutes: string;
  waitMinutes: string;
  searchRadiusKm: string;
  errors: SectionErrors;
  onCapacity: (value: number) => void;
  onMinutes: (key: "freeCancelMinutes" | "waitMinutes" | "searchRadiusKm", value: string) => void;
}

export function RidePanel(props: RidePanelProps) {
  const { errors } = props;
  return (
    <div className="divide-y divide-border">
      <SettingRow
        label="Enabled categories"
        helper={props.categoryNames.join(", ")}
        controlId="settings-manage-categories"
      >
        <Link href="/admin/pricing-categories?tab=ride-categories">
          <Button variant="secondary" className="h-11! px-5!">
            Manage categories
          </Button>
        </Link>
      </SettingRow>
      <SettingRow
        label="Maximum vehicle capacity"
        helper="Highest allowed passenger capacity"
        controlId="settings-max-capacity"
        error={errors.maxCapacity}
      >
        <Select
          id="settings-max-capacity"
          label="Maximum vehicle capacity"
          value={`${props.maxCapacity} passengers`}
          onChange={(event) =>
            props.onCapacity(Number(event.target.value.split(" ")[0]) || 0)
          }
        >
          {CAPACITY_OPTIONS.map((option) => (
            <option key={option} value={`${option} passengers`}>
              {option} passengers
            </option>
          ))}
        </Select>
      </SettingRow>
      <SettingRow
        label="Free cancellation window"
        helper="Minutes after driver assignment"
        controlId="settings-free-cancel"
        error={errors.freeCancelMinutes}
      >
        <TextField
          id="settings-free-cancel"
          label="Free cancellation window"
          hideLabel
          type="number"
          inputMode="numeric"
          min={0}
          max={15}
          value={props.freeCancelMinutes}
          error={errors.freeCancelMinutes}
          trailing={<span className="text-xs text-ink-muted">minutes</span>}
          onChange={(event) => props.onMinutes("freeCancelMinutes", event.target.value)}
        />
      </SettingRow>
      <SettingRow
        label="Driver waiting period"
        helper="Free wait time before charges begin"
        controlId="settings-wait-minutes"
        error={errors.waitMinutes}
      >
        <TextField
          id="settings-wait-minutes"
          label="Driver waiting period"
          hideLabel
          type="number"
          inputMode="numeric"
          min={0}
          max={30}
          value={props.waitMinutes}
          error={errors.waitMinutes}
          trailing={<span className="text-xs text-ink-muted">minutes</span>}
          onChange={(event) => props.onMinutes("waitMinutes", event.target.value)}
        />
      </SettingRow>
      <SettingRow
        label="Maximum search radius"
        helper="Driver matching radius in active cities"
        controlId="settings-search-radius"
        error={errors.searchRadiusKm}
      >
        <TextField
          id="settings-search-radius"
          label="Maximum search radius"
          hideLabel
          type="number"
          inputMode="numeric"
          min={1}
          max={50}
          value={props.searchRadiusKm}
          error={errors.searchRadiusKm}
          trailing={<span className="text-xs text-ink-muted">kilometres</span>}
          onChange={(event) => props.onMinutes("searchRadiusKm", event.target.value)}
        />
      </SettingRow>
    </div>
  );
}
