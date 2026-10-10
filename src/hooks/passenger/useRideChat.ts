
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";

import {
  rideChatApi,
  type ChatMessage,
  type ConversationView,
} from "../../api/passenger/rideChat.api";

import { passengerSession } from "../../api/passenger/passengerSession";

export interface UseRideChatOptions {
  rideId: string;
  currentUserId: string;
}

interface SendMessageAck {
  success: boolean;
  message?: ChatMessage;
  code?: string;
  error?: string;
}

interface TypingEvent {
  conversationId: string;
  userId?: string;
}

interface ReadReceiptEvent {
  conversationId: string;
  userId: string;
  readAt: string;
}

interface ChatClosedEvent {
  rideId: string;
  code?: string;
  message?: string;
}

interface ChatWindowEvent {
  rideId: string;
  canSend: boolean;
  canCall: boolean;
  expiresAt: string | null;
}

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || ""
).replace(/\/+$/, "");

function mergeMessages(
  previous: ChatMessage[],
  incoming: ChatMessage[],
): ChatMessage[] {
  const map = new Map<string, ChatMessage>();

  for (const message of previous) {
    map.set(message.id, message);
  }

  for (const message of incoming) {
    map.set(message.id, message);
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(a.createdAt).getTime() -
      new Date(b.createdAt).getTime(),
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export function useRideChat({
  rideId,
  currentUserId,
}: UseRideChatOptions) {
  const [conversation, setConversation] =
    useState<ConversationView | null>(null);

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [readAt, setReadAt] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const conversationRef =
    useRef<ConversationView | null>(null);

  const typingTimer =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const remoteTypingTimer =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const typingStarted = useRef(false);
  const mountedRef = useRef(false);
  const sendingRef = useRef(false);
  const uploadingRef = useRef(false);
  const loadingMoreRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!rideId) return;

    const view =
      await rideChatApi.openConversation(rideId);

    if (!mountedRef.current) return;

    conversationRef.current = view;
    setConversation(view);

    const history = await rideChatApi.getMessages(
      view.id,
      1,
      30,
    );

    if (!mountedRef.current) return;

    setMessages((previous) =>
      mergeMessages(
        previous.filter(
          (message) =>
            message.conversationId === view.id,
        ),
        history.items,
      ),
    );

    setPage(1);
    setHasMore(history.meta.hasNextPage);

    await rideChatApi
      .markAsRead(view.id)
      .catch(() => undefined);
  }, [rideId]);

  useEffect(() => {
    mountedRef.current = true;

    let cancelled = false;
    let socket: Socket | null = null;

    setLoading(true);
    setError(null);
    setConnected(false);
    setConversation(null);
    setMessages([]);
    setPage(1);
    setHasMore(false);
    setReadAt(null);
    setOtherTyping(false);

    conversationRef.current = null;

    const connect = async () => {
      try {
        await refresh();

        if (cancelled) return;

        if (!API_BASE_URL) {
          throw new Error(
            "VITE_API_URL is missing from your environment.",
          );
        }

        socket = io(`${API_BASE_URL}/chat`, {
          auth: (callback) => {
            callback({
              token: passengerSession.getAccessToken(),
            });
          },
          autoConnect: false,
          reconnection: true,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
          if (cancelled) return;

          setConnected(true);
          setError(null);

          void refresh().catch((err) => {
            if (!cancelled) {
              setError(getErrorMessage(err));
            }
          });

          void rideChatApi
            .getUnreadCount()
            .catch(() => undefined);
        });

        socket.on("disconnect", () => {
          if (cancelled) return;

          setConnected(false);
          setOtherTyping(false);
        });

        socket.on("connect_error", (err: Error) => {
          if (cancelled) return;

          setConnected(false);
          setError(err.message);
        });

        socket.on(
          "new_message",
          (message: ChatMessage) => {
            if (
              cancelled ||
              message.conversationId !==
                conversationRef.current?.id
            ) {
              return;
            }

            setMessages((previous) =>
              mergeMessages(previous, [message]),
            );

            if (
              document.visibilityState === "visible"
            ) {
              void rideChatApi
                .markAsRead(message.conversationId)
                .catch(() => undefined);
            }
          },
        );

        socket.on(
          "user_typing",
          (event: TypingEvent) => {
            if (
              cancelled ||
              event.conversationId !==
                conversationRef.current?.id ||
              event.userId === currentUserId
            ) {
              return;
            }

            setOtherTyping(true);

            if (remoteTypingTimer.current) {
              clearTimeout(remoteTypingTimer.current);
            }

            remoteTypingTimer.current = setTimeout(
              () => setOtherTyping(false),
              3000,
            );
          },
        );

        socket.on(
          "user_stopped_typing",
          (event: TypingEvent) => {
            if (
              !cancelled &&
              event.conversationId ===
                conversationRef.current?.id
            ) {
              setOtherTyping(false);
            }
          },
        );

        socket.on(
          "read_receipt",
          (event: ReadReceiptEvent) => {
            if (
              cancelled ||
              event.conversationId !==
                conversationRef.current?.id ||
              event.userId === currentUserId
            ) {
              return;
            }

            setReadAt(event.readAt);
          },
        );

        socket.on(
          "chat_closed",
          (event: ChatClosedEvent) => {
            if (cancelled || event.rideId !== rideId) {
              return;
            }

            setConversation((previous) => {
              if (!previous) return previous;

              const updated: ConversationView = {
                ...previous,
                messaging: {
                  ...previous.messaging,
                  canSend: false,
                  code: event.code ?? null,
                  message:
                    event.message ??
                    "Messaging is no longer available.",
                },
                calling: {
                  ...previous.calling,
                  canCall: false,
                },
              };

              conversationRef.current = updated;
              return updated;
            });
          },
        );

        socket.on(
          "chat_window_updated",
          (event: ChatWindowEvent) => {
            if (cancelled || event.rideId !== rideId) {
              return;
            }

            setConversation((previous) => {
              if (!previous) return previous;

              const updated: ConversationView = {
                ...previous,
                messaging: {
                  ...previous.messaging,
                  canSend: event.canSend,
                  expiresAt: event.expiresAt,
                },
                calling: {
                  ...previous.calling,
                  canCall: event.canCall,
                },
              };

              conversationRef.current = updated;
              return updated;
            });
          },
        );

        socket.connect();
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void connect();

    const onVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        !cancelled
      ) {
        void refresh().catch(() => undefined);

        void rideChatApi
          .getUnreadCount()
          .catch(() => undefined);
      }
    };

    document.addEventListener(
      "visibilitychange",
      onVisibilityChange,
    );

    return () => {
      cancelled = true;
      mountedRef.current = false;

      document.removeEventListener(
        "visibilitychange",
        onVisibilityChange,
      );

      socket?.disconnect();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }

      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
      }

      if (remoteTypingTimer.current) {
        clearTimeout(remoteTypingTimer.current);
      }

      typingStarted.current = false;
    };
  }, [rideId, currentUserId, refresh]);

  const stopTyping = useCallback(() => {
    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
      typingTimer.current = null;
    }

    const id = conversationRef.current?.id;

    if (
      typingStarted.current &&
      id &&
      socketRef.current?.connected
    ) {
      socketRef.current.emit("typing_stop", {
        conversationId: id,
      });
    }

    typingStarted.current = false;
  }, []);

  const notifyTyping = useCallback(() => {
    const id = conversationRef.current?.id;
    const socket = socketRef.current;

    if (
      !id ||
      !socket?.connected ||
      !conversationRef.current?.messaging.canSend
    ) {
      return;
    }

    if (!typingStarted.current) {
      socket.emit("typing_start", {
        conversationId: id,
      });

      typingStarted.current = true;
    }

    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
    }

    typingTimer.current = setTimeout(
      stopTyping,
      2000,
    );
  }, [stopTyping]);

  const send = useCallback(
    async (value: string): Promise<boolean> => {
      const content = value.trim();
      const view = conversationRef.current;

      if (
        !content ||
        !view?.messaging.canSend ||
        sendingRef.current
      ) {
        return false;
      }

      if (content.length > 1000) {
        toast.error(
          "Messages must be 1000 characters or fewer.",
        );
        return false;
      }

      sendingRef.current = true;
      setSending(true);
      stopTyping();

      try {
        const socket = socketRef.current;
        let result: ChatMessage;

        if (socket?.connected) {
          result = await new Promise<ChatMessage>(
            (resolve, reject) => {
              socket.timeout(8000).emit(
                "send_message",
                {
                  conversationId: view.id,
                  content,
                },
                (
                  timeout: Error | null,
                  ack: SendMessageAck,
                ) => {
                  if (timeout) {
                    reject(
                      new Error(
                        "Message confirmation timed out. Refresh the chat before retrying.",
                      ),
                    );
                    return;
                  }

                  if (!ack?.success || !ack.message) {
                    reject(
                      new Error(
                        ack?.error ??
                          ack?.code ??
                          "Unable to send message.",
                      ),
                    );
                    return;
                  }

                  resolve(ack.message);
                },
              );
            },
          );
        } else {
          result = await rideChatApi.sendMessage(
            view.id,
            content,
          );
        }

        if (mountedRef.current) {
          setMessages((previous) =>
            mergeMessages(previous, [result]),
          );
        }

        return true;
      } catch (err) {
        toast.error(getErrorMessage(err));
        return false;
      } finally {
        sendingRef.current = false;

        if (mountedRef.current) {
          setSending(false);
        }
      }
    },
    [stopTyping],
  );

  const upload = useCallback(
    async (
      file: File,
      caption = "",
    ): Promise<boolean> => {
      const view = conversationRef.current;

      if (
        !view?.messaging.canSend ||
        uploadingRef.current
      ) {
        return false;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("Maximum file size is 10 MB.");
        return false;
      }

      uploadingRef.current = true;
      setUploading(true);

      try {
        const result =
          await rideChatApi.uploadAttachment(
            view.id,
            file,
            caption,
          );

        if (mountedRef.current) {
          setMessages((previous) =>
            mergeMessages(previous, [result]),
          );
        }

        return true;
      } catch (err) {
        toast.error(getErrorMessage(err));
        return false;
      } finally {
        uploadingRef.current = false;

        if (mountedRef.current) {
          setUploading(false);
        }
      }
    },
    [],
  );

  const loadMore = useCallback(async () => {
    const view = conversationRef.current;

    if (
      !view ||
      !hasMore ||
      loadingMoreRef.current
    ) {
      return;
    }

    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const nextPage = page + 1;

      const history = await rideChatApi.getMessages(
        view.id,
        nextPage,
        30,
      );

      if (!mountedRef.current) return;

      setMessages((previous) =>
        mergeMessages(previous, history.items),
      );

      setPage(nextPage);
      setHasMore(history.meta.hasNextPage);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      loadingMoreRef.current = false;

      if (mountedRef.current) {
        setLoadingMore(false);
      }
    }
  }, [hasMore, page]);

  return {
    conversation,
    messages,
    loading,
    loadingMore,
    sending,
    uploading,
    error,
    connected,
    otherTyping,
    readAt,
    hasMore,
    send,
    upload,
    loadMore,
    notifyTyping,
    stopTyping,
    refresh,
  };
}
