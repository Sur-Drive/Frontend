"use client";

import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import {
  approveRefund,
  buildRefundDetailModel,
  isUnreadableAmount,
  nairaLabel,
  refundSourceFromRow,
  rejectRefund,
} from "@/lib/finance";
import type { FinanceRefundRow, RefundModelSource } from "@/lib/finance";
import type { EntityDetailsModel } from "@/types/entity-details";
import { FinanceDrawerShell } from "./FinanceDrawerShell";
import type { FinanceActionResult } from "./FinanceDrawerShell";

interface RefundDetailsDrawerProps {
  // The row behind the drawer: carries the id for the live fetches and enough
  // display fields for the provisional model shown while they run.
  row: FinanceRefundRow | null;
  // Live detail state owned by the view (the TransactionDetailsDrawer
  // pattern): the model is swapped in once GET detail + GET timeline both
  // resolve. `source` is the mapped live detail whose
  // canApprove/canReject decided which action buttons even render.
  state: {
    loading: boolean;
    error: string | null;
    model: EntityDetailsModel | null;
    source: RefundModelSource | null;
  };
  onRetry: () => void;
  onClose: () => void;
  // Refetches the refunds list, the stats cards and this drawer's detail
  // (+ timeline) after a confirmed approve/reject settles — also on the 409
  // "someone else changed it" reload.
  onRefetch: () => void;
}

// Refund drawer for the Refunds table: detail and timeline are lazily
// fetched when a row opens, and Approve / Reject render ONLY from the live
// detail's canApprove/canReject (plain admins never see them active; the API
// 403s them anyway). Row/detail shapes were never observed (the live list is
// empty), so missing fields degrade to "—" instead of guesses.
export function RefundDetailsDrawer({
  row,
  state,
  onRetry,
  onClose,
  onRefetch,
}: RefundDetailsDrawerProps) {
  const toast = useToast();
  const source = state.source;
  // While the live detail loads, the drawer opens on the row's own fields;
  // the loading line above the sections makes the gap explicit.
  const model =
    state.model ??
    (row ? buildRefundDetailModel(refundSourceFromRow(row)) : null);

  async function runAction(input: {
    actionId: string;
    note: string;
  }): Promise<FinanceActionResult> {
    if (
      input.actionId !== "approve-refund" &&
      input.actionId !== "reject-refund"
    ) {
      // Defensive: the refund drawer only ships these two actions.
      return { done: false, message: "This action has no confirmed endpoint." };
    }
    if (!source) {
      return {
        done: false,
        message: "The refund details are still loading. Please try again.",
      };
    }
    const isApprove = input.actionId === "approve-refund";
    if (isApprove && isUnreadableAmount(source.refundAmount)) {
      // The dialog is supposed to show the amount first and the button is
      // already disabled in this state, so this guard only stops a wiring
      // bug from approving an unknown value (approving moves REAL money).
      // Missing, non-finite and <= 0 amounts are all unreadable.
      return { done: false, message: "The refund amount could not be read." };
    }
    try {
      if (isApprove) {
        // WARNING: approving may move REAL money — it starts the refund
        // through the payment gateway.
        await approveRefund(source.id);
        toast.success({
          title: "Refund approved",
          description: `The refund for ${model?.title ?? "this payment"} is starting through the payment gateway.`,
        });
      } else {
        // WARNING: rejecting notifies the rider that the request was not
        // approved (generic push). The reason itself is INTERNAL — admin
        // drawer only, never lists or exports.
        await rejectRefund(source.id, input.note);
        toast.success({
          title: "Refund rejected",
          description: `${model?.title ?? "This refund"} was rejected. The rider is told only that it was not approved.`,
        });
      }
      onRefetch();
      return { done: true };
    } catch (cause) {
      const message =
        cause instanceof Error && cause.message
          ? cause.message
          : "Request failed. Please try again.";
      if (cause instanceof ApiError && cause.status === 409 && !isApprove) {
        // Someone else changed the refund first: show the
        // backend's message and reload instead of retrying a stale reject.
        toast.error({ title: "Refund already updated", description: message });
        onRefetch();
        return { done: false, message, closeDialog: true };
      }
      if (cause instanceof ApiError && cause.status === 400 && isApprove) {
        // Exceeds the remaining refundable amount: show the
        // backend's message and offer Reject — the shell swaps to the reject
        // dialog with this message showing.
        return { done: false, message, switchToActionId: "reject-refund" };
      }
      // Anything else: keep the dialog open with the backend's message.
      return { done: false, message };
    }
  }

  return (
    <FinanceDrawerShell
      model={model}
      onClose={onClose}
      detailState={
        state.loading || state.error
          ? { loading: state.loading, error: state.error, onRetry }
          : undefined
      }
      runAction={runAction}
      // The drawer's notes attach to the refund itself.
      notesSubject="refund"
      // Approve shows the refund's own amount and reference before the super
      // admin confirms (the button is disabled entirely when the amount
      // could not be read — see buildRefundDetailModel).
      renderDialogExtra={(actionId) =>
        actionId === "approve-refund" && source ? (
          <div className="rounded-xl bg-surface-muted p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink-muted">Refund amount</span>
              <span className="text-sm font-semibold text-ink">
                {nairaLabel(source.refundAmount)}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <span className="text-sm text-ink-muted">Refund reference</span>
              <span className="truncate text-sm font-medium text-ink">
                {source.reference}
              </span>
            </div>
          </div>
        ) : undefined
      }
    />
  );
}
