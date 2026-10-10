import { driverFetch } from "./account";

const enc = encodeURIComponent;

/** GET /chat/rides/:rideId — the conversation attached to a ride. */
export const getRideConversation = (rideId: string) =>
  driverFetch(`/chat/rides/${enc(rideId)}`, "GET", "Failed to open chat");

/** GET /chat/conversations/:id/messages?page&limit */
export const getMessages = (conversationId: string, page = 1, limit = 50) =>
  driverFetch(
    `/chat/conversations/${enc(conversationId)}/messages?page=${page}&limit=${limit}`,
    "GET",
    "Failed to load messages",
  );

/** POST /chat/conversations/:id/messages { content } */
export const sendMessage = (conversationId: string, content: string) =>
  driverFetch(
    `/chat/conversations/${enc(conversationId)}/messages`,
    "POST",
    "Failed to send message",
    { content },
  );

/** POST /chat/conversations/:id/attachments (multipart, field "file") */
export const sendAttachment = (conversationId: string, file: File) => {
  const fd = new FormData();
  fd.append("file", file);
  return driverFetch(
    `/chat/conversations/${enc(conversationId)}/attachments`,
    "POST",
    "Failed to send photo",
    fd,
  );
};

/** PATCH /chat/conversations/:id/read */
export const markConversationRead = (conversationId: string) =>
  driverFetch(`/chat/conversations/${enc(conversationId)}/read`, "PATCH", "Failed to mark read");

/** GET /chat/unread */
export const getUnreadCount = () => driverFetch("/chat/unread", "GET", "Failed to load unread count");

/** GET /chat/conversations?page&limit — used to find a ride's conversation. */
export const getConversations = (page = 1, limit = 20) =>
  driverFetch(`/chat/conversations?page=${page}&limit=${limit}`, "GET", "Failed to load conversations");
