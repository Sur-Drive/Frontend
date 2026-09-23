import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  MessageSquare,
  FileEdit,
  PhoneCall,
  Copy,
  Check,
} from "lucide-react";
import ArticlesPage from "./ArticlesPage";
import LiveChatPage from "./LiveChatPage";
import TicketsPage from "./TicketsPage";

type View = "home" | "articles" | "live-chat" | "tickets";

const CONTACT = {
  phone: "+234 800 SURDRIVE",
  email: "+234 800 SURDRIVE",
};

function SupportRow({
  icon,
  title,
  subtitle,
  onClick,
  trailing,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3.5 py-4 text-left"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAFB]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[17px] font-medium text-[#1F2937]">{title}</p>
        <p className="mt-0.5 truncate text-[14px] text-[#8B93C9]">
          {subtitle}
        </p>
      </div>
      {trailing ?? (
        <ChevronRight size={18} className="shrink-0 text-[#C7CCD6]" />
      )}
    </button>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(value).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      aria-label="Copy"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#9AA5B8]"
    >
      {copied ? (
        <Check size={17} className="text-[#1E9E56]" />
      ) : (
        <Copy size={17} />
      )}
    </button>
  );
}

export default function SupportPage({ onBack }: { onBack: () => void }) {
  const [view, setView] = useState<View>("home");

  if (view === "articles") {
    return <ArticlesPage onBack={() => setView("home")} />;
  }

  if (view === "live-chat") {
    return <LiveChatPage onBack={() => setView("home")} />;
  }

  if (view === "tickets") {
    return <TicketsPage onBack={() => setView("home")} />;
  }

  return (
    <div className="font-outfit flex h-full min-h-0 w-full flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-10 pt-4">
        <div className="mx-auto w-full max-w-xl">
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-50 shadow-md"
          >
            <ChevronLeft size={22} className="text-[#1F2937]" />
          </button>

          <h1 className="mt-6 text-[28px] font-bold text-[#1F2937]">
            Support
          </h1>
          <p className="mt-1.5 text-base text-[#9AA5B8]">
            How can we help you?
          </p>

          <div className="mt-6 divide-y divide-gray-100 rounded-3xl border border-gray-100 px-4 shadow-sm">
            <SupportRow
              icon={<FileText size={19} className="text-[#6E43A3]" />}
              title="Articles"
              subtitle="Browse through our  support articles"
              onClick={() => setView("articles")}
            />
            <SupportRow
              icon={<MessageSquare size={19} className="text-[#6E43A3]" />}
              title="Live Chat"
              subtitle="Chat with our support team"
              onClick={() => setView("live-chat")}
            />
            <SupportRow
              icon={<FileEdit size={19} className="text-[#6E43A3]" />}
              title="Tickets"
              subtitle="See the status of every ticket raised here"
              onClick={() => setView("tickets")}
            />
            <SupportRow
              icon={<PhoneCall size={19} className="text-[#6E43A3]" />}
              title="Call Us"
              subtitle={CONTACT.phone}
              trailing={<CopyButton value={CONTACT.phone} />}
            />
            <SupportRow
              icon={<PhoneCall size={19} className="text-[#6E43A3]" />}
              title="Email"
              subtitle={CONTACT.email}
              trailing={<CopyButton value={CONTACT.email} />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
