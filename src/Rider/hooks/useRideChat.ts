import { useCallback, useEffect, useRef, useState } from "react";
import {
  getConversations,
  getMessages,
  getRideConversation,
  markConversationRead,
  sendAttachment,
  sendMessage,
} from "../api/chat";
import {
  conversationIdOf,
  mapMessage,
  myUserId,
  unwrapList,
  type ChatMsg,
} from "../lib/chatMap";

/**
 * Chat for one ride: finds the conversation, loads + polls messages, sends
 * text/photos and marks the thread read. Sent messages show up instantly, and
 * a message that fails stays in the list with a retry instead of vanishing.
 */
export function useRideChat(rideId: string | undefined, enabled: boolean) {
  const [convId, setConvId] = useState<string>();
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const convRef = useRef<string>();
  const timer = useRef<number>();
  const me = useRef(myUserId());

  const load = useCallback(async (id: string) => {
    const raw = await getMessages(id);
    const list = unwrapList(raw)
      .map((m) => mapMessage(m, me.current))
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    // keep messages still sending / failed that the server doesn't have yet
    setMessages((cur) => [...list, ...cur.filter((m) => m.id.startsWith("tmp-"))]);
  }, []);

  /** Finds this ride's conversation id (GET /chat/rides/:id, then the list). */
  const connect = useCallback(async (): Promise<string> => {
    if (convRef.current) return convRef.current;
    if (!rideId) throw new Error("No active ride to chat about. Accept a ride request first, then open the chat.");
    let id: string | undefined;
    try {
      const raw = await getRideConversation(rideId);
      console.log("[chat] GET /chat/rides/:id", raw);
      id = conversationIdOf(raw);
    } catch (e) {
      console.warn("[chat] ride conversation lookup failed", e);
    }
    if (!id) {
      const raw = await getConversations();
      console.log("[chat] GET /chat/conversations", raw);
      const hit = unwrapList(raw).find(
        (c: any) => String(c.rideId ?? c.ride?.id ?? c.ride?._id ?? "") === String(rideId),
      );
      id = hit ? conversationIdOf(hit) : undefined;
    }
    if (!id) throw new Error("Chat isn't available for this ride yet.");
    convRef.current = id;
    setConvId(id);
    return id;
  }, [rideId]);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const id = await connect();
        if (!alive) return;
        await load(id);
        markConversationRead(id).catch(() => {});
        timer.current = window.setInterval(() => load(id).catch(() => {}), 4000);
      } catch (e: any) {
        if (alive) setError(e?.message ?? "Failed to open chat");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [enabled, connect, load]);

  const deliver = useCallback(
    async (tmpId: string, content: string) => {
      setSending(true);
      setError(null);
      try {
        const id = await connect();
        const res = await sendMessage(id, content);
        console.log("[chat] POST message", res);
        await load(id);
        // If the server list doesn't include it yet, show what the POST returned.
        const sent = res?.data?.message ?? res?.data ?? res?.message ?? res;
        setMessages((cur) => {
          const rest = cur.filter((m) => m.id !== tmpId);
          const mapped = sent && (sent.id || sent._id) ? mapMessage(sent, me.current) : null;
          if (mapped && !rest.some((m) => m.id === mapped.id)) {
            return [...rest, { ...mapped, mine: true }];
          }
          return rest;
        });
        if (!timer.current) timer.current = window.setInterval(() => load(id).catch(() => {}), 4000);
      } catch (e: any) {
        console.warn("[chat] send failed", e);
        setMessages((cur) => cur.map((m) => (m.id === tmpId ? { ...m, failed: true } : m)));
        setError(e?.message ?? "Message not sent");
      } finally {
        setSending(false);
      }
    },
    [connect, load],
  );

  const send = useCallback(
    (text: string) => {
      const content = text.trim();
      if (!content) return;
      const tmpId = `tmp-${Date.now()}`;
      setMessages((m) => [
        ...m,
        { id: tmpId, mine: true, type: "text", content, createdAt: new Date().toISOString() },
      ]);
      return deliver(tmpId, content);
    },
    [deliver],
  );

  const retry = useCallback(
    (tmpId: string) => {
      const m = messages.find((x) => x.id === tmpId);
      if (!m) return;
      setMessages((cur) => cur.map((x) => (x.id === tmpId ? { ...x, failed: false } : x)));
      return deliver(tmpId, m.content);
    },
    [messages, deliver],
  );

  const sendPhoto = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Please choose an image.");
        return;
      }
      // Show the photo straight away from the local file.
      const tmpId = `tmp-${Date.now()}`;
      const preview = URL.createObjectURL(file);
      setMessages((m) => [
        ...m,
        { id: tmpId, mine: true, type: "image", content: preview, createdAt: new Date().toISOString() },
      ]);
      setSending(true);
      setError(null);
      try {
        const id = await connect();
        const res = await sendAttachment(id, file);
        console.log("[chat] POST attachment", res);
        await load(id);
        setMessages((cur) => cur.filter((x) => x.id !== tmpId));
        URL.revokeObjectURL(preview);
      } catch (e: any) {
        console.warn("[chat] photo failed", e);
        setMessages((cur) => cur.filter((x) => x.id !== tmpId));
        setError(e?.message ?? "Failed to send photo");
      } finally {
        setSending(false);
      }
    },
    [connect, load],
  );

  return { convId, messages, loading, error, sending, send, retry, sendPhoto, clearError: () => setError(null) };
}
