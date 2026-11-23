"use client";

import { useState } from "react";
import Link from "next/link";
import type { ReactNode } from "react";
import { SideSheet } from "@/components/ui/SideSheet";
import { Tabs } from "@/components/ui/Tabs";
import type { TabItem } from "@/components/ui/Tabs";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { DetailSections } from "@/components/admin/details/DetailSections";
import {
  REFUND_ACTION_DESCRIPTIONS,
  SETTLEMENT_ACTION_DESCRIPTIONS,
} from "@/lib/finance";
import type { FinanceNoteSubjectType } from "@/lib/finance";
import type { DetailAction, EntityDetailsModel } from "@/types/entity-details";
import { FinanceNotesTab } from "./FinanceNotesTab";

// What a CONFIRMED finance action reports back to the shell:
//   { done: true }                        -> close the dialog (caller toasted).
//   { done: false, message }              -> keep the dialog open and show the
//                                            backend's message (the admin can
//                                            retry the same submit).
//   { done: false, message, closeDialog } -> close the dialog; the caller has
//                                            shown the message (toast) and is
//                                            reloading the record (409).
//   { done: false, message, switchToActionId } -> swap to another action's
//                                            dialog showing the message (the
//                                            approve-400 "offer Reject" path).
export type FinanceActionResult =
  | { done: true }
  | { done: false; message: string; closeDialog?: boolean }
  | { done: false; message: string; switchToActionId: string };

interface FinanceDrawerShellProps {
  // The drawer is open whenever a model is provided.
  model: EntityDetailsModel | null;
  onClose: () => void;
  // Optional live-detail fetch state: a loading line or an error banner with
  // Retry above the sections (same contract as the shared EntityDrawer).
  detailState?: {
    loading: boolean;
    error: string | null;
    onRetry: () => void;
  };
  // Runs a CONFIRMED action. Only ever called from the confirm dialog's
  // button — never from the footer click — so no request can fire without a
  // prior confirm. The caller owns loading-safe mutations, toasts and
  // refetches; the shell only renders the outcome.
  runAction: (input: {
    actionId: string;
    note: string;
  }) => Promise<FinanceActionResult>;
  // Optional extra dialog field for an action (the initiate refund's amount
  // input), rendered above the internal-note field.
  renderDialogExtra?: (actionId: string) => ReactNode;
  // Fired when a dialog opens (with the action id) and when it closes or is
  // cancelled (with null). The transaction drawer uses this to mint and drop
  // the Idempotency-Key and to reset the amount draft.
  onDialogChange?: (actionId: string | null) => void;
  // The subject the live Notes tab attaches to: the drawer
  // declares it because the shared model's entity kind cannot distinguish a
  // transaction's payment from a refund (both use entity "transaction").
  // When omitted the notes tab renders the model's own sections.
  notesSubject?: FinanceNoteSubjectType;
}

// Fallback for actions without documented copy (unflag has none; the
// four documented settlement actions and the three refund actions carry their
// own copy from lib/finance.ts).
const DEFAULT_DIALOG_DESCRIPTION =
  "Please confirm you want to continue.";

// Footer button styling per variant; disabled buttons swallow mouse events,
// so they are wrapped in a title-bearing span to surface the reason as a
// tooltip (the shared EntityDrawer's approach).
const DRAWER_ACTION_VARIANT: Record<DetailAction["variant"], string> = {
  danger:
    "bg-danger text-white shadow-sm shadow-danger/40 hover:bg-danger/90 focus-visible:ring-danger",
  outline: "border border-border bg-surface text-ink hover:bg-brand-soft",
  brand: "bg-brand text-white shadow-sm shadow-brand/40 hover:bg-brand-hover",
};

const DRAWER_ACTION_BASE =
  "inline-flex h-11! flex-1 items-center justify-center gap-2 rounded-xl px-5! text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg sm:flex-none";

// Finance-local drawer shell for the transaction/refund drawers: renders the
// shared EntityDetailsModel (same SideSheet + tabs + sections as the shared
// EntityDrawer) but owns the confirm dialog, so the refund mutations can use
// the documented copy, an extra amount field, an Idempotency-Key
// lifecycle and the 409/400 error paths without extending the shared drawer
// that every other section depends on. The Notes tab is rendered live here:
// for the notes tab id the shell swaps in FinanceNotesTab
// (GET/POST /admin/finance/notes) instead of the model's static sections.
export function FinanceDrawerShell({
  model,
  onClose,
  detailState,
  runAction,
  renderDialogExtra,
  onDialogChange,
  notesSubject,
}: FinanceDrawerShellProps) {
  const open = model !== null;
  const [tab, setTab] = useState("");
  const [action, setAction] = useState<DetailAction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);

  // Reset to the first tab each time the drawer opens (render-time state
  // adjustment, same pattern as the shared EntityDrawer).
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open && model) {
      setTab(model.tabs[0]?.id ?? "");
      setAction(null);
      setError(null);
    }
  }

  function beginAction(item: DetailAction) {
    setAction(item);
    setError(null);
    onDialogChange?.(item.id);
  }

  function closeAction() {
    setAction(null);
    setError(null);
    onDialogChange?.(null);
  }

  async function handleConfirm(note: string) {
    if (!model || !action) return;
    setLoading(true);
    setError(null);
    try {
      const result = await runAction({ actionId: action.id, note });
      setLoading(false);
      if (result.done) {
        closeAction();
        return;
      }
      if ("switchToActionId" in result) {
        const next = model.actions.find(
          (item) => item.id === result.switchToActionId,
        );
        if (next && !next.href) {
          // Show the backend's message and offer the other action (the
          // approve-400 path) instead of leaving a dead-end dialog.
          setAction(next);
          setError(result.message);
          onDialogChange?.(next.id);
          return;
        }
        // No such action to offer (wiring bug): still show the message.
        setError(result.message);
        return;
      }
      if (result.closeDialog) {
        // The caller has surfaced the message (toast) and is reloading the
        // record: drop the dialog so a stale retry cannot be fired again.
        closeAction();
        return;
      }
      setError(result.message);
    } catch (cause) {
      // Defensive: runAction resolves with results instead of throwing, so
      // this only catches a wiring bug — still show the message.
      setLoading(false);
      setError(
        cause instanceof Error && cause.message
          ? cause.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  function buttonVariant(
    item: DetailAction,
  ): "danger" | "secondary" | "primary" {
    if (item.variant === "danger") return "danger";
    if (item.variant === "outline") return "secondary";
    return "primary";
  }

  if (!model) return null;

  const dialogOpen = action !== null;
  const activeTab = model.tabs.find((item) => item.id === tab) ?? model.tabs[0];
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
          <Tabs tabs={tabItems} value={activeTab?.id ?? ""} onChange={setTab} />
        }
        footer={
          <>
            {model.actions.map((item) => {
              if (item.href) {
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`${DRAWER_ACTION_BASE} ${DRAWER_ACTION_VARIANT[item.variant]}`}
                  >
                    {item.label}
                  </Link>
                );
              }
              if (item.disabled && item.disabledReason) {
                return (
                  <span
                    key={item.id}
                    title={item.disabledReason}
                    className="flex-1 sm:flex-none"
                  >
                    <Button
                      variant={buttonVariant(item)}
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
                  variant={buttonVariant(item)}
                  onClick={() => beginAction(item)}
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
            {activeTab.id === "notes" && notesSubject ? (
              // The live Notes tab: keyed by subject so a
              // record change remounts the panel and refetches its notes.
              <FinanceNotesTab
                key={`${notesSubject}-${model.id}`}
                subjectType={notesSubject}
                subjectId={model.id}
              />
            ) : (
              <DetailSections sections={activeTab.sections} />
            )}
          </div>
        ) : null}
      </SideSheet>

      {action ? (
        <ConfirmDialog
          open={dialogOpen}
          title={action.dialogTitle}
          description={
            REFUND_ACTION_DESCRIPTIONS[action.id] ??
            SETTLEMENT_ACTION_DESCRIPTIONS[action.id] ??
            DEFAULT_DIALOG_DESCRIPTION
          }
          noteLabel={action.noteLabel}
          noteRequired={action.noteRequired}
          notePlaceholder={action.notePlaceholder}
          confirmLabel={action.label}
          confirmTone={action.confirmTone ?? "brand"}
          loading={loading}
          error={error}
          onConfirm={handleConfirm}
          onCancel={closeAction}
        >
          {renderDialogExtra?.(action.id)}
        </ConfirmDialog>
      ) : null}
    </>
  );
}

