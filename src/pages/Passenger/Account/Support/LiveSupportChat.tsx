import {
  Camera,
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

import type {
  ChangeEvent,
  KeyboardEvent,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

type ChatSender =
  | "passenger"
  | "agent";

interface ChatMessage {
  id: string;
  sender: ChatSender;
  message: string;
  createdAt: string;
  image?: string;
}

const initialMessages: ChatMessage[] = [
  {
    id: "support-welcome",
    sender: "agent",
    message:
      "Hi Abiodun.\nWhat brings you here today?",
    createdAt:
      "2026-07-15T05:35:00",
  },
];

function formatMessageTime(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "en-NG",
    {
      hour: "numeric",
      minute: "2-digit",
    },
  ).format(
    new Date(value),
  );
}

export default function LiveSupportChat() {
  const navigate =
    useNavigate();

  const [
    messages,
    setMessages,
  ] =
    useState<ChatMessage[]>(
      initialMessages,
    );

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    attachment,
    setAttachment,
  ] =
    useState<string | null>(
      null,
    );

  const [
    typing,
    setTyping,
  ] = useState(false);

  const [
    sending,
    setSending,
  ] = useState(false);

  const bottomRef =
    useRef<HTMLDivElement>(
      null,
    );

  const fileInputRef =
    useRef<HTMLInputElement>(
      null,
    );

  const typingTimerRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | undefined
    >(undefined);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [
    messages,
    typing,
    attachment,
  ]);

  useEffect(() => {
    return () => {
      if (
        typingTimerRef.current
      ) {
        clearTimeout(
          typingTimerRef.current,
        );
      }
    };
  }, []);

  const handleAttachment =
    (
      event:
        ChangeEvent<HTMLInputElement>,
    ) => {
      const file =
        event.target
          .files?.[0];

      if (!file) {
        return;
      }

      if (
        !file.type.startsWith(
          "image/",
        )
      ) {
        event.target.value =
          "";

        return;
      }

      const reader =
        new FileReader();

      reader.onload = () => {
        if (
          typeof reader.result ===
          "string"
        ) {
          setAttachment(
            reader.result,
          );
        }
      };

      reader.readAsDataURL(
        file,
      );

      event.target.value = "";
    };

  const simulateAgentReply =
    () => {
      setTyping(true);

      typingTimerRef.current =
        setTimeout(() => {
          setTyping(false);

          setMessages(
            (previous) => [
              ...previous,
              {
                id:
                  `agent-${Date.now()}`,

                sender:
                  "agent",

                message:
                  "Thanks for sharing that. Let me look into this for you.",

                createdAt:
                  new Date()
                    .toISOString(),
              },
            ],
          );
        }, 1400);
    };

  const sendMessage =
    () => {
      const cleanMessage =
        message.trim();

      if (
        (!cleanMessage &&
          !attachment) ||
        sending
      ) {
        return;
      }

      setSending(true);

      const newMessage:
        ChatMessage = {
          id:
            `passenger-${Date.now()}`,

          sender:
            "passenger",

          message:
            cleanMessage,

          createdAt:
            new Date()
              .toISOString(),

          image:
            attachment ??
            undefined,
        };

      setMessages(
        (previous) => [
          ...previous,
          newMessage,
        ],
      );

      setMessage("");
      setAttachment(null);
      setSending(false);

      /*
       * FRONTEND PREVIEW ONLY
       *
       * Remove this once the real
       * live-chat socket/API is connected.
       */
      simulateAgentReply();
    };

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

        sendMessage();
      }
    };

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#F7F6F8]">
      {/* =========================
          HEADER
      ========================== */}

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
          <motion.button
            type="button"
            whileTap={{
              scale: 0.9,
            }}
            onClick={() =>
              navigate(
                "/passenger/account/support",
              )
            }
            aria-label="Back to support"
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

          {/* AGENT AVATAR */}

          <div className="relative shrink-0">
            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                overflow-hidden
                rounded-full
                bg-[#EDE5F5]
                text-[14px]
                font-semibold
                text-[#7442AD]
              "
            >
              HW
            </div>

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
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-[#302B34]">
              Harry Wilson
            </p>

            <p className="mt-0.5 text-[12px] font-medium text-[#7442AD]">
              Support agent
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#36A665]" />

            <span className="hidden text-[12px] text-[#817A85] sm:inline">
              Online
            </span>
          </div>
        </div>
      </header>

      {/* =========================
          CHAT BODY
      ========================== */}

      <main className="min-h-0 flex-1 overflow-y-auto">
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
          {/* DATE */}

          <div className="mb-3 text-center">
            <span className="text-[11px] font-medium text-[#9B95A0]">
              Mon, Jul 15
            </span>
          </div>

          {/* MESSAGES */}

          <div className="flex-1">
            <AnimatePresence
              initial={false}
            >
              {messages.map(
                (item) => {
                  const passenger =
                    item.sender ===
                    "passenger";

                  return (
                    <motion.div
                      key={
                        item.id
                      }
                      initial={{
                        opacity: 0,
                        y: 10,
                        scale: 0.98,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                      }}
                      transition={{
                        duration: 0.22,
                      }}
                      className={`
                        mb-4
                        flex
                        flex-col

                        ${
                          passenger
                            ? "items-end"
                            : "items-start"
                        }
                      `}
                    >
                      <div
                        className={`
                          max-w-[85%]
                          overflow-hidden
                          whitespace-pre-line
                          text-[14px]
                          leading-[21px]

                          ${
                            passenger
                              ? `
                                rounded-[20px]
                                rounded-br-[6px]
                                bg-[#7442AD]
                                text-white
                              `
                              : `
                                rounded-[20px]
                                rounded-bl-[6px]
                                bg-white
                                text-[#302B34]
                                shadow-[0_5px_22px_rgba(35,25,44,0.04)]
                              `
                          }
                        `}
                      >
                        {item.image && (
                          <img
                            src={
                              item.image
                            }
                            alt="Chat attachment"
                            className="
                              max-h-[260px]
                              w-full
                              object-cover
                            "
                          />
                        )}

                        {item.message && (
                          <p
                            className={`
                              px-4
                              py-3.5

                              ${
                                item.image
                                  ? "pt-3"
                                  : ""
                              }
                            `}
                          >
                            {
                              item.message
                            }
                          </p>
                        )}
                      </div>

                      <span className="mt-1.5 px-1 text-[11px] text-[#AAA4AE]">
                        {formatMessageTime(
                          item.createdAt,
                        )}
                      </span>
                    </motion.div>
                  );
                },
              )}
            </AnimatePresence>

            {/* TYPING INDICATOR */}

            <AnimatePresence>
              {typing && (
                <motion.div
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
                  className="mb-4 flex items-start"
                >
                  <div
                    className="
                      flex
                      h-[48px]
                      items-center
                      gap-1.5
                      rounded-[20px]
                      rounded-bl-[6px]
                      bg-white
                      px-5
                      shadow-[0_5px_22px_rgba(35,25,44,0.04)]
                    "
                  >
                    {[0, 1, 2].map(
                      (dot) => (
                        <motion.span
                          key={
                            dot
                          }
                          animate={{
                            y: [
                              0,
                              -4,
                              0,
                            ],
                            opacity: [
                              0.4,
                              1,
                              0.4,
                            ],
                          }}
                          transition={{
                            duration:
                              0.8,
                            repeat:
                              Infinity,
                            delay:
                              dot *
                              0.15,
                          }}
                          className="h-2 w-2 rounded-full bg-[#C9C4CD]"
                        />
                      ),
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              ref={
                bottomRef
              }
            />
          </div>
        </div>
      </main>

      {/* =========================
          COMPOSER
      ========================== */}

      <footer
        className="
          z-[50]
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
          {/* IMAGE PREVIEW */}

          <AnimatePresence>
            {attachment && (
              <motion.div
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: 10,
                }}
                className="mb-3"
              >
                <div className="relative inline-block">
                  <img
                    src={
                      attachment
                    }
                    alt="Selected attachment"
                    className="
                      h-[82px]
                      w-[82px]
                      rounded-[14px]
                      object-cover
                    "
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setAttachment(
                        null,
                      )
                    }
                    aria-label="Remove attachment"
                    className="
                      absolute
                      -right-2
                      -top-2
                      flex
                      h-6
                      w-6
                      items-center
                      justify-center
                      rounded-full
                      bg-[#302B34]
                      text-[14px]
                      text-white
                      shadow
                    "
                  >
                    ×
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
            <input
              ref={
                fileInputRef
              }
              type="file"
              accept="image/*"
              onChange={
                handleAttachment
              }
              className="hidden"
            />

            <motion.button
              type="button"
              whileTap={{
                scale: 0.9,
              }}
              onClick={() =>
                fileInputRef.current?.click()
              }
              aria-label="Attach image"
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
              "
            >
              <Camera
                size={20}
                strokeWidth={1.9}
              />
            </motion.button>

            <textarea
              value={
                message
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
              maxLength={1000}
              placeholder="Write a message"
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
              "
            />

            <motion.button
              type="button"
              whileTap={
                message.trim() ||
                attachment
                  ? {
                      scale: 0.88,
                    }
                  : undefined
              }
              disabled={
                (!message.trim() &&
                  !attachment) ||
                sending
              }
              onClick={
                sendMessage
              }
              aria-label="Send message"
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
              <Send
                size={18}
                strokeWidth={2}
              />
            </motion.button>
          </div>
        </div>
      </footer>
    </div>
  );
}