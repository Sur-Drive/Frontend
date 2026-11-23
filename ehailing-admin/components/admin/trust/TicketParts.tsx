import { ShieldAlert } from "lucide-react";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { StatusPill } from "@/components/ui/StatusPill";
import { TICKET_PRIORITY_TONE } from "@/types/trust";
import type { SupportTicket, TicketMessage } from "@/types/trust";

// One row in the inbox list: avatar + bold subject, muted "SUP-… • Category",
// priority chip on the right. Selected rows get the light-purple wash with a
// purple left bar. Chips stay compact (w-fit, no stretch).
export function TicketListItem({
  ticket,
  selected,
  onSelect,
}: {
  ticket: SupportTicket;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? true : undefined}
        aria-label={`Open ticket ${ticket.id}: ${ticket.subject}`}
        className={`flex w-full items-start gap-3 border-l-4 px-4 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand ${
          selected
            ? "border-l-brand bg-brand-soft/60"
            : "border-l-transparent hover:bg-surface-muted"
        }`}
      >
        <InitialsAvatar
          initials={ticket.requester.initials}
          tone={ticket.requester.tone}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="truncate text-sm font-semibold text-ink">
              {ticket.requester.name}
            </span>
            <span className="shrink-0 text-xs text-ink-subtle">
              {ticket.timeAgo}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-sm font-semibold text-ink">
            {ticket.subject}
          </span>
          <span className="mt-0.5 flex items-center justify-between gap-2">
            <span className="min-w-0 truncate text-xs text-ink-muted">
              {ticket.id} • {ticket.category}
            </span>
            <StatusPill
              tone={TICKET_PRIORITY_TONE[ticket.priority]}
              label={ticket.priority}
            />
          </span>
        </span>
      </button>
    </li>
  );
}

// Customer bubbles sit left (white, bordered); agent bubbles sit right (light
// purple); internal notes are full-width amber banners with a shield icon.
function CustomerBubble({ message }: { message: TicketMessage }) {
  return (
    <div className="flex max-w-[85%] flex-col rounded-2xl rounded-tl-md border border-border bg-surface px-4 py-3 shadow-sm sm:max-w-[75%]">
      <p className="text-xs font-semibold text-ink">{message.sender}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink">{message.text}</p>
      <p className="mt-1.5 text-xs text-ink-subtle">{message.timeLabel}</p>
    </div>
  );
}

function AgentBubble({
  message,
  adminLabel,
}: {
  message: TicketMessage;
  adminLabel: string;
}) {
  return (
    <div className="ml-auto flex max-w-[85%] flex-col rounded-2xl rounded-tr-md bg-brand-soft/70 px-4 py-3 sm:max-w-[75%]">
      <p className="text-xs font-semibold text-ink">{adminLabel}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink">{message.text}</p>
      <p className="mt-1.5 text-xs text-ink-subtle">{message.timeLabel}</p>
    </div>
  );
}

function NoteBanner({ message }: { message: TicketMessage }) {
  return (
    <div className="flex items-start gap-2.5 rounded-2xl bg-warning-soft px-4 py-3">
      <ShieldAlert
        className="mt-0.5 size-4 shrink-0 text-warning"
        aria-hidden="true"
      />
      <div className="min-w-0">
        <p className="text-sm leading-relaxed text-ink">
          <span className="font-semibold">Internal note: </span>
          {message.text}
        </p>
        <p className="mt-1 text-xs text-ink-subtle">{message.timeLabel}</p>
      </div>
    </div>
  );
}

// Centered muted status line for system events (e.g. "Ticket escalated").
function SystemLine({ message }: { message: TicketMessage }) {
  return (
    <div className="flex justify-center">
      <p className="rounded-full bg-surface-muted px-3 py-1 text-xs text-ink-muted">
        {message.text}
      </p>
    </div>
  );
}

// Scrolling message thread. Mock agent bubbles are signed "Sarah • Support";
// live replies render under the signed-in admin's first name.
export function MessageThread({
  ticket,
  adminFirstName,
}: {
  ticket: SupportTicket;
  adminFirstName: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {ticket.messages.map((message) => {
        if (message.from === "note") {
          return <NoteBanner key={message.id} message={message} />;
        }
        if (message.from === "system") {
          return <SystemLine key={message.id} message={message} />;
        }
        if (message.from === "agent") {
          const label =
            message.id.endsWith("-live")
              ? `${adminFirstName} • Support`
              : message.sender;
          return (
            <AgentBubble
              key={message.id}
              message={message}
              adminLabel={label}
            />
          );
        }
        return <CustomerBubble key={message.id} message={message} />;
      })}
    </div>
  );
}
