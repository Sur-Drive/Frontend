"use client";

import { useId, useState } from "react";
import { SideSheet } from "@/components/ui/SideSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Select } from "@/components/ui/Select";
import { INCIDENT_TYPES, SEVERITIES } from "@/types/trust";
import type { IncidentType, Severity } from "@/types/trust";
import type { IncidentCreateDraft } from "@/lib/safety-incidents";

interface Draft {
  type: IncidentType | "";
  tripId: string;
  location: string;
  dateTime: string;
  severity: Severity | "";
  description: string;
}

const EMPTY: Draft = {
  type: "",
  tripId: "",
  location: "",
  dateTime: "",
  severity: "",
  description: "",
};

interface LogIncidentDrawerProps {
  open: boolean;
  onClose: () => void;
  // Called with the form's values when the user confirms via the dialog. The
  // drawer keeps its values so it can be reopened intact if the dialog is
  // cancelled. The parent POSTs them via runIncidentCreate — this component
  // never fabricates an id, reporter or status.
  onRequestCreate: (draft: IncidentCreateDraft) => void;
  // Bumped by the parent after a successful create so the drawer resets.
  resetKey: number;
}

// "Log incident" side sheet in the Create-promotion style: validated fields,
// a Create button that hands a draft to the parent's confirm dialog.
export function LogIncidentDrawer({
  open,
  onClose,
  onRequestCreate,
  resetKey,
}: LogIncidentDrawerProps) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  const ids = useId();

  // Parent bumps resetKey after a successful create; reset for next time.
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setDraft(EMPTY);
    setTouched(false);
  }

  if (!open) return null;

  const typeId = `${ids}-type`;
  const tripId = `${ids}-trip`;
  const locationId = `${ids}-location`;
  const dateTimeId = `${ids}-datetime`;
  const severityId = `${ids}-severity`;
  const descriptionId = `${ids}-description`;

  const errors = {
    type: draft.type === "" ? "Select an incident type." : null,
    tripId: draft.tripId.trim() === "" ? "Enter the related trip or party." : null,
    location: draft.location.trim() === "" ? "Enter the incident location." : null,
    dateTime: draft.dateTime.trim() === "" ? "Enter the date and time." : null,
    severity: draft.severity === "" ? "Select a severity." : null,
    description:
      draft.description.trim() === "" ? "Describe what happened." : null,
  };

  function show(key: keyof typeof errors): string | undefined {
    return touched ? (errors[key] ?? undefined) : undefined;
  }

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleClose() {
    setDraft(EMPTY);
    setTouched(false);
    onClose();
  }

  function handleCreate() {
    setTouched(true);
    if (Object.values(errors).some((message) => message !== null)) return;

    // Hand the form values to the parent's confirm dialog; the parent POSTs
    // /admin/ride-hailing/safety/incidents via runIncidentCreate. Nothing is
    // fabricated here (no id, reporter, status or evidence URLs).
    onRequestCreate({
      type: draft.type,
      tripId: draft.tripId,
      location: draft.location,
      dateTime: draft.dateTime,
      severity: draft.severity,
      description: draft.description,
    });
  }


  return (
    <SideSheet
      open
      onClose={handleClose}
      eyebrow="INCIDENT MANAGEMENT"
      title="Log incident"
      subtitle="Record a new safety report"
      footer={
        <>
          <Button
            variant="secondary"
            className="h-11! flex-1 px-5! sm:flex-none"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            className="h-11! flex-1 px-5! sm:flex-none"
            onClick={handleCreate}
          >
            Log incident
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="min-w-0">
          <label htmlFor={typeId} className="text-sm font-medium text-ink">
            Incident type
          </label>
          <div className="mt-1.5">
            <Select
              id={typeId}
              label="Incident type"
              value={draft.type}
              onChange={(event) =>
                update("type", event.target.value as Draft["type"])
              }
            >
              <option value="">Select a type</option>
              {INCIDENT_TYPES.map((type) => (
                // "Route Deviation" has no confirmed backend incidentType
                // value — the option stays visible
                // but can't be selected.
                <option key={type} value={type} disabled={type === "Route Deviation"}>
                  {type}
                </option>
              ))}
            </Select>
            {show("type") ? (
              <p className="mt-1 text-xs text-danger">{show("type")}</p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor={tripId} className="text-sm font-medium text-ink">
              Related trip or party
            </label>
            <div className="mt-1.5">
              <TextField
                id={tripId}
                label="Related trip or party"
                value={draft.tripId}
                onChange={(event) => update("tripId", event.target.value)}
                error={show("tripId")}
                placeholder="e.g. SD-28498 or account name"
                autoComplete="off"
              />
              {show("tripId") ? (
                <p className="mt-1 text-xs text-danger">{show("tripId")}</p>
              ) : null}
              <p className="mt-1 text-xs text-ink-muted">
                Recorded only when it matches a ride ID.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor={locationId} className="text-sm font-medium text-ink">
              Location
            </label>
            <div className="mt-1.5">
              <TextField
                id={locationId}
                label="Location"
                value={draft.location}
                onChange={(event) => update("location", event.target.value)}
                error={show("location")}
                placeholder="e.g. Lekki Phase 1, Lagos"
                autoComplete="off"
              />
              {show("location") ? (
                <p className="mt-1 text-xs text-danger">{show("location")}</p>
              ) : null}
            </div>
          </div>

          <div className="min-w-0">
            <label htmlFor={dateTimeId} className="text-sm font-medium text-ink">
              Date and time
            </label>
            <div className="mt-1.5">
              <input
                id={dateTimeId}
                type="datetime-local"
                value={draft.dateTime}
                onChange={(event) => update("dateTime", event.target.value)}
                aria-invalid={show("dateTime") ? true : undefined}
                className="mt-1 block w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:text-sm"
              />
              {show("dateTime") ? (
                <p className="mt-1 text-xs text-danger">{show("dateTime")}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor={severityId} className="text-sm font-medium text-ink">
              Severity
            </label>
            <div className="mt-1.5">
              <Select
                id={severityId}
                label="Severity"
                value={draft.severity}
                onChange={(event) =>
                  update("severity", event.target.value as Draft["severity"])
                }
              >
                <option value="">Select a severity</option>
                {SEVERITIES.map((severity) => (
                  <option key={severity} value={severity}>
                    {severity}
                  </option>
                ))}
              </Select>
              {show("severity") ? (
                <p className="mt-1 text-xs text-danger">{show("severity")}</p>
              ) : null}
            </div>
          </div>

          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">
              Supporting evidence
            </p>
            <div className="mt-1.5">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink">
                {/* The create endpoint takes evidenceUrls (public URLs); the
                    form can only pick a local file name, so nothing is
                    uploaded. The control stays in place but disabled with the
                    app's tooltip treatment, and the value is explicitly not
                    recorded. */}
                <span title="Not available yet" className="inline-flex">
                  <button
                    type="button"
                    disabled
                    className="flex items-center gap-2 text-xs text-ink disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label="Choose supporting evidence file"
                  >
                    Choose File
                  </button>
                </span>
                <span className="text-xs text-ink-muted">
                  Not recorded yet
                </span>
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                Optional supporting files (photos, documents, etc.) — not
                uploaded yet
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <label htmlFor={descriptionId} className="text-sm font-medium text-ink">
            Description
          </label>
          <textarea
            id={descriptionId}
            value={draft.description}
            onChange={(event) => update("description", event.target.value)}
            placeholder="Describe what happened..."
            aria-invalid={show("description") ? true : undefined}
            className="mt-2 min-h-26 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:text-sm"
          />
          {show("description") ? (
            <p className="mt-1 text-xs text-danger">{show("description")}</p>
          ) : null}
        </div>

      </div>
    </SideSheet>
  );
}

