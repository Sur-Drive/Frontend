import { useMemo, useState } from "react";
import {
  ChevronLeft,
  SlidersHorizontal,
  X,
  FileEdit,
  FileSearch,
  User,
  ChevronRight,
} from "lucide-react";
import RaiseTicketPage, { type NewTicket } from "./RaiseTicketPage";
import TicketDetailPage from "./TicketDetailPage";

export interface TicketMessage {
  id: string;
  sender: "user" | "agent" | "system";
  text: string;
  time: string;
}

export interface Ticket {
  id: string;
  number: string;
  createdLabel: string;
  title: string;
  description: string;
  status: "Open" | "Closed";
  priority: "Low" | "Medium" | "High";
  escalated?: boolean;
  actionLabel: "Reply" | "Details";
  updatedLabel: string;
  hint: string;
  messages: TicketMessage[];
}

const INITIAL_TICKETS: Ticket[] = [
  {
    id: "t1",
    number: "TR-2048",
    createdLabel: "Jan 15, 2026 at 5:20 PM",
    title: "Missing fare refund after cancelled ride",
    description:
      "Ride ID #TR-2048 was cancelled by the driver, but the refund has not appeared in my wallet yet.",
    status: "Open",
    priority: "Medium",
    actionLabel: "Reply",
    updatedLabel: "2h ago",
    hint: "Need your reply",
    messages: [
      {
        id: "t1m1",
        sender: "user",
        text: "Missing fare refund after cancelled ride.\n\nRide ID #TR-2048 was cancelled by the driver, but the refund has not appeared in my wallet yet.",
        time: "Mon, Jul 15, 5:37 AM",
      },
      {
        id: "t1m2",
        sender: "agent",
        text: "Hi there! 👋 Welcome to our support chat. How can I help you today?",
        time: "Mon, Jul 15, 5:35 AM",
      },
    ],
  },
  {
    id: "t2",
    number: "TR-2049",
    createdLabel: "Jan 10, 2026 at 11:05 AM",
    title: "Incorrect pickup address on last trip",
    description:
      "The driver arrived at the wrong entrance and I had to update the pickup point manually before the trip started.",
    status: "Closed",
    priority: "Low",
    actionLabel: "Details",
    updatedLabel: "5 days ago",
    hint: "Resolved this week",
    messages: [
      {
        id: "t2m1",
        sender: "user",
        text: "Incorrect pickup address on last trip.\n\nThe driver arrived at the wrong entrance and I had to update the pickup point manually before the trip started.",
        time: "Wed, Jul 10, 11:06 AM",
      },
      {
        id: "t2m2",
        sender: "agent",
        text: "Hi there! 👋 Welcome to our support chat. How can I help you today?",
        time: "Wed, Jul 10, 11:05 AM",
      },
      {
        id: "t2m3",
        sender: "agent",
        text: "Thanks for flagging this — we've shared it with the driver and marked this resolved.",
        time: "Wed, Jul 10, 11:20 AM",
      },
    ],
  },
];

type StatusFilter = "All" | "Open" | "Closed";
type PriorityFilter = "All" | "Low" | "Medium" | "High";
type View = "list" | "raise";

const STATUS_BADGE: Record<Ticket["status"], string> = {
  Open: "bg-[#EFE0FB] text-[#6E43A3]",
  Closed: "bg-[#DCF5E4] text-[#1E9E56]",
};

const PRIORITY_BADGE: Record<Ticket["priority"], string> = {
  Low: "bg-gray-100 text-gray-600",
  Medium: "bg-[#FDF1DC] text-[#C98A1F]",
  High: "bg-[#FCE4E4] text-[#E8542F]",
};

function FilterSheet({
  open,
  status,
  priority,
  startDate,
  endDate,
  onChangeStatus,
  onChangePriority,
  onChangeStart,
  onChangeEnd,
  onApply,
  onReset,
  onClose,
}: {
  open: boolean;
  status: StatusFilter;
  priority: PriorityFilter;
  startDate: string;
  endDate: string;
  onChangeStatus: (s: StatusFilter) => void;
  onChangePriority: (p: PriorityFilter) => void;
  onChangeStart: (v: string) => void;
  onChangeEnd: (v: string) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  const statusPills: StatusFilter[] = ["All", "Open", "Closed"];
  const priorityPills: PriorityFilter[] = ["All", "Low", "Medium", "High"];

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-t-[28px] bg-white px-5 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] pt-5 shadow-2xl sm:max-w-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1F2937]">Filters</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-[#4B5768]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="my-4 h-px w-full bg-gray-100" />

        <p className="mb-2 text-sm font-semibold text-[#1F2937]">Status</p>
        <div className="flex flex-wrap gap-2">
          {statusPills.map((p) => {
            const active = status === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onChangeStatus(p)}
                className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-[#6E43A3] text-white"
                    : "bg-[#F1F2F5] text-[#4B5768]"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <p className="mb-2 mt-5 text-sm font-semibold text-[#1F2937]">
          Priority
        </p>
        <div className="flex flex-wrap gap-2">
          {priorityPills.map((p) => {
            const active = priority === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onChangePriority(p)}
                className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-[#6E43A3] text-white"
                    : "bg-[#F1F2F5] text-[#4B5768]"
                }`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <p className="mb-2 mt-5 text-sm font-semibold text-[#1F2937]">
          Custom Dates
        </p>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            value={startDate}
            onChange={(e) => onChangeStart(e.target.value)}
            className="w-full rounded-xl bg-[#F1F2F5] px-3.5 py-3 text-sm text-[#1F2937] outline-none"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => onChangeEnd(e.target.value)}
            className="w-full rounded-xl bg-[#F1F2F5] px-3.5 py-3 text-sm text-[#1F2937] outline-none"
          />
        </div>

        <button
          type="button"
          onClick={onApply}
          className="mt-6 w-full rounded-full bg-[#6E43A3] py-3.5 text-base font-bold text-white shadow-sm transition active:scale-[0.99]"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={onReset}
          className="mt-2 w-full rounded-full py-3.5 text-base font-bold text-[#E8542F]"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function TicketRow({
  ticket,
  onOpen,
}: {
  ticket: Ticket;
  onOpen: () => void;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-[12.5px] font-semibold ${STATUS_BADGE[ticket.status]}`}
          >
            {ticket.status}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-[12.5px] font-semibold ${PRIORITY_BADGE[ticket.priority]}`}
          >
            {ticket.priority}
          </span>
        </div>
        <span className="shrink-0 text-[13px] text-[#8B93C9]">
          #{ticket.number}
        </span>
      </div>

      <p className="mt-3 text-[17px] font-semibold text-[#1F2937]">
        {ticket.title}
      </p>
      <p className="mt-1.5 text-[14px] leading-relaxed text-[#7C86C9]">
        {ticket.description}
      </p>

      <div className="my-3.5 h-px w-full bg-gray-100" />

      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[14px] text-[#4B5768]">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFE0FB] text-[#6E43A3]">
            <User size={15} />
          </span>
          Support agent
        </span>
        <button
          type="button"
          onClick={onOpen}
          className="flex items-center gap-1 rounded-full bg-[#F1F2F5] px-3.5 py-2 text-[13.5px] font-semibold text-[#1F2937]"
        >
          {ticket.actionLabel}
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="my-3.5 h-px w-full bg-gray-100" />

      <div className="flex items-center justify-between text-[13px]">
        <span className="text-[#9AA5B8]">{ticket.updatedLabel}</span>
        <span
          className={
            ticket.status === "Closed"
              ? "text-[#9AA5B8]"
              : "font-medium text-[#E8542F]"
          }
        >
          {ticket.hint}
        </span>
      </div>
    </div>
  );
}

export default function TicketsPage({ onBack }: { onBack: () => void }) {
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS);
  const [view, setView] = useState<View>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [status, setStatus] = useState<StatusFilter>("All");
  const [priority, setPriority] = useState<PriorityFilter>("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedStatus, setAppliedStatus] = useState<StatusFilter>("All");
  const [appliedPriority, setAppliedPriority] =
    useState<PriorityFilter>("All");

  const filtersActive = appliedStatus !== "All" || appliedPriority !== "All";

  const filtered = useMemo(
    () =>
      tickets.filter((t) => {
        if (appliedStatus !== "All" && t.status !== appliedStatus)
          return false;
        if (appliedPriority !== "All" && t.priority !== appliedPriority)
          return false;
        return true;
      }),
    [tickets, appliedStatus, appliedPriority],
  );

  const selected = tickets.find((t) => t.id === selectedId) || null;

  const updateTicket = (updated: Ticket) => {
    setTickets((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const createTicket = (newTicket: NewTicket) => {
    const number = `TR-${2050 + tickets.length}`;
    const created: Ticket = {
      id: `${Date.now()}`,
      number,
      createdLabel: new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
      title: newTicket.summary,
      description: newTicket.details || "No further details provided.",
      status: "Open",
      priority: (newTicket.priority || "Medium") as Ticket["priority"],
      actionLabel: "Reply",
      updatedLabel: "Just now",
      hint: "Need your reply",
      messages: [
        {
          id: `${Date.now()}-1`,
          sender: "user",
          text: `${newTicket.summary}${
            newTicket.details ? `\n\n${newTicket.details}` : ""
          }`,
          time: "Just now",
        },
        {
          id: `${Date.now()}-2`,
          sender: "agent",
          text: "Hi there! 👋 Welcome to our support chat. How can I help you today?",
          time: "Just now",
        },
      ],
    };
    setTickets((prev) => [created, ...prev]);
    setSelectedId(created.id);
    setView("list");
  };

  if (view === "raise") {
    return (
      <RaiseTicketPage
        onBack={() => setView("list")}
        onSubmit={createTicket}
      />
    );
  }

  if (selected) {
    return (
      <TicketDetailPage
        ticket={selected}
        onBack={() => setSelectedId(null)}
        onUpdate={updateTicket}
      />
    );
  }

  return (
    <div className="font-outfit flex h-full min-h-0 w-full flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-4">
        <div className="mx-auto w-full max-w-xl">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 shadow-md"
            >
              <ChevronLeft size={22} className="text-[#1F2937]" />
            </button>
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 shadow-md"
            >
              <SlidersHorizontal size={18} className="text-[#1F2937]" />
              {filtersActive && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#6E43A3]" />
              )}
            </button>
          </div>

          <h1 className="mt-6 text-[28px] font-bold text-[#1F2937]">
            Tickets
          </h1>
          <p className="mt-1.5 text-base text-[#9AA5B8]">
            Track issues, reopen cases, and raise new help requests.
          </p>

          {filtered.length === 0 ? (
            <div className="mt-16 flex flex-col items-center text-center">
              {filtersActive ? (
                <>
                  <span className="flex h-24 w-24 items-center justify-center rounded-full bg-[#F3EAFB]">
                    <FileSearch size={40} className="text-[#9B7CC9]" />
                  </span>
                  <p className="mt-5 text-lg font-bold text-[#1F2937]">
                    No tickets found
                  </p>
                  <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-[#9AA5B8]">
                    We couldn't find any tickets matching this filter. Try
                    another status or raise a new request.
                  </p>
                  <span className="mt-4 rounded-full bg-[#F1F2F5] px-4 py-2 text-[13px] text-[#4B5768]">
                    Tip: Clear filters to see all tickets
                  </span>
                </>
              ) : (
                <>
                  <span className="flex h-24 w-24 items-center justify-center rounded-full bg-[#F3EAFB]">
                    <FileEdit size={40} className="text-[#9B7CC9]" />
                  </span>
                  <p className="mt-5 text-lg font-bold text-[#1F2937]">
                    No Open ticket
                  </p>
                  <p className="mt-1.5 text-sm text-[#9AA5B8]">
                    Create a ticket when you need help
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-4 pb-4">
              {filtered.map((t) => (
                <TicketRow
                  key={t.id}
                  ticket={t}
                  onOpen={() => setSelectedId(t.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] pt-3">
        <div className="mx-auto w-full max-w-xl">
          <button
            type="button"
            onClick={() => setView("raise")}
            className="h-14 w-full rounded-2xl bg-[#6E43A3] text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99]"
          >
            Raise a ticket
          </button>
        </div>
      </div>

      <FilterSheet
        open={filterOpen}
        status={status}
        priority={priority}
        startDate={startDate}
        endDate={endDate}
        onChangeStatus={setStatus}
        onChangePriority={setPriority}
        onChangeStart={setStartDate}
        onChangeEnd={setEndDate}
        onApply={() => {
          setAppliedStatus(status);
          setAppliedPriority(priority);
          setFilterOpen(false);
        }}
        onReset={() => {
          setStatus("All");
          setPriority("All");
          setStartDate("");
          setEndDate("");
          setAppliedStatus("All");
          setAppliedPriority("All");
        }}
        onClose={() => setFilterOpen(false)}
      />
    </div>
  );
}
