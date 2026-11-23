"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { SideSheet } from "@/components/ui/SideSheet";
import { Tabs } from "@/components/ui/Tabs";
import type { TabItem } from "@/components/ui/Tabs";
import { StatusPill } from "@/components/ui/StatusPill";
import { Button } from "@/components/ui/Button";
import { RouteMapPreview } from "@/components/admin/records/RouteMapPreview";
import {
  incidentActionDisabledReason,
  incidentSeverityDisplay,
  incidentStatusDisplay,
  incidentTypeDisplay,
} from "@/lib/safety-incidents";
import type { IncidentDetailModel } from "@/lib/safety-incidents";
import type { Incident } from "@/types/trust";
import type { DetailItem } from "@/types/ride-details";

// Why a footer action is disabled for the current incident (rendered as a
// tooltip). Single source lives in lib/safety-incidents.ts so the fixture check
// exercises the same logic the footer and row menu use. Returns undefined when
// the action is available.
export function disabledReason(
  incident: Incident,
  action: IncidentActionId,
): string | undefined {
  return incidentActionDisabledReason(incident, action);
}

const TABS: TabItem[] = [
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Timeline" },
  { id: "history", label: "History" },
  { id: "notes", label: "Notes" },
];

// Footer action ids. Order and tone are driven from this list so a button's
// colour stays a one-line change in ACTION_META.
export type IncidentActionId = "assign-officer" | "escalate" | "resolve";

interface ActionMeta {
  id: IncidentActionId;
  label: string;
  // Footer button variant.
  variant: "danger" | "outline" | "brand";
  // Confirm dialog button tone; escalate is a danger action.
  confirmTone: "brand" | "danger";
}

export const ACTION_META: ActionMeta[] = [
  {
    id: "assign-officer",
    label: "Assign officer",
    variant: "danger",
    confirmTone: "brand",
  },
  {
    id: "escalate",
    label: "Escalate incident",
    variant: "outline",
    confirmTone: "danger",
  },
  {
    id: "resolve",
    label: "Resolve incident",
    variant: "brand",
    confirmTone: "brand",
  },
];

// Dialog title for a footer/row-menu action.
export function actionDialogTitle(action: IncidentActionId): string {
  if (action === "assign-officer") return "Confirm assign officer";
  if (action === "escalate") return "Confirm escalate incident";
  return "Confirm resolve incident";
}

function InfoCard({ item }: { item: DetailItem }) {
  return (
    <div className="rounded-xl bg-surface-muted p-4">
      <p className="text-xs text-ink-muted">{item.label}</p>
      <p className="mt-1 text-sm font-medium text-ink">
        {item.pill ? (
          <StatusPill tone={item.pill.tone} label={item.pill.label} />
        ) : (
          (item.value ?? "—")
        )}
      </p>
    </div>
  );
}

function InfoGrid({ items }: { items: DetailItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <InfoCard key={item.label} item={item} />
      ))}
    </div>
  );
}

// Data-derived timeline: steps come from the detail fetch (createdAt /
// updatedAt / resolvedAt — see mapIncidentDetail), never from fabricated
// times. Renders a loading line or nothing while the detail is in flight.
function TimelineList({
  steps,
  loading,
}: {
  steps: { title: string; time: string }[];
  loading: boolean;
}) {
  if (steps.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        {loading ? "Loading details…" : "No timeline events yet."}
      </p>
    );
  }
  return (
    <ol className="flex flex-col gap-4">
      {steps.map((step, index) => (
        <li key={step.title} className="relative flex items-start gap-3">
          {index < steps.length - 1 ? (
            <span
              aria-hidden="true"
              className="absolute left-[7.5px] top-5 -bottom-4 w-px bg-border"
            />
          ) : null}
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-success-soft"
          >
            <Check className="size-3 text-success" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-sm font-medium text-ink">{step.title}</span>
            <span className="text-xs text-ink-muted">{step.time}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

// Lazy detail fetch state owned by the view (GET /safety/incidents/{id}).
// `model` is the sanitized, display-ready payload — the raw response never
// reaches this component. While loading, the list row renders underneath.
interface IncidentDetailState {
  loading: boolean;
  error: string | null;
  model: IncidentDetailModel | null;
  onRetry: () => void;
}

interface IncidentDetailsDrawerProps {
  incident: Incident | null;
  // Null while the drawer is closed or the first fetch has not started.
  detailState: IncidentDetailState | null;
  onClose: () => void;
  // A footer button was clicked; the parent opens its shared confirm dialog.
  onRequestAction: (action: IncidentActionId) => void;
  // True while the parent's confirm dialog is open, so this sheet stops owning
  // Escape/focus (the dialog owns them while stacked on top).
  actionPending: boolean;
}

// Incident details side sheet, mirroring the ride details drawer: fixed
// header/tabs/footer with a scrolling body and the route preview at the top of
// the overview. Footer actions request confirmation from the parent.
export function IncidentDetailsDrawer({
  incident,
  detailState,
  onClose,
  onRequestAction,
  actionPending,
}: IncidentDetailsDrawerProps) {
  const [tab, setTab] = useState("overview");
  const [prevId, setPrevId] = useState(incident?.id ?? null);

  // Reset to the first tab whenever a different incident is opened.
  if ((incident?.id ?? null) !== prevId) {
    setPrevId(incident?.id ?? null);
    setTab("overview");
  }

  if (!incident) return null;

  // The list row renders immediately; the lazy detail (timeline, last-updated
  // label) fills in when it arrives. Only display fields are ever shown.
  const model = detailState?.model ?? null;
  const severity = incidentSeverityDisplay(incident.severity);
  const status = incidentStatusDisplay(incident.status);

  const infoItems: DetailItem[] = [
    { label: "Incident ID", value: incident.id },
    { label: "Type", value: incidentTypeDisplay(incident.type) },
    { label: "Ride", value: incident.rideId },
    {
      label: "Severity",
      value: null,
      pill: { tone: severity.tone, label: severity.label },
    },
    { label: "Assigned officer", value: incident.officer ?? "Unassigned" },
    { label: "Date", value: incident.dateLabel },
    {
      label: "Status",
      value: null,
      pill: { tone: status.tone, label: status.label },
    },
  ];

  const subtitle = model?.updatedLabel
    ? `${incident.id} • Last updated ${model.updatedLabel}`
    : incident.id;

  return (
    <SideSheet
      open
      onClose={onClose}
      eyebrow="INCIDENT DETAILS"
      title={incident.reporter.name}
      subtitle={subtitle}
      headerExtras={<Tabs tabs={TABS} value={tab} onChange={setTab} />}
      footer={
        <>
          {ACTION_META.map((item) => {
            const reason = disabledReason(incident, item.id);
            const btnVariant =
              item.variant === "danger"
                ? "danger"
                : item.variant === "outline"
                  ? "secondary"
                  : "primary";
            if (reason) {
              return (
                <span
                  key={item.id}
                  title={reason}
                  className="flex-1 sm:flex-none"
                >
                  <Button
                    variant={btnVariant}
                    disabled
                    className="pointer-events-none h-11! w-full px-5!"
                  >
                    {item.label}
                  </Button>
                </span>
              );
            }
            return (
              <Button
                key={item.id}
                variant={btnVariant}
                onClick={() => onRequestAction(item.id)}
                className="h-11! flex-1 px-5! sm:flex-none"
              >
                {item.label}
              </Button>
            );
          })}
        </>
      }
      // While the confirm dialog is open it owns Escape, focus and clicks.
      closeOnEscape={!actionPending}
      trapFocus={!actionPending}
    >
      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        tabIndex={0}
        className="outline-none"
      >
        {/* Lazy detail fetch state (GET /safety/incidents/{id}): loading line
            or error banner with Retry, mirroring EntityDrawer's detailState.
            The list row keeps rendering underneath either way. */}
        {detailState && (detailState.loading || detailState.error) ? (
          detailState.loading ? (
            <div
              role="status"
              aria-busy="true"
              className="mb-4 flex items-center gap-2 text-sm text-ink-muted"
            >
              <span
                className="size-3.5 animate-spin rounded-full border-2 border-border border-t-brand"
                aria-hidden="true"
              />
              Loading details…
            </div>
          ) : (
            <div
              role="alert"
              className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-danger-soft px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="min-w-0 text-sm font-medium text-danger">
                {detailState.error}
              </p>
              <Button
                variant="secondary"
                onClick={detailState.onRetry}
                className="shrink-0 self-start sm:self-auto"
              >
                Retry
              </Button>
            </div>
          )
        ) : null}
        {tab === "overview" ? (
          <div className="flex flex-col gap-6">
            <RouteMapPreview
              from="Ride origin"
              to="Ride destination"
              distanceKm={18.4}
              durationMin={32}
            />
            <section>
              <h3 className="text-base font-normal text-ink">
                Incident information
              </h3>
              <div className="mt-3 border-t border-border pt-3">
                <InfoGrid items={infoItems} />
              </div>
            </section>
            <section>
              <h3 className="text-base font-normal text-ink">
                Activity timeline
              </h3>
              <div className="mt-3 border-t border-border pt-3">
                <TimelineList
                  steps={model?.timeline ?? []}
                  loading={detailState?.loading ?? false}
                />
              </div>
            </section>
          </div>
        ) : null}

        {tab === "timeline" ? (
          <TimelineList
            steps={model?.timeline ?? []}
            loading={detailState?.loading ?? false}
          />
        ) : null}

        {tab === "history" ? (
          // No history endpoint exists for incidents; the tab stays in place
          // with the app's availability note (same treatment as the
          // verification centre's endpoint-less tab).
          <p className="px-1 py-8 text-center text-sm text-ink-muted">
            Not available yet
          </p>
        ) : null}

        {tab === "notes" ? (
          <div>
            <label
              htmlFor="incident-notes"
              className="text-sm font-medium text-ink"
            >
              Internal notes
            </label>
            <textarea
              id="incident-notes"
              placeholder="Add an internal note about this incident..."
              className="mt-2 min-h-32 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:text-sm"
            />
          </div>
        ) : null}
      </div>
    </SideSheet>
  );
}

