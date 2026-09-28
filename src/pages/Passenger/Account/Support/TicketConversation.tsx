import {
  ArrowUpRight,
  Camera,
  CheckCircle2,
  ChevronLeft,
  Send,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Navigate,
  useNavigate,
  useParams,
} from "react-router-dom";

import TicketMessage from "../../../../components/passenger/support/TicketMessage";

import TicketStatusBadge from "../../../../components/passenger/support/TicketStatusBadge";

import {
  usePassengerSupport,
} from "../../../../context/PassengerSupportContext";

function formatTicketDate(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-NG",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute:
        "2-digit",
    },
  ).format(
    new Date(value),
  );
}

export default function TicketConversation() {
  const {
    ticketId,
  } =
    useParams<{
      ticketId:
        string;
    }>();

  const navigate =
    useNavigate();

  const {
    getTicket,
    sendMessage,
    resolveTicket,
    escalateTicket,
  } =
    usePassengerSupport();

  const ticket =
    ticketId
      ? getTicket(
          ticketId,
        )
      : undefined;

  const [
    message,
    setMessage,
  ] = useState("");

  const bottomRef =
    useRef<HTMLDivElement>(
      null,
    );

  useEffect(() => {
    bottomRef.current
      ?.scrollIntoView({
        behavior:
          "smooth",
      });
  }, [
    ticket?.messages
      .length,
  ]);

  if (!ticketId) {
    return (
      <Navigate
        to="/passenger/account/support/tickets"
        replace
      />
    );
  }

  if (!ticket) {
    return (
      <Navigate
        to="/passenger/account/support/tickets"
        replace
      />
    );
  }

  const closed =
    ticket.status ===
    "closed";

  const submitMessage =
    () => {
      if (
        !message.trim() ||
        closed
      ) {
        return;
      }

      sendMessage(
        ticket.id,
        message,
      );

      setMessage("");
    };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#F8F7F9]">
      {/* HEADER */}

      <header
        className="
          z-[50]
          shrink-0
          border-b
          border-[#EEEAF0]
          bg-white/95
          px-4
          pb-3
          pt-[calc(12px+env(safe-area-inset-top))]
          backdrop-blur-xl
        "
      >
        <div className="mx-auto flex w-full max-w-[680px] items-center gap-3">
          <button
            type="button"
            onClick={() =>
              navigate(
                "/passenger/account/support/tickets",
              )
            }
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-[#F6F5F7]
              text-[#302B34]
            "
          >
            <ChevronLeft
              size={21}
            />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-[16px] font-semibold text-[#302B34]">
              #
              {
                ticket.reference
              }
            </p>

            <p className="mt-0.5 text-[11px] text-[#918B95]">
              {formatTicketDate(
                ticket.createdAt,
              )}
            </p>
          </div>

          <div className="flex shrink-0 gap-2">
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
        </div>
      </header>

      {/* CHAT */}

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[680px] px-4 py-5">
          <AnimatePresence
            initial={false}
          >
            {ticket.messages.map(
              (
                item,
              ) => (
                <motion.div
                  key={
                    item.id
                  }
                  initial={{
                    opacity:
                      0,
                    y: 8,
                  }}
                  animate={{
                    opacity:
                      1,
                    y: 0,
                  }}
                >
                  <TicketMessage
                    message={
                      item
                    }
                  />
                </motion.div>
              ),
            )}
          </AnimatePresence>

          <div
            ref={
              bottomRef
            }
          />
        </div>
      </main>

      {/* CLOSED */}

      {closed ? (
        <div
          className="
            shrink-0
            border-t
            border-[#EEEAF0]
            bg-white
            px-5
            pb-[calc(25px+env(safe-area-inset-bottom))]
            pt-6
            text-center
          "
        >
          <p className="mx-auto max-w-[360px] text-[14px] leading-6 text-[#817A85]">
            This ticket has
            been resolved. No
            further actions can
            be taken.
          </p>
        </div>
      ) : (
        <div
          className="
            shrink-0
            border-t
            border-[#EEEAF0]
            bg-white
            px-4
            pb-[calc(12px+env(safe-area-inset-bottom))]
            pt-3
          "
        >
          <div className="mx-auto w-full max-w-[680px]">
            {/* ACTIONS */}

            <div className="mb-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  resolveTicket(
                    ticket.id,
                  )
                }
                className="
                  flex
                  h-[42px]
                  items-center
                  justify-center
                  gap-2
                  rounded-full
                  border
                  border-[#E3DEE6]
                  bg-white
                  text-[13px]
                  font-medium
                  text-[#36A665]
                "
              >
                <CheckCircle2
                  size={16}
                />

                Mark
                Resolved
              </button>

              <button
                type="button"
                disabled={
                  ticket.escalated
                }
                onClick={() =>
                  escalateTicket(
                    ticket.id,
                  )
                }
                className="
                  flex
                  h-[42px]
                  items-center
                  justify-center
                  gap-2
                  rounded-full
                  border
                  border-[#E3DEE6]
                  bg-white
                  text-[13px]
                  font-medium
                  text-[#E25353]
                  disabled:cursor-not-allowed
                  disabled:text-[#BBB5BE]
                "
              >
                <ArrowUpRight
                  size={16}
                />

                {ticket.escalated
                  ? "Escalated"
                  : "Escalate Ticket"}
              </button>
            </div>

            {/* INPUT */}

            <div
              className="
                flex
                min-h-[54px]
                items-end
                gap-2
                rounded-[18px]
                bg-[#F5F4F6]
                px-3
                py-2
              "
            >
              <button
                type="button"
                aria-label="Attach image"
                className="flex h-9 w-9 shrink-0 items-center justify-center text-[#71678A]"
              >
                <Camera
                  size={19}
                />
              </button>

              <textarea
                value={
                  message
                }
                onChange={(
                  event,
                ) =>
                  setMessage(
                    event
                      .target
                      .value,
                  )
                }
                onKeyDown={(
                  event,
                ) => {
                  if (
                    event.key ===
                      "Enter" &&
                    !event.shiftKey
                  ) {
                    event.preventDefault();

                    submitMessage();
                  }
                }}
                rows={1}
                placeholder="Write a message"
                className="
                  max-h-[120px]
                  min-h-[38px]
                  min-w-0
                  flex-1
                  resize-none
                  bg-transparent
                  py-2
                  text-[16px]
                  leading-5
                  text-[#302B34]
                  outline-none
                  placeholder:text-[#AAA4AE]
                "
              />

              <motion.button
                type="button"
                whileTap={{
                  scale:
                    0.9,
                }}
                disabled={
                  !message.trim()
                }
                onClick={
                  submitMessage
                }
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  text-[#7442AD]
                  disabled:opacity-35
                "
              >
                <Send
                  size={18}
                />
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}