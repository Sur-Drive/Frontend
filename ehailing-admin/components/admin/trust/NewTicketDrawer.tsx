"use client";

import { useId, useState } from "react";
import { SideSheet } from "@/components/ui/SideSheet";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { Select } from "@/components/ui/Select";
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from "@/types/trust";
import type {
  SupportTicket,
  TicketCategory,
  TicketPriority,
} from "@/types/trust";

interface Draft {
  affectedUser: string;
  category: TicketCategory | "";
  priority: TicketPriority;
  rideId: string;
  subject: string;
  description: string;
}

const EMPTY: Draft = {
  affectedUser: "",
  category: "",
  priority: "Medium",
  rideId: "",
  subject: "",
  description: "",
};

// Stable avatar tone rotation for created tickets (mirrors LogIncidentDrawer).
const TONES = ["brand", "warning", "info", "success"] as const;

function initialsFromName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

interface NewTicketDrawerProps {
  open: boolean;
  existingIds: string[];
  onClose: () => void;
  onRequestCreate: (ticket: SupportTicket) => void;
  resetKey: number;
}

export function NewTicketDrawer({
  open,
  existingIds,
  onClose,
  onRequestCreate,
  resetKey,
}: NewTicketDrawerProps) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  const ids = useId();

  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setDraft(EMPTY);
    setTouched(false);
  }

  if (!open) return null;

  const affectedUserId = `${ids}-affected-user`;
  const categoryId = `${ids}-category`;
  const priorityId = `${ids}-priority`;
  const rideId = `${ids}-ride`;
  const subjectId = `${ids}-subject`;
  const descriptionId = `${ids}-description`;

  const errors = {
    affectedUser:
      draft.affectedUser.trim() === "" ? "Enter the affected user." : null,
    category: draft.category === "" ? "Select a category." : null,
    subject: draft.subject.trim() === "" ? "Enter a subject." : null,
    description:
      draft.description.trim() === "" ? "Describe the issue." : null,
  };

  function show(key: keyof typeof errors): string | undefined {
    return touched ? (errors[key] ?? undefined) : undefined;
  }

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleCreate() {
    setTouched(true);
    if (Object.values(errors).some((error) => error !== null)) return;
    const name = draft.affectedUser.trim();
    let next = 4822;
    for (const id of existingIds) {
      const match = /^SUP-(\d+)$/.exec(id);
      if (match) next = Math.max(next, Number(match[1]) + 1);
    }
    const tone = TONES[next % TONES.length];
    onRequestCreate({
      id: `SUP-${next}`,
      subject: draft.subject.trim(),
      category: draft.category as TicketCategory,
      requester: { name, initials: initialsFromName(name), tone },
      requesterType: "Passenger",
      requesterMeta: "Passenger • New requester",
      rideId: draft.rideId.trim() === "" ? null : draft.rideId.trim(),
      timeAgo: "Just now",
      openedLabel: "Opened just now",
      priority: draft.priority,
      status: "Open",
      escalated: false,
      assignee: null,
      messages: [
        {
          id: `SUP-${next}-m1`,
          from: "customer",
          sender: name,
          text: draft.description.trim(),
          timeLabel: "Just now",
        },
      ],
    });
  }

  return (
    <SideSheet
      open
      onClose={onClose}
      eyebrow="SUPPORT TICKET MANAGEMENT"
      title="New ticket"
      subtitle="Open a support request"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            className="h-11! flex-1 px-5! sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            className="h-11! flex-1 px-5! sm:flex-none"
          >
            Create ticket
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="min-w-0">
          <label htmlFor={affectedUserId} className="text-sm font-medium text-ink">
            Affected user
          </label>
          <div className="mt-1.5">
            <TextField
              id={affectedUserId}
              label="Affected user"
              value={draft.affectedUser}
              onChange={(event) => update("affectedUser", event.target.value)}
              error={show("affectedUser")}
              placeholder="e.g. Adaeze Nwosu • 08012345678 • SUP-4822"
              autoComplete="off"
            />
            {show("affectedUser") ? (
              <p className="mt-1 text-xs text-danger">{show("affectedUser")}</p>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="min-w-0">
            <label
              htmlFor={categoryId}
              className="text-sm font-medium text-ink"
            >
              Category
            </label>
            <div className="mt-1.5">
              <Select
                id={categoryId}
                label="Category"
                value={draft.category}
                onChange={(event) =>
                  update("category", event.target.value as Draft["category"])
                }
              >
                <option value="">Select a category</option>
                {TICKET_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </Select>
              {show("category") ? (
                <p className="mt-1 text-xs text-danger">{show("category")}</p>
              ) : null}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="min-w-0">
            <label
              htmlFor={priorityId}
              className="text-sm font-medium text-ink"
            >
              Priority
            </label>
            <div className="mt-1.5">
              <Select
                id={priorityId}
                label="Priority"
                value={draft.priority}
                onChange={(event) =>
                  update("priority", event.target.value as TicketPriority)
                }
              >
                {TICKET_PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <TextField
            id={rideId}
            label="Related ride"
            value={draft.rideId}
            onChange={(event) => update("rideId", event.target.value)}
            placeholder="e.g. SD-28498"
          />
        </div>
        <TextField
          id={subjectId}
          label="Subject"
          value={draft.subject}
          onChange={(event) => update("subject", event.target.value)}
          placeholder="e.g. Payment deducted twice"
          error={show("subject")}
        />
        <div className="min-w-0">
          <label
            htmlFor={descriptionId}
            className="text-sm font-medium text-ink"
          >
            Description
          </label>
          <textarea
            id={descriptionId}
            value={draft.description}
            onChange={(event) => update("description", event.target.value)}
            placeholder="Describe the issue..."
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
