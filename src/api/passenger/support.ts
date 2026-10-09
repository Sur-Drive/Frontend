import {
  passengerApi,
} from "./passengerClient";

/* =========================================================
   COMMON TYPES
========================================================= */

export type SupportTicketPriority =
  | "low"
  | "medium"
  | "high";

export type SupportTicketStatus =
  | "open"
  | "resolved"
  | "closed";

export type SupportMessageSenderType =
  | "requester"
  | "agent"
  | "system";

export type SupportMessageType =
  | "text"
  | "image"
  | "audio"
  | "file"
  | "system";

/* =========================================================
   AGENT
========================================================= */

export interface SupportAgent {
  id?: string;
  name?: string;
  email?: string | null;
  profilePicture?:
    | string
    | null;
}

/* =========================================================
   RIDE
========================================================= */

export interface SupportRide {
  id: string;

  pickupAddress: string;
  dropoffAddress: string;

  rideType:
    | "economy"
    | "comfort"
    | "suv"
    | string;

  status: string;

  createdAt: string;
}

/* =========================================================
   TICKET LIST ITEM
========================================================= */

export interface SupportTicket {
  id: string;

  ticketNumber: number;

  reference: string;

  subject: string;

  priority:
    SupportTicketPriority;

  status:
    SupportTicketStatus;

  rideId:
    | string
    | null;

  lastMessagePreview:
    | string
    | null;

  lastMessageAt:
    | string
    | null;

  resolvedAt:
    | string
    | null;

  createdAt: string;

  updatedAt?:
    | string
    | null;

  unreadCount: number;

  descriptionPreview:
    | string
    | null;

  agent:
    | SupportAgent
    | null;

  needsYourReply: boolean;
}

/* =========================================================
   TICKET DETAIL
========================================================= */

export interface SupportTicketPermissions {
  canReply: boolean;
  canResolve: boolean;
  canReopen: boolean;
}

export interface SupportTicketDetail {
  id: string;

  ticketNumber: number;

  reference: string;

  subject: string;

  description:
    | string
    | null;

  priority:
    SupportTicketPriority;

  status:
    SupportTicketStatus;

  rideId:
    | string
    | null;

  resolvedAt:
    | string
    | null;

  createdAt: string;

  updatedAt?:
    | string
    | null;

  unreadCount?: number;

  agent:
    | SupportAgent
    | null;

  needsYourReply?: boolean;

  permissions:
    SupportTicketPermissions;
}

/* =========================================================
   ATTACHMENT
========================================================= */

export interface SupportMessageAttachment {
  id?: string;

  url:
    | string
    | null;

  thumbnailUrl?:
    | string
    | null;

  originalName?:
    | string
    | null;

  mimeType?:
    | string
    | null;

  size?:
    | number
    | null;
}

/* =========================================================
   MESSAGE
========================================================= */

export interface SupportTicketMessage {
  id: string;

  ticketId?:
    | string
    | null;

  content:
    | string
    | null;

  senderType:
    SupportMessageSenderType;

  senderId?:
    | string
    | null;

  type:
    SupportMessageType;

  attachment?:
    | SupportMessageAttachment
    | null;

  createdAt: string;

  updatedAt?:
    | string
    | null;
}

/* =========================================================
   MESSAGES RESPONSE
========================================================= */

export interface SupportMessagesMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface SupportMessagesResponse {
  items:
    SupportTicketMessage[];

  meta?:
    SupportMessagesMeta;
}

/* =========================================================
   TICKET LIST RESPONSE
========================================================= */

export interface SupportTicketsMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface SupportTicketsResponse {
  items:
    SupportTicket[];

  meta:
    SupportTicketsMeta;
}

/* =========================================================
   UNREAD
========================================================= */

export interface SupportUnreadTicket {
  id?: string;
  ticketId?: string;
  reference?: string;
  unreadCount?: number;

  [key: string]:
    unknown;
}

export interface SupportUnreadResponse {
  total: number;

  tickets:
    SupportUnreadTicket[];
}

/* =========================================================
   CREATE TICKET
========================================================= */

export interface CreateSupportTicketPayload {
  rideId?: string;

  subject: string;

  description: string;

  /*
   * Backend currently expects
   * this spelling.
   */
  priotity?:
    SupportTicketPriority;
}

/* =========================================================
   GET TICKETS PARAMS
========================================================= */

export interface GetTicketsParams {
  page?: number;

  limit?: number;

  status?:
    | "open"
    | "closed";

  search?: string;

  sort?:
    | "recent"
    | "oldest"
    | "priority";
}

/* =========================================================
   QUERY BUILDER
========================================================= */

function buildQuery(
  params:
    GetTicketsParams,
) {
  const search =
    new URLSearchParams();

  if (
    params.page !==
    undefined
  ) {
    search.set(
      "page",
      String(
        params.page,
      ),
    );
  }

  if (
    params.limit !==
    undefined
  ) {
    search.set(
      "limit",
      String(
        params.limit,
      ),
    );
  }

  if (
    params.status
  ) {
    search.set(
      "status",
      params.status,
    );
  }

  if (
    params.search?.trim()
  ) {
    search.set(
      "search",
      params.search.trim(),
    );
  }

  if (
    params.sort
  ) {
    search.set(
      "sort",
      params.sort,
    );
  }

  const query =
    search.toString();

  return query
    ? `?${query}`
    : "";
}

/* =========================================================
   SUPPORT API
========================================================= */

export const passengerSupportApi = {
  /* -------------------------
     RIDES
  ------------------------- */

  getRides: () =>
    passengerApi.get<
      SupportRide[]
    >(
      "/support/rides",
      {
        authMode:
          "access",
      },
    ),

  /* -------------------------
     CREATE TICKET
  ------------------------- */

  createTicket: (
    payload:
      CreateSupportTicketPayload,
  ) =>
    passengerApi.post<
      SupportTicket
    >(
      "/support/tickets",
      payload,
      {
        authMode:
          "access",
      },
    ),

  /* -------------------------
     TICKET LIST
  ------------------------- */

  getTickets: (
    params:
      GetTicketsParams = {},
  ) =>
    passengerApi.get<
      SupportTicketsResponse
    >(
      `/support/tickets${buildQuery(
        params,
      )}`,
      {
        authMode:
          "access",
      },
    ),

  /* -------------------------
     UNREAD
  ------------------------- */

  getUnreadSummary: () =>
    passengerApi.get<
      SupportUnreadResponse
    >(
      "/support/tickets/unread",
      {
        authMode:
          "access",
      },
    ),

  /* -------------------------
     SINGLE TICKET
  ------------------------- */

  getTicket: (
    id: string,
  ) =>
    passengerApi.get<
      SupportTicketDetail
    >(
      `/support/tickets/${encodeURIComponent(
        id,
      )}`,
      {
        authMode:
          "access",
      },
    ),

  /* -------------------------
     MESSAGES
  ------------------------- */

  getMessages: (
    id: string,
    page = 1,
    limit = 20,
  ) =>
    passengerApi.get<
      SupportMessagesResponse
    >(
      `/support/tickets/${encodeURIComponent(
        id,
      )}/messages?page=${page}&limit=${limit}`,
      {
        authMode:
          "access",
      },
    ),

  /* -------------------------
     SEND MESSAGE
  ------------------------- */

  sendMessage: (
    id: string,
    content: string,
  ) =>
    passengerApi.post<
      SupportTicketMessage
    >(
      `/support/tickets/${encodeURIComponent(
        id,
      )}/messages`,
      {
        content,
      },
      {
        authMode:
          "access",
      },
    ),

  /* -------------------------
     ATTACHMENT
  ------------------------- */

  uploadAttachment: (
    id: string,
    file: File,
  ) => {
    const formData =
      new FormData();

    formData.append(
      "file",
      file,
    );

    return passengerApi.post<
      SupportTicketMessage
    >(
      `/support/tickets/${encodeURIComponent(
        id,
      )}/attachments`,
      formData,
      {
        authMode:
          "access",
      },
    );
  },

  /* -------------------------
     MARK READ
  ------------------------- */

  markRead: (
    id: string,
  ) =>
    passengerApi.patch<
      unknown
    >(
      `/support/tickets/${encodeURIComponent(
        id,
      )}/read`,
      {},
      {
        authMode:
          "access",
      },
    ),

  /* -------------------------
     RESOLVE
  ------------------------- */

  resolve: (
    id: string,
  ) =>
    passengerApi.post<
      unknown
    >(
      `/support/tickets/${encodeURIComponent(
        id,
      )}/resolve`,
      {},
      {
        authMode:
          "access",
      },
    ),

  /* -------------------------
     REOPEN
  ------------------------- */

  reopen: (
    id: string,
  ) =>
    passengerApi.post<
      unknown
    >(
      `/support/tickets/${encodeURIComponent(
        id,
      )}/reopen`,
      {},
      {
        authMode:
          "access",
      },
    ),
};

// import {
//   passengerApi,
// } from "./passengerClient";

// /* =========================================================
//    COMMON TYPES
// ========================================================= */

// export type SupportTicketPriority =
//   | "low"
//   | "medium"
//   | "high";

// export type SupportTicketStatus =
//   | "open"
//   | "in_progress"
//   | "resolved"
//   | "closed"
//   | string;

// export type SupportMessageSenderType =
//   | "requester"
//   | "agent"
//   | "system"
//   | string;

// export type SupportMessageType =
//   | "text"
//   | "image"
//   | "audio"
//   | "file"
//   | "system"
//   | string;

// /* =========================================================
//    RIDES
// ========================================================= */

// export interface SupportRide {
//   id: string;

//   pickupAddress: string;
//   dropoffAddress: string;

//   rideType: string;
//   status: string;

//   createdAt: string;
// }

// /* =========================================================
//    AGENT
// ========================================================= */

// export interface SupportAgent {
//   id?: string;
//   name?: string;

//   profilePicture?: string | null;

//   [key: string]:
//     unknown;
// }

// /* =========================================================
//    PERMISSIONS
// ========================================================= */

// export interface SupportTicketPermissions {
//   canReply: boolean;
//   canResolve: boolean;
//   canReopen: boolean;

//   canAssign?: boolean;
//   canChangePriority?: boolean;
// }

// /* =========================================================
//    TICKET CARD / LIST
// ========================================================= */

// export interface SupportTicket {
//   id: string;

//   reference: string;

//   subject: string;

//   descriptionPreview?: string;

//   description?: string;

//   priority:
//     SupportTicketPriority;

//   status:
//     SupportTicketStatus;

//   rideId?: string | null;

//   agent?: SupportAgent | null;

//   needsYourReply?: boolean;

//   unreadCount?: number;

//   lastMessageAt?:
//     string | null;

//   createdAt: string;

//   updatedAt?: string;

//   permissions?:
//     SupportTicketPermissions;

//   [key: string]:
//     unknown;
// }

// /* =========================================================
//    TICKET DETAIL
// ========================================================= */

// export interface SupportTicketDetail
//   extends SupportTicket {
//   description: string;

//   permissions:
//     SupportTicketPermissions;

//   ride?: unknown | null;

//   assignee?:
//     SupportAgent | null;

//   reopenCount?: number;
// }

// /* =========================================================
//    MESSAGES
// ========================================================= */

// export interface SupportAttachment {
//   id?: string;

//   url?: string;

//   thumbnailUrl?:
//     string | null;

//   originalName?:
//     string | null;

//   size?: number | null;

//   durationSeconds?:
//     number | null;

//   mimeType?:
//     string | null;

//   [key: string]:
//     unknown;
// }

// export interface SupportTicketMessage {
//   id: string;

//   ticketId: string;

//   senderId?:
//     string | null;

//   senderType:
//     SupportMessageSenderType;

//   type:
//     SupportMessageType;

//   content: string;

//   attachment?:
//     SupportAttachment | null;

//   createdAt: string;
// }

// /* =========================================================
//    CREATE
// ========================================================= */

// export interface CreateSupportTicketRequest {
//   subject: string;

//   description: string;

//   priority?:
//     SupportTicketPriority;

//   rideId?: string;
// }

// /* =========================================================
//    LIST
// ========================================================= */

// export interface GetSupportTicketsParams {
//   status?:
//     | "open"
//     | "closed";

//   priority?:
//     SupportTicketPriority;

//   startDate?: string;

//   endDate?: string;

//   page?: number;

//   limit?: number;
// }

// export interface SupportPaginationMeta {
//   total: number;

//   page: number;

//   limit: number;

//   totalPages: number;

//   hasNextPage: boolean;

//   hasPreviousPage: boolean;
// }

// export interface SupportTicketsResponse {
//   items:
//     SupportTicket[];

//   meta:
//     SupportPaginationMeta;
// }

// /* =========================================================
//    UNREAD
// ========================================================= */

// export interface SupportUnreadTicket {
//   ticketId: string;

//   unreadCount: number;
// }

// export interface SupportUnreadResponse {
//   total: number;

//   tickets:
//     SupportUnreadTicket[];
// }

// /* =========================================================
//    MESSAGES RESPONSE
// ========================================================= */

// export interface SupportMessagesResponse {
//   items:
//     SupportTicketMessage[];

//   meta?:
//     SupportPaginationMeta;
// }

// /* =========================================================
//    READ
// ========================================================= */

// export interface SupportReadResponse {
//   readAt: string;
// }

// /* =========================================================
//    QUERY BUILDER
// ========================================================= */

// function buildQuery(
//   params: Record<
//     string,
//     string | number | undefined
//   >,
// ) {
//   const search =
//     new URLSearchParams();

//   Object.entries(
//     params,
//   ).forEach(
//     ([key, value]) => {
//       if (
//         value !== undefined &&
//         value !== ""
//       ) {
//         search.set(
//           key,
//           String(value),
//         );
//       }
//     },
//   );

//   const query =
//     search.toString();

//   return query
//     ? `?${query}`
//     : "";
// }

// /* =========================================================
//    API
// ========================================================= */

// export const passengerSupportApi = {
//   /* -------------------------
//      RIDES
//   ------------------------- */

//   getRides: () =>
//     passengerApi.get<
//       SupportRide[]
//     >(
//       "/support/rides",
//       {
//         authMode:
//           "access",
//       },
//     ),

//   /* -------------------------
//      CREATE TICKET
//   ------------------------- */

//   createTicket: (
//     payload:
//       CreateSupportTicketRequest,
//   ) =>
//     passengerApi.post<
//       SupportTicketDetail
//     >(
//       "/support/tickets",
//       payload,
//       {
//         authMode:
//           "access",
//       },
//     ),

//   /* -------------------------
//      TICKET LIST
//   ------------------------- */

//   getTickets: (
//     params:
//       GetSupportTicketsParams = {},
//   ) =>
//     passengerApi.get<
//       SupportTicketsResponse
//     >(
//       `/support/tickets${buildQuery(
//         params,
//       )}`,
//       {
//         authMode:
//           "access",
//       },
//     ),

//   /* -------------------------
//      UNREAD
//   ------------------------- */

//   getUnreadSummary: () =>
//     passengerApi.get<
//       SupportUnreadResponse
//     >(
//       "/support/tickets/unread",
//       {
//         authMode:
//           "access",
//       },
//     ),

//   /* -------------------------
//      DETAIL
//   ------------------------- */

//   getTicket: (
//     id: string,
//   ) =>
//     passengerApi.get<
//       SupportTicketDetail
//     >(
//       `/support/tickets/${encodeURIComponent(
//         id,
//       )}`,
//       {
//         authMode:
//           "access",
//       },
//     ),

//   /* -------------------------
//      MESSAGES
//   ------------------------- */

//   getMessages: (
//     id: string,
//     page = 1,
//     limit = 50,
//   ) =>
//     passengerApi.get<
//       SupportMessagesResponse
//     >(
//       `/support/tickets/${encodeURIComponent(
//         id,
//       )}/messages?page=${page}&limit=${limit}`,
//       {
//         authMode:
//           "access",
//       },
//     ),

//   sendMessage: (
//     id: string,
//     content: string,
//   ) =>
//     passengerApi.post<
//       SupportTicketMessage
//     >(
//       `/support/tickets/${encodeURIComponent(
//         id,
//       )}/messages`,
//       {
//         content,
//       },
//       {
//         authMode:
//           "access",
//       },
//     ),

//   /* -------------------------
//      ATTACHMENT
//   ------------------------- */

//   uploadAttachment: (
//     id: string,
//     file: File,
//     caption?: string,
//   ) => {
//     const formData =
//       new FormData();

//     formData.append(
//       "file",
//       file,
//     );

//     if (
//       caption?.trim()
//     ) {
//       formData.append(
//         "caption",
//         caption.trim(),
//       );
//     }

//     return passengerApi.post<
//       SupportTicketMessage
//     >(
//       `/support/tickets/${encodeURIComponent(
//         id,
//       )}/attachments`,
//       formData,
//       {
//         authMode:
//           "access",
//       },
//     );
//   },

//   /* -------------------------
//      READ
//   ------------------------- */

//   markRead: (
//     id: string,
//   ) =>
//     passengerApi.patch<
//       SupportReadResponse
//     >(
//       `/support/tickets/${encodeURIComponent(
//         id,
//       )}/read`,
//       undefined,
//       {
//         authMode:
//           "access",
//       },
//     ),

//   /* -------------------------
//      RESOLVE
//   ------------------------- */

//   resolve: (
//     id: string,
//   ) =>
//     passengerApi.post<
//       SupportTicket
//     >(
//       `/support/tickets/${encodeURIComponent(
//         id,
//       )}/resolve`,
//       undefined,
//       {
//         authMode:
//           "access",
//       },
//     ),

//   /* -------------------------
//      REOPEN
//   ------------------------- */

//   reopen: (
//     id: string,
//   ) =>
//     passengerApi.post<
//       SupportTicket
//     >(
//       `/support/tickets/${encodeURIComponent(
//         id,
//       )}/reopen`,
//       undefined,
//       {
//         authMode:
//           "access",
//       },
//     ),
// };