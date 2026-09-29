import { useState } from "react";
import {
  ChevronLeft,
  Camera,
  Send,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import type { Ticket, TicketMessage } from "./TicketsPage";

const STATUS_BADGE: Record<Ticket["status"], string> = {
  Open: "bg-[#EFE0FB] text-[#6E43A3]",
  Closed: "bg-[#DCF5E4] text-[#1E9E56]",
};

const PRIORITY_BADGE: Record<Ticket["priority"], string> = {
  Low: "bg-gray-100 text-gray-600",
  Medium: "bg-[#FDF1DC] text-[#C98A1F]",
  High: "bg-[#FCE4E4] text-[#E8542F]",
};

export default function TicketDetailPage({
  ticket,
  onBack,
  onUpdate,
}: {
  ticket: Ticket;
  onBack: () => void;
  onUpdate: (updated: Ticket) => void;
}) {
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);

  const addMessage = (msg: Omit<TicketMessage, "id">) => {
    onUpdate({
      ...ticket,
      messages: [...ticket.messages, { ...msg, id: `${Date.now()}` }],
    });
  };

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    addMessage({
      sender: "user",
      text,
      time: new Date().toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    });
    setDraft("");
  };

  const markResolved = () => {
    onUpdate({ ...ticket, status: "Closed" });
  };

  const escalate = () => {
    if (ticket.escalated) return;
    onUpdate({
      ...ticket,
      priority: "High",
      escalated: true,
      messages: [
        ...ticket.messages,
        {
          id: `${Date.now()}`,
          sender: "system",
          text: "⚠️ This ticket has been escalated for urgent attention.",
          time: "Just now",
        },
      ],
    });
    setTyping(true);
    setTimeout(() => setTyping(false), 1600);
  };

  const isClosed = ticket.status === "Closed";

  return (
    <div className="font-outfit flex h-full min-h-0 w-full flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-4">
        <div className="mx-auto w-full max-w-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={onBack}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-50 shadow-md"
              >
                <ChevronLeft size={22} className="text-[#1F2937]" />
              </button>
              <div>
                <p className="text-[17px] font-bold text-[#1F2937]">
                  #{ticket.number}
                </p>
                <p className="text-[13.5px] text-[#6E43A3]">
                  {ticket.createdLabel}
                </p>
              </div>
            </div>
            <div className="mt-1 flex shrink-0 items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-[13px] font-semibold ${STATUS_BADGE[ticket.status]}`}
              >
                {ticket.status}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-[13px] font-semibold ${PRIORITY_BADGE[ticket.priority]}`}
              >
                {ticket.priority}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-5 pb-6">
            {ticket.messages.map((m) => (
              <div key={m.id}>
                <p className="mb-2 text-center text-[12.5px] text-[#9AA5B8]">
                  {m.time}
                </p>
                {m.sender === "agent" ? (
                  <p className="whitespace-pre-line text-[15px] leading-relaxed text-[#1F2937]">
                    {m.text}
                  </p>
                ) : (
                  <div className="flex justify-end">
                    <p className="max-w-[85%] whitespace-pre-line rounded-2xl rounded-tr-sm bg-[#6E43A3] px-4 py-3 text-[15px] leading-relaxed text-white">
                      {m.text}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {typing && (
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-gray-300 [animation-delay:-0.3s]" />
                <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-gray-300 [animation-delay:-0.15s]" />
                <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-gray-300" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-3">
        <div className="mx-auto w-full max-w-xl">
          {!isClosed && (
            <div className="mb-3 flex items-center gap-3">
              <button
                type="button"
                onClick={markResolved}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#1E9E56] py-3 text-[14px] font-semibold text-[#1E9E56]"
              >
                <CheckCircle2 size={16} /> Mark Resolved
              </button>
              <button
                type="button"
                onClick={escalate}
                disabled={ticket.escalated}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full border py-3 text-[14px] font-semibold transition ${
                  ticket.escalated
                    ? "border-gray-200 text-gray-400"
                    : "border-[#E8542F] text-[#E8542F]"
                }`}
              >
                <ArrowUpRight size={16} /> Escalate Ticket
              </button>
            </div>
          )}

          <div className="flex items-center gap-3 rounded-full bg-[#f4f4f3] px-4 py-2.5">
            <Camera size={20} className="shrink-0 text-[#6E43A3]" />
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder="Write a message"
              className="h-full w-full bg-transparent text-[15px] text-[#1F2937] outline-none placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={send}
              aria-label="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#6E43A3]"
            >
              <Send size={19} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
