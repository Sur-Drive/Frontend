// import { driverFetch } from "./account";
// import { mapRide } from "../lib/rideMap";
// import { myUserId, stampLabel } from "../lib/chatMap";

// const enc = encodeURIComponent;

// /* --------------------------------- types --------------------------------- */

// export interface TicketMessage {
//   id: string;
//   sender: "user" | "agent" | "system";
//   text: string;
//   imageUrl?: string;
//   time: string;
//   createdAt: string;
// }

// export interface Ticket {
//   id: string;
//   number: string;
//   createdAt: string;
//   createdLabel: string;
//   title: string;
//   description: string;
//   status: "Open" | "Closed";
//   priority: "Low" | "Medium" | "High";
//   actionLabel: "Reply" | "Details";
//   updatedLabel: string;
//   hint: string;
//   unread: boolean;
//   escalated?: boolean;
// }

// export interface SupportRide {
//   id: string;
//   label: string;
// }

// export type TicketPriority = "low" | "medium" | "high";
// export type TicketSort = "recent" | "oldest" | "priority";

// /* ------------------------------- normalizers ------------------------------ */

// const pick = (...v: any[]) => v.find((x) => x !== undefined && x !== null && x !== "");

// export function extractList(body: any): any[] {
//   if (Array.isArray(body)) return body;
//   for (const c of [
//     body?.data?.items,
//     body?.data?.tickets,
//     body?.data?.rides,
//     body?.data?.messages,
//     body?.data,
//     body?.items,
//     body?.tickets,
//     body?.rides,
//     body?.messages,
//   ]) {
//     if (Array.isArray(c)) return c;
//   }
//   return [];
// }

// const unwrapOne = (body: any, key: string) =>
//   body?.data?.[key] ?? body?.[key] ?? body?.data ?? body;

// const longDate = (iso?: string) =>
//   iso
//     ? new Date(iso).toLocaleString("en-US", {
//         month: "short",
//         day: "numeric",
//         year: "numeric",
//         hour: "numeric",
//         minute: "2-digit",
//       })
//     : "";

// function ago(iso?: string) {
//   if (!iso) return "";
//   const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
//   if (s < 60) return "Just now";
//   if (s < 3600) return `${Math.floor(s / 60)}m ago`;
//   if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
//   if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
//   return longDate(iso);
// }

// export function mapTicket(t: any): Ticket {
//   const id = String(pick(t?.id, t?._id, t?.ticketId, ""));
//   const st = String(pick(t?.status, "open")).toLowerCase();
//   const closed = ["closed", "resolved", "done"].includes(st);
//   const pr = String(pick(t?.priority, t?.priotity, "medium")).toLowerCase();
//   const priority = (pr === "low" ? "Low" : pr === "high" ? "High" : "Medium") as Ticket["priority"];
//   const unreadN = Number(pick(t?.unreadCount, t?.unread_count, 0));
//   const unread = t?.unread === true || t?.hasUnread === true || unreadN > 0;
//   const createdAt = String(pick(t?.createdAt, t?.created_at, ""));
//   const updatedAt = String(pick(t?.lastMessageAt, t?.updatedAt, createdAt, ""));
//   return {
//     id,
//     number: String(pick(t?.ticketNumber, t?.reference, t?.number, t?.code, id.slice(0, 8).toUpperCase())),
//     createdAt,
//     createdLabel: longDate(createdAt),
//     title: String(pick(t?.subject, t?.title, "Support ticket")),
//     description: String(pick(t?.description, "")),
//     status: closed ? "Closed" : "Open",
//     priority,
//     escalated: t?.escalated === true,
//     actionLabel: closed ? "Details" : "Reply",
//     updatedLabel: ago(updatedAt),
//     hint: closed ? "Resolved" : unread ? "New reply from support" : "Awaiting support",
//     unread,
//   };
// }

// export function mapTicketMessage(m: any): TicketMessage {
//   const role = String(pick(m?.senderRole, m?.sender?.role, m?.senderType, m?.authorType, m?.type, "")).toLowerCase();
//   const senderId = pick(m?.senderId, m?.sender?.id, m?.sender?._id, m?.userId);
//   const me = myUserId();
//   let sender: TicketMessage["sender"] = "user";
//   if (m?.isSystem === true || role.includes("system")) sender = "system";
//   else if (me && senderId && String(senderId) === me) sender = "user";
//   else if (/admin|agent|support|staff|operator/.test(role)) sender = "agent";
//   const createdAt = String(pick(m?.createdAt, m?.sentAt, new Date().toISOString()));
//   const img = pick(m?.attachmentUrl, m?.imageUrl, m?.attachment?.url, m?.url);
//   return {
//     id: String(pick(m?.id, m?._id, `${createdAt}-${m?.content}`)),
//     sender,
//     text: String(pick(m?.content, m?.message, m?.text, "")),
//     imageUrl: img ? String(img) : undefined,
//     time: stampLabel(createdAt),
//     createdAt,
//   };
// }

// /* ---------------------------------- calls --------------------------------- */

// /** GET /support/rides — rides a ticket can be raised about. */
// export async function getSupportRides(): Promise<SupportRide[]> {
//   const body = await driverFetch("/support/rides", "GET", "Failed to load rides");
//   return extractList(body)
//     .map((r) => {
//       const v = mapRide(r);
//       const when = pick(r?.completedAt, r?.createdAt, r?.requestedAt);
//       const date = when
//         ? new Date(when).toLocaleDateString("en-US", { day: "numeric", month: "short" })
//         : "";
//       return {
//         id: String(pick(v.id, r?.rideId, "")),
//         label: `${v.pickupShort} → ${v.dropoffShort}${date ? `, ${date}` : ""}`,
//       };
//     })
//     .filter((r) => r.id);
// }

// export interface TicketQuery {
//   status?: "open" | "closed";
//   searchValue?: string;
//   sort?: TicketSort;
// }

// /** GET /support/tickets?status&searchValue&sort */
// export async function getTickets(q: TicketQuery = {}): Promise<Ticket[]> {
//   const qs = new URLSearchParams();
//   if (q.status) qs.set("status", q.status);
//   if (q.searchValue) qs.set("searchValue", q.searchValue);
//   qs.set("sort", q.sort ?? "recent");
//   const body = await driverFetch(`/support/tickets?${qs}`, "GET", "Failed to load tickets");
//   return extractList(body).map(mapTicket);
// }

// /** GET /support/tickets/unread */
// export async function getUnreadTickets(): Promise<number> {
//   const b = await driverFetch("/support/tickets/unread", "GET", "Failed to load unread tickets");
//   const n = pick(b?.data?.count, b?.data?.unread, b?.data?.unreadCount, b?.count, b?.unread, b?.unreadCount, b?.data);
//   if (typeof n === "number") return n;
//   const list = extractList(b);
//   return list.length;
// }

// /** GET /support/tickets/:id */
// export async function getTicket(id: string): Promise<Ticket> {
//   const b = await driverFetch(`/support/tickets/${enc(id)}`, "GET", "Failed to load ticket");
//   return mapTicket(unwrapOne(b, "ticket"));
// }

// /** GET /support/tickets/:id/messages */
// export async function getTicketMessages(id: string): Promise<TicketMessage[]> {
//   const b = await driverFetch(`/support/tickets/${enc(id)}/messages`, "GET", "Failed to load messages");
//   return extractList(b)
//     .map(mapTicketMessage)
//     .sort((a, b2) => +new Date(a.createdAt) - +new Date(b2.createdAt));
// }

// /** POST /support/tickets/:id/messages { content } */
// export const sendTicketMessage = (id: string, content: string) =>
//   driverFetch(`/support/tickets/${enc(id)}/messages`, "POST", "Failed to send message", { content });

// /** POST /support/tickets/:id/attachments (multipart, field "file") */
// export const sendTicketAttachment = (id: string, file: File) => {
//   const fd = new FormData();
//   fd.append("file", file);
//   return driverFetch(`/support/tickets/${enc(id)}/attachments`, "POST", "Failed to send photo", fd);
// };

// /** PATCH /support/tickets/:id/read */
// export const markTicketRead = (id: string) =>
//   driverFetch(`/support/tickets/${enc(id)}/read`, "PATCH", "Failed to mark read");

// /** POST /support/tickets/:id/resolve */
// export const resolveTicket = (id: string) =>
//   driverFetch(`/support/tickets/${enc(id)}/resolve`, "POST", "Failed to resolve ticket");

// /** POST /support/tickets/:id/reopen */
// export const reopenTicket = (id: string) =>
//   driverFetch(`/support/tickets/${enc(id)}/reopen`, "POST", "Failed to reopen ticket");

// export interface NewTicketInput {
//   rideId?: string;
//   subject: string;
//   description: string;
//   priority: TicketPriority;
// }

// /**
//  * POST /support/tickets { rideId, subject, description, priority }.
//  * The API doc spells the field "priotity"; if the server rejects "priority"
//  * for that reason we retry once with the other spelling.
//  */
// export async function createTicket(input: NewTicketInput): Promise<Ticket> {
//   const base: Record<string, unknown> = {
//     subject: input.subject,
//     description: input.description,
//   };
//   if (input.rideId) base.rideId = input.rideId;

//   const post = (field: "priority" | "priotity") =>
//     driverFetch("/support/tickets", "POST", "Failed to create ticket", {
//       ...base,
//       [field]: input.priority,
//     });

//   let res: any;
//   try {
//     res = await post("priority");
//   } catch (e: any) {
//     if (!/priotity|priority/i.test(e?.message ?? "")) throw e;
//     res = await post("priotity");
//   }
//   return mapTicket(unwrapOne(res, "ticket"));
// }

import { driverFetch } from "./account";
import { mapRide } from "../lib/rideMap";
import { myUserId, stampLabel } from "../lib/chatMap";

const enc = encodeURIComponent;

/* --------------------------------- types --------------------------------- */

export interface TicketAttachment {
  kind: "image" | "audio" | "file";
  url: string;
  thumbnailUrl?: string;
  name: string;
  size: number;
  durationSeconds?: number;
}

export interface TicketMessage {
  id: string;
  sender: "user" | "agent" | "system";
  /** "system" sender + type "system" = centred notice; system + text = support bubble (mapped to "agent"). */
  text: string;
  attachment?: TicketAttachment;
  time: string;
  createdAt: string;
  /** Local-only: optimistic bubble state. */
  status?: "sending" | "failed";
}

export interface TicketPermissions {
  canReply: boolean;
  canResolve: boolean;
  canReopen: boolean;
}

export interface TicketDetail {
  ticket: Ticket;
  permissions: TicketPermissions;
}

export interface Ticket {
  id: string;
  number: string;
  createdAt: string;
  createdLabel: string;
  title: string;
  description: string;
  status: "Open" | "Closed";
  priority: "Low" | "Medium" | "High";
  actionLabel: "Reply" | "Details";
  updatedLabel: string;
  hint: string;
  unread: boolean;
  escalated?: boolean;
  agentName?: string;
}

export interface SupportRide {
  id: string;
  label: string;
}

export type TicketPriority = "low" | "medium" | "high";
export type TicketSort = "recent" | "oldest" | "priority";

/* ------------------------------- normalizers ------------------------------ */

const pick = (...v: any[]) =>
  v.find((x) => x !== undefined && x !== null && x !== "");

export function extractList(body: any): any[] {
  if (Array.isArray(body)) return body;
  for (const c of [
    body?.data?.items,
    body?.data?.tickets,
    body?.data?.rides,
    body?.data?.messages,
    body?.data,
    body?.items,
    body?.tickets,
    body?.rides,
    body?.messages,
  ]) {
    if (Array.isArray(c)) return c;
  }
  return [];
}

const unwrapOne = (body: any, key: string) =>
  body?.data?.[key] ?? body?.[key] ?? body?.data ?? body;

const longDate = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

function ago(iso?: string) {
  if (!iso) return "";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return longDate(iso);
}

export function mapTicket(t: any): Ticket {
  const id = String(pick(t?.id, t?._id, t?.ticketId, ""));
  const st = String(pick(t?.status, "open")).toLowerCase();
  const closed = ["closed", "resolved", "done"].includes(st);
  const pr = String(pick(t?.priority, t?.priotity, "medium")).toLowerCase();
  const priority = (
    pr === "low" ? "Low" : pr === "high" ? "High" : "Medium"
  ) as Ticket["priority"];
  const unreadN = Number(pick(t?.unreadCount, t?.unread_count, 0));
  const unread = t?.unread === true || t?.hasUnread === true || unreadN > 0;
  const createdAt = String(pick(t?.createdAt, t?.created_at, ""));
  const updatedAt = String(pick(t?.lastMessageAt, t?.updatedAt, createdAt, ""));
  return {
    id,
    number: String(
      pick(
        t?.ticketNumber,
        t?.reference,
        t?.number,
        t?.code,
        id.slice(0, 8).toUpperCase(),
      ),
    ),
    createdAt,
    createdLabel: longDate(createdAt),
    title: String(pick(t?.subject, t?.title, "Support ticket")),
    description: String(pick(t?.description, t?.descriptionPreview, "")),
    status: closed ? "Closed" : "Open",
    priority,
    escalated: t?.escalated === true,
    agentName: pick(t?.agent?.name, t?.assignee?.name) as string | undefined,
    actionLabel: closed ? "Details" : "Reply",
    updatedLabel: ago(updatedAt),
    hint: closed
      ? "Resolved"
      : unread
        ? "New reply from support"
        : "Awaiting support",
    unread,
  };
}

function mapAttachment(m: any, kind: string): TicketAttachment | undefined {
  const a = m?.attachment;
  if (!a?.url) return undefined;
  const mime = String(a.mimeType ?? "").toLowerCase();
  const k: TicketAttachment["kind"] =
    kind === "image" || mime.startsWith("image/")
      ? "image"
      : kind === "audio" || mime.startsWith("audio/")
        ? "audio"
        : "file";
  return {
    kind: k,
    url: String(a.url),
    thumbnailUrl: a.thumbnailUrl ? String(a.thumbnailUrl) : undefined,
    name: String(a.originalName ?? "Attachment"),
    size: Number(a.size ?? 0),
    durationSeconds:
      a.durationSeconds != null ? Number(a.durationSeconds) : undefined,
  };
}

/**
 * Support message -> UI message.
 *   senderType requester -> the viewer (we are the requester in this app)
 *   senderType agent     -> support agent bubble
 *   senderType system    -> type "system" = centred notice, type "text" = support bubble
 */
export function mapTicketMessage(m: any): TicketMessage {
  const senderType = String(
    pick(m?.senderType, m?.senderRole, m?.sender?.role, ""),
  ).toLowerCase();
  const kind = String(pick(m?.type, "text")).toLowerCase();
  let sender: TicketMessage["sender"];
  if (senderType === "system") sender = kind === "system" ? "system" : "agent";
  else if (senderType === "requester") sender = "user";
  else if (senderType === "agent") sender = "agent";
  else {
    const senderId = pick(m?.senderId, m?.sender?.id, m?.userId);
    const me = myUserId();
    sender =
      me && senderId && String(senderId) === me
        ? "user"
        : /admin|agent|support|staff/.test(senderType)
          ? "agent"
          : "user";
  }
  const createdAt = String(
    pick(m?.createdAt, m?.sentAt, new Date().toISOString()),
  );
  return {
    id: String(pick(m?.id, m?._id, `${createdAt}-${m?.content}`)),
    sender,
    text: String(pick(m?.content, m?.message, m?.text, "")),
    attachment: mapAttachment(m, kind),
    time: stampLabel(createdAt),
    createdAt,
  };
}

/* ---------------------------------- calls --------------------------------- */

/** GET /support/rides — rides a ticket can be raised about. */
export async function getSupportRides(): Promise<SupportRide[]> {
  const body = await driverFetch(
    "/support/rides",
    "GET",
    "Failed to load rides",
  );
  return extractList(body)
    .map((r) => {
      const v = mapRide(r);
      const when = pick(r?.completedAt, r?.createdAt, r?.requestedAt);
      const date = when
        ? new Date(when).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
          })
        : "";
      return {
        id: String(pick(v.id, r?.rideId, "")),
        label: `${v.pickupShort} → ${v.dropoffShort}${date ? `, ${date}` : ""}`,
      };
    })
    .filter((r) => r.id);
}

export interface TicketQuery {
  status?: "open" | "closed";
  searchValue?: string;
  /** Applied in the app only. The backend rejects a `sort` query param. */
  sort?: TicketSort;
}

/** GET /support/tickets?status&searchValue  (sorting is done here, not by the API) */
export async function getTickets(q: TicketQuery = {}): Promise<Ticket[]> {
  const qs = new URLSearchParams();
  if (q.status) qs.set("status", q.status);
  if (q.searchValue) qs.set("searchValue", q.searchValue);
  const query = qs.toString();

  const body = await driverFetch(
    `/support/tickets${query ? `?${query}` : ""}`,
    "GET",
    "Failed to load tickets",
  );

  const list = extractList(body).map(mapTicket);
  const time = (t: Ticket) =>
    t.createdAt ? new Date(t.createdAt).getTime() || 0 : 0;
  const weight = { High: 3, Medium: 2, Low: 1 } as const;

  switch (q.sort ?? "recent") {
    case "oldest":
      return list.sort((a, b) => time(a) - time(b));
    case "priority":
      return list.sort(
        (a, b) => weight[b.priority] - weight[a.priority] || time(b) - time(a),
      );
    case "recent":
    default:
      // Server order is "latest message first" — don't re-sort.
      return list;
  }
}

/** GET /support/tickets/unread */
export async function getUnreadTickets(): Promise<number> {
  const b = await driverFetch(
    "/support/tickets/unread",
    "GET",
    "Failed to load unread tickets",
  );
  const n = pick(
    b?.total,
    b?.data?.total,
    b?.data?.count,
    b?.data?.unread,
    b?.data?.unreadCount,
    b?.count,
    b?.unread,
    b?.unreadCount,
    b?.data,
  );
  if (typeof n === "number") return n;
  const list = extractList(b);
  return list.length;
}

/** GET /support/tickets/:id */
export async function getTicket(id: string): Promise<Ticket> {
  const b = await driverFetch(
    `/support/tickets/${enc(id)}`,
    "GET",
    "Failed to load ticket",
  );
  return mapTicket(unwrapOne(b, "ticket"));
}

/** GET /support/tickets/:id  — detail incl. permissions + assigned agent. */
export async function getTicketDetail(id: string): Promise<TicketDetail> {
  const b = await driverFetch(
    `/support/tickets/${enc(id)}`,
    "GET",
    "Failed to load ticket",
  );
  const raw = unwrapOne(b, "ticket");
  const ticket = mapTicket(raw);
  const p = raw?.permissions ?? {};
  const closed = ticket.status === "Closed";
  return {
    ticket,
    permissions: {
      canReply: p.canReply ?? !closed,
      canResolve: p.canResolve ?? !closed,
      canReopen: p.canReopen ?? false,
    },
  };
}

/**
 * GET /support/tickets/:id/messages — the API returns NEWEST first. We reverse
 * (not re-sort by time: the opening message and greeting share a timestamp).
 */
export async function getTicketMessages(id: string): Promise<TicketMessage[]> {
  const b = await driverFetch(
    `/support/tickets/${enc(id)}/messages?page=1&limit=50`,
    "GET",
    "Failed to load messages",
  );
  return extractList(b).map(mapTicketMessage).reverse();
}

/** POST /support/tickets/:id/messages { content } (REST fallback for the socket) */
export const sendTicketMessage = async (
  id: string,
  content: string,
): Promise<TicketMessage> =>
  mapTicketMessage(
    unwrapOne(
      await driverFetch(
        `/support/tickets/${enc(id)}/messages`,
        "POST",
        "Failed to send message",
        { content },
      ),
      "message",
    ),
  );

/** POST /support/tickets/:id/attachments (multipart: file + optional caption) */
export const sendTicketAttachment = async (
  id: string,
  file: File,
  caption?: string,
): Promise<TicketMessage> => {
  const fd = new FormData();
  fd.append("file", file);
  if (caption?.trim()) fd.append("caption", caption.trim());
  return mapTicketMessage(
    unwrapOne(
      await driverFetch(
        `/support/tickets/${enc(id)}/attachments`,
        "POST",
        "Failed to send attachment",
        fd,
      ),
      "message",
    ),
  );
};

/** PATCH /support/tickets/:id/read */
export const markTicketRead = (id: string) =>
  driverFetch(
    `/support/tickets/${enc(id)}/read`,
    "PATCH",
    "Failed to mark read",
  );

/** POST /support/tickets/:id/resolve */
export const resolveTicket = (id: string) =>
  driverFetch(
    `/support/tickets/${enc(id)}/resolve`,
    "POST",
    "Failed to resolve ticket",
  );

/** POST /support/tickets/:id/reopen */
export const reopenTicket = (id: string) =>
  driverFetch(
    `/support/tickets/${enc(id)}/reopen`,
    "POST",
    "Failed to reopen ticket",
  );

export interface NewTicketInput {
  rideId?: string;
  subject: string;
  description: string;
  priority: TicketPriority;
}

/**
 * POST /support/tickets { rideId, subject, description, priority }.
 * The API doc spells the field "priotity"; if the server rejects "priority"
 * for that reason we retry once with the other spelling.
 */
export async function createTicket(input: NewTicketInput): Promise<Ticket> {
  const base: Record<string, unknown> = {
    subject: input.subject,
    description: input.description,
  };
  if (input.rideId) base.rideId = input.rideId;

  const post = (field: "priority" | "priotity") =>
    driverFetch("/support/tickets", "POST", "Failed to create ticket", {
      ...base,
      [field]: input.priority,
    });

  let res: any;
  try {
    res = await post("priority");
  } catch (e: any) {
    if (!/priotity|priority/i.test(e?.message ?? "")) throw e;
    res = await post("priotity");
  }
  return mapTicket(unwrapOne(res, "ticket"));
}
