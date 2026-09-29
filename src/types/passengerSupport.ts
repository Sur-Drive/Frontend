export type SupportTicketStatus =
  | "open"
  | "closed";

export type SupportTicketPriority =
  | "low"
  | "medium"
  | "high";

export type SupportMessageSender =
  | "passenger"
  | "agent"
  | "system";

export interface SupportFAQ {
  id: string;
  question: string;
  answer: string;
}

export interface SupportRide {
  id: string;
  date: string;
  pickup: string;
  destination: string;
}

export interface SupportTicketMessage {
  id: string;

  sender:
    SupportMessageSender;

  message: string;

  createdAt: string;
}

export interface SupportTicket {
  id: string;

  reference: string;

  summary: string;

  description: string;

  rideId?: string;

  priority:
    SupportTicketPriority;

  status:
    SupportTicketStatus;

  createdAt: string;

  updatedAt: string;

  escalated: boolean;

  messages:
    SupportTicketMessage[];
}

export interface CreateSupportTicketInput {
  summary: string;

  description: string;

  rideId?: string;

  priority:
    SupportTicketPriority;
}

export interface TicketFilters {
  status:
    | "all"
    | SupportTicketStatus;

  priority:
    | "all"
    | SupportTicketPriority;

  startDate?: string;

  endDate?: string;
}