"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import type { SupportTicket } from "@/types/trust";
import { MessageThread } from "./TicketParts";
import { TicketActionButtons } from "./TicketActionButtons";
import { TicketRequesterRow } from "./TicketRequesterRow";
import { TicketComposer } from "./TicketComposer";
import type { TicketComposerTab } from "./TicketComposer";

// Footer action ids for a conversation. "assign" opens a dialog with an agent
// select; "escalate" uses the danger confirm tone; "resolve" is terminal.
export type TicketActionId = "assign" | "escalate" | "resolve";

// Why a header action is disabled for the current ticket (rendered as a
// tooltip). Returns undefined when the action is available.
export function ticketDisabledReason(
  ticket: SupportTicket,
  action: TicketActionId,
): string | undefined {
  const resolved = ticket.status === "Resolved";
  if (action === "assign") {
    return resolved ? "Resolved tickets can't be reassigned." : undefined;
  }
  if (action === "escalate") {
    if (resolved) return "Resolved tickets can't be escalated.";
    if (ticket.escalated) return "Already escalated";
    return undefined;
  }
  // resolve
  return resolved ? "Ticket is already resolved." : undefined;
}

// Dialog title for a header action.
export function ticketActionDialogTitle(action: TicketActionId): string {
  if (action === "assign") return "Confirm assign ticket";
  if (action === "escalate") return "Confirm escalate ticket";
  return "Confirm resolve ticket";
}

// "View profile" goes to the requester's list page (no per-person deep link
// exists yet): passengers -> /admin/passengers, drivers -> /admin/drivers.
export function profileHref(ticket: SupportTicket): string {
  return ticket.requesterType === "Driver"
    ? "/admin/drivers"
    : "/admin/passengers";
}

type ComposerTab = TicketComposerTab;

// Static time label for locally appended bubbles (no Date.now, so server and
// client renders match).
export const LIVE_TIME_LABEL = "Just now";

interface TicketConversationProps {
  ticket: SupportTicket;
  adminFirstName: string;
  onRequestAction: (action: TicketActionId) => void;
  onSendReply: (ticketId: string, text: string) => void;
  onAddNote: (ticketId: string, text: string) => void;
  // Shown below lg when a ticket is open; returns to the inbox list.
  onBack?: () => void;
}

// Right-hand conversation card: subject header with Assign/Escalate/Resolve,
// requester row with profile link, scrolling message thread, and a pinned
// Reply/Internal-note composer (Cmd/Ctrl+Enter sends; no confirm needed).
export function TicketConversation({
  ticket,
  adminFirstName,
  onRequestAction,
  onSendReply,
  onAddNote,
  onBack,
}: TicketConversationProps) {
  const [composerTab, setComposerTab] = useState<ComposerTab>("reply");
  const [draft, setDraft] = useState("");
  const [prevTicketId, setPrevTicketId] = useState(ticket.id);
  const threadRef = useRef<HTMLDivElement>(null);

  // Clear the composer whenever a different ticket is opened.
  if (ticket.id !== prevTicketId) {
    setPrevTicketId(ticket.id);
    setComposerTab("reply");
    setDraft("");
  }

  // Keep the newest message in view.
  useEffect(() => {
    threadRef.current?.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [ticket.messages.length, ticket.id]);

  const resolved = ticket.status === "Resolved";

  function send() {
    const text = draft.trim();
    if (text === "") return;
    if (composerTab === "reply") {
      onSendReply(ticket.id, text);
    } else {
      onAddNote(ticket.id, text);
    }
    setDraft("");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-start gap-2">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to inbox"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand lg:hidden"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
          ) : null}
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-ink">
              {ticket.subject}
            </h2>
            <p className="mt-0.5 truncate text-xs text-ink-muted">
              {ticket.id} • {ticket.openedLabel}
            </p>
          </div>
        </div>
        <TicketActionButtons ticket={ticket} onRequestAction={onRequestAction} />
      </div>
      <TicketRequesterRow ticket={ticket} />
      <div
        ref={threadRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5"
      >
        <MessageThread ticket={ticket} adminFirstName={adminFirstName} />
      </div>
      <TicketComposer
        composerTab={composerTab}
        onTabChange={setComposerTab}
        draft={draft}
        onDraftChange={setDraft}
        resolved={resolved}
        onSend={send}
      />
    </div>
  );
}

