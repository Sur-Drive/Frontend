import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  MessageSquare,
  FileEdit,
  PhoneCall,
  Mail,
  Copy,
  Check,
} from "lucide-react";
import ArticlesPage from "./ArticlesPage";
import LiveChatPage from "./LiveChatPage";
import TicketsPage from "./TicketsPage";
import { useUnreadTickets } from "../../hooks/useSupport";

type View = "home" | "articles" | "live-chat" | "tickets";

const CONTACT = {
  phone: "+234 800 SURDRIVE",
  email: "support@surdrive.com", // TODO: put your real support email here
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
  const clickable = !!onClick;
  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      className={`flex w-full items-center gap-3.5 py-4 text-left ${
        clickable ? "cursor-pointer" : ""
      }`}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAFB]">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] sm:text-[17px] font-medium text-[#1F2937]">
          {title}
        </p>
        <p className="mt-0.5 truncate text-[12.5px] sm:text-[14px] text-[#8B93C9]">
          {subtitle}
        </p>
      </div>
      {trailing ?? (
        <ChevronRight size={18} className="shrink-0 text-[#C7CCD6]" />
      )}
    </div>
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
  const unread = useUnreadTickets();
  const unreadCount = unread.data ?? 0;

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
    <div className="flex flex-col w-full h-full min-h-0 bg-white font-outfit">
      <div className="flex-1 min-h-0 px-6 pt-4 pb-10 overflow-y-auto">
        <div className="w-full max-w-xl mx-auto">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center justify-center rounded-full shadow-md h-11 w-11 bg-gray-50"
          >
            <ChevronLeft size={22} className="text-[#1F2937]" />
          </button>

          <h1 className="mt-6 text-[22px] sm:text-[28px] font-bold text-[#1F2937]">
            Support
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-[#9AA5B8]">
            How can we help you?
          </p>

          <div className="px-4 mt-6 border border-gray-100 divide-y divide-gray-100 shadow-sm rounded-3xl">
            <SupportRow
              icon={<FileText size={19} className="text-[#6E43A3]" />}
              title="Articles"
              subtitle="Browse through our support articles"
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
              trailing={
                <span className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6E43A3] px-1.5 text-[11px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                  <ChevronRight size={18} className="shrink-0 text-[#C7CCD6]" />
                </span>
              }
            />
            <SupportRow
              icon={<PhoneCall size={19} className="text-[#6E43A3]" />}
              title="Call Us"
              subtitle={CONTACT.phone}
              trailing={<CopyButton value={CONTACT.phone} />}
            />
            <SupportRow
              icon={<Mail size={19} className="text-[#6E43A3]" />}
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
