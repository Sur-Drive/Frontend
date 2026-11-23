import type { StatusTone } from "@/components/ui/StatusPill";
import type { EntityKind } from "@/types/entity-details";

// Fixed action vocabulary for the audit log. The chip tone map follows
// the same list; every other action renders as a neutral chip.
export const ACTIVITY_ACTIONS = [
  "Approve",
  "Reject",
  "Update",
  "Create",
  "Escalate",
  "Resolve",
  "Deactivate",
  "Reactivate",
  "Delete",
  "Invite",
  "Revoke",
  "Initiate Refund",
  "Export",
  "Pause",
  "Activate",
  "Expire",
  "Send",
  "Schedule",
  "Cancel Schedule",
  "Retry",
  "Flag",
  "Unflag",
  "Assign",
] as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export const ACTIVITY_ACTION_TONE: Record<ActivityAction, StatusTone> = {
  Approve: "success",
  Resolve: "success",
  Update: "info",
  Create: "info",
  "Initiate Refund": "warning",
  Escalate: "warning",
  Deactivate: "danger",
  Reactivate: "success",
  Revoke: "danger",
  Invite: "info",
  Delete: "danger",
  Reject: "neutral",
  Export: "neutral",
  Pause: "neutral",
  Activate: "neutral",
  Expire: "neutral",
  Send: "neutral",
  Schedule: "neutral",
  "Cancel Schedule": "neutral",
  Retry: "neutral",
  Flag: "neutral",
  Unflag: "neutral",
  Assign: "neutral",
};

export interface ActivityLogEntry {
  id: string;
  activity: string;
  user: string;
  role: string;
  action: ActivityAction;
  // "Driver" / "Chinedu Okafor": entity type then name or id, shown as
  // "Driver • Chinedu Okafor".
  entityKind: string;
  entitySubject: string;
  // "Today, 10:42:18 AM"; formatted when the entry is recorded, never in render.
  timestamp: string;
  // Pre-masked, e.g. "197.210.•••.48", so the CSV export stays masked too.
  ip: string;
  // Whole days between the entry's day and "today" (0 = today). Date filtering
  // runs off this deterministic value, never off Date.now() during render.
  daysAgo: number;
}

// Row shape the Activity Logs table/cards render after mapping from a backend
// item (mapActivityLogRow in lib/activity-logs.ts). Only the safe summary
// survives mapping: metadata (logged request bodies) and userEmail are
// dropped there and never carried into any UI model. `action` stays the raw
// backend value — chip label/tone come from activityActionLabel/Tone.
export interface ActivityLogRow {
  id: string;
  activity: string;
  user: string;
  role: string;
  action: string;
  // Humanised entityType, e.g. "Incident".
  entityKind: string;
  // entityLabel, falling back to httpPath.
  entitySubject: string;
  // Raw httpMethod ("PATCH"), always visible next to the action chip.
  method: string;
  // statusCode as a string, "—" when null.
  statusCode: string;
  // Readable local timestamp, "—" when null/invalid.
  timestamp: string;
  // Last IPv4 octet masked, "—" when missing/not an IPv4 address.
  ip: string;
}

// Display labels for the shared entity kinds, used when the shared action
// stub (lib/actions) logs an entry keyed by EntityKind.
export const ENTITY_KIND_LABELS: Record<EntityKind, string> = {
  passenger: "Passenger",
  driver: "Driver",
  vehicle: "Vehicle",
  fleet: "Fleet",
  verification: "Verification",
  transaction: "Transaction",
  settlement: "Settlement",
  promotion: "Promotion",
  incident: "Incident",
  supportTicket: "Support Ticket",
  review: "Review",
  riskCase: "Risk Case",
  notification: "Notification",
  adminUser: "Admin",
};
