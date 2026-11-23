import Link from "next/link";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { StatusPill } from "@/components/ui/StatusPill";
import { TICKET_STATUS_TONE } from "@/types/trust";
import type { SupportTicket } from "@/types/trust";
import { profileHref } from "./TicketConversation";

// Requester row: avatar + bold name + muted meta, purple profile link, a
// vertical divider, then the RELATED RIDE label + ride id.
export function TicketRequesterRow({ ticket }: { ticket: SupportTicket }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border px-4 py-3 sm:px-5">
      <InitialsAvatar
        initials={ticket.requester.initials}
        tone={ticket.requester.tone}
      />
      <div className="min-w-0 flex-1 basis-40">
        <p className="truncate text-sm font-semibold text-ink">
          {ticket.requester.name}
        </p>
        <p className="truncate text-xs text-ink-muted">{ticket.requesterMeta}</p>
      </div>
      <Link
        href={profileHref(ticket)}
        className="shrink-0 text-sm font-semibold text-brand hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        View profile
      </Link>
      <span aria-hidden="true" className="h-8 w-px shrink-0 bg-border" />
      <div className="min-w-0 shrink-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
          Related ride
        </p>
        <p className="truncate text-sm font-semibold text-ink">
          {ticket.rideId ?? "—"}
        </p>
      </div>
      <StatusPill tone={TICKET_STATUS_TONE[ticket.status]} label={ticket.status} />
    </div>
  );
}
