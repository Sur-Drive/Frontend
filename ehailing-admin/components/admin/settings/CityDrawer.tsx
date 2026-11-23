"use client";

import { useState } from "react";
import { SideSheet } from "@/components/ui/SideSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Select } from "@/components/ui/Select";
import { CITY_STATUSES } from "@/types/platform-settings";
import type { CityStatus, OperatingCity } from "@/types/platform-settings";

export interface CitySave {
  name: string;
  status: CityStatus;
  serviceZones: number;
  restrictedZones: number;
}

interface CityDrawerProps {
  // Null drafts a new city; a city edits it. Null state means closed.
  state: { city: OperatingCity | null } | null;
  nameError?: string;
  onClose: () => void;
  onSave: (save: CitySave) => void;
}

export function CityDrawer({ state, nameError, onClose, onSave }: CityDrawerProps) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<CityStatus>("Pilot");
  const [serviceZones, setServiceZones] = useState("0");
  const [restrictedZones, setRestrictedZones] = useState("0");
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const key = state ? (state.city?.id ?? "new") : null;
  if (state && loadedFor !== key) {
    setLoadedFor(key);
    setName(state.city?.name ?? "");
    setStatus(state.city?.status ?? "Pilot");
    setServiceZones(String(state.city?.serviceZones ?? 0));
    setRestrictedZones(String(state.city?.restrictedZones ?? 0));
  }

  const city = state?.city ?? null;
  const title = city ? city.name : "Add operating city";

  function handleSave() {
    onSave({
      name: name.trim(),
      status,
      serviceZones: Math.max(0, Math.trunc(Number(serviceZones) || 0)),
      restrictedZones: Math.max(0, Math.trunc(Number(restrictedZones) || 0)),
    });
  }

  return (
    <SideSheet
      open={state !== null}
      onClose={onClose}
      eyebrow="CITY SETTINGS"
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="sm:w-auto">
            Cancel
          </Button>
          <Button onClick={handleSave} className="sm:w-auto">
            {city ? "Update city" : "Add city"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <TextField
          id="city-name"
          label="City name"
          value={name}
          error={nameError}
          onChange={(event) => setName(event.target.value)}
        />
        <div>
          <label htmlFor="city-status" className="text-sm font-medium text-ink">
            Status
          </label>
          <div className="mt-1.5">
            <Select
              id="city-status"
              label="Status"
              options={CITY_STATUSES}
              value={status}
              onChange={(event) => setStatus(event.target.value as CityStatus)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <TextField
            id="city-service-zones"
            label="Service zones"
            type="number"
            inputMode="numeric"
            min={0}
            value={serviceZones}
            onChange={(event) => setServiceZones(event.target.value)}
          />
          <TextField
            id="city-restricted-zones"
            label="Restricted zones"
            type="number"
            inputMode="numeric"
            min={0}
            value={restrictedZones}
            onChange={(event) => setRestrictedZones(event.target.value)}
          />
        </div>
      </div>
    </SideSheet>
  );
}
