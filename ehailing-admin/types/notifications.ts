import type { StatusTone } from "@/components/ui/StatusPill";

// System > Notifications. This page composes and monitors communications sent
// TO platform users (campaigns); it is not the admin's own inbox.

export type NotificationChannel =
  | "Push"
  | "Email"
  | "SMS"
  | "Push + Email"
  | "SMS + Push";

export type NotificationStatus = "Draft" | "Scheduled" | "Sent" | "Failed";

// Avatar tone set (mirrors InitialsAvatar's tone prop).
export type NotificationTone = "brand" | "success" | "warning" | "info";

export interface NotificationCampaign {
  id: string;
  // Drawer reference code, e.g. "NTF-2081".
  ref: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  // Free text on purpose: the seeded rows use segment counts ("248 drivers")
  // while the composer offers named segments ("All drivers").
  audience: string;
  city: string;
  // Display label: "14 Jun, 9:00 AM", "Today, 8:00 AM" or "Not scheduled".
  schedule: string;
  status: NotificationStatus;
  // Details-drawer card values: "12 Jun, 2:18 PM" and "98.4%" ("—" when the
  // campaign has never been sent).
  created: string;
  delivered: string;
  initials: string;
  tone: NotificationTone;
  createdBy: string;
}

export type DeliveryStatus = "Delivered" | "Partially delivered" | "Failed";

export interface DeliveryRecord {
  id: string;
  title: string;
  channel: NotificationChannel;
  audience: string;
  sent: string;
  deliveredPercent: number;
  openedPercent: number;
  status: DeliveryStatus;
}

export const NOTIFICATION_STATUS_TONE: Record<NotificationStatus, StatusTone> =
  {
    Draft: "neutral",
    Scheduled: "info",
    Sent: "success",
    Failed: "danger",
  };

export const DELIVERY_STATUS_TONE: Record<DeliveryStatus, StatusTone> = {
  Delivered: "success",
  "Partially delivered": "warning",
  Failed: "danger",
};

export const TAB_IDS = [
  "push",
  "email",
  "sms",
  "templates",
  "delivery-history",
] as const;

export type NotificationTabId = (typeof TAB_IDS)[number];

export function isNotificationTab(value: string | undefined): value is NotificationTabId {
  return value !== undefined && (TAB_IDS as readonly string[]).includes(value);
}

// A multi-channel campaign ("Push + Email", "SMS + Push") belongs to both of
// its single-channel tabs.
export function channelInTab(
  channel: NotificationChannel,
  tab: NotificationTabId,
): boolean {
  if (tab === "push") {
    return (
      channel === "Push" || channel === "Push + Email" || channel === "SMS + Push"
    );
  }
  if (tab === "email") return channel === "Email" || channel === "Push + Email";
  if (tab === "sms") return channel === "SMS" || channel === "SMS + Push";
  return true;
}

export const AUDIENCE_OPTIONS = [
  "All users",
  "All passengers",
  "All drivers",
  "Lagos passengers",
  "Lagos drivers",
];

// Composer channel options; "Push notification" is stored as channel "Push".
export const CHANNEL_OPTIONS: { label: string; channel: NotificationChannel }[] =
  [
    { label: "Push notification", channel: "Push" },
    { label: "Email", channel: "Email" },
    { label: "SMS", channel: "SMS" },
    { label: "Push + Email", channel: "Push + Email" },
  ];

export const SCHEDULE_OPTIONS = ["Send now", "Schedule for later"];

// Avatar initials per the design: capital first letter of word 1 plus the
// lowercase first letter of word 2 ("Weekend ride offer" -> "Wr").
export function notificationInitials(title: string): string {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0].toUpperCase()}${words[1][0].toLowerCase()}`;
}

// Purple, yellow, blue, green, purple — the design's cycle.
export const NOTIFICATION_TONES: NotificationTone[] = [
  "brand",
  "warning",
  "info",
  "success",
];

export const TITLE_MAX = 60;

// Push and SMS are capped at 160 characters; email bodies run longer.
export function messageMax(channel: NotificationChannel): number {
  return channel === "Email" ? 300 : 160;
}

function time12(time: string): string {
  const [rawHour, rawMinute] = time.split(":");
  const hour = Number(rawHour);
  if (!Number.isFinite(hour)) return time;
  const suffix = hour < 12 ? "AM" : "PM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${rawMinute ?? "00"} ${suffix}`;
}

// "14 Jun, 9:00 AM" from an ISO date and a 24h time input.
export function formatScheduleLabel(dateIso: string, time: string): string {
  const date = new Date(`${dateIso}T00:00:00`);
  const day = Number.isNaN(date.getTime())
    ? dateIso
    : new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
      }).format(date);
  return `${day}, ${time12(time)}`;
}

// "Today, 9:05 AM" for an immediate send. Called from event handlers only.
export function formatTodayTime(date: Date): string {
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  return `Today, ${time}`;
}
