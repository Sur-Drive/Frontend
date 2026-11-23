"use client";

import { useMemo, useState } from "react";
import { Download, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import type { TabItem } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/admin/PageHeader";
import { useAdminUser } from "@/components/admin/AdminUserContext";
import { downloadCsv, toCsv } from "@/lib/csv";
import { useConfirmedExport } from "@/lib/hooks/useConfirmedExport";
import { runEntityAction } from "@/lib/actions";
import { entityActionMessage } from "@/lib/toast-messages";
import { TICKET_AGENTS } from "@/types/trust";
import type { SupportTicket } from "@/types/trust";
import { TicketListItem } from "./TicketParts";
import {
  LIVE_TIME_LABEL,
  ticketActionDialogTitle,
  TicketConversation,
} from "./TicketConversation";
import type { TicketActionId } from "./TicketConversation";
import { NewTicketDrawer } from "./NewTicketDrawer";

const CONFIRM_DESCRIPTION =
  "Please confirm you want to continue.";

const TABS: TabItem[] = [
  { id: "open", label: "Open" },
  { id: "mine", label: "Mine" },
  { id: "urgent", label: "Urgent" },
];

// Tab id -> predicate. "open" is every unresolved ticket; "mine" is tickets
// assigned to the signed-in admin; "urgent" is open urgent tickets.
function tabMatches(
  tabId: string,
  ticket: SupportTicket,
  adminName: string,
): boolean {
  if (tabId === "mine") return ticket.assignee === adminName;
  if (tabId === "urgent") {
    return ticket.status === "Open" && ticket.priority === "Urgent";
  }
  return ticket.status === "Open";
}

function ticketMatchesQuery(ticket: SupportTicket, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (needle === "") return true;
  return [ticket.id, ticket.subject, ticket.requester.name, ticket.category]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

const CSV_COLUMNS = [
  "Ticket ID",
  "Subject",
  "Category",
  "Requester",
  "Related ride",
  "Priority",
  "Status",
  "Assignee",
  "Opened",
];

interface PendingAction {
  ticketId: string;
  action: TicketActionId;
}

export function SupportCentreView({
  tickets: initialTickets,
}: {
  tickets: SupportTicket[];
}) {
  const toast = useToast();
  const { user } = useAdminUser();
  const adminName = `${user.firstName} ${user.lastName}`;
  const confirmedExport = useConfirmedExport();

  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
  const [tab, setTab] = useState("open");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialTickets[0]?.id ?? null,
  );
  // Below lg only one card shows at a time; opening a ticket focuses the
  // conversation with a "Back to inbox" return.
  const [focused, setFocused] = useState(false);

  // Shared confirm for Assign / Escalate / Resolve.
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [assignee, setAssignee] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // New-ticket drawer + its confirm step. The drawer stays open (draft intact)
  // while the confirm dialog is up; cancel returns to it untouched.
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingCreate, setPendingCreate] = useState<SupportTicket | null>(null);
  const [createResetKey, setCreateResetKey] = useState(0);

  const filtered = useMemo(
    () =>
      tickets.filter(
        (ticket) =>
          tabMatches(tab, ticket, adminName) &&
          ticketMatchesQuery(ticket, query),
      ),
    [tickets, tab, query, adminName],
  );

  const selected =
    tickets.find((ticket) => ticket.id === selectedId) ?? filtered[0] ?? null;

  function handleExport() {
    const rows = filtered.map((ticket) => [
      ticket.id,
      ticket.subject,
      ticket.category,
      ticket.requester.name,
      ticket.requesterType,
      ticket.rideId ?? "—",
      ticket.priority,
      ticket.status,
      ticket.assignee ?? "Unassigned",
      ticket.openedLabel,
    ]);
    downloadCsv("support-tickets.csv", toCsv(CSV_COLUMNS, rows));
  }

  function handleSendReply(ticketId: string, text: string) {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              messages: [
                ...ticket.messages,
                {
                  id: `${ticketId}-reply-live`,
                  from: "agent" as const,
                  sender: `${user.firstName} • Support`,
                  text,
                  timeLabel: LIVE_TIME_LABEL,
                },
              ],
            }
          : ticket,
      ),
    );
    toast.success({
      title: "Reply sent",
      description: `Your reply was sent on ${ticketId}.`,
    });
  }

  function handleAddNote(ticketId: string, text: string) {
    setTickets((current) =>
      current.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              messages: [
                ...ticket.messages,
                {
                  id: `${ticketId}-note-live`,
                  from: "note" as const,
                  sender: "Internal note",
                  text,
                  timeLabel: LIVE_TIME_LABEL,
                },
              ],
            }
          : ticket,
      ),
    );
    toast.success({
      title: "Internal note added",
      description: `Your note was added to ${ticketId}.`,
    });
  }

  const pendingTicket = pending
    ? (tickets.find((ticket) => ticket.id === pending.ticketId) ?? null)
    : null;

  function handleSelect(ticketId: string) {
    setSelectedId(ticketId);
    setFocused(true);
  }

  function requestAction(ticketId: string, action: TicketActionId) {
    const ticket = tickets.find((item) => item.id === ticketId);
    if (!ticket) return;
    setAssignee(ticket.assignee ?? "");
    setAssignError(null);
    setPending({ ticketId, action });
  }

  function cancelConfirm() {
    if (loading) return;
    setPending(null);
    setAssignee("");
    setAssignError(null);
  }

  async function confirmPending(note: string) {
    if (!pending || !pendingTicket) return;
    if (pending.action === "assign" && assignee === "") {
      setAssignError("Select an agent.");
      return;
    }
    setLoading(true);
    try {
      await runEntityAction({
        entity: "supportTicket",
        id: pending.ticketId,
        action: pending.action,
        note,
      });
      const message = entityActionMessage(
        "supportTicket",
        pending.action,
        pending.ticketId,
      );
      if (pending.action === "assign") {
        const name = assignee;
        setTickets((current) =>
          current.map((ticket) =>
            ticket.id === pending.ticketId
              ? { ...ticket, assignee: name }
              : ticket,
          ),
        );
      } else if (pending.action === "escalate") {
        setTickets((current) =>
          current.map((ticket) =>
            ticket.id === pending.ticketId
              ? {
                  ...ticket,
                  priority: "Urgent" as const,
                  escalated: true,
                  messages: [
                    ...ticket.messages,
                    {
                      id: `${ticket.id}-escalated-system`,
                      from: "system" as const,
                      sender: "System",
                      text: "Ticket escalated",
                      timeLabel: LIVE_TIME_LABEL,
                    },
                  ],
                }
              : ticket,
          ),
        );
      } else {
        const currentTab = tab;
        const currentQuery = query;
        const currentAdmin = adminName;
        setTickets((current) => {
          const updated = current.map((ticket) =>
            ticket.id === pending.ticketId
              ? { ...ticket, status: "Resolved" as const }
              : ticket,
          );
          const next = updated.find(
            (ticket) =>
              ticket.id !== pending.ticketId &&
              tabMatches(currentTab, ticket, currentAdmin) &&
              ticketMatchesQuery(ticket, currentQuery),
          );
          setSelectedId(next?.id ?? null);
          return updated;
        });
      }
      toast.success({ title: message.title, description: message.description });
      setPending(null);
      setAssignee("");
      setAssignError(null);
    } finally {
      setLoading(false);
    }
  }

  function handleRequestCreate(ticket: SupportTicket) {
    setPendingCreate(ticket);
  }

  function cancelCreate() {
    if (loading) return;
    // Drawer stays open with the draft intact.
    setPendingCreate(null);
  }

  async function confirmCreate() {
    if (!pendingCreate) return;
    setLoading(true);
    try {
      await runEntityAction({
        entity: "supportTicket",
        id: pendingCreate.id,
        action: "create",
        note: "",
      });
      const created = pendingCreate;
      setTickets((current) => [created, ...current]);
      setSelectedId(created.id);
      setFocused(true);
      setTab("open");
      setQuery("");
      const message = entityActionMessage(
        "supportTicket",
        "create",
        created.id,
      );
      toast.success({ title: message.title, description: message.description });
      setPendingCreate(null);
      setDrawerOpen(false);
      setCreateResetKey((key) => key + 1);
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Support Centre"
        description="Resolve passenger and driver issues from a unified inbox."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                confirmedExport.requestExport("Confirm export", handleExport)
              }
            >
              <Download className="size-4" aria-hidden="true" />
              Export
            </Button>
            <Button variant="primary" onClick={() => setDrawerOpen(true)}>
              <Plus className="size-4" aria-hidden="true" />
              New ticket
            </Button>
          </>
        }
      />

      <div className="grid min-w-0 grid-cols-1 gap-4 lg:h-[calc(100dvh-12rem)] lg:min-h-144 lg:grid-cols-[35%_1fr]">
        <Card
          className={`min-w-0 flex-col p-0! ${
            focused ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="shrink-0 border-b border-border px-4 pt-4 sm:px-5">
            <label htmlFor="ticket-search" className="sr-only">
              Search tickets
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-subtle"
                aria-hidden="true"
              />
              <input
                id="ticket-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tickets..."
                className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              />
            </div>
            <div className="mt-2">
              <Tabs tabs={TABS} value={tab} onChange={setTab} />
            </div>
          </div>
          <div className="max-h-96 min-h-0 flex-1 overflow-y-auto lg:max-h-none">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                <p className="text-sm font-semibold text-ink">
                  No tickets found
                </p>
                <p className="text-sm text-ink-muted">
                  Try a different search or tab.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map((ticket) => (
                  <TicketListItem
                    key={ticket.id}
                    ticket={ticket}
                    selected={selected?.id === ticket.id}
                    onSelect={() => handleSelect(ticket.id)}
                  />
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card
          className={`min-w-0 flex-col p-0! ${
            focused ? "flex" : "hidden lg:flex"
          }`}
        >
          {selected ? (
            <TicketConversation
              ticket={selected}
              adminFirstName={user.firstName}
              onRequestAction={(action) => requestAction(selected.id, action)}
              onSendReply={handleSendReply}
              onAddNote={handleAddNote}
              onBack={() => setFocused(false)}
            />
          ) : (
            <div className="flex min-h-80 flex-1 flex-col items-center justify-center gap-2 px-6 py-12 text-center">
              <p className="text-sm font-semibold text-ink">
                No ticket selected
              </p>
              <p className="text-sm text-ink-muted">
                Select a ticket from the inbox to view the conversation.
              </p>
            </div>
          )}
        </Card>
      </div>

      <NewTicketDrawer
        open={drawerOpen}
        existingIds={tickets.map((ticket) => ticket.id)}
        onClose={() => setDrawerOpen(false)}
        onRequestCreate={handleRequestCreate}
        resetKey={createResetKey}
      />

      <ConfirmDialog
        open={pending !== null}
        title={pending ? ticketActionDialogTitle(pending.action) : ""}
        description={CONFIRM_DESCRIPTION}
        confirmTone={pending?.action === "escalate" ? "danger" : "brand"}
        confirmLabel={
          pending?.action === "assign"
            ? "Assign ticket"
            : pending?.action === "escalate"
              ? "Escalate ticket"
              : "Resolve ticket"
        }
        noteLabel="Note"
        loading={loading}
        error={assignError}
        onConfirm={confirmPending}
        onCancel={cancelConfirm}
      >
        {pending?.action === "assign" ? (
          <div>
            <label
              htmlFor="assign-agent"
              className="text-sm font-medium text-ink"
            >
              Agent
            </label>
            <div className="mt-1.5">
              <Select
                id="assign-agent"
                label="Agent"
                value={assignee}
                onChange={(event) => {
                  setAssignee(event.target.value);
                  setAssignError(null);
                }}
              >
                <option value="">Select an agent</option>
                {TICKET_AGENTS.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={pendingCreate !== null}
        title="Confirm create ticket"
        description={CONFIRM_DESCRIPTION}
        confirmLabel="Create ticket"
        loading={loading}
        onConfirm={confirmCreate}
        onCancel={cancelCreate}
      />

      {confirmedExport.dialog}
    </div>
  );
}
