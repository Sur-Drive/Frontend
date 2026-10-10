import {
  ChevronRight,
  Headphones,
} from "lucide-react";

import {
  motion,
} from "framer-motion";

import type {
  SupportTicket,
} from "../../../api/passenger/support";

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

  const difference =
    Date.now() -
    date.getTime();

  if (
    Number.isNaN(
      difference,
    )
  ) {
    return "";
  }

  const minutes =
    Math.floor(
      difference /
        (1000 * 60),
    );

  const hours =
    Math.floor(
      difference /
        (1000 *
          60 *
          60),
    );

  const days =
    Math.floor(
      hours / 24,
    );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  if (days === 1) {
    return "1 day ago";
  }

  if (days < 7) {
    return `${days} days ago`;
  }

  return new Intl.DateTimeFormat(
    "en-NG",
    {
      day: "numeric",
      month: "short",
    },
  ).format(date);
}

export default function TicketCard({
  ticket,
  onClick,
}: TicketCardProps) {
  const resolved =
    ticket.status ===
      "resolved" ||
    ticket.status ===
      "closed";

  const unreadCount =
    ticket.unreadCount ??
    0;

  const agentName =
    ticket.agent?.name ||
    "Support agent";

  const relativeDate =
    ticket.lastMessageAt ??
    ticket.updatedAt ??
    ticket.createdAt;

  const actionLabel =
    resolved
      ? "Details"
      : "Reply";

  return (
    <motion.button
      type="button"
      whileTap={{
        scale: 0.99,
      }}
      onClick={
        onClick
      }
      className="
        w-full
        rounded-[18px]
        border
        border-[#EEEAF0]
        bg-white
        p-4
        text-left
        shadow-[0_5px_20px_rgba(36,25,45,0.035)]
        transition
        hover:border-[#E6DFEA]
        hover:shadow-[0_8px_26px_rgba(36,25,45,0.05)]
      "
    >
      {/* Top badges + reference */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <TicketStatusBadge
            type="status"
            value={
              ticket.status
            }
          />

          <TicketStatusBadge
            type="priority"
            value={
              ticket.priority
            }
          />
        </div>

        <span className="shrink-0 text-[12px] font-medium text-[#817A85]">
          #
          {
            ticket.reference
          }
        </span>
      </div>

      {/* Subject */}
      <h3 className="mt-4 text-[16px] font-semibold leading-6 text-[#302B34]">
        {
          ticket.subject
        }
      </h3>

      {/* Description */}
      {ticket.descriptionPreview ? (
        <p
          className="
            mt-2
            line-clamp-2
            text-[14px]
            leading-6
            text-[#817A85]
          "
        >
          {
            ticket.descriptionPreview
          }
        </p>
      ) : (
        <p className="mt-2 text-[14px] italic leading-6 text-[#AAA4AE]">
          No description
          available
        </p>
      )}

      {/* Bottom section */}
      <div className="mt-4 border-t border-[#EEEAF0] pt-3">
        <div className="flex items-center justify-between gap-3">
          {/* Agent */}
          <div className="flex min-w-0 items-center gap-2 text-[#817A85]">
            <div
              className="
                flex
                h-7
                w-7
                shrink-0
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

            <span className="max-w-[150px] truncate text-[12px]">
              {
                agentName
              }
            </span>

            {/* Unread badge */}
            {unreadCount >
              0 && (
              <span
                className="
                  flex
                  h-[20px]
                  min-w-[20px]
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[#7442AD]
                  px-1.5
                  text-[10px]
                  font-semibold
                  text-white
                "
              >
                {unreadCount >
                99
                  ? "99+"
                  : unreadCount}
              </span>
            )}
          </div>

          {/* Reply / Details */}
          <div
            className="
              flex
              shrink-0
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
            {
              actionLabel
            }

            <ChevronRight
              size={13}
            />
          </div>
        </div>

        {/* Time + reply state */}
        <div className="flex items-center justify-between gap-3 mt-3">
          <span className="text-[11px] text-[#9B95A0]">
            {getRelativeLabel(
              relativeDate,
            )}
          </span>

          {resolved ? (
            <span className="text-[11px] font-medium text-[#36A665]">
              Resolved
            </span>
          ) : ticket.needsYourReply ? (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#7442AD]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7442AD]" />

              Need your
              reply
            </span>
          ) : (
            <span className="text-[11px] font-medium text-[#817A85]">
              Awaiting
              support
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
