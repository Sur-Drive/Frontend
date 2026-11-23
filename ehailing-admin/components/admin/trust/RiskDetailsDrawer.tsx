"use client";

import { useState } from "react";
import { Check, Circle } from "lucide-react";
import { SideSheet } from "@/components/ui/SideSheet";
import { Tabs } from "@/components/ui/Tabs";
import type { TabItem } from "@/components/ui/Tabs";
import { StatusPill } from "@/components/ui/StatusPill";
import { Button } from "@/components/ui/Button";
import {
  riskLevelDisplay,
  riskPatternDisplay,
  riskScoreLabel,
  riskStatusDisplay,
} from "@/lib/fraud";
import type { CaseTimelineEvent } from "@/lib/fraud";
import type { RiskCase } from "@/types/trust";
import type { DetailItem } from "@/types/ride-details";

const TABS: TabItem[] = [
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Timeline" },
  { id: "history", label: "History" },
  { id: "notes", label: "Notes" },
];

// Footer action ids. Order and tone are driven from this list so a button's
// colour stays a one-line change in ACTION_META. "add-note" never opens a
// confirm dialog (it focuses the Notes tab instead); "assign" stays disabled
// with "Not available yet" — no officers endpoint exists to source ids.
export type RiskActionId =
  | "add-note"
  | "escalate"
  | "assign"
  | "resolve"
  | "dismiss";

interface ActionMeta {
  id: RiskActionId;
  label: string;
  // Footer button variant.
  variant: "danger" | "outline" | "brand";
  // Confirm dialog button tone; escalate is a danger action.
  confirmTone: "brand" | "danger";
}

export const ACTION_META: ActionMeta[] = [
  { id: "add-note", label: "Add note", variant: "danger", confirmTone: "brand" },
  { id: "escalate", label: "Escalate risk", variant: "outline", confirmTone: "danger" },
  { id: "assign", label: "Assign", variant: "outline", confirmTone: "brand" },
  { id: "resolve", label: "Resolve", variant: "brand", confirmTone: "brand" },
  { id: "dismiss", label: "Dismiss", variant: "outline", confirmTone: "brand" },
];

// Dialog title for a confirmable footer/row-menu action.
export function actionDialogTitle(action: RiskActionId): string {
  if (action === "escalate") return "Confirm escalate risk";
  if (action === "resolve") return "Confirm resolve case";
  if (action === "dismiss") return "Confirm dismiss case";
  return "Confirm action";
}

// Why a footer action is disabled for the current risk (rendered as a
// tooltip). Returns undefined when the action is available. Escalate
// pre-empts the documented backend failure ("Fails if the case is already
// resolved or dismissed"); resolve/dismiss have no documented preconditions,
// so a stale row never blocks a legitimate retry — the backend message shows
// instead. Assign is unavailable by design (no officers endpoint); every
// action needs the record id for its URL, so rows without one disable too.
export function disabledReason(
  risk: RiskCase,
  action: RiskActionId,
): string | undefined {
  if (action === "assign") return "Not available yet";
  if (!risk.recordId) return "Case id is not available.";
  if (action === "escalate") {
    const status = riskStatusDisplay(risk.status).label;
    if (status === "Resolved") return "Resolved cases can't be escalated.";
    if (status === "Dismissed") return "Dismissed cases can't be escalated.";
  }
  return undefined;
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

// Case detail state as passed by the view: the timeline events were extracted
// defensively from the unverified detail shape (null = no recognizable
// timeline array in the response).
export interface DrawerDetailState {
  loading: boolean;
  error: string | null;
  events: CaseTimelineEvent[] | null;
  onRetry: () => void;
}

// Data-derived timeline: every event comes from the detail fetch (see
// mapCaseTimeline); unrecognized fields render "—" and an empty/unparseable
// timeline renders the empty state — nothing is fabricated.
function TimelinePanel({ detailState }: { detailState: DrawerDetailState }) {
  if (detailState.loading) {
    return (
      <p className="py-6 text-center text-sm text-ink-muted">
        Loading case timeline…
      </p>
    );
  }
  if (detailState.error) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <p className="text-sm text-danger">{detailState.error}</p>
        <Button variant="secondary" onClick={detailState.onRetry}>
          Retry
        </Button>
      </div>
    );
  }
  const events = detailState.events ?? [];
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <Circle className="size-8 text-ink-subtle" aria-hidden="true" />
        <p className="text-sm text-ink-muted">No timeline events available.</p>
      </div>
    );
  }
  return (
    <ol className="flex flex-col gap-4">
      {events.map((event, index) => (
        <li
          key={`${event.label}-${index}`}
          className="relative flex items-start gap-3"
        >
          {index < events.length - 1 ? (
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
            <span className="text-sm font-medium text-ink">{event.label}</span>
            <span className="text-xs text-ink-muted">{event.timeLabel}</span>
            {event.text ? (
              <span className="mt-1 text-sm text-ink-muted">{event.text}</span>
            ) : null}
          </span>
        </li>
      ))}
    </ol>
  );
}

interface RiskDetailsDrawerProps {
  risk: RiskCase | null;
  // Present while the drawer is open; null when closed.
  detailState: DrawerDetailState | null;
  onClose: () => void;
  // A footer button was clicked; the parent opens its confirm dialog (or, for
  // add-note, bumps focusNotesKey to focus the Notes tab here).
  onRequestAction: (action: RiskActionId) => void;
  // True while the parent's confirm dialog is open, so this sheet stops
  // owning Escape/focus (the dialog owns them while stacked on top).
  actionPending: boolean;
  // Bumped by the parent to force the Notes tab open and focus the field.
  focusNotesKey: number;
  // Save-note request state: saving disables the field, error shows under it.
  noteState: { saving: boolean; error: string | null };
  // Persist the note through POST /notes; the parent shows the toast and
  // refetches the detail.
  onSaveNote: (caseId: string, note: string) => void;
  // Bumped after the backend confirms a saved note; the textarea clears then.
  noteSavedKey: number;
}

// Risk details side sheet, mirroring the incident drawer: fixed header/tabs/
// footer with a scrolling body. Overview shows the risk information grid and
// the case timeline; footer actions request confirmation from the parent.
export function RiskDetailsDrawer({
  risk,
  detailState,
  onClose,
  onRequestAction,
  actionPending,
  focusNotesKey,
  noteState,
  onSaveNote,
  noteSavedKey,
}: RiskDetailsDrawerProps) {
  const [tab, setTab] = useState("overview");
  const [prevId, setPrevId] = useState(risk?.id ?? null);
  const [noteText, setNoteText] = useState("");
  const [prevFocusKey, setPrevFocusKey] = useState(focusNotesKey);
  const [prevSavedKey, setPrevSavedKey] = useState(noteSavedKey);

  // Reset to the first tab and clear the draft whenever a different case is
  // opened (render-time state adjustment — no effect).
  if ((risk?.id ?? null) !== prevId) {
    setPrevId(risk?.id ?? null);
    setTab("overview");
    setNoteText("");
  }

  // Force the Notes tab when the parent bumps focusNotesKey (from the footer
  // "Add note" or the row menu).
  if (focusNotesKey !== prevFocusKey) {
    setPrevFocusKey(focusNotesKey);
    setTab("notes");
  }

  // Clear the draft only after the backend confirmed the save (never before).
  if (noteSavedKey !== prevSavedKey) {
    setPrevSavedKey(noteSavedKey);
    setNoteText("");
  }

  if (!risk) return null;

  const level = riskLevelDisplay(risk.riskLevel);
  const status = riskStatusDisplay(risk.status);

  const infoItems: DetailItem[] = [
    { label: "Risk ID", value: risk.id },
    { label: "Pattern", value: riskPatternDisplay(risk.pattern) },
    { label: "Signal", value: risk.signal },
    {
      label: "Risk level",
      value: null,
      pill: { tone: level.tone, label: level.label },
    },
    { label: "Risk score", value: riskScoreLabel(risk.riskScore) },
    { label: "Detected", value: risk.detectedLabel },
    {
      label: "Status",
      value: null,
      pill: { tone: status.tone, label: status.label },
    },
  ];

  function saveNote() {
    if (!noteText.trim() || noteState.saving) return;
    onSaveNote(risk!.id, noteText.trim());
  }

  return (
    <SideSheet
      open
      onClose={onClose}
      eyebrow="RISK DETAILS"
      title={risk.subject?.name ?? "—"}
      subtitle={`Detected ${risk.detectedLabel}`}
      headerExtras={<Tabs tabs={TABS} value={tab} onChange={setTab} />}
      footer={
        <>
          {ACTION_META.map((item) => {
            const reason = disabledReason(risk, item.id);
            const btnVariant =
              item.variant === "danger"
                ? "danger"
                : item.variant === "outline"
                  ? "secondary"
                  : "primary";
            if (reason) {
              // Disabled actions keep their tooltip on the wrapper span
              // (disabled buttons don't fire pointer events).
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
        {tab === "overview" ? (
          <div className="flex flex-col gap-6">
            <section>
              <h3 className="text-base font-normal text-ink">
                Risk information
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
                {detailState ? (
                  <TimelinePanel detailState={detailState} />
                ) : null}
              </div>
            </section>
          </div>
        ) : null}

        {tab === "timeline" && detailState ? (
          <TimelinePanel detailState={detailState} />
        ) : null}

        {tab === "history" ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Circle className="size-8 text-ink-subtle" aria-hidden="true" />
            <p className="text-sm text-ink-muted">
              No earlier activity for this case.
            </p>
          </div>
        ) : null}

        {tab === "notes" ? (
          <div>
            <label
              htmlFor="risk-notes"
              className="text-sm font-medium text-ink"
            >
              Internal notes
            </label>
            <textarea
              id="risk-notes"
              value={noteText}
              onChange={(event) => setNoteText(event.target.value)}
              disabled={noteState.saving}
              placeholder="Add an internal note about this case..."
              className="mt-2 min-h-32 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
            />
            {noteState.error ? (
              <p role="alert" className="mt-2 text-xs text-danger">
                {noteState.error}
              </p>
            ) : null}
            <div className="mt-3 flex items-center gap-3">
              <Button
                variant="primary"
                onClick={saveNote}
                loading={noteState.saving}
                disabled={!noteText.trim() || noteState.saving}
                className="h-11! px-5!"
              >
                Save note
              </Button>
              <span className="text-xs text-ink-muted">
                Saved notes appear in the case timeline.
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </SideSheet>
  );
}



