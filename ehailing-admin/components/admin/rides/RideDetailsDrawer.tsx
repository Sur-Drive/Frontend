"use client";

import { useState } from "react";
import { Check, Circle, LifeBuoy, MapPin, X } from "lucide-react";
import { SideSheet } from "@/components/ui/SideSheet";
import { Tabs } from "@/components/ui/Tabs";
import type { TabItem } from "@/components/ui/Tabs";
import { StatusPill } from "@/components/ui/StatusPill";
import { Button } from "@/components/ui/Button";
import { RouteMapPreview } from "@/components/admin/records/RouteMapPreview";
import type {
  DetailItem,
  RideDetailsModel,
  TimelineStep,
} from "@/types/ride-details";

const TABS: TabItem[] = [
  { id: "overview", label: "Trip Overview" },
  { id: "timeline", label: "Timeline" },
  { id: "payment", label: "Payment" },
  { id: "support", label: "Support" },
];

// The ride operations backend exposes only GET endpoints for rides;
// the escalate / review-fare actions therefore have no
// confirmed mutation endpoint and stay disabled in place.
const ACTIONS_NOT_AVAILABLE = "Not available yet";

function circleClass(state: TimelineStep["state"]): string {
  if (state === "done") return "bg-success-soft";
  if (state === "danger") return "bg-danger-soft";
  if (state === "upcoming") return "border border-border bg-surface";
  return "bg-brand-soft";
}

function circleIcon(state: TimelineStep["state"]) {
  if (state === "done") return <Check className="size-3.5 text-success" />;
  if (state === "danger") return <X className="size-3.5 text-danger" />;
  if (state === "upcoming") return <Circle className="size-2.5 text-ink-subtle" />;
  return <Circle className="size-2.5 fill-brand text-brand" />;
}

function textClass(state: TimelineStep["state"]): string {
  if (state === "done") return "text-ink-muted";
  if (state === "danger") return "font-semibold text-danger";
  if (state === "upcoming") return "text-ink-subtle";
  return "font-semibold text-ink";
}

function InfoCard({ item }: { item: DetailItem }) {
  return (
    <div className="rounded-xl bg-surface-muted p-4">
      <p className="text-xs text-ink-muted">{item.label}</p>
      <p className="mt-1 text-sm font-medium text-ink">
        {item.pill ? (
          <StatusPill tone={item.pill.tone} label={item.pill.label} />
        ) : (
          item.value ?? "—"
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

function TimelineRow({ step }: { step: TimelineStep }) {
  return (
    <li className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${circleClass(step.state)}`}
      >
        {circleIcon(step.state)}
      </span>
      <span className="flex min-w-0 flex-wrap items-center gap-2">
        <span className={`text-sm ${textClass(step.state)}`}>{step.label}</span>
        {step.state === "current" ? (
          <span className="text-xs font-medium text-brand">Current</span>
        ) : null}
        {step.tag ? (
          <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">
            {step.tag.label}
          </span>
        ) : null}
      </span>
    </li>
  );
}
interface RideDetailsDrawerProps {
  details: RideDetailsModel | null;
  onClose: () => void;
  detailState?: { loading: boolean; error: string | null; onRetry: () => void };
  tabState?: { loading: boolean; error: string | null; onRetry: () => void };
  // Fired when the user switches tabs so the caller can lazily fetch the
  // newly opened tab's data (timeline / payment sub-resources).
  onTabChange?: (tabId: string) => void;
}

export function RideDetailsDrawer({
  details,
  onClose,
  detailState,
  tabState,
  onTabChange,
}: RideDetailsDrawerProps) {
  const open = details !== null;
  const [tab, setTab] = useState("overview");
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setTab("overview");
  }

  const drawerError = detailState?.error || tabState?.error;
  const drawerLoading = detailState?.loading || tabState?.loading;
  const onRetry = detailState?.onRetry || tabState?.onRetry;

  function handleTabChange(id: string) {
    setTab(id);
    onTabChange?.(id);
  }

  if (!details) return null;

  return (
    <>
      <SideSheet
        open={open}
        onClose={onClose}
        eyebrow="Ride details"
        title={details.title}
        subtitle={details.id}
        headerExtras={<Tabs tabs={TABS} value={tab} onChange={handleTabChange} />}
        footer={
          <>
            <span title={ACTIONS_NOT_AVAILABLE} className="flex-1 sm:flex-none">
              <Button
                variant="danger"
                disabled
                className="pointer-events-none h-11! w-full px-5! sm:flex-none"
              >
                Escalate
              </Button>
            </span>
            <span title={ACTIONS_NOT_AVAILABLE} className="flex-1 sm:flex-none">
              <Button
                disabled
                className="pointer-events-none h-11! w-full px-5! sm:flex-none"
              >
                Review fare
              </Button>
            </span>
          </>
        }
      >
        {drawerLoading ? (
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
        ) : drawerError ? (
          <div
            role="alert"
            className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-danger-soft px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="min-w-0 text-sm font-medium text-danger">{drawerError}</p>
            <Button
              variant="secondary"
              onClick={onRetry}
              className="shrink-0 self-start sm:self-auto"
            >
              Retry
            </Button>
          </div>
        ) : null}
        {tab === "overview" ? (
          <div
            role="tabpanel"
            id="panel-overview"
            aria-labelledby="tab-overview"
            tabIndex={0}
            className="outline-none"
          >
            <div className="flex flex-col gap-6">
              <RouteMapPreview
                from={details.from}
                to={details.to}
                distanceKm={details.distanceKm}
                durationMin={details.durationMin}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-surface-muted p-4">
                  <p className="text-xs text-ink-muted">Pickup</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-medium text-ink">
                    <MapPin className="size-4 shrink-0 text-accent" aria-hidden="true" />
                    <span className="font-semibold">{details.from}</span>
                  </p>
                </div>
                <div className="rounded-xl bg-surface-muted p-4">
                  <p className="text-xs text-ink-muted">Destination</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-medium text-ink">
                    <MapPin className="size-4 shrink-0 text-brand" aria-hidden="true" />
                    <span className="font-semibold">{details.to}</span>
                  </p>
                </div>
              </div>
              <section>
                <h3 className="text-base font-normal text-ink">Trip information</h3>
                <div className="mt-3 border-t border-border pt-3">
                  <InfoGrid items={details.info} />
                </div>
              </section>
            </div>
          </div>
        ) : null}
        {tab === "timeline" ? (
          <div
            role="tabpanel"
            id="panel-timeline"
            aria-labelledby="tab-timeline"
            tabIndex={0}
            className="outline-none"
          >
            <ol className="flex flex-col gap-4">
              {details.timeline.map((step) => (
                <TimelineRow key={step.label} step={step} />
              ))}
            </ol>
          </div>
        ) : null}
        {tab === "payment" ? <InfoGrid items={details.payment} /> : null}
        {tab === "support" ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <LifeBuoy className="size-8 text-ink-subtle" aria-hidden="true" />
            <p className="text-sm text-ink-muted">{details.supportEmptyText}</p>
          </div>
        ) : null}
      </SideSheet>
    </>
  );
}

