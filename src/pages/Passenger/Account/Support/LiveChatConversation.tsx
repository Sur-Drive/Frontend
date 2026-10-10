import {
  AlertCircle,
  ChevronLeft,
  Headphones,
  LoaderCircle,
  Paperclip,
  RefreshCw,
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

import {
  passengerSupportApi,
} from "../../../../api/passenger/support";

import type {
  SupportTicketDetail,
  SupportTicketMessage,
} from "../../../../api/passenger/support";

import LiveChatMessage from "../../../../components/passenger/support/LiveChatMessage";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function normalizeText(
  value?: string | null,
) {
  return (value ?? "")
    .replace(/\r\n/g, "\n")
    .trim();
}

function getErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (
    error &&
    typeof error === "object"
  ) {
    const candidate =
      error as {
        message?: unknown;

        response?: {
          data?: {
            message?: unknown;
          };
        };
      };

    const apiMessage =
      candidate.response?.data
        ?.message;

    if (
      typeof apiMessage ===
        "string" &&
      apiMessage.trim()
    ) {
      return apiMessage;
    }

    if (
      Array.isArray(
        apiMessage,
      )
    ) {
      const messages =
        apiMessage.filter(
          (
            item,
          ): item is string =>
            typeof item ===
            "string",
        );

      if (
        messages.length
      ) {
        return messages.join(
          ". ",
        );
      }
    }

    if (
      typeof candidate.message ===
        "string" &&
      candidate.message.trim()
    ) {
      return candidate.message;
    }
  }

  return fallback;
}

/*
 * Backend returns newest-first.
 *
 * Reverse the returned array only.
 * Do NOT timestamp-sort.
 */
function oldestFirst(
  messages:
    SupportTicketMessage[],
) {
  return [
    ...messages,
  ].reverse();
}

/*
 * Backend automatically creates the
 * initial requester message:
 *
 * subject
 *
 * description
 *
 * Live Chat already displays the
 * subject/description in its context
 * card, so remove only that exact
 * generated message.
 */
function isInitialGeneratedMessage(
  message:
    SupportTicketMessage,
  ticket:
    SupportTicketDetail,
) {
  if (
    message.senderType !==
      "requester" ||
    message.type !== "text"
  ) {
    return false;
  }

  const expected =
    normalizeText(
      `${ticket.subject}\n\n${ticket.description}`,
    );

  const actual =
    normalizeText(
      message.content,
    );

  if (
    !expected ||
    actual !== expected
  ) {
    return false;
  }

  const messageTime =
    new Date(
      message.createdAt,
    ).getTime();

  const ticketTime =
    new Date(
      ticket.createdAt,
    ).getTime();

  if (
    Number.isNaN(
      messageTime,
    ) ||
    Number.isNaN(
      ticketTime,
    )
  ) {
    return false;
  }

  return (
    messageTime ===
    ticketTime
  );
}

function upsertMessage(
  list:
    SupportTicketMessage[],
  message:
    SupportTicketMessage,
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

  const next =
    [...list];

  next[index] =
    message;

  return next;
}

function getAgentName(
  ticket:
    SupportTicketDetail,
) {
  return (
    ticket.agent?.name ??
    "Support Team"
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function LiveChatConversation() {
  const {
    conversationId,
  } =
    useParams<{
      conversationId:
        string;
    }>();

  const navigate =
    useNavigate();

  const bottomRef =
    useRef<HTMLDivElement>(
      null,
    );

  const fileInputRef =
    useRef<HTMLInputElement>(
      null,
    );

  const [
    ticket,
    setTicket,
  ] =
    useState<
      SupportTicketDetail | null
    >(null);

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
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    sending,
    setSending,
  ] = useState(false);

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  /* ---------------------------------------------------------------------- */
  /* Fetch messages                                                         */
  /* ---------------------------------------------------------------------- */

  const fetchMessages =
    useCallback(
      async (
        ticketId: string,
      ) => {
        /*
         * IMPORTANT:
         *
         * support.ts expects:
         *
         * getMessages(
         *   ticketId,
         *   page,
         *   limit,
         * )
         *
         * NOT:
         *
         * getMessages(ticketId, {
         *   page: 1,
         *   limit: 50,
         * })
         *
         * Passing an object caused:
         *
         * ?page=[object Object]&limit=20
         */
        const response =
          await passengerSupportApi.getMessages(
            ticketId,
            1,
            50,
          );

        return response;
      },
      [],
    );

  /* ---------------------------------------------------------------------- */
  /* Load conversation                                                      */
  /* ---------------------------------------------------------------------- */

  const loadConversation =
    useCallback(
      async () => {
        if (
          !conversationId
        ) {
          return;
        }

        setLoading(true);
        setError(null);

        try {
          const [
            ticketResponse,
            messageResponse,
          ] =
            await Promise.all([
              passengerSupportApi.getTicket(
                conversationId,
              ),

              fetchMessages(
                conversationId,
              ),
            ]);

          setTicket(
            ticketResponse,
          );

          setMessages(
            oldestFirst(
              messageResponse.items ??
                [],
            ),
          );

          /*
           * Failure to mark as read
           * shouldn't break the chat.
           */
          try {
            await passengerSupportApi.markRead(
              conversationId,
            );
          } catch (
            readError
          ) {
            console.error(
              "Unable to mark live support conversation as read:",
              readError,
            );
          }
        } catch (
          requestError
        ) {
          console.error(
            "Unable to load live support conversation:",
            requestError,
          );

          setError(
            getErrorMessage(
              requestError,
              "We couldn't load this conversation. Please try again.",
            ),
          );
        } finally {
          setLoading(false);
        }
      },
      [
        conversationId,
        fetchMessages,
      ],
    );

  useEffect(() => {
    void loadConversation();
  }, [
    loadConversation,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Filter generated opening message                                       */
  /* ---------------------------------------------------------------------- */

  const visibleMessages =
    useMemo(() => {
      if (!ticket) {
        return messages;
      }

      return messages.filter(
        (item) =>
          !isInitialGeneratedMessage(
            item,
            ticket,
          ),
      );
    }, [
      messages,
      ticket,
    ]);

  /* ---------------------------------------------------------------------- */
  /* Scroll                                                                 */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (loading) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          bottomRef.current?.scrollIntoView(
            {
              behavior:
                "smooth",
              block: "end",
            },
          );
        },
        80,
      );

    return () => {
      window.clearTimeout(
        timer,
      );
    };
  }, [
    loading,
    visibleMessages.length,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Refresh                                                                */
  /* ---------------------------------------------------------------------- */

  const refreshConversation =
    async () => {
      if (
        !conversationId ||
        refreshing
      ) {
        return;
      }

      setRefreshing(true);
      setError(null);

      try {
        const [
          ticketResponse,
          messageResponse,
        ] =
          await Promise.all([
            passengerSupportApi.getTicket(
              conversationId,
            ),

            fetchMessages(
              conversationId,
            ),
          ]);

        setTicket(
          ticketResponse,
        );

        setMessages(
          oldestFirst(
            messageResponse.items ??
              [],
          ),
        );

        try {
          await passengerSupportApi.markRead(
            conversationId,
          );
        } catch (
          readError
        ) {
          console.error(
            "Unable to mark conversation as read:",
            readError,
          );
        }
      } catch (
        requestError
      ) {
        console.error(
          "Unable to refresh live support conversation:",
          requestError,
        );

        setError(
          getErrorMessage(
            requestError,
            "We couldn't refresh the conversation.",
          ),
        );
      } finally {
        setRefreshing(
          false,
        );
      }
    };

  /* ---------------------------------------------------------------------- */
  /* Send message                                                           */
  /* ---------------------------------------------------------------------- */

  const sendMessage =
  async () => {
    const content =
      message.trim();

    if (
      !conversationId ||
      !ticket ||
      !content ||
      sending ||
      uploading
    ) {
      return;
    }

    if (
      !ticket.permissions
        .canReply
    ) {
      setError(
        "This conversation is no longer accepting replies.",
      );

      return;
    }

    if (
      content.length >
      2000
    ) {
      setError(
        "Messages cannot be longer than 2000 characters.",
      );

      return;
    }

    setSending(true);
    setError(null);

    try {
      /*
       * IMPORTANT:
       *
       * sendMessage() already creates:
       *
       * {
       *   content: "..."
       * }
       *
       * So pass the string here,
       * NOT { content }.
       */
      const created =
        await passengerSupportApi.sendMessage(
          conversationId,
          content,
        );

      setMessages(
        (current) =>
          upsertMessage(
            current,
            created,
          ),
      );

      setMessage("");

      try {
        const detail =
          await passengerSupportApi.getTicket(
            conversationId,
          );

        setTicket(
          detail,
        );
      } catch (
        detailError
      ) {
        console.error(
          "Unable to refresh support ticket detail:",
          detailError,
        );
      }
    } catch (
      requestError
    ) {
      console.error(
        "Unable to send support message:",
        requestError,
      );

      /*
       * Resync messages because the
       * request may have reached the
       * backend before the client
       * experienced an error.
       */
      try {
        const response =
          await passengerSupportApi.getMessages(
            conversationId,
            1,
            50,
          );

        setMessages(
          [
            ...(
              response.items ??
              []
            ),
          ].reverse(),
        );
      } catch (
        refreshError
      ) {
        console.error(
          "Unable to resync support messages:",
          refreshError,
        );
      }

      setError(
        getErrorMessage(
          requestError,
          "Your message couldn't be sent. Please try again.",
        ),
      );
    } finally {
      setSending(false);
    }
  };

  /* ---------------------------------------------------------------------- */
  /* Attachment                                                             */
  /* ---------------------------------------------------------------------- */

  const handleAttachment =
    async (
      event:
        ChangeEvent<HTMLInputElement>,
    ) => {
      const file =
        event.target
          .files?.[0];

      /*
       * Reset input so selecting the
       * same file again still triggers
       * onChange.
       */
      event.target.value =
        "";

      if (
        !file ||
        !conversationId ||
        !ticket ||
        uploading ||
        sending
      ) {
        return;
      }

      if (
        !ticket.permissions
          .canReply
      ) {
        setError(
          "This conversation is no longer accepting attachments.",
        );

        return;
      }

      /*
       * Support API attachment limit.
       */
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
            conversationId,
            file,
          );

        setMessages(
          (current) =>
            upsertMessage(
              current,
              created,
            ),
        );

        try {
          const detail =
            await passengerSupportApi.getTicket(
              conversationId,
            );

          setTicket(detail);
        } catch (
          detailError
        ) {
          console.error(
            "Unable to refresh ticket after attachment:",
            detailError,
          );
        }
      } catch (
        requestError
      ) {
        console.error(
          "Unable to upload support attachment:",
          requestError,
        );

        setError(
          getErrorMessage(
            requestError,
            "Your attachment couldn't be uploaded. Please try again.",
          ),
        );
      } finally {
        setUploading(
          false,
        );
      }
    };

  /* ---------------------------------------------------------------------- */
  /* Keyboard                                                               */
  /* ---------------------------------------------------------------------- */

  const handleKeyDown =
    (
      event:
        KeyboardEvent<HTMLTextAreaElement>,
    ) => {
      if (
        event.key ===
          "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();

        void sendMessage();
      }
    };

  /* ---------------------------------------------------------------------- */
  /* Missing ID                                                             */
  /* ---------------------------------------------------------------------- */

  if (
    !conversationId
  ) {
    return (
      <Navigate
        to="/passenger/account/support/live-chat"
        replace
      />
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Loading                                                                */
  /* ---------------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#F8F7F9]">
        <div className="text-center">
          <LoaderCircle
            size={30}
            className="mx-auto animate-spin text-[#7442AD]"
          />

          <p className="mt-3 text-[14px] text-[#918B95]">
            Opening your
            conversation...
          </p>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Initial load failed                                                    */
  /* ---------------------------------------------------------------------- */

  if (!ticket) {
    return (
      <div className="min-h-[100dvh] bg-[#F8F7F9]">
        <header
          className="
            border-b
            border-[#EEEAF0]
            bg-white
            px-4
            pb-3
            pt-[calc(12px+env(safe-area-inset-top))]
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

            <h1 className="text-[18px] font-semibold text-[#302B34]">
              Live Support
            </h1>
          </div>
        </header>

        <main className="mx-auto flex min-h-[75dvh] w-full max-w-[680px] items-center justify-center px-6">
          <div className="max-w-[350px] text-center">
            <div
              className="
                mx-auto
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-full
                bg-[#FFF0F0]
                text-[#B42318]
              "
            >
              <AlertCircle
                size={24}
              />
            </div>

            <h2 className="mt-4 text-[20px] font-semibold text-[#302B34]">
              Couldn't open
              conversation
            </h2>

            <p className="mt-2 text-[14px] leading-6 text-[#918B95]">
              {error ??
                "We couldn't load this support conversation."}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadConversation()
              }
              className="
                mt-6
                inline-flex
                h-[50px]
                items-center
                justify-center
                gap-2
                rounded-[14px]
                bg-[#7442AD]
                px-6
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
        </main>
      </div>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* Derived                                                                */
  /* ---------------------------------------------------------------------- */

  const canReply =
    ticket.permissions
      .canReply;

  const conversationEnded =
    ticket.status ===
      "resolved" ||
    ticket.status ===
      "closed";

  const agentName =
    getAgentName(ticket);

  /* ---------------------------------------------------------------------- */
  /* Main UI                                                                */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#F8F7F9]">
      {/* Header */}

      <header
        className="
          z-50
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

          {/* Avatar */}

          <div className="relative shrink-0">
            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                bg-[#EDE5F5]
                text-[#7442AD]
              "
            >
              <Headphones
                size={19}
              />
            </div>

            {!conversationEnded && (
              <span
                className="
                  absolute
                  bottom-0
                  right-0
                  h-3
                  w-3
                  rounded-full
                  border-2
                  border-white
                  bg-[#36A665]
                "
              />
            )}
          </div>

          {/* Name */}

          <div className="flex-1 min-w-0">
            <p className="truncate text-[16px] font-semibold text-[#302B34]">
              {agentName}
            </p>

            <div className="mt-0.5 flex items-center gap-1.5">
              <span
                className={`
                  text-[12px]
                  font-medium

                  ${
                    conversationEnded
                      ? "text-[#918B95]"
                      : "text-[#36A665]"
                  }
                `}
              >
                {conversationEnded
                  ? "Conversation ended"
                  : ticket.agent
                    ? "Support agent"
                    : "Support team"}
              </span>

              <span className="text-[10px] text-[#C4BEC8]">
                •
              </span>

              <span className="truncate text-[11px] text-[#AAA4AE]">
                {
                  ticket.reference
                }
              </span>
            </div>
          </div>

          {/* Refresh */}

          <motion.button
            type="button"
            whileTap={{
              scale: 0.9,
            }}
            disabled={
              refreshing
            }
            onClick={() =>
              void refreshConversation()
            }
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              text-[#817A85]
              transition
              hover:bg-[#F6F5F7]
              disabled:opacity-50
            "
          >
            <RefreshCw
              size={18}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />
          </motion.button>
        </div>
      </header>

      {/* Messages */}

      <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div
          className="
            mx-auto
            flex
            min-h-full
            w-full
            max-w-[680px]
            flex-col
            px-4
            pb-5
            pt-4
            sm:px-6
          "
        >
          {/* Security */}

          <div className="mb-4 text-center">
            <span
              className="
                inline-block
                rounded-full
                bg-[#ECE9EE]
                px-4
                py-2
                text-[11px]
                leading-4
                text-[#817A85]
              "
            >
              Never share your
              password, PIN or OTP
              in this chat.
            </span>
          </div>

          {/* Conversation context */}

          <motion.div
            initial={{
              opacity: 0,
              y: 7,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            className="
              mb-6
              rounded-[18px]
              border
              border-[#EDE9EF]
              bg-white
              px-4
              py-4
              shadow-[0_4px_18px_rgba(40,28,48,0.025)]
            "
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#A19AA5]">
                  Your request
                </p>

                <h2 className="mt-1.5 break-words text-[16px] font-semibold leading-6 text-[#302B34]">
                  {
                    ticket.subject
                  }
                </h2>
              </div>

              <span
                className={`
                  shrink-0
                  rounded-full
                  px-2.5
                  py-1
                  text-[11px]
                  font-semibold
                  capitalize

                  ${
                    ticket.status ===
                    "open"
                      ? "bg-[#EAF7EF] text-[#27824C]"
                      : "bg-[#F0EDF2] text-[#817A85]"
                  }
                `}
              >
                {ticket.status ===
                "resolved"
                  ? "closed"
                  : ticket.status}
              </span>
            </div>

            {ticket.description && (
              <p className="mt-2 whitespace-pre-line break-words text-[14px] leading-6 text-[#817A85]">
                {
                  ticket.description
                }
              </p>
            )}
          </motion.div>

          {/* Error */}

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
                  onClick={() =>
                    setError(null)
                  }
                >
                  <X
                    size={16}
                  />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty */}

          {visibleMessages.length ===
            0 && (
            <div className="flex items-center justify-center flex-1 py-10">
              <div className="max-w-[300px] text-center">
                <div
                  className="
                    mx-auto
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-full
                    bg-[#EEE7F5]
                    text-[#7442AD]
                  "
                >
                  <Headphones
                    size={21}
                  />
                </div>

                <p className="mt-3 text-[15px] font-semibold text-[#302B34]">
                  Conversation
                  started
                </p>

                <p className="mt-1.5 text-[13px] leading-5 text-[#918B95]">
                  Send a message
                  below to continue
                  your conversation
                  with support.
                </p>
              </div>
            </div>
          )}

          {/* Messages */}

          <div className="flex-1">
            <AnimatePresence
              initial={false}
            >
              {visibleMessages.map(
                (item) => (
                  <LiveChatMessage
                    key={
                      item.id
                    }
                    message={
                      item
                    }
                  />
                ),
              )}
            </AnimatePresence>

            <div
              ref={bottomRef}
            />
          </div>
        </div>
      </main>

      {/* Composer */}

      <footer
        className="
          z-50
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
          {canReply ? (
            <>
              <input
                ref={
                  fileInputRef
                }
                type="file"
                hidden
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={
                  handleAttachment
                }
              />

              <div
                className="
                  flex
                  min-h-[56px]
                  items-end
                  gap-2
                  rounded-[20px]
                  bg-[#F5F4F6]
                  px-3
                  py-2
                  transition
                  focus-within:ring-2
                  focus-within:ring-[#7442AD]/15
                "
              >
                {/* Attachment */}

                <motion.button
                  type="button"
                  whileTap={{
                    scale: 0.9,
                  }}
                  disabled={
                    uploading ||
                    sending
                  }
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    text-[#71678A]
                    transition
                    hover:bg-white
                    disabled:opacity-40
                  "
                >
                  {uploading ? (
                    <LoaderCircle
                      size={19}
                      className="animate-spin"
                    />
                  ) : (
                    <Paperclip
                      size={20}
                    />
                  )}
                </motion.button>

                {/* Input */}

                <textarea
                  value={message}
                  disabled={
                    sending
                  }
                  onChange={(
                    event,
                  ) =>
                    setMessage(
                      event.target
                        .value,
                    )
                  }
                  onKeyDown={
                    handleKeyDown
                  }
                  rows={1}
                  maxLength={2000}
                  placeholder="Write a message..."
                  className="
                    max-h-[120px]
                    min-h-[40px]
                    min-w-0
                    flex-1
                    resize-none
                    bg-transparent
                    py-[9px]
                    text-[16px]
                    leading-[22px]
                    text-[#302B34]
                    outline-none
                    placeholder:text-[#AAA4AE]
                    disabled:opacity-60
                  "
                />

                {/* Send */}

                <motion.button
                  type="button"
                  whileTap={
                    message.trim() &&
                    !sending
                      ? {
                          scale:
                            0.88,
                        }
                      : undefined
                  }
                  disabled={
                    !message.trim() ||
                    sending ||
                    uploading
                  }
                  onClick={() =>
                    void sendMessage()
                  }
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-[#7442AD]
                    text-white
                    shadow-[0_5px_15px_rgba(116,66,173,0.25)]
                    transition
                    disabled:bg-transparent
                    disabled:text-[#AAA4AE]
                    disabled:shadow-none
                  "
                >
                  {sending ? (
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <Send
                      size={18}
                    />
                  )}
                </motion.button>
              </div>

              <div className="mt-1.5 flex items-center justify-between px-1">
                <span className="text-[10px] text-[#AAA4AE]">
                  Press Enter to
                  send
                </span>

                {message.length >
                  1600 && (
                  <span className="text-[10px] text-[#AAA4AE]">
                    {
                      message.length
                    }
                    /2000
                  </span>
                )}
              </div>
            </>
          ) : (
            <div
              className="
                rounded-[16px]
                bg-[#F5F4F6]
                px-4
                py-4
                text-center
              "
            >
              <p className="text-[13px] text-[#817A85]">
                {conversationEnded
                  ? "This conversation has ended."
                  : "Replies are currently unavailable for this conversation."}
              </p>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}