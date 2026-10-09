
import { passengerApi } from "./passengerClient";

export type MessageType =
  | "text"
  | "system"
  | "image"
  | "audio"
  | "file";

export interface MessageAttachment {
  url: string;
  thumbnailUrl: string | null;
  publicId: string;
  resourceType: "image" | "video" | "raw";
  mimeType: string;
  originalName: string;
  size: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  rideId?: string;
  senderId: string;
  type: MessageType;
  content: string;
  attachment: MessageAttachment | null;
  createdAt: string;
}

export interface ChatCounterpart {
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  photo?: string | null;
  avatarUrl?: string | null;
  rating?: number;
  [key: string]: unknown;
}

export interface ConversationView {
  id: string;
  rideId: string;
  counterpart: ChatCounterpart | null;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;

  messaging: {
    canSend: boolean;
    expiresAt: string | null;
    code: string | null;
    message: string | null;
  };

  calling: {
    canCall: boolean;
    code: string | null;
    message: string | null;
  };
}

export interface Paginated<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface SendMessagePayload {
  content: string;
}

export interface UnreadCountResponse {
  [key: string]: unknown;
}

const conversationPath = (conversationId: string) =>
  `/chat/conversations/${encodeURIComponent(conversationId)}`;

export const rideChatApi = {
  openConversation(rideId: string) {
    return passengerApi.get<ConversationView>(
      `/chat/rides/${encodeURIComponent(rideId)}`,
      { authMode: "access" },
    );
  },

  getMessages(
    conversationId: string,
    page = 1,
    limit = 30,
  ) {
    return passengerApi.get<Paginated<ChatMessage>>(
      `${conversationPath(conversationId)}/messages`,
      {
        authMode: "access",
        params: { page, limit },
      },
    );
  },

  sendMessage(
    conversationId: string,
    content: string,
  ) {
    return passengerApi.post<ChatMessage>(
      `${conversationPath(conversationId)}/messages`,
      { content: content.trim() } satisfies SendMessagePayload,
      { authMode: "access" },
    );
  },

  markAsRead(conversationId: string) {
    return passengerApi.patch<unknown>(
      `${conversationPath(conversationId)}/read`,
      undefined,
      { authMode: "access" },
    );
  },

  getUnreadCount() {
    return passengerApi.get<UnreadCountResponse>(
      "/chat/unread",
      { authMode: "access" },
    );
  },

  uploadAttachment(
    conversationId: string,
    file: File,
    caption = "",
  ) {
    const formData = new FormData();

    formData.append("file", file);

    if (caption.trim()) {
      formData.append("caption", caption.trim());
    }

    return passengerApi.post<ChatMessage>(
      `${conversationPath(conversationId)}/attachments`,
      formData,
      { authMode: "access" },
    );
  },
};

