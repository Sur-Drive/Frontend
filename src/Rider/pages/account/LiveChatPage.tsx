import { useState } from "react";
import { ChevronLeft, Camera, Send } from "lucide-react";

interface Message {
  id: string;
  sender: "agent" | "user";
  text: string;
  time: string;
}

const AGENT = {
  name: "Harry Wilson",
  role: "Support agent",
  initials: "HW",
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: "m1",
    sender: "agent",
    text: "Hi abiodun.\nWhat brings you here today?",
    time: "Mon, Jul 15, 5:35 AM",
  },
];

export default function LiveChatPage({ onBack }: { onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}`,
        sender: "user",
        text,
        time: new Date().toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      },
    ]);
    setDraft("");
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
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6E43A3] text-sm font-bold text-white">
              {AGENT.initials}
            </span>
            <div>
              <p className="text-[17px] font-semibold text-[#1F2937]">
                {AGENT.name}
              </p>
              <p className="text-[13.5px] text-[#8B93C9]">{AGENT.role}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-5 pb-6">
            {messages.map((m) => (
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
                    <p className="max-w-[80%] whitespace-pre-line rounded-2xl rounded-tr-sm bg-[#6E43A3] px-4 py-3 text-[15px] leading-relaxed text-white">
                      {m.text}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-3">
        <div className="mx-auto flex w-full max-w-xl items-center gap-3 rounded-full bg-[#f4f4f3] px-4 py-2.5">
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
  );
}
