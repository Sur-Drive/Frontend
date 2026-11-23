"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ChartColumnBig,
  Download,
  MoreHorizontal,
  Plus,
  Users,
  Wallet,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { StatusPill } from "@/components/ui/StatusPill";
import { Pagination, PAGE_SIZE } from "@/components/ui/Pagination";
import { FilterPopover } from "@/components/ui/FilterPopover";
import { Tabs } from "@/components/ui/Tabs";
import type { TabItem } from "@/components/ui/Tabs";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/admin/PageHeader";
import { RecordsToolbar } from "@/components/admin/RecordsToolbar";
import { StatCard, StatCardGrid } from "@/components/admin/StatCard";
import { RecordsTable } from "@/components/admin/records/RecordsTable";
import type { Column } from "@/components/admin/records/RecordsTable";
import { EntityDrawer } from "@/components/admin/details/EntityDrawer";
import { buildPromotionDetails } from "@/lib/entity-details/promotion";
import { useRecordsList } from "@/lib/hooks/useRecordsList";
import { downloadCsv, toCsv } from "@/lib/csv";
import { useConfirmedExport } from "@/lib/hooks/useConfirmedExport";
import { formatNumber } from "@/lib/format";
import {
  PROMOTION_STATUS_TONE,
  PROMOTION_STATUSES,
  formatDiscount,
  formatPromotionDate,
} from "@/types/promotions";
import type {
  Promotion,
  PromotionStatus,
  PromotionSummary,
} from "@/types/promotions";
import { CreatePromotionDrawer } from "./CreatePromotionDrawer";
import { useToast } from "@/components/ui/Toast";
import { entityActionMessage } from "@/lib/toast-messages";

const CONFIRM_DESCRIPTION =
  "Please confirm you want to continue.";

const ALL_STATUSES_LABEL = "All statuses";

const TABS: TabItem[] = [
  { id: "all-campaigns", label: "All Campaigns" },
  { id: "active", label: "Active" },
  { id: "scheduled", label: "Scheduled" },
  { id: "paused", label: "Paused" },
  { id: "expired", label: "Expired" },
];

const ALL_DISCOUNT = "all";

// Tab id <-> list status. "all-campaigns" is the hook's "all" sentinel.
function statusFromTab(tabId: string): string {
  return tabId === "all-campaigns" ? "all" : tabId;
}

function tabFromStatus(status: string): string {
  return status === "all" ? "all-campaigns" : status;
}

const CSV_COLUMNS = [
  "Promo code",
  "Campaign name",
  "Discount type",
  "Discount value",
  "Usage limit",
  "Used count",
  "Start date",
  "End date",
  "Status",
];

const COLUMNS: Column<Promotion>[] = [
  {
    key: "code",
    header: "Promo code",
    className: "whitespace-nowrap text-sm font-semibold text-ink",
    cell: (promotion) => promotion.code,
  },
  {
    key: "name",
    header: "Campaign name",
    cell: (promotion) => (
      <span className="flex min-w-0 items-center gap-3">
        <InitialsAvatar initials={promotion.initials} tone={promotion.tone} />
        <span className="min-w-0 truncate text-sm font-semibold text-ink">
          {promotion.name}
        </span>
      </span>
    ),
  },
  {
    key: "discountType",
    header: "Discount type",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (promotion) => promotion.discountType,
  },
  {
    key: "discountValue",
    header: "Discount value",
    className: "whitespace-nowrap text-sm text-ink",
    cell: (promotion) => formatDiscount(promotion),
  },
  {
    key: "usageLimit",
    header: "Usage limit",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (promotion) => formatNumber(promotion.usageLimit),
  },
  {
    key: "usedCount",
    header: "Used count",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (promotion) => formatNumber(promotion.usedCount),
  },
  {
    key: "startDate",
    header: "Start date",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (promotion) => formatPromotionDate(promotion.startDate),
  },
  {
    key: "endDate",
    header: "End date",
    className: "whitespace-nowrap text-sm text-ink-muted",
    cell: (promotion) => formatPromotionDate(promotion.endDate),
  },
  {
    key: "status",
    header: "Status",
    cell: (promotion) => (
      <StatusPill
        tone={PROMOTION_STATUS_TONE[promotion.status]}
        label={promotion.status}
      />
    ),
  },
];

type PromotionActionId = "expire" | "pause" | "activate";

// Next status a confirmed action produces.
function nextStatusFor(actionId: PromotionActionId): PromotionStatus {
  if (actionId === "expire") return "Expired";
  if (actionId === "pause") return "Paused";
  return "Active";
}

function actionTitle(actionId: PromotionActionId): string {
  if (actionId === "expire") return "Confirm expire campaign";
  if (actionId === "pause") return "Confirm pause campaign";
  return "Confirm activate campaign";
}

function actionConfirmTone(actionId: PromotionActionId): "brand" | "danger" {
  return actionId === "expire" ? "danger" : "brand";
}

interface PendingAction {
  promotionId: string;
  actionId: PromotionActionId;
}

interface PromotionsViewProps {
  promotions: Promotion[];
  summary: PromotionSummary;
}

export function PromotionsView({
  promotions: initialPromotions,
  summary: initialSummary,
}: PromotionsViewProps) {
  const [promotions, setPromotions] = useState(initialPromotions);
  const confirmedExport = useConfirmedExport();
  const [summary, setSummary] = useState(initialSummary);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [pendingCreate, setPendingCreate] = useState<Promotion | null>(null);
  const [createResetKey, setCreateResetKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const {
    query,
    setQuery,
    status,
    setStatus,
    filterValues,
    setFilter,
    clearFilters,
    activeFilterCount,
    page,
    setPage,
    filtered,
    pageRows,
    total,
  } = useRecordsList<Promotion>({
    rows: promotions,
    searchText: (promotion) => `${promotion.code} ${promotion.name}`,
    statusOf: (promotion) => promotion.status,
    filters: {
      discountType: (promotion, value) => promotion.discountType === value,
    },
  });

  const selected = promotions.find((item) => item.id === selectedId) ?? null;
  const pendingPromotion =
    promotions.find((item) => item.id === pending?.promotionId) ?? null;

  // Applies a status change to the list and keeps the Active Campaigns stat in
  // sync (the other aggregates aren't derived from a single campaign's status).
  function applyAction(promotion: Promotion, actionId: PromotionActionId) {
    const next = nextStatusFor(actionId);
    setPromotions((current) =>
      current.map((item) =>
        item.id === promotion.id
          ? { ...item, status: next, lastUpdated: "just now" }
          : item,
      ),
    );
    const wasActive = promotion.status === "Active";
    const willBeActive = next === "Active";
    if (wasActive !== willBeActive) {
      setSummary((current) => ({
        ...current,
        activeCampaigns: current.activeCampaigns + (willBeActive ? 1 : -1),
      }));
    }
  }

  function commitCreate(promotion: Promotion) {
    setPromotions((current) => [promotion, ...current]);
    if (promotion.status === "Active") {
      setSummary((current) => ({
        ...current,
        activeCampaigns: current.activeCampaigns + 1,
      }));
    }
  }

  // The drawer requests a create; hide the drawer and open the confirm dialog.
  // Cancelling reopens the drawer with the entered values intact.
  function requestCreate(promotion: Promotion) {
    setError(null);
    setCreateOpen(false);
    setPendingCreate(promotion);
  }

  function handleExport() {
    const rows = filtered.map((promotion) => [
      promotion.code,
      promotion.name,
      promotion.discountType,
      formatDiscount(promotion),
      promotion.usageLimit,
      promotion.usedCount,
      formatPromotionDate(promotion.startDate),
      formatPromotionDate(promotion.endDate),
      promotion.status,
    ]);
    const today = new Date().toISOString().slice(0, 10);
    downloadCsv(`promotions-${today}.csv`, toCsv(CSV_COLUMNS, rows));
  }

  function requestAction(promotionId: string, actionId: PromotionActionId) {
    setError(null);
    setPending({ promotionId, actionId });
  }

  // Mirrors runEntityAction's local-resolve stub; the note goes nowhere until
  // the promotions endpoint contract is confirmed (then send it via apiFetch).
  async function handleConfirm(note: string) {
    void note;
    setLoading(true);
    setError(null);
    try {
      if (pendingCreate) {
        commitCreate(pendingCreate);
        toast.success({
          title: "Promotion created",
          description: `${pendingCreate.name} (${pendingCreate.code}) is now ${pendingCreate.status}.`,
        });
        setPendingCreate(null);
        // Bump so the drawer clears its draft next time it opens.
        setCreateResetKey((value) => value + 1);
      } else if (pendingPromotion && pending) {
        applyAction(pendingPromotion, pending.actionId);
        toast.success(
          entityActionMessage("promotion", pending.actionId, pendingPromotion.code),
        );
        setPending(null);
      }
      setLoading(false);
    } catch {
      setLoading(false);
      setError("Something went wrong. Please try again.");
    }
  }


  const filters = (
    <FilterPopover activeCount={activeFilterCount} onClear={clearFilters}>
      <Select
        label="Filter by discount type"
        value={filterValues.discountType}
        onChange={(event) => setFilter("discountType", event.target.value)}
      >
        <option value={ALL_DISCOUNT}>All discount types</option>
        <option value="Percentage">Percentage</option>
        <option value="Fixed">Fixed</option>
      </Select>
    </FilterPopover>
  );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <PageHeader
        title="Promotions"
        description="Create offers, manage campaign usage and track redemptions."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() =>
                confirmedExport.requestExport("Confirm export", handleExport)
              }
            >
              <Download className="size-4" aria-hidden="true" />
              Export
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Create promotion
            </Button>
          </>
        }
      />

      <StatCardGrid>
        <StatCard
          icon={Plus}
          tone="brand"
          label="Active Campaigns"
          value={formatNumber(summary.activeCampaigns)}
          note={summary.endingSoonNote}
        />
        <StatCard
          icon={Users}
          tone="success"
          label="Total Redemptions"
          value={formatNumber(summary.totalRedemptions)}
          note={summary.redemptionsDelta}
        />
        <StatCard
          icon={Wallet}
          tone="warning"
          label="Discount Value"
          value={summary.discountValue}
          note={summary.discountValueNote}
          noteTone="muted"
        />
        <StatCard
          icon={ChartColumnBig}
          tone="info"
          label="Conversion Rate"
          value={summary.conversionRate}
          note={summary.conversionDelta}
        />
      </StatCardGrid>

      <Card className="min-w-0">
        <div className="-mx-5 mb-4 px-5">
          <Tabs
            tabs={TABS}
            value={tabFromStatus(status)}
            onChange={(id) => setStatus(statusFromTab(id))}
          />
        </div>

        <RecordsToolbar
          query={query}
          onQueryChange={setQuery}
          placeholder="Search promotions..."
          searchLabel="Search promotions"
          statusOptions={[ALL_STATUSES_LABEL, ...PROMOTION_STATUSES]}
          status={status === "all" ? ALL_STATUSES_LABEL : status}
          onStatusChange={(value) =>
            setStatus(value === ALL_STATUSES_LABEL ? "all" : value)
          }
          filters={filters}
          resultCount={total}
          countLabel="records"
        />


        <RecordsTable
          columns={COLUMNS}
          rows={pageRows}
          getKey={(promotion) => promotion.id}
          onOpen={(promotion) => setSelectedId(promotion.id)}
          rowLabel={(promotion) => promotion.name}
          minWidth={1180}
          emptyMessage="No promotions match your filters."
          renderActions={(promotion) => (
            <RowActionsMenu
              promotion={promotion}
              onView={() => setSelectedId(promotion.id)}
              onAction={(actionId) => requestAction(promotion.id, actionId)}
            />
          )}
          renderCard={(promotion) => (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <InitialsAvatar
                    initials={promotion.initials}
                    tone={promotion.tone}
                  />
                  <p className="min-w-0 truncate text-sm font-semibold text-ink">
                    {promotion.name}
                  </p>
                </div>
                <StatusPill
                  tone={PROMOTION_STATUS_TONE[promotion.status]}
                  label={promotion.status}
                />
              </div>
              <p className="mt-2 text-sm font-semibold text-ink">
                {promotion.code}
              </p>
              <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
                <span>{promotion.discountType}</span>
                <span aria-hidden="true">·</span>
                <span>{formatDiscount(promotion)}</span>
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                {formatNumber(promotion.usedCount)} of{" "}
                {formatNumber(promotion.usageLimit)} used
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                {formatPromotionDate(promotion.startDate)} –{" "}
                {formatPromotionDate(promotion.endDate)}
              </p>
            </>
          )}
        />

        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
        />
      </Card>

      <EntityDrawer
        model={selected ? buildPromotionDetails(selected) : null}
        onClose={() => setSelectedId(null)}
        onAction={(actionId) => {
          if (!selected) return;
          if (
            actionId === "expire" ||
            actionId === "pause" ||
            actionId === "activate"
          ) {
            // EntityDrawer already opened its own confirm dialog; just apply.
            applyAction(selected, actionId);
          }
        }}
      />

      <CreatePromotionDrawer
        open={createOpen}
        existingCodes={promotions.map((promotion) => promotion.code)}
        onClose={() => setCreateOpen(false)}
        onRequestCreate={requestCreate}
        resetKey={createResetKey}
      />

      <ConfirmDialog
        open={pendingCreate !== null || (pending !== null && pendingPromotion !== null)}
        title={
          pendingCreate
            ? "Confirm create promotion"
            : pendingPromotion && pending
              ? actionTitle(pending.actionId)
              : ""
        }
        description={CONFIRM_DESCRIPTION}
        noteLabel="Internal note"
        confirmTone={
          pendingCreate
            ? "brand"
            : pending
              ? actionConfirmTone(pending.actionId)
              : "brand"
        }
        loading={loading}
        error={error}
        onConfirm={handleConfirm}
        onCancel={() => {
          if (loading) return;
          // Reopen the create drawer with its values intact if a create was
          // cancelled; otherwise just close the status-action dialog.
          if (pendingCreate) setCreateOpen(true);
          setPending(null);
          setPendingCreate(null);
          setError(null);
        }}
      />
      {confirmedExport.dialog}
    </div>
  );
}


interface RowActionsMenuProps {
  promotion: Promotion;
  onView: () => void;
  onAction: (actionId: PromotionActionId) => void;
}

// Per-row "…" dropdown: View details, Pause/Activate (by current status) and
// Expire. Closes on outside click or Escape and never triggers the row's own
// open handler.
function RowActionsMenu({ promotion, onView, onAction }: RowActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const isExpired = promotion.status === "Expired";

  return (
    <div
      className="relative inline-block text-left"
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${promotion.name}`}
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
          {promotion.status === "Active" ? (
            <MenuItem
              onSelect={() => onAction("pause")}
              onClose={() => setOpen(false)}
            >
              Pause
            </MenuItem>
          ) : (
            <MenuItem
              disabled={isExpired}
              onSelect={() => onAction("activate")}
              onClose={() => setOpen(false)}
            >
              Activate
            </MenuItem>
          )}
          <MenuItem
            disabled={isExpired}
            tone="danger"
            onSelect={() => onAction("expire")}
            onClose={() => setOpen(false)}
          >
            Expire
          </MenuItem>
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

