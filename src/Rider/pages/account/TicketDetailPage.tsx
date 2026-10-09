import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  Camera,
  Paperclip,
  Send,
  CheckCircle2,
  RotateCcw,
  Loader2,
  FileText,
  AlertCircle,
} from "lucide-react";
import type { Ticket, TicketMessage } from "../../api/support";
import { useTicketChat } from "../../hooks/useTicketChat";

const STATUS_BADGE: Record<Ticket["status"], string> = {
  Open: "bg-[#EFE0FB] text-[#6E43A3]",
  Closed: "bg-[#DCF5E4] text-[#1E9E56]",
};

const PRIORITY_BADGE: Record<Ticket["priority"], string> = {
  Low: "bg-gray-100 text-gray-600",
  Medium: "bg-[#FDF1DC] text-[#C98A1F]",
  High: "bg-[#FCE4E4] text-[#E8542F]",
};

const DOC_ACCEPT =
  ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,audio/*";

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "SA";

const fmtSize = (n: number) =>
  n >= 1024 * 1024
    ? `${(n / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(n / 1024))} KB`;

function Attachment({ m, mine }: { m: TicketMessage; mine: boolean }) {
  const a = m.attachment;
  if (!a) return null;
  if (a.kind === "image") {
    return (
      <a href={a.url} target="_blank" rel="noreferrer">
        <img
          src={a.thumbnailUrl ?? a.url}
          alt={a.name}
          className={`mb-1 max-h-60 max-w-full rounded-2xl object-cover ${mine ? "rounded-tr-sm" : ""}`}
        />
      </a>
    );
  }
  if (a.kind === "audio") {
    return (
      <audio controls preload="none" src={a.url} className="mb-1 max-w-full" />
    );
  }
  return (
    <a
      href={a.url}
      target="_blank"
      rel="noreferrer"
      className="mb-1 flex max-w-full items-center gap-2 rounded-2xl bg-[#F3EAFB] px-3 py-2 text-[13px] text-[#1F2937]"
    >
      <FileText size={18} className="shrink-0 text-[#6E43A3]" />
      <span className="min-w-0 truncate">{a.name}</span>
      <span className="shrink-0 text-[11px] text-[#8B93C9]">{fmtSize(a.size)}</span>
    </a>
  );
}

/**
 * Realtime support chat for one ticket (REST history + Socket.IO /support).
 * `live` renders the "Live Chat" header (agent avatar + name) instead of the ticket number.
 */
export default function TicketDetailPage({
  ticket: initial,
  onBack,
  live = false,
}: {
  ticket: Ticket;
  onBack: () => void;
  live?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const chat = useTicketChat(initial.id);

  const ticket = chat.ticket ?? initial;
  const messages = chat.messages;
  const perms = chat.permissions;
  const canReply = perms ? perms.canReply : ticket.status !== "Closed";
  const canResolve = perms ? perms.canResolve : ticket.status !== "Closed";
  const canReopen = perms ? perms.canReopen : false;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, chat.typing]);

  // Newest of my messages the agent has read.
  const seenId = (() => {
    if (!chat.readAt) return undefined;
    const mine = messages.filter((m) => m.sender === "user" && !m.status);
    for (let i = mine.length - 1; i >= 0; i--) {
      if (mine[i].createdAt <= chat.readAt) return mine[i].id;
    }
    return undefined;
  })();

  const submit = () => {
    if (chat.send(draft)) setDraft("");
  };

  const agentName = ticket.agentName ?? "Support team";

  return (
    <div className="font-outfit flex h-full min-h-0 w-full flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-4">
        <div className="mx-auto w-full max-w-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-50 shadow-md"
              >
                <ChevronLeft size={22} className="text-[#1F2937]" />
              </button>
              {live ? (
                <>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6E43A3] text-[13px] sm:text-sm font-bold text-white">
                    {initialsOf(agentName)}
                  </span>
                  <div>
                    <p className="text-[15px] sm:text-[17px] font-semibold text-[#1F2937]">
                      {agentName}
                    </p>
                    <p className="text-[12px] sm:text-[13.5px] text-[#8B93C9]">
                      {chat.typing
                        ? "typing…"
                        : chat.connected
                          ? "Support agent"
                          : "Connecting…"}
                    </p>
                  </div>
                </>
              ) : (
                <div>
                  <p className="text-[15px] sm:text-[17px] font-bold text-[#1F2937]">
                    #{ticket.number}
                  </p>
                  <p className="text-[12px] sm:text-[13.5px] text-[#6E43A3]">
                    {ticket.createdLabel}
                  </p>
                </div>
              )}
            </div>
            <div className="mt-1 flex shrink-0 items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-[12px] sm:text-[13px] font-semibold ${STATUS_BADGE[ticket.status]}`}
              >
                {ticket.status}
              </span>
              {!live && (
                <span
                  className={`rounded-full px-3 py-1 text-[12px] sm:text-[13px] font-semibold ${PRIORITY_BADGE[ticket.priority]}`}
                >
                  {ticket.priority}
                </span>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-5 pb-6">
            {chat.loading && (
              <div className="flex justify-center py-6">
                <Loader2 className="animate-spin text-[#6E43A3]" />
              </div>
            )}
            {chat.loadError && (
              <div className="text-center">
                <p className="text-sm font-semibold text-[#E53935]">
                  {chat.loadError}
                </p>
                <button
                  type="button"
                  onClick={chat.reload}
                  className="mt-2 text-sm font-semibold text-[#6E43A3]"
                >
                  Try again
                </button>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id}>
                {m.sender === "system" ? (
                  <p className="text-center text-[12.5px] text-[#9AA5B8]">
                    {m.text}
                  </p>
                ) : (
                  <>
                    <p className="mb-2 text-center text-[11.5px] sm:text-[12.5px] text-[#9AA5B8]">
                      {m.time}
                    </p>
                    {m.sender === "agent" ? (
                      <div>
                        <Attachment m={m} mine={false} />
                        {m.text && (
                          <p className="whitespace-pre-line break-words text-[13px] sm:text-[15px] leading-relaxed text-[#1F2937]">
                            {m.text}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-end">
                        <div className="flex max-w-[85%] flex-col items-end">
                          <Attachment m={m} mine />
                          {m.text && (
                            <p
                              className={`whitespace-pre-line break-words rounded-2xl rounded-tr-sm px-4 py-3 text-[13px] sm:text-[15px] leading-relaxed text-white ${
                                m.status ? "bg-[#6E43A3]/60" : "bg-[#6E43A3]"
                              }`}
                            >
                              {m.text}
                            </p>
                          )}
                        </div>
                        {m.status === "sending" && (
                          <p className="mt-1 text-[11px] text-[#9AA5B8]">Sending…</p>
                        )}
                        {m.status === "failed" && (
                          <p className="mt-1 flex items-center gap-2 text-[11.5px] text-[#E53935]">
                            <AlertCircle size={13} /> Not sent
                            <button
                              type="button"
                              onClick={() => chat.retry(m.id)}
                              className="font-semibold underline"
                            >
                              Retry
                            </button>
                            <button
                              type="button"
                              onClick={() => chat.discard(m.id)}
                              className="font-semibold text-[#9AA5B8] underline"
                            >
                              Delete
                            </button>
                          </p>
                        )}
                        {seenId === m.id && (
                          <p className="mt-1 text-[11px] text-[#9AA5B8]">Seen</p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            {chat.typing && !live && (
              <p className="text-[12.5px] italic text-[#9AA5B8]">
                Support is typing…
              </p>
            )}

            <div ref={endRef} />
          </div>
        </div>
      </div>

      <div className="px-6 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-3">
        <div className="mx-auto w-full max-w-xl">
          {chat.error && (
            <p className="mb-2 rounded-xl bg-[#FDECEC] px-3 py-2 text-center text-xs font-semibold text-[#E53935]">
              {chat.error}
            </p>
          )}

          {canResolve && canReply && (
            <div className="mb-3 flex items-center gap-3">
              <button
                type="button"
                disabled={chat.busy}
                onClick={() => {
                  if (window.confirm("Mark this ticket as resolved?")) chat.resolve();
                }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#1E9E56] py-3 text-[12.5px] sm:text-[14px] font-semibold text-[#1E9E56] disabled:opacity-60"
              >
                <CheckCircle2 size={16} /> Mark Resolved
              </button>
            </div>
          )}

          {canReply ? (
            <div className="flex items-center gap-3 rounded-full bg-[#f4f4f3] px-4 py-2.5">
              <label
                aria-label="Send a photo"
                className="relative flex shrink-0 cursor-pointer text-[#6E43A3]"
              >
                <Camera size={20} />
                <input
                  type="file"
                  accept="image/*"
                  disabled={chat.busy}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) chat.sendFile(f);
                  }}
                />
              </label>
              <label
                aria-label="Attach a file"
                className="relative flex shrink-0 cursor-pointer text-[#6E43A3]"
              >
                <Paperclip size={20} />
                <input
                  type="file"
                  accept={DOC_ACCEPT}
                  disabled={chat.busy}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) chat.sendFile(f);
                  }}
                />
              </label>
              <input
                type="text"
                value={draft}
                maxLength={2000}
                onChange={(e) => {
                  setDraft(e.target.value);
                  chat.notifyTyping();
                }}
                onBlur={chat.stopTyping}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submit();
                }}
                placeholder="Write a message"
                className="h-full w-full bg-transparent text-[13px] sm:text-[15px] text-[#1F2937] outline-none placeholder:text-gray-400"
              />
              <button
                type="button"
                onClick={submit}
                disabled={!draft.trim()}
                aria-label="Send message"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#6E43A3] disabled:opacity-40"
              >
                <Send size={19} />
              </button>
            </div>
          ) : canReopen ? (
            <button
              type="button"
              disabled={chat.busy}
              onClick={chat.reopen}
              className="flex w-full items-center justify-center gap-1.5 rounded-full border border-[#6E43A3] py-3 text-[12.5px] sm:text-[14px] font-semibold text-[#6E43A3] disabled:opacity-60"
            >
              <RotateCcw size={16} /> Reopen Ticket
            </button>
          ) : (
            <p className="rounded-2xl bg-[#F6F7F9] px-4 py-3 text-center text-[13px] text-[#6B7280]">
              This ticket has been resolved. No further actions can be taken.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
