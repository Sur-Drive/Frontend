import { apiFetch } from "@/lib/api";
import {
  NETWORK_ERROR_MESSAGE,
  apiBaseUrl,
  backendMessage,
  getToken,
} from "@/lib/auth";
import { EM_DASH, formatNumber, humanize } from "@/lib/format";
import { ACTIVITY_ACTION_TONE } from "@/types/activity-logs";
import type { ActivityLogRow } from "@/types/activity-logs";
import type { StatusTone } from "@/components/ui/StatusPill";
import type {
  ActivityLogFilterOptions,
  ActivityLogItem,
  ActivityLogsListResponse,
  ActivityLogsStatsResponse,
} from "@/types/activity-logs-api";

// Confirmed query params: page, limit, search,
// userId, roleName, action, entityType, from, to. Only the ones this page
// wires are accepted here; nothing is invented. Verified 2026-11-12 by
// totals (default total=4): action=create -> 3, roleName=Safety Officer -> 2,
// userId -> 2, from=11/12/2026 00:00:00 -> 0, wide 2026 range -> 4,
// search=zzzznotfound -> 0.

export interface ActivityLogQuery {
  page: number;
  limit: number;
  search?: string;
  userId?: string;
  roleName?: string;
  action?: string;
  entityType?: string;
  from?: string;
  to?: string;
}

// GET /admin/ride-hailing/activity-logs — observed envelope
// { items, total, page, limit, totalPages }; items are newest-first
// (createdAt descending, observed 2026-11-12).
export async function fetchActivityLogs(
  query: ActivityLogQuery,
  signal?: AbortSignal,
): Promise<ActivityLogsListResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit),
  });
  if (query.search) params.set("search", query.search);
  if (query.userId) params.set("userId", query.userId);
  if (query.roleName) params.set("roleName", query.roleName);
  if (query.action) params.set("action", query.action);
  if (query.entityType) params.set("entityType", query.entityType);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  return apiFetch<ActivityLogsListResponse>(
    `/admin/ride-hailing/activity-logs?${params.toString()}`,
    { signal },
  );
}

// GET /admin/ride-hailing/activity-logs/stats — bare object { total, today }.
export async function fetchActivityLogsStats(
  signal?: AbortSignal,
): Promise<ActivityLogsStatsResponse> {
  return apiFetch<ActivityLogsStatsResponse>(
    "/admin/ride-hailing/activity-logs/stats",
    { signal },
  );
}

// GET /admin/ride-hailing/activity-logs/filter-options — bare object
// { users, roles, actions, entityTypes } (values are open-ended).
export async function fetchActivityLogFilterOptions(
  signal?: AbortSignal,
): Promise<ActivityLogFilterOptions> {
  return apiFetch<ActivityLogFilterOptions>(
    "/admin/ride-hailing/activity-logs/filter-options",
    { signal },
  );
}

// --- Date range (from/to use the "MM/DD/YYYY HH:mm:ss" format the endpoint
// accepts; computed from local date parts, never toISOString).

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function dayStartParam(date: Date): string {
  return `${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}/${date.getFullYear()} 00:00:00`;
}

function dayEndParam(date: Date): string {
  return `${pad2(date.getMonth() + 1)}/${pad2(date.getDate())}/${date.getFullYear()} 23:59:59`;
}

function isoDayToDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

// Sentinel value for "no date restriction" (the backend default: no from/to).
export const DATE_ALL = "all";

// The view stores the date selection as one filter value: "all" | "today" |
// "7d" | "30d" (presets -> from only, matching the .http examples) or
// "yyyy-mm-dd|yyyy-mm-dd" (custom window -> from 00:00:00 + to 23:59:59).
// Unknown values return no params instead of guessing.
export function dateRangeParams(
  dateValue: string,
): { from?: string; to?: string } {
  const value = typeof dateValue === "string" ? dateValue.trim() : "";
  if (!value || value === DATE_ALL) return {};
  if (value.includes("|")) {
    const [fromIso, toIso] = value.split("|");
    const from = isoDayToDate(fromIso);
    const to = isoDayToDate(toIso);
    if (!from || !to) return {};
    return { from: dayStartParam(from), to: dayEndParam(to) };
  }
  const backDays =
    value === "today" ? 0 : value === "7d" ? 7 : value === "30d" ? 30 : null;
  if (backDays === null) return {};
  const start = new Date();
  start.setDate(start.getDate() - backDays);
  return { from: dayStartParam(start) };
}

// --- Mapping layer (one place per entity): backend item -> UI row.

function asString(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

// Readable local timestamp ("07 Nov 2026, 10:42:18"); null/invalid -> "—".
export function formatLogTimestamp(
  value: string | null | undefined,
): string {
  const raw = asString(value);
  if (!raw) return EM_DASH;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return EM_DASH;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// Mask the last IPv4 octet (the section's pre-masked convention); anything
// that is not an IPv4 address renders "—" instead of leaking a raw format.
export function maskIpAddress(value: string | null | undefined): string {
  const parts = asString(value).split(".");
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part))) {
    return EM_DASH;
  }
  return `${parts[0]}.${parts[1]}.${parts[2]}.•••`;
}

// Raw action -> chip tone. Case-insensitive match onto the app's existing
// vocabulary (ACTIVITY_ACTION_TONE); anything else falls back to a neutral
// chip — the observed create|update is never treated as exhaustive.
export function activityActionTone(
  action: string | null | undefined,
): StatusTone {
  const raw = asString(action).toLowerCase();
  if (!raw) return "neutral";
  const key = (
    Object.keys(ACTIVITY_ACTION_TONE) as Array<
      keyof typeof ACTIVITY_ACTION_TONE
    >
  ).find((candidate) => candidate.toLowerCase() === raw);
  return key ? ACTIVITY_ACTION_TONE[key] : "neutral";
}

// Humanised chip label ("create" -> "Create"); unknown values get a
// humanised label, null/blank renders "—".
export function activityActionLabel(
  action: string | null | undefined,
): string {
  const raw = asString(action);
  return raw ? humanize(raw) : EM_DASH;
}

// Maps one backend log item onto the row the table/cards render.
//
// DROPPED HERE, never carried into any UI model: `metadata` (the logged
// request bodies — may contain passwords, tokens, national IDs, card data…)
// and `userEmail`. Only the safe summary survives: action, entityType,
// httpMethod, httpPath/entityLabel, statusCode, createdAt and the actor's
// display name/role. Undefined/null input yields "—" cells, never a throw.
export function mapActivityLogRow(
  item: ActivityLogItem | null | undefined,
): ActivityLogRow {
  const record = item ?? {};
  const entityType = asString(record.entityType);
  const statusCode = asNumber(record.statusCode);
  return {
    id: asString(record.id) || EM_DASH,
    activity: asString(record.description) || EM_DASH,
    user: asString(record.userName) || EM_DASH,
    role: asString(record.roleName) || EM_DASH,
    action: asString(record.action),
    entityKind: entityType ? humanize(entityType) : EM_DASH,
    entitySubject:
      asString(record.entityLabel) || asString(record.httpPath) || EM_DASH,
    method: asString(record.httpMethod) || EM_DASH,
    statusCode: statusCode === null ? EM_DASH : String(statusCode),
    timestamp: formatLogTimestamp(record.createdAt),
    ip: maskIpAddress(record.ipAddress),
  };
}

// --- Stats (footer counters).

export interface ActivityLogStats {
  total: number | null;
  today: number | null;
}

// null (unloaded/failed) stays null so the footer renders "—"; a loaded
// response keeps its true zeros.
export function mapActivityLogStats(
  stats: ActivityLogsStatsResponse | null | undefined,
): ActivityLogStats {
  const record = stats ?? {};
  return { total: asNumber(record.total), today: asNumber(record.today) };
}

// Footer copy for the stats endpoint's summary fields — never derived from
// an items array. Unloaded/failed -> "—".
export function formatActivityStats(
  stats: ActivityLogsStatsResponse | null | undefined,
): string {
  const mapped = mapActivityLogStats(stats);
  if (mapped.total === null) return EM_DASH;
  const today =
    mapped.today === null ? "" : ` • ${formatNumber(mapped.today)} recorded today`;
  return `${formatNumber(mapped.total)} immutable events${today}`;
}

// --- Filter options (populated from /filter-options, open-ended).

export interface ActivityLogFilterState {
  users: { userId: string; userName: string }[];
  roles: string[];
  actions: string[];
  entityTypes: string[];
}

export function mapActivityLogFilterOptions(
  options: ActivityLogFilterOptions | null | undefined,
): ActivityLogFilterState {
  const record = options ?? {};
  const users = Array.isArray(record.users) ? record.users : [];
  return {
    users: users
      .map((user) => ({
        userId: asString(user?.userId),
        userName: asString(user?.userName),
      }))
      .filter((user) => user.userId),
    roles: Array.isArray(record.roles)
      ? record.roles.map(asString).filter(Boolean)
      : [],
    actions: Array.isArray(record.actions)
      ? record.actions.map(asString).filter(Boolean)
      : [],
    entityTypes: Array.isArray(record.entityTypes)
      ? record.entityTypes.map(asString).filter(Boolean)
      : [],
  };
}

// --- Export (backend CSV).

export interface ActivityLogsExportQuery {
  action?: string;
  from?: string;
  to?: string;
}

// Filename from a Content-Disposition attachment header; null when absent.
function exportFilename(disposition: string | null): string | null {
  const match = /filename="?([^";]+)"?/i.exec(disposition ?? "");
  return match ? match[1] : null;
}

// GET /admin/ride-hailing/activity-logs/export — re-confirmed 2026-11-12 as
// 200 text/csv with Content-Disposition: attachment (a file download, 526
// bytes), so the button streams it through fetch + Blob: the token lives in a
// cookie-read header, so a plain <a href> link would not authenticate. Only
// the export params confirmed on the endpoint (action, from, to)
// are forwarded — search/userId/roleName/entityType are not documented on the
// export endpoint and are never invented. Returns the downloaded filename;
// throws the backend message (or the friendly network text) on failure.
export async function downloadActivityLogsCsv(
  query: ActivityLogsExportQuery,
): Promise<string> {
  const params = new URLSearchParams();
  if (query.action) params.set("action", query.action);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  const search = params.toString();
  const url = `${apiBaseUrl()}/admin/ride-hailing/activity-logs/export${
    search ? `?${search}` : ""
  }`;

  const headers = new Headers();
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(url, { method: "GET", headers });
  } catch (cause) {
    if (cause instanceof TypeError) throw new Error(NETWORK_ERROR_MESSAGE);
    throw cause;
  }

  if (!response.ok) {
    const data: unknown = await response.json().catch(() => null);
    throw new Error(
      backendMessage(data) ??
        (response.status === 401
          ? "Your session has expired. Please sign in again."
          : "Request failed. Please try again."),
    );
  }

  const blob = await response.blob();
  const filename =
    exportFilename(response.headers.get("Content-Disposition")) ??
    "activity-logs.csv";
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(href);
  return filename;
}


