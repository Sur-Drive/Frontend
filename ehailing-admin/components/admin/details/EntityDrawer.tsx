"use client";

import { useState } from "react";
import Link from "next/link";
import { SideSheet } from "@/components/ui/SideSheet";
import { Tabs } from "@/components/ui/Tabs";
import type { TabItem } from "@/components/ui/Tabs";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { DetailSections } from "./DetailSections";
import { runEntityAction, PartialDecisionError } from "@/lib/actions";
import { useToast } from "@/components/ui/Toast";
import { entityActionMessage } from "@/lib/toast-messages";
import type {
  DetailAction,
  DocumentDecisionRequest,
  EntityDetailsModel,
} from "@/types/entity-details";

const CONFIRM_DESCRIPTION =
  "Please confirm you want to continue.";

const DRAWER_ACTION_LINK_BASE =
  "inline-flex h-11! flex-1 items-center justify-center gap-2 rounded-xl px-5! text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg sm:flex-none";

const DRAWER_ACTION_LINK_VARIANT: Record<
  DetailAction["variant"],
  string
> = {
  danger:
    "bg-danger text-white shadow-sm shadow-danger/40 hover:bg-danger/90 focus-visible:ring-danger",
  outline: "border border-border bg-surface text-ink hover:bg-brand-soft",
  brand: "bg-brand text-white shadow-sm shadow-brand/40 hover:bg-brand-hover",
};

interface EntityDrawerProps {
  // The drawer is open whenever a model is provided.
  model: EntityDetailsModel | null;
  onClose: () => void;
  // Called after a footer action is confirmed, so the caller can react (e.g.
  // update the record's status in the list). Runs before the dialog closes.
  onAction?: (actionId: string, note: string) => void;
  // Optional live-detail fetch state (list-backed model renders underneath):
  // shown as a loading line or an error banner with Retry above the sections.
  detailState?: {
    loading: boolean;
    error: string | null;
    onRetry: () => void;
  };
  // Fired whenever the user switches tabs; the caller can use it to fetch the
  // newly opened tab's data lazily (drivers/passengers sub-resources).
  onTabChange?: (id: string) => void;
  // Runs a document review panel's decision; resolves after the backend
  // confirms and rejects with its message on failure.
  onDocumentDecision?: (input: DocumentDecisionRequest) => Promise<void>;
}

// Shared entity details side sheet for People & Fleets: model-driven tabs of
// sections plus footer actions behind a confirm dialog. Behavior mirrors
// RideDetailsDrawer (tab reset on open, focus return, stacked dialog owning
// Escape/focus while open).
export function EntityDrawer({
  model,
  onClose,
  onAction,
  detailState,
  onTabChange,
  onDocumentDecision,
}: EntityDrawerProps) {
  const toast = useToast();
  const open = model !== null;
  const [tab, setTab] = useState("");
  const [action, setAction] = useState<DetailAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);

  // Reset to the first tab each time the drawer opens.
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open && model) {
      setTab(model.tabs[0]?.id ?? "");
      setAction(null);
      setError(null);
    }
  }

  function closeAction() {
    setAction(null);
    setError(null);
  }

  async function handleConfirm(note: string) {
    if (!model || !action) return;
    setLoading(true);
    setError(null);
    try {
      await runEntityAction({
        entity: model.entity,
        id: model.id,
        action: action.id,
        note,
        target: model.actionTarget,
      });
      // Only runs after the backend confirms: the view refetches its list /
      // detail here, so no local state ever changes before the PATCH lands.
      onAction?.(action.id, note);
      toast.success(entityActionMessage(model.entity, action.id, model.title));
      setLoading(false);
      closeAction();
    } catch (cause) {
      // Keep the dialog open with the backend's own message (apiFetch throws
      // ApiError.message from the response body; network failures carry the
      // friendly text).
      if (cause instanceof PartialDecisionError) {
        // The batch partially applied: some documents already changed on the
        // backend, so refetch exactly like the success path to drop stale
        // statuses — but do NOT toast or close the dialog; show how far the
        // batch got before it failed.
        onAction?.(action.id, note);
        setLoading(false);
        setError(
          `${cause.completed} of ${cause.total} documents updated: ${cause.message}`,
        );
        return;
      }
      // Nothing changed on the backend: leave the displayed record state
      // unchanged (no refetch) and surface the message as-is.
      setLoading(false);
      setError(
        cause instanceof Error && cause.message
          ? cause.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  if (!model) return null;

  const dialogOpen = action !== null;
  const activeTab =
    model.tabs.find((item) => item.id === tab) ?? model.tabs[0];
  const tabItems: TabItem[] = model.tabs.map(({ id, label }) => ({ id, label }));

  return (
    <>
      <SideSheet
        open={open}
        onClose={onClose}
        eyebrow={model.eyebrow}
        title={model.title}
        subtitle={model.subtitle}
        headerExtras={
          <Tabs
            tabs={tabItems}
            value={activeTab?.id ?? ""}
            onChange={(id) => {
              setTab(id);
              onTabChange?.(id);
            }}
          />
        }
        footer={
          <>
            {model.actions.map((item) => {
              if (item.href) {
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`${DRAWER_ACTION_LINK_BASE} ${DRAWER_ACTION_LINK_VARIANT[item.variant]}`}
                  >
                    {item.label}
                  </Link>
                );
              }
              // Disabled buttons swallow mouse events, so wrap them in a
              // title-bearing span to surface the reason as a tooltip.
              if (item.disabled && item.disabledReason) {
                return (
                  <span
                    key={item.id}
                    title={item.disabledReason}
                    className="flex-1 sm:flex-none"
                  >
                    <Button
                      variant={
                        item.variant === "danger"
                          ? "danger"
                          : item.variant === "outline"
                            ? "secondary"
                            : "primary"
                      }
                      disabled
                      className="pointer-events-none h-11! w-full px-5!"
                    >
                      {item.label}
                    </Button>
                  </span>
                );
              }
              return (
                <Button
                  key={item.id}
                  variant={
                    item.variant === "danger"
                      ? "danger"
                      : item.variant === "outline"
                        ? "secondary"
                        : "primary"
                  }
                  onClick={() => setAction(item)}
                  disabled={item.disabled}
                  className="h-11! flex-1 px-5! sm:flex-none"
                >
                  {item.label}
                </Button>
              );
            })}
          </>
        }
        // While the confirmation dialog is open it owns Escape, focus and clicks.
        closeOnEscape={!dialogOpen}
        trapFocus={!dialogOpen}
      >
        {detailState && (detailState.loading || detailState.error) ? (
          detailState.loading ? (
            <div
              role="status"
              aria-busy="true"
              className="mb-4 flex items-center gap-2 text-sm text-ink-muted"
            >
              <span
                className="size-3.5 animate-spin rounded-full border-2 border-border border-t-brand"
                aria-hidden="true"
              />
              Loading details…
            </div>
          ) : (
            <div
              role="alert"
              className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-danger-soft px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="min-w-0 text-sm font-medium text-danger">
                {detailState.error}
              </p>
              <Button
                variant="secondary"
                onClick={detailState.onRetry}
                className="shrink-0 self-start sm:self-auto"
              >
                Retry
              </Button>
            </div>
          )
        ) : null}
        {activeTab ? (
          <div
            role="tabpanel"
            id={`panel-${activeTab.id}`}
            aria-labelledby={`tab-${activeTab.id}`}
            tabIndex={0}
            className="outline-none"
          >
            {activeTab.note ? (
              <p className="mb-4 text-sm text-ink-muted">{activeTab.note}</p>
            ) : null}
            <DetailSections
              sections={activeTab.sections}
              onDocumentDecision={onDocumentDecision}
            />
          </div>
        ) : null}
      </SideSheet>

      <ConfirmDialog
        open={dialogOpen}
        title={action?.dialogTitle ?? ""}
        description={CONFIRM_DESCRIPTION}
        noteLabel={action?.noteLabel ?? "Internal note"}
        noteRequired={action?.noteRequired ?? false}
        notePlaceholder={action?.notePlaceholder}
        confirmLabel="Confirm action"
        confirmTone={action?.confirmTone ?? "brand"}
        loading={loading}
        error={error}
        onConfirm={handleConfirm}
        onCancel={closeAction}
      />
    </>
  );
}
