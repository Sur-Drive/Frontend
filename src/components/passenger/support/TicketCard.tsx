import {
  ChevronRight,
  Headphones,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import type {
  SupportTicket,
} from "../../../types/passengerSupport";

import TicketStatusBadge from "./TicketStatusBadge";

interface TicketCardProps {
  ticket: SupportTicket;

  onClick: () => void;
}

function getRelativeLabel(
  dateString: string,
) {
  const date =
    new Date(dateString);

  const now =
    new Date();

  const difference =
    now.getTime() -
    date.getTime();

  const hours =
    Math.floor(
      difference /
        (1000 * 60 * 60),
    );

  const days =
    Math.floor(
      hours / 24,
    );

  if (hours < 1) {
    return "Just now";
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  if (days === 1) {
    return "1 day ago";
  }

  return `${days} days ago`;
}

export default function TicketCard({
  ticket,
  onClick,
}: TicketCardProps) {
  return (
    <motion.button
      type="button"
      whileTap={{
        scale: 0.99,
      }}
      onClick={onClick}
      className="
        w-full
        rounded-[18px]
        border
        border-[#EEEAF0]
        bg-white
        p-4
        text-left
        shadow-[0_5px_20px_rgba(36,25,45,0.035)]
      "
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <TicketStatusBadge
            type="status"
            value={ticket.status}
          />

          <TicketStatusBadge
            type="priority"
            value={ticket.priority}
          />
        </div>

        <span className="shrink-0 text-[12px] font-medium text-[#817A85]">
          #{ticket.reference}
        </span>
      </div>

      <h3 className="mt-4 text-[15px] font-semibold leading-5 text-[#302B34]">
        {ticket.summary}
      </h3>

      <p
        className="
          mt-2
          line-clamp-2
          text-[13px]
          leading-5
          text-[#817A85]
        "
      >
        {ticket.description}
      </p>

      <div className="mt-4 border-t border-[#EEEAF0] pt-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[#817A85]">
            <div
              className="
                flex
                h-7
                w-7
                items-center
                justify-center
                rounded-full
                bg-[#F1E9FA]
                text-[#7442AD]
              "
            >
              <Headphones
                size={14}
              />
            </div>

            <span className="text-[12px]">
              Support agent
            </span>
          </div>

          <div
            className="
              flex
              items-center
              gap-1
              rounded-full
              bg-[#F6F5F7]
              px-3
              py-1.5
              text-[12px]
              font-medium
              text-[#817A85]
            "
          >
            {ticket.status ===
            "open"
              ? "Reply"
              : "Details"}

            <ChevronRight
              size={13}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-[#9B95A0]">
            {getRelativeLabel(
              ticket.updatedAt,
            )}
          </span>

          <span className="text-[11px] text-[#7442AD]">
            {ticket.status ===
            "open"
              ? "Need your reply"
              : "Resolved"}
          </span>
        </div>
      </div>
    </motion.button>
  );
}