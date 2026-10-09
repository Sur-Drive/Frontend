import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getTicketDetail,
  getTicketMessages,
  mapTicketMessage,
  markTicketRead,
  sendTicketAttachment,
  sendTicketMessage,
  reopenTicket,
  resolveTicket,
  type Ticket,
  type TicketMessage,
  type TicketPermissions,
} from "../api/support";
import { myUserId, stampLabel } from "../lib/chatMap";
import {
  acquireSupportSocket,
  releaseSupportSocket,
} from "../lib/supportSocket";

const MAX_LEN = 2000;
const MAX_FILE = 10 * 1024 * 1024;
const TYPING_EVERY = 2500;
const TYPING_IDLE = 2000;
const TYPING_HIDE = 4000;

/** Insert or replace by id (the new_message echo and the REST/ack reply are the same message). */
function upsert(list: TicketMessage[], m: TicketMessage): TicketMessage[] {
  const i = list.findIndex((x) => x.id === m.id);
  if (i === -1) return [...list, m];
  const next = [...list];
  next[i] = m;
  return next;
}

const FRIENDLY: Record<string, string> = {
  SUPPORT_TICKET_RESOLVED: "This ticket has been resolved.",
  SUPPORT_EMPTY_MESSAGE: "Write a message first.",
  SUPPORT_TICKET_NOT_FOUND: "Ticket not found.",
  SUPPORT_REOPEN_WINDOW_EXPIRED:
    "This ticket can no longer be reopened. Please raise a new ticket.",
  RATE_LIMITED: "You're sending too fast. Please wait a moment.",
  ATTACHMENT_TOO_LARGE: "That file is over 10 MB.",
  ATTACHMENT_TYPE_NOT_ALLOWED: "That file type isn't supported.",
  ATTACHMENT_CONTENT_MISMATCH: "That file doesn't match its type.",
  ATTACHMENT_TOO_LONG: "Voice notes can be at most 5 minutes.",
  ATTACHMENT_EMPTY: "That file is empty.",
};

const errText = (e: any, fallback: string) =>
  (e?.code && FRIENDLY[e.code]) || e?.message || fallback;

/**
 * Realtime support-ticket chat (rider/driver side).
 *  - REST: ticket detail + history (newest-first, reversed here), attachments, read, resolve/reopen
 *  - Socket /support: send_message, new_message, typing, read receipts, ticket_updated
 *  - Reconnect: socket events aren't replayed, so every `connect` refetches and merges by id.
 */
export function useTicketChat(ticketId: string) {
  const qc = useQueryClient();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [permissions, setPermissions] = useState<TicketPermissions | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [typing, setTyping] = useState(false);
  const [readAt, setReadAt] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);

  const alive = useRef(true);
  const socketRef = useRef<ReturnType<typeof acquireSupportSocket> | null>(null);
  const pendingSeq = useRef(0);
  const typingSentAt = useRef(0);
  const typingIdle = useRef<ReturnType<typeof setTimeout>>();
  const typingHide = useRef<ReturnType<typeof setTimeout>>();

  const refreshLists = useCallback(
    () => qc.invalidateQueries({ queryKey: ["support"] }),
    [qc],
  );

  /** Fetch detail + history and merge by id, keeping local not-yet-confirmed bubbles. */
  const load = useCallback(
    async (initial = false) => {
      try {
        const [d, msgs] = await Promise.all([
          getTicketDetail(ticketId),
          getTicketMessages(ticketId),
        ]);
        if (!alive.current) return;
        setTicket(d.ticket);
        setPermissions(d.permissions);
        setMessages((prev) => {
          const local = prev.filter((m) => m.status);
          return [...msgs, ...local];
        });
        setLoadError("");
        markTicketRead(ticketId)
          .then(refreshLists)
          .catch(() => {});
      } catch (e: any) {
        if (!alive.current) return;
        if (initial) setLoadError(errText(e, "Could not load this ticket"));
        else setError(errText(e, "Could not refresh"));
      } finally {
        if (initial && alive.current) setLoading(false);
      }
    },
    [ticketId, refreshLists],
  );

  useEffect(() => {
    alive.current = true;
    setLoading(true);
    setMessages([]);
    load(true);

    const socket = acquireSupportSocket();
    socketRef.current = socket;
    setConnected(socket.connected);

    const onConnect = () => {
      setConnected(true);
      load(); // events aren't replayed — resync
      refreshLists();
    };
    const onDisconnect = () => setConnected(false);

    const onNew = (raw: any) => {
      if (raw?.ticketId && String(raw.ticketId) !== ticketId) return;
      const m = mapTicketMessage(raw);
      setMessages((prev) => upsert(prev, m));
      if (m.sender !== "user") {
        setTyping(false);
        // Chat is open: the agent's message is read immediately.
        socket.timeout(5000).emit("message_read", { ticketId }, () => {});
        refreshLists();
      }
    };

    const onUpdated = (p: any) => {
      if (p?.id && String(p.id) !== ticketId && String(p?.ticketId ?? "") !== ticketId) return;
      load(); // permissions / status may have changed
      refreshLists();
    };

    const onReceipt = (p: any) => {
      if (String(p?.ticketId) !== ticketId) return;
      // Our own read receipt can echo back; only the agent's matters.
      const me = myUserId();
      if (me && p?.userId && String(p.userId) === me) return;
      if (p?.readAt) setReadAt((cur) => (!cur || p.readAt > cur ? p.readAt : cur));
    };

    const onTyping = (p: any) => {
      if (String(p?.ticketId) !== ticketId || p?.senderType === "requester") return;
      setTyping(true);
      clearTimeout(typingHide.current);
      typingHide.current = setTimeout(() => setTyping(false), TYPING_HIDE);
    };
    const onStopped = (p: any) => {
      if (String(p?.ticketId) !== ticketId || p?.senderType === "requester") return;
      setTyping(false);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("new_message", onNew);
    socket.on("ticket_updated", onUpdated);
    socket.on("read_receipt", onReceipt);
    socket.on("user_typing", onTyping);
    socket.on("user_stopped_typing", onStopped);

    return () => {
      alive.current = false;
      clearTimeout(typingIdle.current);
      clearTimeout(typingHide.current);
      if (socket.connected) {
        socket.emit("typing_stop", { ticketId });
      }
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("new_message", onNew);
      socket.off("ticket_updated", onUpdated);
      socket.off("read_receipt", onReceipt);
      socket.off("user_typing", onTyping);
      socket.off("user_stopped_typing", onStopped);
      releaseSupportSocket();
      socketRef.current = null;
    };
  }, [ticketId, load, refreshLists]);

  /* ------------------------------- typing ------------------------------- */

  const stopTyping = useCallback(() => {
    clearTimeout(typingIdle.current);
    if (typingSentAt.current) {
      typingSentAt.current = 0;
      socketRef.current?.connected &&
        socketRef.current.emit("typing_stop", { ticketId });
    }
  }, [ticketId]);

  /** Call from the input's onChange. Throttled: start at most every 2.5s, stop after ~2s idle. */
  const notifyTyping = useCallback(() => {
    const s = socketRef.current;
    if (!s?.connected) return;
    const now = Date.now();
    if (now - typingSentAt.current > TYPING_EVERY) {
      typingSentAt.current = now;
      s.emit("typing_start", { ticketId });
    }
    clearTimeout(typingIdle.current);
    typingIdle.current = setTimeout(stopTyping, TYPING_IDLE);
  }, [ticketId, stopTyping]);

  /* ------------------------------- sending ------------------------------ */

  const deliver = useCallback(
    async (pendingId: string, content: string) => {
      const settle = (m: TicketMessage) =>
        setMessages((prev) => upsert(prev.filter((x) => x.id !== pendingId), m));
      const fail = () =>
        setMessages((prev) =>
          prev.map((x) => (x.id === pendingId ? { ...x, status: "failed" } : x)),
        );

      const s = socketRef.current;
      try {
        if (s?.connected) {
          const ack: any = await new Promise((resolve, reject) =>
            s.timeout(5000).emit("send_message", { ticketId, content }, (err: any, res: any) =>
              err ? reject(err) : resolve(res),
            ),
          );
          if (!ack?.success) {
            // Server said no (4xx-style): don't retry, show why.
            setMessages((prev) => prev.filter((x) => x.id !== pendingId));
            setError(errText(ack, "Message not sent"));
            if (ack?.code === "SUPPORT_TICKET_RESOLVED") load();
            return;
          }
          settle(mapTicketMessage(ack.message));
        } else {
          settle(await sendTicketMessage(ticketId, content));
        }
        refreshLists();
      } catch (e: any) {
        // REST 4xx (carries a status) is final; anything else is a network/timeout failure.
        if (e?.status && e.status < 500) {
          setMessages((prev) => prev.filter((x) => x.id !== pendingId));
          setError(errText(e, "Message not sent"));
          if (e.code === "SUPPORT_TICKET_RESOLVED") load();
        } else {
          fail();
        }
      }
    },
    [ticketId, load, refreshLists],
  );

  const send = useCallback(
    (raw: string) => {
      const content = raw.trim();
      if (!content) return false;
      if (content.length > MAX_LEN) {
        setError(`Messages can be at most ${MAX_LEN} characters.`);
        return false;
      }
      setError("");
      stopTyping();
      const createdAt = new Date().toISOString();
      const id = `pending-${++pendingSeq.current}`;
      setMessages((prev) => [
        ...prev,
        {
          id,
          sender: "user",
          text: content,
          time: stampLabel(createdAt),
          createdAt,
          status: "sending",
        },
      ]);
      deliver(id, content);
      return true;
    },
    [deliver, stopTyping],
  );

  /** Retry a failed bubble. There's no idempotency key, so refetch first to avoid a duplicate. */
  const retry = useCallback(
    async (pendingId: string) => {
      const target = messages.find((m) => m.id === pendingId);
      if (!target) return;
      setMessages((prev) =>
        prev.map((x) => (x.id === pendingId ? { ...x, status: "sending" } : x)),
      );
      try {
        const fresh = await getTicketMessages(ticketId);
        const already = fresh.some(
          (m) =>
            m.sender === "user" &&
            m.text === target.text &&
            m.createdAt >= target.createdAt,
        );
        if (already) {
          setMessages([...fresh, ...messages.filter((m) => m.status && m.id !== pendingId)]);
          return;
        }
      } catch {
        /* fall through and just try sending */
      }
      deliver(pendingId, target.text);
    },
    [messages, ticketId, deliver],
  );

  const discard = useCallback(
    (pendingId: string) =>
      setMessages((prev) => prev.filter((m) => m.id !== pendingId)),
    [],
  );

  const sendFile = useCallback(
    async (file: File) => {
      setError("");
      if (file.size > MAX_FILE) {
        setError(FRIENDLY.ATTACHMENT_TOO_LARGE);
        return;
      }
      setBusy(true);
      try {
        const m = await sendTicketAttachment(ticketId, file);
        setMessages((prev) => upsert(prev, m));
        refreshLists();
      } catch (e: any) {
        setError(errText(e, "Could not send the file"));
      } finally {
        if (alive.current) setBusy(false);
      }
    },
    [ticketId, refreshLists],
  );

  /* --------------------------- resolve / reopen -------------------------- */

  const act = useCallback(
    async (fn: (id: string) => Promise<unknown>) => {
      setError("");
      setBusy(true);
      try {
        await fn(ticketId);
      } catch (e: any) {
        setError(errText(e, "Something went wrong"));
      } finally {
        await load();
        refreshLists();
        if (alive.current) setBusy(false);
      }
    },
    [ticketId, load, refreshLists],
  );

  return {
    ticket,
    permissions,
    messages,
    loading,
    loadError,
    error,
    clearError: () => setError(""),
    typing,
    readAt,
    connected,
    busy,
    send,
    sendFile,
    retry,
    discard,
    notifyTyping,
    stopTyping,
    resolve: () => act(resolveTicket),
    reopen: () => act(reopenTicket),
    reload: () => load(true),
  };
}
