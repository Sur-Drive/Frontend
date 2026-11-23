// Notifications data layer: confirmed apiFetch calls (GET list/stats/detail,
// deliveries, POST create, PATCH send/cancel), plus the mapping layer from
// backend records to the design's campaign rows and the mutation bodies.
//
// Confirmed endpoints (observed 2026-11-13):
//   GET   /admin/ride-hailing/notifications   envelope { items, total, page, limit, totalPages }
//   GET   /admin/ride-hailing/notifications/stats  bare { campaigns, deliveries }
//   GET   /admin/ride-hailing/notifications/{id}   full campaign detail
//   POST  /admin/ride-hailing/notifications        create — MAY SEND TO REAL DEVICES
//   PATCH /admin/ride-hailing/notifications/{id}/send   send now / retry — MAY SEND TO REAL DEVICES
//   PATCH /admin/ride-hailing/notifications/{id}/cancel cancel schedule
//   GET   /admin/ride-hailing/notifications/deliveries — observed 500 (2026-11-13)
//   GET   /admin/ride-hailing/notifications/{id}/deliveries — not wired
//
// Backend query params confirmed: page, limit, channel, status, search. Only
// the ones this page wires are sent; nothing is invented.
//
// Trap findings:
//   - GET /notifications/deliveries returns 500. The delivery-history tab
//     renders an error state with Retry; nothing else is built around it.
//   - No template endpoints exist, so template create/edit/save stay disabled
//     with "Not available yet".
//   - city, createdBy and multi-channel ("Push + Email", "SMS + Push") have no
//     confirmed backend body field, so they are disabled / not collected.
import { apiFetch } from "@/lib/api";
import { EM_DASH, formatDateLabel, formatNumber, humanize } from "@/lib/format";
import {
  NOTIFICATION_TONES,
  notificationInitials,
} from "@/types/notifications";
import type {
  BackendAudience,
  BackendChannel,
  NotificationCampaignItem,
  NotificationCampaignListResponse,
  NotificationStatsResponse,
  DeliveryRecordItem,
  CreateNotificationBody,
  NotificationStatsSummary,
} from "@/types/notifications-api";
import type { NotificationChannel, NotificationStatus } from "@/types/notifications";

// ---------------------------------------------------------------------------
// Fetchers
// ---------------------------------------------------------------------------

export interface NotificationsPageQuery {
  page: number;
  limit: number;
  channel?: string;
  status?: string;
  search?: string;
}

// GET /admin/ride-hailing/notifications — observed envelope
// { items, total, page, limit, totalPages }.
export async function fetchNotificationsPage(
  query: NotificationsPageQuery,
  signal?: AbortSignal,
): Promise<NotificationCampaignListResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });
  if (query.channel) params.set("channel", query.channel);
  if (query.status) params.set("status", query.status);
  if (query.search) params.set("search", query.search);
  return apiFetch<NotificationCampaignListResponse>(
    `/admin/ride-hailing/notifications?${params.toString()}`,
    { signal },
  );
}

// GET /admin/ride-hailing/notifications/stats — bare object, no envelope.
// Always fetched unfiltered (the endpoint ignores query params) and never
// derived from a list length.
export async function fetchNotificationsStats(
  signal?: AbortSignal,
): Promise<NotificationStatsResponse> {
  return apiFetch<NotificationStatsResponse>(
    "/admin/ride-hailing/notifications/stats",
    { signal },
  );
}

// GET /admin/ride-hailing/notifications/deliveries — observed 500 (2026-11-13).
// Kept so the delivery-history tab can surface an error state with Retry.
export async function fetchDeliveriesPage(
  query: NotificationsPageQuery,
  signal?: AbortSignal,
): Promise<{ items: DeliveryRecordItem[]; total: number }> {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });
  if (query.channel) params.set("channel", query.channel);
  if (query.status) params.set("status", query.status);
  if (query.search) params.set("search", query.search);
  const response = await apiFetch<{
    items?: DeliveryRecordItem[] | null;
    total?: number | null;
  }>(`/admin/ride-hailing/notifications/deliveries?${params.toString()}`, {
    signal,
  });
  return {
    items: response.items ?? [],
    total: Number(response.total) || 0,
  };
}

// GET /admin/ride-hailing/notifications/{id} — full campaign detail.
export async function fetchNotificationDetail(
  id: string,
  signal?: AbortSignal,
): Promise<NotificationCampaignItem> {
  return apiFetch<NotificationCampaignItem>(
    `/admin/ride-hailing/notifications/${encodeURIComponent(id)}`,
    { signal },
  );
}

// MAY SEND TO REAL DEVICES: POST /notifications fans out to all recipients.
// Never called from the terminal; only from a user-confirmed dialog.
export async function createNotification(
  body: CreateNotificationBody,
): Promise<unknown> {
  return apiFetch<unknown>("/admin/ride-hailing/notifications", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// MAY SEND TO REAL DEVICES: PATCH /notifications/{id}/send fans out to all
// recipients. Works on draft, scheduled or failed campaigns. Never called from
// the terminal; only from a user-confirmed dialog.
export async function sendNow(id: string): Promise<unknown> {
  return apiFetch<unknown>(
    `/admin/ride-hailing/notifications/${encodeURIComponent(id)}/send`,
    { method: "PATCH" },
  );
}

// PATCH /notifications/{id}/cancel — only works on draft, scheduled or failed
// campaigns. Cancels a scheduled send; does not send to devices.
export async function cancelSchedule(id: string): Promise<unknown> {
  return apiFetch<unknown>(
    `/admin/ride-hailing/notifications/${encodeURIComponent(id)}/cancel`,
    { method: "PATCH" },
  );
}

// MAY SEND TO REAL DEVICES: retries a failed send (PATCH /notifications/{id}/send).
// Never called from the terminal; only from a user-confirmed dialog.
export async function retrySend(id: string): Promise<unknown> {
  return sendNow(id);
}

// UI channel -> backend channel. Multi-channel values ("Push + Email",
// "SMS + Push") have no confirmed backend channel and are disabled in the
// composer, so this throws defensively if one ever reaches it.
const UI_CHANNEL_TO_BACKEND: Record<
  NotificationChannel,
  BackendChannel | null
> = {
  Push: "push",
  Email: "email",
  SMS: "sms",
  "Push + Email": null,
  "SMS + Push": null,
};

function backendChannelFromUi(channel: NotificationChannel): BackendChannel {
  const mapped = UI_CHANNEL_TO_BACKEND[channel];
  if (!mapped) {
    throw new Error(`No confirmed backend channel for "${channel}".`);
  }
  return mapped;
}

// UI audience -> backend audience. Values without a confirmed backend
// equivalent ("Lagos passengers", "Lagos drivers") are disabled in the
// composer, so this throws defensively if one ever reaches it.
const UI_AUDIENCE_TO_BACKEND: Record<string, BackendAudience | null> = {
  "All users": "all",
  "All passengers": "all_riders",
  "All drivers": "all_drivers",
  "Lagos passengers": null,
  "Lagos drivers": null,
};

function backendAudienceFromUi(audience: string): BackendAudience {
  const mapped = UI_AUDIENCE_TO_BACKEND[audience];
  if (!mapped) {
    throw new Error(`No confirmed backend audience for "${audience}".`);
  }
  return mapped;
}

// Turns a composer draft into the confirmed POST /notifications body. The
// dialog's internal note has no confirmed body field on this endpoint and is
// deliberately NOT sent. `city` has no backend field and is not collected.
export function buildCreateBody(
  draft: {
    title: string;
    message: string;
    audience: string;
    channel: NotificationChannel;
    // "" (unset duplicate prefill) falls through with no scheduledAt, so the
    // campaign is created as a draft.
    schedule: "Send now" | "Schedule for later" | "";
    date: string;
    time: string;
  },
): CreateNotificationBody {
  const body: CreateNotificationBody = {
    title: draft.title,
    body: draft.message,
    channel: backendChannelFromUi(draft.channel),
    audience: backendAudienceFromUi(draft.audience),
  };
  if (
    draft.schedule === "Schedule for later" &&
    draft.date &&
    draft.time
  ) {
    body.scheduledAt = `${draft.date}T${draft.time}:00Z`;
  }
  return body;
}

const BACKEND_CHANNEL_TO_UI: Record<string, NotificationChannel> = {
  push: "Push",
  email: "Email",
  sms: "SMS",
};

const BACKEND_STATUS_TO_UI: Record<string, NotificationStatus> = {
  draft: "Draft",
  scheduled: "Scheduled",
  sent: "Sent",
  failed: "Failed",
};

const BACKEND_AUDIENCE_TO_UI: Record<string, string> = {
  all: "All users",
  all_riders: "All passengers",
  all_drivers: "All drivers",
  specific_users: "Specific users",
};

function asString(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function backendChannelToUi(channel?: string | null): NotificationChannel {
  const mapped = channel ? BACKEND_CHANNEL_TO_UI[channel] : undefined;
  return mapped ?? ((channel && humanize(channel)) as NotificationChannel);
}

function backendStatusToUi(status?: string | null): NotificationStatus {
  const mapped = status ? BACKEND_STATUS_TO_UI[status.toLowerCase()] : undefined;
  return mapped ?? ((status && humanize(status)) as NotificationStatus);
}

function backendAudienceToUi(audience?: string | null): string {
  if (!audience) return EM_DASH;
  return BACKEND_AUDIENCE_TO_UI[audience] ?? humanize(audience);
}

function formatBackendSchedule(
  scheduledAt?: string | null,
  status?: string | null,
): string {
  if (status === "draft" || !scheduledAt) return "Not scheduled";
  const date = new Date(scheduledAt);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  return formatDateLabel(scheduledAt);
}

// Map one backend campaign onto the UI NotificationCampaign shape. Unknown
// enum values render a neutral chip via humanize(); missing fields render "—".
export function mapNotificationListItem(
  item: NotificationCampaignItem,
  index: number,
): import("@/types/notifications").NotificationCampaign {
  const record = item ?? {};
  const title = asString(record.title) || EM_DASH;
  const channel = backendChannelToUi(record.channel);
  const status = backendStatusToUi(record.status);
  const audience = backendAudienceToUi(record.audience);
  const totalRecipients = asNumber(record.totalRecipients);
  const deliveredCount = asNumber(record.deliveredCount);
  const delivered =
    totalRecipients !== null &&
    totalRecipients > 0 &&
    deliveredCount !== null
      ? `${Math.round((deliveredCount / totalRecipients) * 100)}%`
      : "—";
  const tone = NOTIFICATION_TONES[index % NOTIFICATION_TONES.length];
  return {
    id: asString(record.id) || `ntf-${index}`,
    ref: asString(record.id) || `NTF-${index + 1}`,
    title,
    message: asString(record.body) || EM_DASH,
    channel,
    audience,
    city: EM_DASH, // backend carries no city field
    schedule: formatBackendSchedule(record.scheduledAt, record.status),
    status,
    created: record.createdAt ? formatDateLabel(record.createdAt) : EM_DASH,
    delivered,
    initials: notificationInitials(title),
    tone,
    createdBy: EM_DASH, // backend carries a creator id, not a resolvable name
  };
}

// Map the /stats summary onto stat-card values. null (unloaded / failed /
// missing field) renders "—" via statLabel(); loaded true zeros stay "0".
export function mapNotificationStats(
  response: NotificationStatsResponse | null | undefined,
): NotificationStatsSummary {
  const campaigns = (response && response.campaigns) || {};
  const deliveries = (response && response.deliveries) || {};
  return {
    campaigns: {
      total: asNumber(campaigns.total),
      scheduled: asNumber(campaigns.scheduled),
      sent: asNumber(campaigns.sent),
      failed: asNumber(campaigns.failed),
    },
    deliveries: {
      total: asNumber(deliveries.total),
      sent: asNumber(deliveries.sent),
      failed: asNumber(deliveries.failed),
    },
  };
}

// Stat card label: null (unloaded / failed / missing) is "—", a loaded true
// zero stays "0".
export const statLabel = (
  value: number | null | undefined,
): string => value === null || value === undefined ? EM_DASH : formatNumber(value);
// ---------------------------------------------------------------------------
