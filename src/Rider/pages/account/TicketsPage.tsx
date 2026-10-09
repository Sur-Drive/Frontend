import { useMemo, useState } from "react";
import {
  ChevronLeft,
  SlidersHorizontal,
  X,
  FileEdit,
  FileSearch,
  User,
  ChevronRight,
  Loader2,
} from "lucide-react";
import RaiseTicketPage, { type NewTicket } from "./RaiseTicketPage";
import TicketDetailPage from "./TicketDetailPage";
import { useCreateTicket, useSupportTickets } from "../../hooks/useSupport";
import type { Ticket, TicketPriority } from "../../api/support";

export type { Ticket, TicketMessage } from "../../api/support";

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
          <h2 className="text-lg sm:text-xl font-bold text-[#1F2937]">Filters</h2>
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
            className="w-full rounded-xl bg-[#F1F2F5] px-3.5 py-3 text-base text-[#1F2937] outline-none"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => onChangeEnd(e.target.value)}
            className="w-full rounded-xl bg-[#F1F2F5] px-3.5 py-3 text-base text-[#1F2937] outline-none"
          />
        </div>

        <button
          type="button"
          onClick={onApply}
          className="mt-6 w-full rounded-full bg-[#6E43A3] py-3.5 text-sm sm:text-base font-bold text-white shadow-sm transition active:scale-[0.99]"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={onReset}
          className="mt-2 w-full rounded-full py-3.5 text-sm sm:text-base font-bold text-[#E8542F]"
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
            className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[ticket.status]}`}
          >
            {ticket.status}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${PRIORITY_BADGE[ticket.priority]}`}
          >
            {ticket.priority}
          </span>
        </div>
        <span className="shrink-0 text-xs sm:text-sm text-[#8B93C9]">
          #{ticket.number}
        </span>
      </div>

      <p className="mt-3 text-base sm:text-lg font-semibold text-[#1F2937]">
        {ticket.title}
      </p>
      <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#7C86C9]">
        {ticket.description}
      </p>

      <div className="my-3.5 h-px w-full bg-gray-100" />

      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs sm:text-sm text-[#4B5768]">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFE0FB] text-[#6E43A3]">
            <User size={15} />
          </span>
          Support agent
        </span>
        <button
          type="button"
          onClick={onOpen}
          className="flex items-center gap-1 rounded-full bg-[#F1F2F5] px-3.5 py-2 text-xs sm:text-sm font-semibold text-[#1F2937]"
        >
          {ticket.actionLabel}
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="my-3.5 h-px w-full bg-gray-100" />

      <div className="flex items-center justify-between text-xs sm:text-sm">
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
  const [view, setView] = useState<View>("list");
  const [selected, setSelected] = useState<Ticket | null>(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [status, setStatus] = useState<StatusFilter>("All");
  const [priority, setPriority] = useState<PriorityFilter>("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedStatus, setAppliedStatus] = useState<StatusFilter>("All");
  const [appliedPriority, setAppliedPriority] = useState<PriorityFilter>("All");
  const [appliedStart, setAppliedStart] = useState("");
  const [appliedEnd, setAppliedEnd] = useState("");

  const filtersActive =
    appliedStatus !== "All" || appliedPriority !== "All" || !!appliedStart || !!appliedEnd;

  // Status is filtered by the API; priority and dates are filtered here.
  const list = useSupportTickets({
    status: appliedStatus === "All" ? undefined : (appliedStatus.toLowerCase() as "open" | "closed"),
    sort: "recent",
  });
  const create = useCreateTicket();

  const filtered = useMemo(() => {
    const from = appliedStart ? new Date(`${appliedStart}T00:00:00`).getTime() : null;
    const to = appliedEnd ? new Date(`${appliedEnd}T23:59:59`).getTime() : null;
    return (list.data ?? []).filter((t) => {
      if (appliedPriority !== "All" && t.priority !== appliedPriority) return false;
      const at = t.createdAt ? new Date(t.createdAt).getTime() : null;
      if (at !== null && from !== null && at < from) return false;
      if (at !== null && to !== null && at > to) return false;
      return true;
    });
  }, [list.data, appliedPriority, appliedStart, appliedEnd]);

  // Keep the open ticket in sync with the refreshed list (status, unread...).
  const live = selected ? (list.data ?? []).find((t) => t.id === selected.id) ?? selected : null;

  if (view === "raise") {
    return (
      <RaiseTicketPage
        onBack={() => setView("list")}
        submitting={create.isPending}
        serverError={create.error ? (create.error as Error).message : ""}
        onSubmit={async (n: NewTicket) => {
          try {
            const created = await create.mutateAsync({
              rideId: n.rideId,
              subject: n.summary,
              description: n.details || n.summary,
              priority: n.priority.toLowerCase() as TicketPriority,
            });
            setSelected(created.id ? created : null);
            setView("list");
          } catch {
            /* the error is shown on the form */
          }
        }}
      />
    );
  }

  if (live) {
    return <TicketDetailPage ticket={live} onBack={() => setSelected(null)} />;
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

          <h1 className="mt-6 text-xl sm:text-2xl font-bold text-[#1F2937]">
            Tickets
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-[#9AA5B8]">
            Track issues, reopen cases, and raise new help requests.
          </p>

          {list.isLoading ? (
            <div className="mt-16 flex justify-center">
              <Loader2 className="animate-spin text-[#6E43A3]" />
            </div>
          ) : list.isError ? (
            <div className="mt-16 text-center">
              <p className="text-sm font-semibold text-[#E53935]">
                {(list.error as Error)?.message ?? "Could not load tickets"}
              </p>
              <button
                type="button"
                onClick={() => list.refetch()}
                className="mt-3 rounded-full bg-[#F1F2F5] px-4 py-2 text-sm font-semibold text-[#1F2937]"
              >
                Try again
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="mt-16 flex flex-col items-center text-center">
              {filtersActive ? (
                <>
                  <span className="flex h-24 w-24 items-center justify-center rounded-full bg-[#F3EAFB]">
                    <FileSearch size={40} className="text-[#9B7CC9]" />
                  </span>
                  <p className="mt-5 text-base sm:text-lg font-bold text-[#1F2937]">
                    No tickets found
                  </p>
                  <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-[#9AA5B8]">
                    We couldn't find any tickets matching this filter. Try
                    another status or raise a new request.
                  </p>
                  <span className="mt-4 rounded-full bg-[#F1F2F5] px-4 py-2 text-xs sm:text-sm text-[#4B5768]">
                    Tip: Clear filters to see all tickets
                  </span>
                </>
              ) : (
                <>
                  <span className="flex h-24 w-24 items-center justify-center rounded-full bg-[#F3EAFB]">
                    <FileEdit size={40} className="text-[#9B7CC9]" />
                  </span>
                  <p className="mt-5 text-base sm:text-lg font-bold text-[#1F2937]">
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
                <TicketRow key={t.id} ticket={t} onOpen={() => setSelected(t)} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-[calc(env(safe-area-inset-bottom,0px)+20px)] pt-3">
        <div className="mx-auto w-full max-w-xl">
          <button
            type="button"
            onClick={() => {
              create.reset();
              setView("raise");
            }}
            className="h-14 w-full rounded-2xl bg-[#6E43A3] text-base sm:text-lg font-semibold text-white shadow-lg shadow-[#6E43A3]/30 transition active:scale-[0.99]"
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
          setAppliedStart(startDate);
          setAppliedEnd(endDate);
          setFilterOpen(false);
        }}
        onReset={() => {
          setStatus("All");
          setPriority("All");
          setStartDate("");
          setEndDate("");
          setAppliedStatus("All");
          setAppliedPriority("All");
          setAppliedStart("");
          setAppliedEnd("");
        }}
        onClose={() => setFilterOpen(false)}
      />
    </div>
  );
}
