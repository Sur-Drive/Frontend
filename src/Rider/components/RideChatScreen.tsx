import { useEffect, useRef, useState } from "react";
import { ChevronLeft, PhoneCall, Loader2 } from "lucide-react";
import { useRideChat } from "../hooks/useRideChat";
import { stampLabel, type ChatMsg } from "../lib/chatMap";

const QUICK_REPLIES = ["Be there in 2 mins", "I am outside", "Okay, thanks!"];

export interface ChatPerson {
  name: string;
  initials: string;
  photo?: string;
  rating?: number;
  trips?: number;
}

const CameraIcon = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M9 3 7.17 5H4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.17L15 3H9Zm3 15a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
  </svg>
);

const SendIcon = () => (
  <svg width="17" height="17" viewBox="0 0 512 512" fill="currentColor" aria-hidden>
    <path d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480V396.4c0-4 1.5-7.8 4.2-10.7L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z" />
  </svg>
);

/**
 * Ride chat screen (Figma "chat"). Opened from the message icon on the
 * passenger card. Sizes below are the Figma sizes in px (390pt-wide frame).
 */
export default function RideChatScreen({
  rideId,
  person,
  onBack,
  onCall,
}: {
  rideId?: string;
  person: ChatPerson;
  onBack: () => void;
  onCall: () => void;
}) {
  const { messages, loading, error, sending, send, retry, sendPhoto } = useRideChat(rideId, true);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = (value = text) => {
    if (!value.trim()) return;
    send(value);
    setText("");
  };

  // The stamp shows above a message when it starts a new minute.
  const stampFor = (i: number) => {
    const cur = stampLabel(messages[i].createdAt);
    return i === 0 || stampLabel(messages[i - 1].createdAt) !== cur ? cur : null;
  };

  return (
    <div className="font-outfit absolute inset-0 z-40 flex flex-col bg-[#F8F8F8]">
      {/* ------------------------------ header ------------------------------ */}
      <header className="flex shrink-0 items-center gap-2 px-6 pb-3 pt-[max(16px,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-white shadow-[0_2px_10px_rgba(31,18,54,0.08)] active:scale-95"
        >
          <ChevronLeft size={20} strokeWidth={2.2} className="text-[#1A1A1A]" />
        </button>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#6E43A3] text-sm font-bold text-white">
          {person.photo ? (
            <img src={person.photo} alt={person.name} className="h-full w-full object-cover" />
          ) : (
            person.initials
          )}
        </div>

        <div className="min-w-0 flex-1 leading-tight">
          <div className="flex items-center gap-2">
            <p className="truncate text-base font-normal text-[#2B2B2B]">{person.name}</p>
            {person.rating !== undefined && (
              <span className="flex shrink-0 items-center gap-[3px] rounded-[3px] bg-[#FFF7DB] px-1 py-[1px] text-xs font-medium text-[#E9B21A]">
                <span className="text-xs">★</span>
                {person.rating.toFixed(1)}
              </span>
            )}
          </div>
          {person.trips !== undefined && (
            <p className="mt-0.5 text-xs text-[#6C7BA8]">{person.trips} Completed ride</p>
          )}
        </div>

        <button
          type="button"
          onClick={onCall}
          aria-label="Call"
          className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-white shadow-[0_2px_10px_rgba(31,18,54,0.08)] active:scale-95"
        >
          <PhoneCall size={18} strokeWidth={1.8} className="text-[#1A1A1A]" />
        </button>
      </header>

      {/* ----------------------------- messages ----------------------------- */}
      <main className="min-h-0 flex-1 overflow-y-auto px-4 pt-1">
        {loading && (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-[#6E43A3]" />
          </div>
        )}
        {!loading && !error && messages.length === 0 && (
          <p className="py-10 text-center text-sm text-[#9A96A8]">No messages yet. Say hello 👋</p>
        )}

        {messages.map((m, i) => (
          <Bubble key={m.id} m={m} stamp={stampFor(i)} onRetry={() => retry(m.id)} />
        ))}
        <div ref={endRef} />
      </main>

      {/* ------------------------ quick replies + input ---------------------- */}
      <footer className="shrink-0 pb-[max(28px,env(safe-area-inset-bottom))] pt-3">
        {error && (
          <p className="mx-6 mb-2 rounded-xl bg-[#FDECEC] px-3 py-2 text-center text-xs font-semibold text-[#E53935]">
            {error}
          </p>
        )}
        <div className="mb-3.5 flex gap-2 overflow-x-auto px-[18px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {QUICK_REPLIES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => submit(r)}
              className="h-[35px] shrink-0 whitespace-nowrap rounded-full border border-[#E6E6EA] bg-white px-4 text-sm font-medium text-[#1B0F3B] active:scale-95"
            >
              {r}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mx-6 flex h-[60px] items-center gap-3 rounded-full bg-white pl-5 pr-[18px] shadow-[0_22px_30px_-8px_rgba(110,67,163,0.30)]"
        >
          {/* A <label> around a visually-hidden input opens the picker on every
              browser, including installed PWAs where input.click() is blocked. */}
          <label
            aria-label="Send a photo"
            className="relative flex shrink-0 cursor-pointer items-center justify-center text-[#5E4A82]"
          >
            <CameraIcon />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) sendPhoto(f);
                e.target.value = "";
              }}
            />
          </label>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a message"
            className="min-w-0 flex-1 bg-transparent text-base text-[#2B2B2B] outline-none placeholder:text-[#B2ABC4]"
          />
          <button
            type="submit"
            aria-label="Send"
            disabled={sending}
            className="flex shrink-0 items-center justify-center text-[#5E4A82] disabled:opacity-50"
          >
            <SendIcon />
          </button>
        </form>
      </footer>
    </div>
  );
}

function Bubble({ m, stamp, onRetry }: { m: ChatMsg; stamp: string | null; onRetry: () => void }) {
  // Incoming: square bottom-left corner. Outgoing: square bottom-right corner.
  const corner = m.mine ? "rounded-br-none" : "rounded-bl-none";
  return (
    <div className="mb-4">
      {stamp && <p className="mb-[7px] text-center text-xs text-[#8F8BA0]">{stamp}</p>}
      <div className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
        {m.type === "image" ? (
          <img
            src={m.content}
            alt="Attachment"
            className={`aspect-[600/350] w-[300px] max-w-full rounded-[30px] object-cover ${corner}`}
          />
        ) : (
          <div
            className={`max-w-[300px] whitespace-pre-wrap break-words rounded-[30px] px-6 text-base leading-[21px] ${corner} ${
              m.mine ? "bg-[#6E43A3] py-6 pl-[30px] text-white" : "bg-white py-[19px] text-[#222]"
            }`}
          >
            {m.content}
          </div>
        )}
      </div>
      {m.failed && (
        <button type="button" onClick={onRetry} className="ml-auto mt-1 block text-xs font-semibold text-[#E53935]">
          Not sent. Tap to retry
        </button>
      )}
    </div>
  );
}
