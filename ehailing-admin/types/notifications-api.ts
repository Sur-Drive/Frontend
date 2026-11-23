// Observed shapes for GET /admin/ride-hailing/notifications{,/stats,/{id},
// /deliveries}. Observed 2026-11-13, limit=5 sample.
// Every field is optional/nullable on purpose: the mapper reads defensively so
// a missing or null value renders "—" and never throws. Enums are open-ended
// — observed values are 5-row samples, never exhaustive.

// Backend channel vocabulary observed: "push". The .http also documents
// "email" and "sms". Multi-channel UI values ("Push + Email", "SMS + Push")
// have no backend channel value.
export type BackendChannel = "push" | "email" | "sms";

// Backend status vocabulary observed: "draft". The .http also documents
// "scheduled", "sent", "failed".
export type BackendNotificationStatus =
  | "draft"
  | "scheduled"
  | "sent"
  | "failed";

// Backend audience vocabulary observed: "all". The .http also documents
// "all_riders", "all_drivers", "specific_users".
export type BackendAudience =
  | "all"
  | "all_riders"
  | "all_drivers"
  | "specific_users";

export interface NotificationCampaignItem {
  id?: string | null;
  title?: string | null;
  body?: string | null;
  channel?: BackendChannel | null;
  audience?: BackendAudience | null;
  userIds?: string[] | null;
  status?: BackendNotificationStatus | null;
  scheduledAt?: string | null;
  sentAt?: string | null;
  totalRecipients?: number | null;
  deliveredCount?: number | null;
  failedCount?: number | null;
  createdBy?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

// Standard pagination envelope; items arrive newest-first (observed 2026-11-13).
export interface NotificationCampaignListResponse {
  items?: NotificationCampaignItem[] | null;
  total?: number | null;
  page?: number | null;
  limit?: number | null;
  totalPages?: number | null;
}

export interface NotificationCampaignsSummary {
  total?: number | null;
  scheduled?: number | null;
  sent?: number | null;
  failed?: number | null;
}

export interface NotificationDeliveriesSummary {
  total?: number | null;
  sent?: number | null;
  failed?: number | null;
}

// Bare object, no envelope (observed 2026-11-13).
export interface NotificationStatsResponse {
  campaigns?: NotificationCampaignsSummary | null;
  deliveries?: NotificationDeliveriesSummary | null;
}

export interface DeliveryRecordItem {
  id?: string | null;
  title?: string | null;
  channel?: string | null;
  audience?: string | null;
  sent?: number | null;
  deliveredPercent?: number | null;
  openedPercent?: number | null;
  status?: string | null;
}

// ---------------------------------------------------------------------------
// Mutation bodies
// ---------------------------------------------------------------------------

export interface CreateNotificationBody {
  title: string;
  body: string;
  channel: BackendChannel;
  audience: BackendAudience;
  scheduledAt?: string;
  userIds?: string[];
}

// Normalised stats used by the stat cards. null means "not loaded / failed"
// and renders "—"; a loaded true zero stays "0".
export interface NotificationStatsSummary {
  campaigns: {
    total: number | null;
    scheduled: number | null;
    sent: number | null;
    failed: number | null;
  };
  deliveries: {
    total: number | null;
    sent: number | null;
    failed: number | null;
  };
}
