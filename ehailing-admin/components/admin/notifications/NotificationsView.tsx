"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  Clock,
  Download,
  Inbox,
  MoreHorizontal,
  Plus,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { StatusPill } from "@/components/ui/StatusPill";
import type { StatusTone } from "@/components/ui/StatusPill";
import { Tabs } from "@/components/ui/Tabs";
import type { TabItem } from "@/components/ui/Tabs";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pagination, PAGE_SIZE } from "@/components/ui/Pagination";
import { FilterPopover } from "@/components/ui/FilterPopover";
import { Select } from "@/components/ui/Select";
import { PageHeader } from "@/components/admin/PageHeader";
import { RecordsToolbar } from "@/components/admin/RecordsToolbar";
import { StatCard, StatCardGrid } from "@/components/admin/StatCard";
import { RecordsTable } from "@/components/admin/records/RecordsTable";
import type { Column } from "@/components/admin/records/RecordsTable";
import {
  RecordsError,
  RecordsSkeleton,
} from "@/components/admin/records/RecordsListState";
import { useRecordsQuery } from "@/lib/hooks/useRecordsQuery";
import {
  buildCreateBody,
  cancelSchedule,
  createNotification,
  fetchDeliveriesPage,
  fetchNotificationDetail,
  fetchNotificationsPage,
  fetchNotificationsStats,
  mapNotificationListItem,
  mapNotificationStats,
  retrySend,
  sendNow,
  statLabel,
} from "@/lib/notifications";
import type {
  DeliveryRecordItem,
  NotificationStatsResponse,
} from "@/types/notifications-api";
import {
  NotificationDetailsDrawer,
  buildCampaignDetails,
} from "./NotificationDetailsDrawer";
import { CreateNotificationDrawer } from "./CreateNotificationDrawer";
import type {
  NotificationDraft,
  NotificationDraftResult,
} from "./CreateNotificationDrawer";
import { downloadCsv, toCsv } from "@/lib/csv";
import { useConfirmedExport } from "@/lib/hooks/useConfirmedExport";
import { useToast } from "@/components/ui/Toast";
import { entityActionMessage } from "@/lib/toast-messages";
import { EM_DASH, formatNumber, humanize } from "@/lib/format";
import {
  DELIVERY_STATUS_TONE,
  NOTIFICATION_STATUS_TONE,
  formatScheduleLabel,
  isNotificationTab,
} from "@/types/notifications";
import type {
  NotificationCampaign,
  NotificationStatus,
  NotificationTabId,
} from "@/types/notifications";

// Confirm-dialog copy per action. The send paths say out loud that real
// devices may be contacted; the old prototype's activity-log promise is gone
// because this page records no client-side activity.
const CONFIRM_SEND_DESCRIPTION =
  "This may send to real devices: the notification will be delivered to its audience immediately.";
const CONFIRM_SCHEDULE_DESCRIPTION =
  "This schedules the notification. The backend will send it to real devices at the scheduled time.";
const CONFIRM_DRAFT_DESCRIPTION =
  "This saves the notification as a draft. No devices are contacted until it is sent.";
const CONFIRM_CANCEL_DESCRIPTION =
  "This cancels the scheduled send and returns the campaign to drafts. No devices are contacted.";
// Shown when a create lands without an id: the campaign exists in the list,
// but this draft must never be POSTed again — the user checks the list first.
const NO_ID_MESSAGE =
  "Created, but no id returned. Check the list before retrying.";

const TABS: TabItem[] = [
  { id: "push", label: "Push" },
  { id: "email", label: "Email" },
  { id: "sms", label: "SMS" },
  { id: "templates", label: "Templates" },
  { id: "delivery-history", label: "Delivery History" },
];

// Confirmed `status` query-param values (every value
// probed 2026-11-13: each returns 200 with totals consistent with the
// unfiltered list total of 1).
const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "All statuses", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Sent", value: "sent" },
  { label: "Failed", value: "failed" },
];

// Confirmed `channel` values, driven by the tab (probed 2026-11-13: push 1,
// email 0, sms 0 against an unfiltered total of 1).
const TAB_CHANNEL: Partial<Record<NotificationTabId, string>> = {
  push: "push",
  email: "email",
  sms: "sms",
};

// Sentinel meaning "no restriction" inside the toolbar (matches useRecordsQuery).
const ALL = "all";

type CampaignActionId = "send-now" | "cancel-schedule" | "retry-send";
type ListActionId = CampaignActionId | "edit" | "duplicate";

interface PendingAction {
  campaignId: string;
  actionId: CampaignActionId;
}

const MENU: {
  id: ListActionId;
  label: string;
  danger?: boolean;
  statuses: NotificationStatus[];
}[] = [
  // No confirmed endpoint updates a campaign: visible but always disabled.
  { id: "edit", label: "Edit", statuses: [] },
  { id: "send-now", label: "Send now", statuses: ["Draft", "Scheduled"] },
  {
    id: "cancel-schedule",
    label: "Cancel schedule",
    danger: true,
    statuses: ["Scheduled"],
  },
  { id: "retry-send", label: "Retry send", statuses: ["Failed"] },
  {
    id: "duplicate",
    label: "Duplicate",
    statuses: ["Draft", "Scheduled", "Sent", "Failed"],
  },
];

function disabledReason(id: ListActionId): string {
  switch (id) {
    case "edit":
      return "Not available yet";
    case "send-now":
      return "Only drafts and scheduled notifications can be sent.";
    case "cancel-schedule":
      return "Only scheduled notifications can be cancelled.";
    case "retry-send":
      return "Only failed notifications can be retried.";
    default:
      return "";
  }
}

// Unknown backend statuses humanise to labels that are not keys of the tone
// maps; those render a neutral chip instead of a broken colour.
function campaignStatusTone(status: NotificationStatus): StatusTone {
  return (
    (NOTIFICATION_STATUS_TONE as Partial<Record<string, StatusTone>>)[status] ??
    "neutral"
  );
}

function deliveryStatusTone(label: string): StatusTone {
  return (
    (DELIVERY_STATUS_TONE as Partial<Record<string, StatusTone>>)[label] ??
    "neutral"
  );
}

// "—" for a null/missing percentage instead of a fabricated 0%.
function percent(value: number | null | undefined): string {
  return value === null || value === undefined ? EM_DASH : `${value}%`;
}

const CAMPAIGN_COLUMNS: Column<NotificationCampaign>[] = [
  {
    key: "title",
    header: "Title",
    cell: (row) => (
      <span className="flex min-w-0 items-center gap-3">
        <InitialsAvatar initials={row.initials} tone={row.tone} />
        <span className="min-w-0 truncate text-sm font-semibold text-ink">
          {row.title}
        </span>
      </span>
    ),
  },
  {
    key: "channel",
    header: "Channel",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (row) => row.channel,
  },
  {
    key: "audience",
    header: "Audience",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (row) => row.audience,
  },
  {
    key: "schedule",
    header: "Schedule",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (row) => row.schedule,
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => (
      <StatusPill tone={campaignStatusTone(row.status)} label={row.status} />
    ),
  },
];

// Delivery-history columns are typed against the backend item so nulls stay
// visible as "—"; this table only renders if the (currently 500) endpoint
// starts returning data — no filters or pagination are built around it.
const DELIVERY_COLUMNS: Column<DeliveryRecordItem>[] = [
  {
    key: "title",
    header: "Title",
    cell: (row) => (
      <span className="min-w-0 truncate text-sm font-semibold text-ink">
        {row.title || EM_DASH}
      </span>
    ),
  },
  {
    key: "channel",
    header: "Channel",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (row) => (row.channel ? humanize(row.channel) : EM_DASH),
  },
  {
    key: "audience",
    header: "Audience",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (row) => (row.audience ? humanize(row.audience) : EM_DASH),
  },
  {
    key: "sent",
    header: "Sent",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (row) =>
      typeof row.sent === "number" && Number.isFinite(row.sent)
        ? formatNumber(row.sent)
        : EM_DASH,
  },
  {
    key: "delivered",
    header: "Delivered (%)",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (row) => percent(row.deliveredPercent),
  },
  {
    key: "opened",
    header: "Opened (%)",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (row) => percent(row.openedPercent),
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => {
      const label = row.status ? humanize(row.status) : EM_DASH;
      return <StatusPill tone={deliveryStatusTone(label)} label={label} />;
    },
  },
];

interface NotificationsViewProps {
  initialTab?: string;
}

interface ComposerState {
  open: boolean;
  title: string;
  initial: NotificationDraft | null;
  toneIndex: number;
}

const CLOSED_COMPOSER: ComposerState = {
  open: false,
  title: "Create notification",
  initial: null,
  toneIndex: 0,
};

// mode "submit" sends or schedules from the composer; mode "draft" only
// persists the campaign as a draft. Both confirm first, both refetch after
// the backend confirms.
interface PendingSubmit {
  draft: NotificationDraftResult;
  mode: "submit" | "draft";
  // Kept the moment step 1 (create) succeeds: if step 2 (send) fails, the
  // next confirm reuses it and repeats only the send — never a second create.
  createdId?: string;
  // Set when create succeeded but returned no id: this draft is blocked —
  // confirming again never POSTs, and cancelling drops it without reopening
  // the composer.
  createdWithoutId?: boolean;
}

// Prefills the composer from a row for duplication. Scheduled rows reopen in
// "Schedule for later" mode with their label parsed back to date/time; a
// scheduled label that can't be parsed leaves the delivery option unset —
// never "Send now", which would risk an immediate send. Every other status
// reopens as "Send now". The backend stores no city field, so the prefill
// resets city to its default.
function draftFromCampaign(campaign: NotificationCampaign): NotificationDraft {
  const scheduled = campaign.status === "Scheduled";
  const parsed = scheduled ? parseScheduleLabel(campaign.schedule) : null;
  return {
    title: campaign.title,
    message: campaign.message,
    audience: campaign.audience,
    channel: campaign.channel,
    city: "All cities",
    schedule: scheduled ? (parsed ? "Schedule for later" : "") : "Send now",
    date: parsed?.date ?? "",
    time: parsed?.time ?? "",
  };
}

const MONTH_INDEX: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

// Inverse of formatScheduleLabel ("14 Jun, 9:00 AM" / "Today, 8:00 AM").
// Returns null when the label can't be parsed, so the composer leaves the
// delivery option unset instead of showing a bogus date. Only runs in event
// handlers.
function parseScheduleLabel(label: string): { date: string; time: string } | null {
  const [dayPart, timePart] = label.split(", ");
  if (!dayPart || !timePart) return null;

  const timeMatch = timePart.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!timeMatch) return null;
  const hour24 = Number(timeMatch[1]) % 12 + (timeMatch[3] === "PM" ? 12 : 0);
  const time = `${String(hour24).padStart(2, "0")}:${timeMatch[2]}`;

  if (dayPart === "Today") {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return { date: `${now.getFullYear()}-${month}-${day}`, time };
  }

  const dayMatch = dayPart.match(/^(\d{2}) ([A-Z][a-z]{2})$/);
  if (!dayMatch || MONTH_INDEX[dayMatch[2]] === undefined) return null;
  const month = String(MONTH_INDEX[dayMatch[2]] + 1).padStart(2, "0");
  return { date: `${new Date().getFullYear()}-${month}-${dayMatch[1]}`, time };
}

function actionTitle(actionId: CampaignActionId): string {
  if (actionId === "send-now") return "Confirm send now";
  if (actionId === "cancel-schedule") return "Confirm cancel schedule";
  return "Confirm retry send";
}

export function NotificationsView({ initialTab }: NotificationsViewProps) {
  const router = useRouter();
  const toast = useToast();
  const confirmedExport = useConfirmedExport();

  const [activeTab, setActiveTab] = useState<NotificationTabId>(() =>
    isNotificationTab(initialTab) ? initialTab : "push",
  );

  // Stats: null = not loaded or failed -> the cards render "—"; a loaded
  // response shows the endpoint's true zeros (never a fabricated 0).
  const [statsData, setStatsData] = useState<NotificationStatsResponse | null>(
    null,
  );
  const [statsRetry, setStatsRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    fetchNotificationsStats(controller.signal)
      .then((data) => {
        if (cancelled) return;
        setStatsData(data);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        if (cause instanceof Error && cause.name === "AbortError") return;
        setStatsData(null);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [statsRetry]);

  const summary = mapNotificationStats(statsData);

  const isCampaignTab =
    activeTab === "push" || activeTab === "email" || activeTab === "sms";

  // Server-side pagination/search/status: useRecordsQuery owns the debounced
  // search (400ms), page resets, totals, loading/error states and the
  // stale-response protection for the campaign list.
  const {
    query,
    setQuery,
    filterValues,
    setFilter,
    clearFilters,
    activeFilterCount,
    page,
    setPage,
    rows,
    total,
    loading,
    error,
    retry,
    updateRows,
  } = useRecordsQuery<NotificationCampaign>({
    filterKeys: ["status"],
    fetchPage: async (
      { page: nextPage, pageSize, query: search, filters },
      signal,
    ) => {
      if (!isCampaignTab) {
        // Templates and delivery history never hit the campaign endpoint;
        // their panels render their own state instead of this page.
        return { items: [], total: 0, totalPages: 0 };
      }
      const result = await fetchNotificationsPage(
        {
          page: nextPage,
          limit: pageSize,
          channel: TAB_CHANNEL[activeTab],
          status: filters.status !== ALL ? filters.status : undefined,
          search: search.trim() || undefined,
        },
        signal,
      );
      return {
        items: (result.items ?? []).map(mapNotificationListItem),
        total: Number(result.total) || 0,
        totalPages: Number(result.totalPages) || 0,
      };
    },
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Delivery history fetches on its own: GET /notifications/deliveries
  // returned 500 when probed (2026-11-13), so the tab shows an error state
  // with Retry and nothing else is built around it while it fails. Loading
  // flips in the event handlers (tab change / retry), never in the effect.
  const [deliveryRows, setDeliveryRows] = useState<DeliveryRecordItem[]>([]);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(
    initialTab === "delivery-history",
  );
  const [deliveryRetry, setDeliveryRetry] = useState(0);

  useEffect(() => {
    if (activeTab !== "delivery-history") return;
    const controller = new AbortController();
    let cancelled = false;
    fetchDeliveriesPage({ page: 1, limit: PAGE_SIZE }, controller.signal)
      .then((result) => {
        if (cancelled) return;
        setDeliveryRows(result.items);
        setDeliveryLoading(false);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        if (cause instanceof Error && cause.name === "AbortError") return;
        setDeliveryRows([]);
        setDeliveryError(
          cause instanceof Error && cause.message
            ? cause.message
            : "Request failed. Please try again.",
        );
        setDeliveryLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [activeTab, deliveryRetry]);

  const [composer, setComposer] = useState<ComposerState>(CLOSED_COMPOSER);
  const [pendingSubmit, setPendingSubmit] = useState<PendingSubmit | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [mutating, setMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const selected = rows.find((campaign) => campaign.id === selectedId) ?? null;
  const pendingCampaign = pendingAction
    ? rows.find((campaign) => campaign.id === pendingAction.campaignId) ?? null
    : null;

  function changeTab(id: string) {
    if (!isNotificationTab(id)) return;
    setActiveTab(id);
    setSelectedId(null);
    // Clear the previous tab's rows so the switch shows the skeleton, never
    // another channel's records; a fresh filter identity also refetches with
    // the new tab's channel (and resets any status filter).
    updateRows(() => []);
    setFilter("status", ALL);
    if (id === "delivery-history") {
      // Entering the tab starts its fetch; the reset happens here, in the
      // event handler, so the delivery effect never sets state synchronously.
      setDeliveryRows([]);
      setDeliveryError(null);
      setDeliveryLoading(true);
      setDeliveryRetry((token) => token + 1);
    }
    // Reflect the tab in the URL so it survives a refresh.
    router.replace(`?tab=${id}`, { scroll: false });
  }

  // One Retry for both resources (they share the backend).
  function retryAll() {
    retry();
    setStatsRetry((token) => token + 1);
  }

  function openCreate() {
    setComposer({
      open: true,
      title: "Create notification",
      initial: null,
      toneIndex: rows.length,
    });
  }

  // Duplicating reuses the row's values (including a parseable schedule) but
  // always commits as a new campaign; draftFromCampaign decides the delivery
  // option, including leaving it unset when a scheduled label won't parse.
  function openDuplicate(campaign: NotificationCampaign) {
    setComposer({
      open: true,
      title: "Create notification",
      initial: draftFromCampaign(campaign),
      toneIndex: rows.length + 1,
    });
  }

  // Row menu actions: duplicate reopens the composer (no mutation yet), the
  // status changes go through the confirm dialog. "edit" never reaches here —
  // MENU keeps it disabled because no update endpoint exists.
  function requestAction(
    campaign: NotificationCampaign,
    actionId: ListActionId,
  ) {
    if (actionId === "edit") return;
    if (actionId === "duplicate") {
      openDuplicate(campaign);
      return;
    }
    setMutationError(null);
    setPendingAction({ campaignId: campaign.id, actionId });
  }

  // Primary composer action: close the drawer, then ask for confirmation.
  function handleSubmit(draft: NotificationDraftResult) {
    setComposer(CLOSED_COMPOSER);
    setPendingSubmit({ draft, mode: "submit" });
  }

  // Every mutation confirms first, drafts included; no local change happens
  // before the backend confirms.
  function handleSaveDraft(draft: NotificationDraftResult) {
    setComposer(CLOSED_COMPOSER);
    setPendingSubmit({ draft, mode: "draft" });
  }

  async function handleConfirm(note: string) {
    void note; // the note field is display-only: the backend stores no note
    if (mutating) return; // block double submit
    setMutating(true);
    setMutationError(null);
    try {
      if (pendingSubmit) {
        const { draft, mode } = pendingSubmit;
        // A create that landed without an id blocks this draft for good:
        // confirming again must never POST a second campaign.
        if (pendingSubmit.createdWithoutId) {
          setMutationError(NO_ID_MESSAGE);
          return;
        }
        // Step 1 — create. The id is stored on the pending submit as soon as
        // it exists, so a retry after a failed step 2 never POSTs again.
        const sendRetry = Boolean(pendingSubmit.createdId);
        let createdId = pendingSubmit.createdId;
        if (!createdId) {
          const created = await createNotification(buildCreateBody(draft));
          const extracted =
            created && typeof created === "object" && "id" in created
              ? (created as { id?: unknown }).id
              : undefined;
          if (typeof extracted !== "string" || !extracted) {
            // The create landed but came back without an id: refetch so the
            // new draft is visible, block this draft (no second POST) and
            // stop — the user checks the list before retrying.
            retryAll();
            setPendingSubmit({ draft, mode, createdWithoutId: true });
            setMutationError(NO_ID_MESSAGE);
            return;
          }
          createdId = extracted;
          setPendingSubmit({ draft, mode, createdId });
        }
        if (mode === "submit" && draft.schedule === "Send now") {
          if (sendRetry) {
            // Before retrying step 2: refetch list + stats, then re-read this
            // campaign's status — only a still-draft campaign may be resent
            // (never repeat a send that already landed).
            retryAll();
            let label: string;
            try {
              const detail: unknown = await fetchNotificationDetail(createdId);
              const record =
                detail && typeof detail === "object"
                  ? (detail as Record<string, unknown>)
                  : null;
              // Tolerate a wrapped { item } envelope as well as the bare
              // campaign shape.
              const source =
                record && record.item && typeof record.item === "object"
                  ? (record.item as Record<string, unknown>)
                  : record;
              const raw = source ? source.status : undefined;
              label = typeof raw === "string" ? raw.trim().toLowerCase() : "";
            } catch {
              setMutationError(
                "Could not re-check the campaign status, so it was not resent. Check the list before retrying.",
              );
              return;
            }
            if (label !== "draft") {
              setMutationError(
                label
                  ? `Not resending: the campaign is ${humanize(label)} now, not a draft.`
                  : "Not resending: the campaign status could not be confirmed as a draft. Check the list before retrying.",
              );
              return;
            }
          }
          // MAY SEND TO REAL DEVICES: dispatch the campaign. A repeat confirm
          // after a failure skips step 1 and only repeats this call.
          try {
            await sendNow(createdId);
          } catch (sendCause) {
            // Partial failure: the campaign exists as a draft. Refetch list +
            // stats so its real status shows; the stored id stays on the
            // pending submit, so confirming again retries only the send.
            retryAll();
            setMutationError(
              `Saved as a draft, but sending failed: ${
                sendCause instanceof Error && sendCause.message
                  ? sendCause.message
                  : "Request failed. Please try again."
              }. Confirming again will only retry the send; it will not create another campaign.`,
            );
            return;
          }
        }
        if (mode === "draft") {
          toast.success({
            title: "Draft saved",
            description: `${draft.title} has been saved as a draft.`,
          });
        } else if (draft.schedule === "Schedule for later") {
          toast.success({
            title: "Notification scheduled",
            description: `${draft.title} is scheduled for ${formatScheduleLabel(draft.date, draft.time)}.`,
          });
        } else {
          toast.success(
            entityActionMessage("notification", "send-now", draft.title),
          );
        }
        setPendingSubmit(null); // also drops the stored created id
        // Refetch list + stats and land on the new campaign's channel tab.
        setStatsRetry((token) => token + 1);
        const target: NotificationTabId =
          draft.channel === "Email"
            ? "email"
            : draft.channel === "SMS"
              ? "sms"
              : "push";
        if (target !== activeTab) changeTab(target);
        else retry();
      } else if (pendingAction && pendingCampaign) {
        const { actionId } = pendingAction;
        // MAY SEND TO REAL DEVICES: send-now and retry-send fan out to every
        // recipient; cancel only touches the schedule.
        if (actionId === "cancel-schedule") {
          await cancelSchedule(pendingCampaign.id);
        } else if (actionId === "retry-send") {
          await retrySend(pendingCampaign.id);
        } else {
          await sendNow(pendingCampaign.id);
        }
        toast.success(
          entityActionMessage("notification", actionId, pendingCampaign.title),
        );
        setPendingAction(null);
        retryAll();
      }
    } catch (cause) {
      setMutationError(
        cause instanceof Error && cause.message
          ? cause.message
          : "Request failed. Please try again.",
      );
    } finally {
      setMutating(false);
    }
  }

  // Cancelling the dialog: nothing was sent — dropping the pending submit also
  // clears any stored created id, so a later submit starts from scratch.
  // Reopen the composer with its values intact, unless a create already landed
  // without an id (then the draft stays dropped so it can't POST twice).
  function handleConfirmCancel() {
    if (mutating) return;
    if (pendingSubmit) {
      if (!pendingSubmit.createdWithoutId) {
        const { draft } = pendingSubmit;
        setComposer({
          open: true,
          title: "Create notification",
          initial: draft,
          toneIndex: draft.toneIndex,
        });
      }
      setPendingSubmit(null);
    }
    setPendingAction(null);
    setMutationError(null);
  }

  function handleExport() {
    if (activeTab === "delivery-history") {
      const csv = toCsv(
        [
          "Title",
          "Channel",
          "Audience",
          "Sent",
          "Delivered (%)",
          "Opened (%)",
          "Status",
        ],
        deliveryRows.map((record) => [
          record.title ?? "",
          record.channel ?? "",
          record.audience ?? "",
          record.sent ?? "",
          record.deliveredPercent ?? "",
          record.openedPercent ?? "",
          record.status ?? "",
        ]),
      );
      downloadCsv("notification-deliveries.csv", csv);
      return;
    }
    const csv = toCsv(
      [
        "Title",
        "Message",
        "Channel",
        "Audience",
        "City",
        "Schedule",
        "Status",
        "Created by",
      ],
      rows.map((campaign) => [
        campaign.title,
        campaign.message,
        campaign.channel,
        campaign.audience,
        campaign.city,
        campaign.schedule,
        campaign.status,
        campaign.createdBy,
      ]),
    );
    downloadCsv(`notifications-${activeTab}.csv`, csv);
  }

  const statusLabel =
    STATUS_OPTIONS.find((option) => option.value === filterValues.status)
      ?.label ?? "All statuses";

  // The backend stores no city field: the filter keeps its slot, disabled.
  const filters = (
    <FilterPopover activeCount={activeFilterCount} onClear={clearFilters}>
      <span title="Not saved yet" className="block">
        <Select
          label="Filter by city"
          value={ALL}
          onChange={() => undefined}
          disabled
        >
          <option value={ALL}>All cities</option>
        </Select>
      </span>
    </FilterPopover>
  );

  const exportDisabled =
    activeTab === "templates" ||
    (activeTab === "delivery-history" && deliveryRows.length === 0);
  const exportDisabledReason =
    activeTab === "templates"
      ? "Not available yet"
      : "No delivery data to export";

  const confirmOpen = pendingSubmit !== null || pendingAction !== null;
  const confirmTitle = pendingSubmit
    ? pendingSubmit.mode === "draft"
      ? "Confirm save draft"
      : pendingSubmit.draft.schedule === "Schedule for later"
        ? "Confirm schedule notification"
        : "Confirm send notification"
    : pendingAction
      ? actionTitle(pendingAction.actionId)
      : "";
  const confirmDescription = pendingSubmit
    ? pendingSubmit.mode === "draft"
      ? CONFIRM_DRAFT_DESCRIPTION
      : pendingSubmit.draft.schedule === "Schedule for later"
        ? CONFIRM_SCHEDULE_DESCRIPTION
        : CONFIRM_SEND_DESCRIPTION
    : pendingAction?.actionId === "cancel-schedule"
      ? CONFIRM_CANCEL_DESCRIPTION
      : CONFIRM_SEND_DESCRIPTION;
  const confirmTone =
    pendingAction?.actionId === "cancel-schedule" ? "danger" : "brand";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notifications"
        description="Compose and monitor platform communications across every channel."
        actions={
          <>
            <span
              title={exportDisabled ? exportDisabledReason : undefined}
              className="inline-flex"
            >
              <Button
                variant="secondary"
                disabled={exportDisabled}
                onClick={() =>
                  confirmedExport.requestExport("Confirm export", handleExport)
                }
              >
                <Download className="size-4" aria-hidden="true" />
                Export
              </Button>
            </span>
            {activeTab === "templates" ? (
              <span title="Not available yet" className="inline-flex">
                <Button disabled>
                  <Plus className="size-4" aria-hidden="true" />
                  Create template
                </Button>
              </span>
            ) : (
              <Button onClick={openCreate}>
                <Plus className="size-4" aria-hidden="true" />
                Create notification
              </Button>
            )}
          </>
        }
      />

      {/* Stat cards come from GET /notifications/stats summary fields only;
          null (unloaded/failed) renders "—", loaded zeros stay 0. */}
      {isCampaignTab ? (
        <StatCardGrid>
          <StatCard
            icon={Bell}
            tone="brand"
            label="Total campaigns"
            value={statLabel(summary.campaigns.total)}
          />
          <StatCard
            icon={Clock}
            tone="info"
            label="Scheduled"
            value={statLabel(summary.campaigns.scheduled)}
          />
          <StatCard
            icon={Check}
            tone="success"
            label="Sent"
            value={statLabel(summary.campaigns.sent)}
          />
          <StatCard
            icon={TriangleAlert}
            tone="warning"
            label="Failed"
            value={statLabel(summary.campaigns.failed)}
          />
        </StatCardGrid>
      ) : activeTab === "delivery-history" ? (
        <StatCardGrid>
          <StatCard
            icon={Inbox}
            tone="brand"
            label="Total deliveries"
            value={statLabel(summary.deliveries.total)}
          />
          <StatCard
            icon={Check}
            tone="success"
            label="Deliveries sent"
            value={statLabel(summary.deliveries.sent)}
          />
          <StatCard
            icon={TriangleAlert}
            tone="warning"
            label="Deliveries failed"
            value={statLabel(summary.deliveries.failed)}
          />
        </StatCardGrid>
      ) : null}

      <Card className="min-w-0">
        <div className="-mx-5 mb-4 px-5">
          <Tabs tabs={TABS} value={activeTab} onChange={changeTab} />
        </div>

        {isCampaignTab ? (
          <>
            <RecordsToolbar
              query={query}
              onQueryChange={setQuery}
              placeholder="Search notifications..."
              searchLabel="Search notifications"
              statusOptions={STATUS_OPTIONS.map((option) => option.label)}
              status={statusLabel}
              onStatusChange={(value) =>
                setFilter(
                  "status",
                  STATUS_OPTIONS.find((option) => option.label === value)
                    ?.value ?? ALL,
                )
              }
              filters={filters}
              resultCount={total}
              countLabel="records"
            />

            {loading && rows.length === 0 ? (
              <RecordsSkeleton />
            ) : error && rows.length === 0 ? (
              <RecordsError message={error} onRetry={retryAll} />
            ) : (
              <div
                aria-busy={loading}
                className={
                  loading
                    ? "opacity-60 transition-opacity"
                    : "transition-opacity"
                }
              >
                {error ? (
                  <div className="mb-4">
                    <RecordsError message={error} onRetry={retryAll} />
                  </div>
                ) : null}
                <RecordsTable
                  columns={CAMPAIGN_COLUMNS}
                  rows={rows}
                  getKey={(campaign) => campaign.id}
                  onOpen={(campaign) => setSelectedId(campaign.id)}
                  rowLabel={(campaign) => campaign.title}
                  minWidth={1040}
                  emptyMessage="No notifications match your filters."
                  renderActions={(campaign) => (
                    <RowActionsMenu
                      campaign={campaign}
                      onView={() => setSelectedId(campaign.id)}
                      onAction={(actionId) =>
                        requestAction(campaign, actionId)
                      }
                    />
                  )}
                  renderCard={(campaign) => (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <InitialsAvatar
                            initials={campaign.initials}
                            tone={campaign.tone}
                          />
                          <p className="min-w-0 truncate text-sm font-semibold text-ink">
                            {campaign.title}
                          </p>
                        </div>
                        <StatusPill
                          tone={campaignStatusTone(campaign.status)}
                          label={campaign.status}
                        />
                      </div>
                      <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
                        <span>{campaign.channel}</span>
                        <span aria-hidden="true">·</span>
                        <span>{campaign.audience}</span>
                        <span aria-hidden="true">·</span>
                        <span>{campaign.city}</span>
                      </p>
                      <p className="mt-1 text-sm text-ink-muted">
                        {campaign.schedule}
                      </p>
                    </>
                  )}
                />
              </div>
            )}

            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onPageChange={setPage}
            />
          </>
        ) : activeTab === "templates" ? (
          // No template endpoints exist: the tab stays visible with an
          // availability note, never a fabricated list.
          <p className="px-1 py-8 text-center text-sm text-ink-muted">
            Not available yet
          </p>
        ) : deliveryLoading && deliveryRows.length === 0 ? (
          <RecordsSkeleton />
        ) : deliveryError ? (
          // GET /notifications/deliveries is still 500 (probed 2026-11-13):
          // an error state with Retry and nothing built around it.
          <RecordsError
            message={deliveryError}
            onRetry={() => {
              setDeliveryError(null);
              setDeliveryLoading(true);
              setDeliveryRetry((token) => token + 1);
            }}
          />
        ) : (
          <RecordsTable
            columns={DELIVERY_COLUMNS}
            rows={deliveryRows}
            getKey={(record) =>
              record.id ?? `dl-${record.title ?? ""}-${record.sent ?? 0}`
            }
            rowLabel={(record) => record.title ?? "Delivery"}
            minWidth={1000}
            emptyMessage="No delivery history yet."
            hideActions
            renderCard={(record) => {
              const deliveryStatusLabel = record.status
                ? humanize(record.status)
                : EM_DASH;
              return (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-semibold text-ink">
                      {record.title || EM_DASH}
                    </p>
                    <StatusPill
                      tone={deliveryStatusTone(deliveryStatusLabel)}
                      label={deliveryStatusLabel}
                    />
                  </div>
                  <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
                    <span>
                      {record.channel ? humanize(record.channel) : EM_DASH}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {record.audience ? humanize(record.audience) : EM_DASH}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {typeof record.sent === "number"
                      ? formatNumber(record.sent)
                      : EM_DASH}{" "}
                    sent · {percent(record.deliveredPercent)} delivered ·{" "}
                    {percent(record.openedPercent)} opened
                  </p>
                </>
              );
            }}
          />
        )}
      </Card>

      <NotificationDetailsDrawer
        details={selected ? buildCampaignDetails(selected) : null}
        onClose={() => setSelectedId(null)}
      />

      <CreateNotificationDrawer
        open={composer.open}
        title={composer.title}
        initial={composer.initial}
        toneIndex={composer.toneIndex}
        onClose={() => setComposer(CLOSED_COMPOSER)}
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
      />

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        description={confirmDescription}
        noteLabel="Internal note"
        // The backend stores no note field: the control keeps its slot
        // disabled with a "Not saved yet" helper.
        noteDisabled
        confirmTone={confirmTone}
        loading={mutating}
        error={mutationError}
        onConfirm={handleConfirm}
        onCancel={handleConfirmCancel}
      />

      {confirmedExport.dialog}
    </div>
  );
}

interface RowActionsMenuProps {
  campaign: NotificationCampaign;
  onView: () => void;
  onAction: (actionId: ListActionId) => void;
}

// Per-row "…": View details plus the status-allowed entries from MENU, each
// unavailable action disabled (never hidden) with its reason as a tooltip.
// Closes on outside click or Escape and never triggers the row's own open
// handler.
function RowActionsMenu({ campaign, onView, onAction }: RowActionsMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative inline-block text-left"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${campaign.title}`}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <MoreHorizontal className="size-4" aria-hidden="true" />
      </button>
      {open ? (
        <RowMenuBackdrop onClose={() => setOpen(false)}>
          <MenuItem onSelect={onView} onClose={() => setOpen(false)}>
            View details
          </MenuItem>
          {MENU.map((entry) => {
            const disabled = !entry.statuses.includes(campaign.status);
            return (
              <span
                key={entry.id}
                role="none"
                className="block"
                title={disabled ? disabledReason(entry.id) : undefined}
              >
                <MenuItem
                  disabled={disabled}
                  tone={entry.danger ? "danger" : "default"}
                  onSelect={() => onAction(entry.id)}
                  onClose={() => setOpen(false)}
                >
                  {entry.label}
                </MenuItem>
              </span>
            );
          })}
        </RowMenuBackdrop>
      ) : null}
    </div>
  );
}

// Closes the menu on outside pointer-down and Escape.
function RowMenuBackdrop({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) onClose();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      className="absolute right-0 top-full z-40 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg"
    >
      {children}
    </div>
  );
}

function MenuItem({
  children,
  onSelect,
  onClose,
  disabled = false,
  tone = "default",
}: {
  children: ReactNode;
  onSelect: () => void;
  onClose: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={() => {
        onSelect();
        onClose();
      }}
      className={`block w-full px-4 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        tone === "danger"
          ? "text-danger hover:bg-danger-soft"
          : "text-ink hover:bg-surface-muted"
      }`}
    >
      {children}
    </button>
  );
}
