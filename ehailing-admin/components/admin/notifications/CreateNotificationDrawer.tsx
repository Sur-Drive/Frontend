"use client";

import { useId, useState } from "react";
import { SideSheet } from "@/components/ui/SideSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Select } from "@/components/ui/Select";
import { NotificationPreview } from "./NotificationPreview";
import { CITIES } from "@/types/analytics";
import {
  AUDIENCE_OPTIONS,
  CHANNEL_OPTIONS,
  NOTIFICATION_TONES,
  SCHEDULE_OPTIONS,
  TITLE_MAX,
  messageMax,
  notificationInitials,
} from "@/types/notifications";
import type {
  NotificationChannel,
  NotificationTone,
} from "@/types/notifications";

// "" = unset: a duplicate whose scheduled label couldn't be parsed opens with
// no delivery option chosen; the composer shows a hint and blocks submit
// until the user picks one.
export type ScheduleMode = "Send now" | "Schedule for later" | "";

// Everything the composer collects; the parent turns it into a list row.
export interface NotificationDraft {
  title: string;
  message: string;
  audience: string;
  channel: NotificationChannel;
  city: string;
  schedule: ScheduleMode;
  date: string;
  time: string;
}

// What the parent receives, pre-derived so it never has to re-read the form.
export interface NotificationDraftResult extends NotificationDraft {
  initials: string;
  tone: NotificationTone;
  toneIndex: number;
}

interface CreateNotificationDrawerProps {
  open: boolean;
  // "Edit notification" when reopening a row, otherwise "Create notification".
  title: string;
  // Existing row values when editing or duplicating; null for a new campaign.
  initial: NotificationDraft | null;
  // Tone cycle position: the row's own index when editing/duplicating.
  toneIndex: number;
  onClose: () => void;
  // Primary footer action: the parent opens its confirm dialog.
  onSubmit: (draft: NotificationDraftResult) => void;
  // The parent opens a confirm dialog for this too: every mutation confirms
  // before anything reaches the backend.
  onSaveDraft: (draft: NotificationDraftResult) => void;
}

const EMPTY: NotificationDraft = {
  title: "",
  message: "",
  audience: "All passengers",
  channel: "Push",
  city: "All cities",
  schedule: "Send now",
  date: "",
  time: "",
};

function channelLabel(channel: NotificationChannel): string {
  return (
    CHANNEL_OPTIONS.find((option) => option.channel === channel)?.label ??
    channel
  );
}

export function CreateNotificationDrawer({
  open,
  title,
  initial,
  toneIndex,
  onClose,
  onSubmit,
  onSaveDraft,
}: CreateNotificationDrawerProps) {
  const [draft, setDraft] = useState<NotificationDraft>(EMPTY);
  const [seeded, setSeeded] = useState(false);
  const [touched, setTouched] = useState(false);
  const ids = useId();

  // Seed once per opening (state adjusted during render) so a cancelled confirm
  // dialog can reopen the drawer with the entered values intact.
  if (open && !seeded) {
    setSeeded(true);
    setTouched(false);
    setDraft(initial ? { ...initial } : { ...EMPTY });
  } else if (!open && seeded) {
    setSeeded(false);
  }

  if (!open) return null;

  const titleId = `${ids}-title`;
  const messageId = `${ids}-message`;
  const audienceId = `${ids}-audience`;
  const channelId = `${ids}-channel`;
  const cityId = `${ids}-city`;
  const scheduleId = `${ids}-schedule`;
  const dateId = `${ids}-date`;
  const timeId = `${ids}-time`;

  const later = draft.schedule === "Schedule for later";
  // Unset only when a duplicate's scheduled label couldn't be parsed: the
  // hint shows and submit stays blocked until an option is chosen.
  const scheduleUnset = draft.schedule === "";
  const maxMessage = messageMax(draft.channel);
  // Local today as YYYY-MM-DD (the date input's format): a past send date is
  // rejected — the backend only accepts a future scheduledAt.
  const today = new Date();
  const todayIso = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  function update<K extends keyof NotificationDraft>(
    key: K,
    value: NotificationDraft[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  const errors = {
    title:
      draft.title.trim() === ""
        ? "Enter a notification title."
        : draft.title.length > TITLE_MAX
          ? `Keep the title to ${TITLE_MAX} characters or fewer.`
          : null,
    message:
      draft.message.trim() === ""
        ? "Enter a message."
        : draft.message.length > maxMessage
          ? `Keep the message to ${maxMessage} characters or fewer.`
          : null,
    date:
      later && draft.date === ""
        ? "Select a send date."
        : later && draft.date < todayIso
          ? "The send date cannot be in the past."
          : null,
    time: later && draft.time === "" ? "Select a send time." : null,
  };

  const valid = Object.values(errors).every((error) => error === null);

  function show(key: keyof typeof errors): string | undefined {
    return touched ? (errors[key] ?? undefined) : undefined;
  }

  function result(): NotificationDraftResult {
    const index = toneIndex % NOTIFICATION_TONES.length;
    return {
      ...draft,
      title: draft.title.trim(),
      message: draft.message.trim(),
      initials: notificationInitials(draft.title),
      tone: NOTIFICATION_TONES[index],
      toneIndex: index,
    };
  }

  function handleSubmit() {
    setTouched(true);
    if (!valid) return;
    onSubmit(result());
  }

  // Only the two required copy fields are enforced here; the parent's
  // confirm dialog comes next, before any request is sent.
  function handleSaveDraft() {
    setTouched(true);
    if (errors.title !== null || errors.message !== null) return;
    onSaveDraft(result());
  }

  return (
    <SideSheet
      open
      onClose={onClose}
      eyebrow="NEW CAMPAIGN"
      title={title}
      subtitle="Reach the right audience at the right time."
      footer={
        <>
          <Button
            variant="secondary"
            className="h-11! flex-1 px-5! sm:flex-none"
            onClick={handleSaveDraft}
          >
            Save draft
          </Button>
          <span
            title={scheduleUnset ? "Select a schedule first" : undefined}
            className="flex-1 sm:flex-none"
          >
            <Button
              className={`h-11! w-full px-5! sm:flex-none${scheduleUnset ? " pointer-events-none" : ""}`}
              onClick={handleSubmit}
              disabled={scheduleUnset}
            >
              {scheduleUnset
                ? "Select a schedule"
                : later
                  ? "Schedule notification"
                  : "Send notification"}
            </Button>
          </span>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor={titleId} className="text-sm font-medium text-ink">
              Notification title
            </label>
            <span className="text-xs text-ink-subtle">
              {draft.title.length}/{TITLE_MAX}
            </span>
          </div>
          <input
            id={titleId}
            value={draft.title}
            onChange={(event) => update("title", event.target.value)}
            placeholder="e.g. Your weekend ride offer"
            aria-invalid={show("title") ? true : undefined}
            aria-describedby={show("title") ? `${titleId}-error` : undefined}
            className={`mt-1.5 h-12 w-full rounded-xl border bg-surface px-4 text-base text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              show("title") ? "border-danger" : "border-border"
            }`}
          />
          {show("title") ? (
            <p id={`${titleId}-error`} className="mt-1 text-xs text-danger">
              {show("title")}
            </p>
          ) : null}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor={messageId} className="text-sm font-medium text-ink">
              Message
            </label>
            <span className="text-xs text-ink-subtle">
              {draft.message.length}/{maxMessage}
            </span>
          </div>
          <textarea
            id={messageId}
            value={draft.message}
            onChange={(event) => update("message", event.target.value)}
            placeholder="Write a clear, concise message..."
            aria-invalid={show("message") ? true : undefined}
            aria-describedby={show("message") ? `${messageId}-error` : undefined}
            className={`mt-1.5 min-h-28 w-full resize-none rounded-xl border bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              show("message") ? "border-danger" : "border-border"
            }`}
          />
          {show("message") ? (
            <p id={`${messageId}-error`} className="mt-1 text-xs text-danger">
              {show("message")}
            </p>
          ) : null}
        </div>


        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor={audienceId}
              className="text-sm font-medium text-ink"
            >
              Audience
            </label>
            <div className="mt-1.5">
              <Select
                id={audienceId}
                label="Audience"
                value={draft.audience}
                onChange={(event) => update("audience", event.target.value)}
              >
                {AUDIENCE_OPTIONS.map((option) => {
                  // City-scoped segments have no confirmed backend audience
                  // value: visible but disabled.
                  const unsupported =
                    option === "Lagos passengers" || option === "Lagos drivers";
                  return (
                    <option
                      key={option}
                      value={option}
                      disabled={unsupported}
                      title={unsupported ? "Not available yet" : undefined}
                    >
                      {option}
                    </option>
                  );
                })}
              </Select>
            </div>
          </div>

          <div>
            <label htmlFor={channelId} className="text-sm font-medium text-ink">
              Channel
            </label>
            <div className="mt-1.5">
              <Select
                id={channelId}
                label="Channel"
                value={channelLabel(draft.channel)}
                onChange={(event) => {
                  const match = CHANNEL_OPTIONS.find(
                    (option) => option.label === event.target.value,
                  );
                  if (match) update("channel", match.channel);
                }}
              >
                {CHANNEL_OPTIONS.map((option) => {
                  // Multi-channel has no confirmed backend channel value:
                  // visible but disabled.
                  const unsupported = option.channel === "Push + Email";
                  return (
                    <option
                      key={option.label}
                      value={option.label}
                      disabled={unsupported}
                      title={unsupported ? "Not available yet" : undefined}
                    >
                      {option.label}
                    </option>
                  );
                })}
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={cityId} className="text-sm font-medium text-ink">
              City
            </label>
            {/* The backend stores no city field: the control keeps its slot
                behind a "Not saved yet" helper instead of collecting a value
                that would be lost. */}
            <div className="mt-1.5" title="Not saved yet">
              <Select
                id={cityId}
                label="City"
                value={draft.city}
                onChange={(event) => update("city", event.target.value)}
                disabled
              >
                {CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </Select>
            </div>
            <p className="mt-1 text-xs text-ink-subtle">Not saved yet</p>
          </div>

          <div>
            <label htmlFor={scheduleId} className="text-sm font-medium text-ink">
              Schedule
            </label>
            <div className="mt-1.5">
              <Select
                id={scheduleId}
                label="Schedule"
                value={draft.schedule}
                onChange={(event) =>
                  update("schedule", event.target.value as ScheduleMode)
                }
              >
                {SCHEDULE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </div>
            {scheduleUnset ? (
              <p className="mt-1 text-xs text-warning">
                Choose a schedule and a send date before submitting.
              </p>
            ) : null}
          </div>
        </div>

        {later ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextField
              id={dateId}
              label="Send date"
              type="date"
              value={draft.date}
              onChange={(event) => update("date", event.target.value)}
              error={show("date")}
            />
            <TextField
              id={timeId}
              label="Send time"
              type="time"
              value={draft.time}
              onChange={(event) => update("time", event.target.value)}
              error={show("time")}
            />
          </div>
        ) : null}

        <div className="rounded-2xl bg-surface-muted p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">
            Preview
          </p>
          <div className="mt-3">
            <NotificationPreview
              channel={draft.channel}
              title={draft.title}
              message={draft.message}
            />
          </div>
        </div>
      </div>
    </SideSheet>
  );
}

