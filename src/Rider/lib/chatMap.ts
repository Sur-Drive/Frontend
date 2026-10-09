/** Flattens whatever the chat API returns into the shape the chat screen draws. */
export interface ChatMsg {
  id: string;
  failed?: boolean;
  mine: boolean;
  type: "text" | "image";
  content: string;
  createdAt: string;
}

const pick = (...v: any[]) => v.find((x) => x !== undefined && x !== null && x !== "");

export const unwrapList = (raw: any): any[] => {
  const c = pick(raw?.data?.items, raw?.data?.messages, raw?.data, raw?.items, raw?.messages, raw);
  return Array.isArray(c) ? c : [];
};

export const conversationIdOf = (raw: any): string | undefined => {
  const c = raw?.data?.conversation ?? raw?.conversation ?? raw?.data ?? raw;
  return pick(c?.id, c?._id, c?.conversationId);
};

export function mapMessage(m: any, myId?: string): ChatMsg {
  const senderRole = String(pick(m.senderRole, m.sender?.role, m.senderType, "")).toLowerCase();
  const senderId = pick(m.senderId, m.sender?.id, m.sender?._id, m.userId);
  const mine =
    m.mine === true ||
    senderRole.includes("driver") ||
    (!!myId && !!senderId && String(senderId) === String(myId));
  const url = pick(m.attachmentUrl, m.imageUrl, m.attachment?.url, m.url);
  const isImage = !!url || String(pick(m.type, m.messageType, "")).toLowerCase() === "image";
  return {
    id: String(pick(m.id, m._id, `${m.createdAt}-${m.content}`)),
    mine,
    type: isImage ? "image" : "text",
    content: isImage ? String(url ?? m.content) : String(pick(m.content, m.text, m.message, "")),
    createdAt: pick(m.createdAt, m.sentAt, m.timestamp, new Date().toISOString()),
  };
}

/** "Mon, Jul 15, 5:35 AM" */
export const stampLabel = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

/** The logged-in driver's user id, read from the JWT in localStorage "token". */
export function myUserId(): string | undefined {
  try {
    const t = localStorage.getItem("token");
    if (!t) return undefined;
    const payload = JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    const id = payload.sub ?? payload.userId ?? payload.id ?? payload.driverId;
    return id ? String(id) : undefined;
  } catch {
    return undefined;
  }
}
