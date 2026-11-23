import { Button } from "@/components/ui/Button";
import type { SupportTicket } from "@/types/trust";
import { ticketDisabledReason } from "./TicketConversation";
import type { TicketActionId } from "./TicketConversation";

const ACTIONS: { id: TicketActionId; label: string }[] = [
  { id: "assign", label: "Assign" },
  { id: "escalate", label: "Escalate" },
  { id: "resolve", label: "Resolve" },
];

// Assign (outline), Escalate (red solid), Resolve (primary). Disabled actions
// render wrapped in a tooltip span explaining why.
export function TicketActionButtons({
  ticket,
  onRequestAction,
}: {
  ticket: SupportTicket;
  onRequestAction: (action: TicketActionId) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {ACTIONS.map((item) => {
        const reason = ticketDisabledReason(ticket, item.id);
        const variant =
          item.id === "escalate"
            ? "danger"
            : item.id === "resolve"
              ? "primary"
              : "secondary";
        if (reason) {
          return (
            <span key={item.id} title={reason}>
              <Button
                variant={variant}
                disabled
                className="pointer-events-none h-10! px-4!"
              >
                {item.label}
              </Button>
            </span>
          );
        }
        return (
          <Button
            key={item.id}
            variant={variant}
            onClick={() => onRequestAction(item.id)}
            className="h-10! px-4!"
          >
            {item.label}
          </Button>
        );
      })}
    </div>
  );
}
