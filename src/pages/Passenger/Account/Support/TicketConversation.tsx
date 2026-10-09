import {
  AlertCircle,
  ArrowUpRight,
  Camera,
  CheckCircle2,
  ChevronLeft,
  Headphones,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Send,
  X,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
} from "framer-motion";

import {
  type ChangeEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
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
  passengerSupportApi,
} from "../../../../api/passenger/support";

import type {
  SupportTicketDetail,
  SupportTicketMessage,
} from "../../../../api/passenger/support";

type ActionSheet =
  | "resolve"
  | "escalate"
  | null;

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
      minute: "2-digit",
    },
  ).format(
    new Date(value),
  );
}

function upsertMessage(
  list: SupportTicketMessage[],
  message: SupportTicketMessage,
) {
  const index =
    list.findIndex(
      (item) =>
        item.id ===
        message.id,
    );

  if (index === -1) {
    return [
      ...list,
      message,
    ];
  }

  const next = [
    ...list,
  ];

  next[index] =
    message;

  return next;
}

function normalizeText(
  value?: string | null,
) {
  return (
    value
      ?.replace(
        /\r\n/g,
        "\n",
      )
      .trim() ?? ""
  );
}

export default function TicketConversation() {
  const {
    ticketId,
  } =
    useParams<{
      ticketId: string;
    }>();

  const navigate =
    useNavigate();

  const bottomRef =
    useRef<HTMLDivElement>(
      null,
    );

  const fileRef =
    useRef<HTMLInputElement>(
      null,
    );

  const [
    ticket,
    setTicket,
  ] =
    useState<SupportTicketDetail | null>(
      null,
    );

  const [
    messages,
    setMessages,
  ] =
    useState<
      SupportTicketMessage[]
    >([]);

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    sending,
    setSending,
  ] =
    useState(false);

  const [
    uploading,
    setUploading,
  ] =
    useState(false);

  const [
    resolving,
    setResolving,
  ] =
    useState(false);

  const [
    reopening,
    setReopening,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const [
    actionSheet,
    setActionSheet,
  ] =
    useState<ActionSheet>(
      null,
    );

  const loadTicket =
    useCallback(
      async () => {
        if (!ticketId) {
          return;
        }

        setError(null);

        try {
          const [
            detail,
            messageResponse,
          ] =
            await Promise.all(
              [
                passengerSupportApi.getTicket(
                  ticketId,
                ),

                passengerSupportApi.getMessages(
                  ticketId,
                  1,
                  50,
                ),
              ],
            );

          setTicket(
            detail,
          );

          /*
           * Backend returns the
           * newest message first.
           *
           * Reverse only.
           * Do not timestamp sort.
           */
          setMessages(
            [
              ...(messageResponse.items ??
                []),
            ].reverse(),
          );

          /*
           * Reading the ticket
           * shouldn't prevent the
           * conversation from loading
           * if the request fails.
           */
          try {
            await passengerSupportApi.markRead(
              ticketId,
            );
          } catch (
            readError
          ) {
            console.error(
              "Unable to mark support ticket read:",
              readError,
            );
          }
        } catch (
          requestError
        ) {
          console.error(
            "Unable to load support ticket:",
            requestError,
          );

          setError(
            "We couldn't load this support conversation.",
          );
        } finally {
          setLoading(
            false,
          );
        }
      },
      [ticketId],
    );

  useEffect(() => {
    void loadTicket();
  }, [loadTicket]);

  /*
   * Keep the latest part of
   * the conversation visible.
   */
  useEffect(() => {
    bottomRef.current
      ?.scrollIntoView({
        behavior:
          "smooth",
      });
  }, [
    messages.length,
  ]);

  /*
   * Remove the automatic initial
   * requester message when it is
   * simply a duplicate of the
   * subject + description card.
   *
   * Example from backend:
   *
   * subject: Testing
   * description: Testing
   *
   * message:
   * Testing
   *
   * Testing
   */
  const visibleMessages =
    useMemo(() => {
      if (!ticket) {
        return messages;
      }

      const subject =
        normalizeText(
          ticket.subject,
        );

      const description =
        normalizeText(
          ticket.description,
        );

      const expectedInitial =
        normalizeText(
          [
            subject,
            description,
          ]
            .filter(
              Boolean,
            )
            .join(
              "\n\n",
            ),
        );

      return messages.filter(
        (item) => {
          if (
            item.senderType !==
              "requester" ||
            item.type !==
              "text"
          ) {
            return true;
          }

          const content =
            normalizeText(
              item.content,
            );

          if (
            !content ||
            !expectedInitial
          ) {
            return true;
          }

          const sameContent =
            content ===
            expectedInitial;

          /*
           * The backend-generated
           * opening message is created
           * with the ticket.
           *
           * Keep this time check so a
           * later user message that
           * happens to contain the same
           * text isn't hidden.
           */
          const ticketTime =
            new Date(
              ticket.createdAt,
            ).getTime();

          const messageTime =
            new Date(
              item.createdAt,
            ).getTime();

          const createdTogether =
            Number.isFinite(
              ticketTime,
            ) &&
            Number.isFinite(
              messageTime,
            ) &&
            Math.abs(
              messageTime -
                ticketTime,
            ) < 5000;

          return !(
            sameContent &&
            createdTogether
          );
        },
      );
    }, [
      messages,
      ticket,
    ]);

  if (!ticketId) {
    return (
      <Navigate
        to="/passenger/account/support/tickets"
        replace
      />
    );
  }

  const submitMessage =
    async () => {
      const content =
        message.trim();

      if (
        !content ||
        sending ||
        !ticket?.permissions
          .canReply
      ) {
        return;
      }

      setSending(true);
      setError(null);

      /*
       * Clear immediately so the
       * composer feels responsive.
       */
      setMessage("");

      try {
        const created =
          await passengerSupportApi.sendMessage(
            ticketId,
            content,
          );

        setMessages(
          (current) =>
            upsertMessage(
              current,
              created,
            ),
        );

        /*
         * Refresh ticket details so
         * status and permissions remain
         * backend-authoritative.
         */
        const detail =
          await passengerSupportApi.getTicket(
            ticketId,
          );

        setTicket(
          detail,
        );
      } catch (
        requestError
      ) {
        console.error(
          "Unable to send support message:",
          requestError,
        );

        /*
         * Because message sending does
         * not have an idempotency key,
         * first refetch the conversation
         * before telling the user to retry.
         */
        try {
          const response =
            await passengerSupportApi.getMessages(
              ticketId,
              1,
              50,
            );

          setMessages(
            [
              ...(response.items ??
                []),
            ].reverse(),
          );
        } catch (
          refreshError
        ) {
          console.error(
            "Unable to refresh messages:",
            refreshError,
          );
        }

        setMessage(
          content,
        );

        setError(
          "Your message may not have been sent. Please check the conversation before trying again.",
        );
      } finally {
        setSending(
          false,
        );
      }
    };

  const uploadFile =
    async (
      event: ChangeEvent<HTMLInputElement>,
    ) => {
      const file =
        event.target
          .files?.[0];

      event.target.value =
        "";

      if (
        !file ||
        !ticket?.permissions
          .canReply
      ) {
        return;
      }

      if (
        file.size >
        10 *
          1024 *
          1024
      ) {
        setError(
          "Attachments must be 10 MB or smaller.",
        );

        return;
      }

      setUploading(true);
      setError(null);

      try {
        const created =
          await passengerSupportApi.uploadAttachment(
            ticketId,
            file,
          );

        setMessages(
          (current) =>
            upsertMessage(
              current,
              created,
            ),
        );
      } catch (
        requestError
      ) {
        console.error(
          "Unable to upload support attachment:",
          requestError,
        );

        setError(
          "We couldn't upload that attachment. Please try again.",
        );
      } finally {
        setUploading(
          false,
        );
      }
    };

  const resolveTicket =
    async () => {
      if (
        !ticket?.permissions
          .canResolve ||
        resolving
      ) {
        return;
      }

      setResolving(true);
      setError(null);

      try {
        await passengerSupportApi.resolve(
          ticketId,
        );

        /*
         * Close sheet first so the
         * successful state feels instant.
         */
        setActionSheet(
          null,
        );

        await loadTicket();
      } catch (
        requestError
      ) {
        console.error(
          "Unable to resolve support ticket:",
          requestError,
        );

        setError(
          "We couldn't resolve this ticket. Please try again.",
        );
      } finally {
        setResolving(
          false,
        );
      }
    };

  const reopenTicket =
    async () => {
      if (
        !ticket?.permissions
          .canReopen ||
        reopening
      ) {
        return;
      }

      setReopening(true);
      setError(null);

      try {
        await passengerSupportApi.reopen(
          ticketId,
        );

        await loadTicket();
      } catch (
        requestError
      ) {
        console.error(
          "Unable to reopen support ticket:",
          requestError,
        );

        setError(
          "This ticket could not be reopened. The reopen window may have expired.",
        );
      } finally {
        setReopening(
          false,
        );
      }
    };

  const handleKeyDown =
    (
      event: KeyboardEvent<HTMLTextAreaElement>,
    ) => {
      if (
        event.key ===
          "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();

        void submitMessage();
      }
    };

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#F8F7F9]">
        <div className="text-center">
          <LoaderCircle
            size={34}
            className="mx-auto animate-spin text-[#7442AD]"
          />

          <p className="mt-4 text-[15px] text-[#918B95]">
            Loading
            conversation...
          </p>
        </div>
      </div>
    );
  }

  if (
    error &&
    !ticket
  ) {
    return (
      <div
        className="
          flex
          min-h-[100dvh]
          flex-col
          items-center
          justify-center
          bg-[#F8F7F9]
          px-5
          text-center
        "
      >
        <div
          className="
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-full
            bg-[#F1E9FA]
            text-[#7442AD]
          "
        >
          <Headphones
            size={25}
          />
        </div>

        <h1 className="mt-5 text-[20px] font-semibold text-[#302B34]">
          Conversation
          unavailable
        </h1>

        <p className="mt-2 max-w-[320px] text-[14px] leading-6 text-[#817A85]">
          {error}
        </p>

        <button
          type="button"
          onClick={() => {
            setLoading(
              true,
            );

            void loadTicket();
          }}
          className="
            mt-5
            flex
            h-12
            items-center
            gap-2
            rounded-[14px]
            bg-[#7442AD]
            px-5
            text-[15px]
            font-semibold
            text-white
          "
        >
          <RefreshCw
            size={17}
          />

          Try again
        </button>
      </div>
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

  const canReply =
    ticket.permissions
      .canReply;

  const canResolve =
    ticket.permissions
      .canResolve;

  const canReopen =
    ticket.permissions
      .canReopen;

  return (
    <>
      <div
        className="
          flex
          h-[100dvh]
          flex-col
          overflow-hidden
          bg-[#F8F7F9]
        "
      >
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
          <div
            className="
              mx-auto
              flex
              w-full
              max-w-[680px]
              items-center
              gap-3
            "
          >
            <motion.button
              type="button"
              whileTap={{
                scale: 0.92,
              }}
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
            </motion.button>

            <div className="flex-1 min-w-0">
              <p
                className="
                  truncate
                  text-[16px]
                  font-semibold
                  text-[#302B34]
                "
              >
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

            <div className="flex items-center gap-2 shrink-0">
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

        {/* CONVERSATION */}
        <main
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain"
        >
          <div
            className="
              mx-auto
              w-full
              max-w-[680px]
              px-4
              pb-6
              pt-5
            "
          >
            {/* TICKET SUMMARY */}
            <div
              className="
                mb-6
                rounded-[18px]
                border
                border-[#EEEAF0]
                bg-[#7442AD]
                px-4
                py-4
                shadow-[0_4px_18px_rgba(35,25,44,0.025)]
              "
            >
              <h1
                className="
                  text-[16px]
                  font-semibold
                  leading-6
                  text-white
                "
              >
                {
                  ticket.subject
                }
              </h1>

              {ticket.description ? (
                <p
                  className="
                    mt-1.5
                    whitespace-pre-line
                    text-[14px]
                    leading-6
                    text-white
                  "
                >
                  {
                    ticket.description
                  }
                </p>
              ) : null}
            </div>

            {/* ERROR */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: -5,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -5,
                  }}
                  className="
                    mb-4
                    flex
                    items-start
                    gap-2.5
                    rounded-[14px]
                    border
                    border-[#F7D6D3]
                    bg-[#FFF6F5]
                    px-3.5
                    py-3
                    text-[13px]
                    leading-5
                    text-[#B42318]
                  "
                >
                  <AlertCircle
                    size={17}
                    className="mt-0.5 shrink-0"
                  />

                  <span className="flex-1">
                    {error}
                  </span>

                  <button
                    type="button"
                    aria-label="Dismiss error"
                    onClick={() =>
                      setError(
                        null,
                      )
                    }
                    className="shrink-0"
                  >
                    <X
                      size={16}
                    />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* MESSAGES */}
            <AnimatePresence
              initial={false}
            >
              {visibleMessages.map(
                (item) => (
                  <motion.div
                    key={
                      item.id
                    }
                    initial={{
                      opacity: 0,
                      y: 8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                    }}
                    transition={{
                      duration:
                        0.2,
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

        {/* BOTTOM AREA */}
        <div
          className="
            z-[40]
            shrink-0
            border-t
            border-[#EEEAF0]
            bg-white/95
            px-4
            pb-[calc(12px+env(safe-area-inset-bottom))]
            pt-3
            backdrop-blur-xl
          "
        >
          <div className="mx-auto w-full max-w-[680px]">
            {/* OPEN TICKET ACTIONS */}
            {canResolve && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                <motion.button
                  type="button"
                  whileTap={{
                    scale: 0.97,
                  }}
                  onClick={() =>
                    setActionSheet(
                      "resolve",
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
                    px-3
                    text-[13px]
                    font-medium
                    text-[#36A665]
                    transition
                    hover:bg-[#F7FBF8]
                  "
                >
                  <CheckCircle2
                    size={16}
                  />

                  <span>
                    Mark Resolved
                  </span>
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={{
                    scale: 0.97,
                  }}
                  onClick={() =>
                    setActionSheet(
                      "escalate",
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
                    px-3
                    text-[13px]
                    font-medium
                    text-[#E25353]
                    transition
                    hover:bg-[#FFF8F8]
                  "
                >
                  <ArrowUpRight
                    size={16}
                  />

                  <span>
                    Escalate
                  </span>
                </motion.button>
              </div>
            )}

            {/* RESOLVED / REOPEN */}
            {canReopen && (
              <div
                className="
                  mb-3
                  flex
                  items-center
                  justify-between
                  gap-3
                  rounded-[14px]
                  bg-[#F7F4F9]
                  px-3.5
                  py-3
                "
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div
                    className="
                      flex
                      h-8
                      w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-white
                      text-[#36A665]
                    "
                  >
                    <CheckCircle2
                      size={17}
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#302B34]">
                      Ticket
                      resolved
                    </p>

                    <p className="mt-0.5 text-[11px] text-[#918B95]">
                      Still need
                      help?
                    </p>
                  </div>
                </div>

                <motion.button
                  type="button"
                  whileTap={{
                    scale: 0.96,
                  }}
                  disabled={
                    reopening
                  }
                  onClick={() =>
                    void reopenTicket()
                  }
                  className="
                    flex
                    h-9
                    shrink-0
                    items-center
                    gap-1.5
                    rounded-full
                    bg-white
                    px-3
                    text-[12px]
                    font-semibold
                    text-[#7442AD]
                    shadow-[0_2px_10px_rgba(35,25,44,0.05)]
                    disabled:opacity-50
                  "
                >
                  {reopening ? (
                    <LoaderCircle
                      size={14}
                      className="animate-spin"
                    />
                  ) : (
                    <RotateCcw
                      size={14}
                    />
                  )}

                  Reopen
                </motion.button>
              </div>
            )}

            {/* COMPOSER */}
            {canReply ? (
              <>
                <input
                  ref={
                    fileRef
                  }
                  type="file"
                  hidden
                  accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                  onChange={
                    uploadFile
                  }
                />

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
                    aria-label="Attach file"
                    disabled={
                      uploading
                    }
                    onClick={() =>
                      fileRef.current?.click()
                    }
                    className="
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      text-[#71678A]
                      transition
                      hover:bg-white/70
                      disabled:opacity-40
                    "
                  >
                    {uploading ? (
                      <LoaderCircle
                        size={19}
                        className="animate-spin"
                      />
                    ) : (
                      <Camera
                        size={19}
                      />
                    )}
                  </button>

                  <textarea
                    value={
                      message
                    }
                    maxLength={
                      2000
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
                    onKeyDown={
                      handleKeyDown
                    }
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
                      scale: 0.9,
                    }}
                    disabled={
                      !message.trim() ||
                      sending
                    }
                    onClick={() =>
                      void submitMessage()
                    }
                    className="
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-[#7442AD]
                      text-white
                      shadow-[0_4px_12px_rgba(116,66,173,0.18)]
                      disabled:bg-transparent
                      disabled:text-[#AAA4AE]
                      disabled:shadow-none
                    "
                  >
                    {sending ? (
                      <LoaderCircle
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Send
                        size={17}
                      />
                    )}
                  </motion.button>
                </div>
              </>
            ) : !canReopen ? (
              <div className="py-2 text-center">
                <p className="text-[13px] leading-5 text-[#918B95]">
                  This
                  conversation is
                  closed.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ACTION SHEETS */}
      <AnimatePresence>
        {actionSheet && (
          <motion.div
            className="
              fixed
              inset-0
              z-[200]
              flex
              items-end
              justify-center
            "
          >
            <motion.button
              type="button"
              aria-label="Close"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              onClick={() => {
                if (
                  !resolving
                ) {
                  setActionSheet(
                    null,
                  );
                }
              }}
              className="
                absolute
                inset-0
                bg-black/35
                backdrop-blur-[2px]
              "
            />

            <motion.div
              initial={{
                y: "100%",
              }}
              animate={{
                y: 0,
              }}
              exit={{
                y: "100%",
              }}
              transition={{
                type: "spring",
                damping: 30,
                stiffness: 320,
              }}
              className="
                relative
                z-10
                w-full
                max-w-[680px]
                rounded-t-[28px]
                bg-white
                px-5
                pb-[calc(22px+env(safe-area-inset-bottom))]
                pt-3
                shadow-[0_-12px_40px_rgba(24,16,31,0.12)]
              "
            >
              <div
                className="
                  mx-auto
                  mb-5
                  h-1
                  w-10
                  rounded-full
                  bg-[#DDD8E0]
                "
              />

              {actionSheet ===
                "resolve" && (
                <>
                  <div
                    className="
                      mx-auto
                      flex
                      h-14
                      w-14
                      items-center
                      justify-center
                      rounded-full
                      bg-[#EDF8F1]
                      text-[#36A665]
                    "
                  >
                    <CheckCircle2
                      size={26}
                    />
                  </div>

                  <div className="mt-4 text-center">
                    <h2
                      className="
                        text-[20px]
                        font-semibold
                        text-[#302B34]
                      "
                    >
                      Resolve this
                      ticket?
                    </h2>

                    <p
                      className="
                        mx-auto
                        mt-2
                        max-w-[380px]
                        text-[14px]
                        leading-6
                        text-[#817A85]
                      "
                    >
                      Mark this
                      ticket as
                      resolved if
                      your issue has
                      been sorted
                      out.
                    </p>
                  </div>

                  <div className="mt-6 space-y-2.5">
                    <motion.button
                      type="button"
                      whileTap={{
                        scale:
                          0.985,
                      }}
                      disabled={
                        resolving
                      }
                      onClick={() =>
                        void resolveTicket()
                      }
                      className="
                        flex
                        h-[52px]
                        w-full
                        items-center
                        justify-center
                        gap-2
                        rounded-[14px]
                        bg-[#7442AD]
                        text-[15px]
                        font-semibold
                        text-white
                        shadow-[0_8px_20px_rgba(116,66,173,0.18)]
                        disabled:opacity-60
                      "
                    >
                      {resolving ? (
                        <LoaderCircle
                          size={18}
                          className="animate-spin"
                        />
                      ) : (
                        <CheckCircle2
                          size={18}
                        />
                      )}

                      {resolving
                        ? "Resolving..."
                        : "Yes, Mark as Resolved"}
                    </motion.button>

                    <button
                      type="button"
                      disabled={
                        resolving
                      }
                      onClick={() =>
                        setActionSheet(
                          null,
                        )
                      }
                      className="
                        h-[50px]
                        w-full
                        rounded-[14px]
                        text-[14px]
                        font-semibold
                        text-[#817A85]
                        disabled:opacity-50
                      "
                    >
                      Keep Ticket
                      Open
                    </button>
                  </div>
                </>
              )}

              {actionSheet ===
                "escalate" && (
                <>
                  <div
                    className="
                      mx-auto
                      flex
                      h-14
                      w-14
                      items-center
                      justify-center
                      rounded-full
                      bg-[#FFF3F3]
                      text-[#E25353]
                    "
                  >
                    <ArrowUpRight
                      size={26}
                    />
                  </div>

                  <div className="mt-4 text-center">
                    <h2
                      className="
                        text-[20px]
                        font-semibold
                        text-[#302B34]
                      "
                    >
                      Escalate
                      ticket
                    </h2>

                    <p
                      className="
                        mx-auto
                        mt-2
                        max-w-[390px]
                        text-[14px]
                        leading-6
                        text-[#817A85]
                      "
                    >
                      Escalation
                      isn't available
                      for this ticket
                      through the app
                      yet. You can
                      continue the
                      conversation
                      with support
                      while your
                      request is being
                      handled.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setActionSheet(
                        null,
                      )
                    }
                    className="
                      mt-6
                      h-[52px]
                      w-full
                      rounded-[14px]
                      bg-[#7442AD]
                      text-[15px]
                      font-semibold
                      text-white
                    "
                  >
                    Continue
                    Conversation
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

