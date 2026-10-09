import { useState } from "react";
import { ChevronLeft, Send, Loader2 } from "lucide-react";
import type { Ticket } from "../../api/support";
import { useCreateTicket, useSupportTickets } from "../../hooks/useSupport";
import TicketDetailPage from "./TicketDetailPage";

/** Live chats are support tickets with this subject, so we can resume the same one. */
const LIVE_SUBJECT = "Live chat";

/**
 * Support > Live Chat, backed by the real support API:
 *  - resumes your open "Live chat" ticket if you have one (GET /support/tickets?status=open)
 *  - otherwise your first message opens one (POST /support/tickets)
 *  - the conversation itself is the realtime ticket chat (REST + Socket.IO /support)
 */
export default function LiveChatPage({ onBack }: { onBack: () => void }) {
  const open = useSupportTickets({ status: "open" });
  const create = useCreateTicket();
  const [draft, setDraft] = useState("");
  const [started, setStarted] = useState<Ticket | null>(null);
  const [error, setError] = useState("");

  const existing = open.data?.find((t) => t.title === LIVE_SUBJECT);
  const active = started ?? existing ?? null;

  if (active) {
    return <TicketDetailPage ticket={active} onBack={onBack} live />;
  }

  const start = async () => {
    const text = draft.trim();
    if (!text || create.isPending) return;
    setError("");
    try {
      const t = await create.mutateAsync({
        subject: LIVE_SUBJECT,
        description: text,
        priority: "medium",
      });
      if (t.id) setStarted(t);
    } catch (e: any) {
      setError(
        e?.code === "SUPPORT_TICKET_LIMIT_REACHED"
          ? "You've reached the limit of open tickets. Resolve one from Tickets, then try again."
          : (e?.message ?? "Could not start the chat"),
      );
    }
  };

  return (
    <div className="font-outfit flex h-full min-h-0 w-full flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-4">
        <div className="mx-auto w-full max-w-xl">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-50 shadow-md"
            >
              <ChevronLeft size={22} className="text-[#1F2937]" />
            </button>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6E43A3] text-[13px] sm:text-sm font-bold text-white">
              SD
            </span>
            <div>
              <p className="text-[15px] sm:text-[17px] font-semibold text-[#1F2937]">
                Support team
              </p>
              <p className="text-[12px] sm:text-[13.5px] text-[#8B93C9]">
                Support agent
              </p>
            </div>
          </div>

          <div className="mt-6">
            {open.isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="animate-spin text-[#6E43A3]" />
              </div>
            ) : (
              <p className="whitespace-pre-line text-[13px] sm:text-[15px] leading-relaxed text-[#1F2937]">
                {"Hi there.\nWhat brings you here today?"}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-3">
        <div className="mx-auto w-full max-w-xl">
          {error && (
            <p className="mb-2 rounded-xl bg-[#FDECEC] px-3 py-2 text-center text-xs font-semibold text-[#E53935]">
              {error}
            </p>
          )}
          <div className="flex items-center gap-3 rounded-full bg-[#f4f4f3] px-4 py-2.5">
            <input
              type="text"
              value={draft}
              maxLength={2000}
              disabled={open.isLoading}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") start();
              }}
              placeholder="Write a message"
              className="h-full w-full bg-transparent text-[13px] sm:text-[15px] text-[#1F2937] outline-none placeholder:text-gray-400"
            />
            <button
              type="button"
              onClick={start}
              disabled={!draft.trim() || create.isPending}
              aria-label="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#6E43A3] disabled:opacity-40"
            >
              {create.isPending ? (
                <Loader2 size={19} className="animate-spin" />
              ) : (
                <Send size={19} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
