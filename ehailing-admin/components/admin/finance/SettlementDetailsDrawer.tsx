"use client";

import { useRef } from "react";
import { EM_DASH } from "@/lib/format";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import {
  approveSettlement,
  buildSettlementDetailModel,
  flagSettlement,
  isAmbiguousSettlementFailure,
  nairaLabel,
  rejectSettlement,
  retrySettlement,
  SETTLEMENT_AMBIGUOUS_GATE_MESSAGE,
  SETTLEMENT_REJECT_REASON_MAX,
  settlementAmbiguousBlockReason,
  settlementNotUpdatedFailure,
  settlementPayoutDetailsUnreadable,
  settlementSourceFromRow,
  unflagSettlement,
} from "@/lib/finance";
import type {
  FinanceSettlementRow,
  SettlementAmbiguousGate,
  SettlementModelSource,
} from "@/lib/finance";
import type { EntityDetailsModel } from "@/types/entity-details";
import { FinanceDrawerShell } from "./FinanceDrawerShell";
import type { FinanceActionResult } from "./FinanceDrawerShell";

interface SettlementDetailsDrawerProps {
  // The row behind the drawer: carries the id for the live fetches and enough
  // display fields for the provisional model shown while they run.
  row: FinanceSettlementRow | null;
  // Live detail state owned by the view (the RefundDetailsDrawer pattern):
  // the model is swapped in once GET detail + GET timeline both resolve.
  // `source` is the mapped live detail whose can* flags decide which actions
  // even render and whose amount/masked account/reference feed the
  // money-moving dialogs.
  state: {
    loading: boolean;
    error: string | null;
    model: EntityDetailsModel | null;
    source: SettlementModelSource | null;
  };
  onRetry: () => void;
  onClose: () => void;
  // Refetches the settlements list, the stats cards and this drawer's detail
  // (+ timeline) after a confirmed action settles — also on the reject 409
  // "someone else acted first" reload and after an ambiguous
  // approve/retry failure (the fresh detail is what resolves the gate).
  onRefetch: () => void;
}

// Settlement drawer for the Driver Settlements table: detail and timeline are
// lazily fetched when a row opens, and the five actions (approve / retry /
// flag / unflag / reject) render ONLY from the live detail's can* flags —
// the admin's role is never assumed. Row/detail shapes were never observed
// (the live list is empty), so missing fields degrade to "—" instead of
// guesses.
export function SettlementDetailsDrawer({
  row,
  state,
  onRetry,
  onClose,
  onRefetch,
}: SettlementDetailsDrawerProps) {
  const toast = useToast();
  const source = state.source;
  // AMBIGUOUS FAILURE GATE for Approve/Retry (both may move REAL money):
  // after a network error, timeout or 5xx the outcome is UNKNOWN, and no
  // second attempt goes out until the detail has been refetched (a NEW
  // source object) and still shows a status where the action is allowed
  // (pending_approval for approve, failed for retry) — otherwise the real
  // status is shown and the attempt stops. The gate is keyed by the
  // settlement's id + the action id and lives in a ref on this always-mounted
  // drawer, so it survives closing and reopening the same settlement (the
  // fresh fetch resolves it) while never blocking a different settlement.
  // The pure gate rules live in lib/finance.ts (asserted by the fixture harness).
  const ambiguousGate = useRef<SettlementAmbiguousGate | null>(null);

  // While the live detail loads, the drawer opens on the row's own fields;
  // the loading line above the sections makes the gap explicit.
  const model =
    state.model ??
    (row ? buildSettlementDetailModel(settlementSourceFromRow(row)) : null);

  // Runs a CONFIRMED action — the shell calls this only from the confirm
  // dialog's button, so no request can fire without a prior confirm. Every
  // mutation is re-checked against the live detail's can* flag here so no
  // request can fire when a flag is false, and nothing changes locally
  // before the backend confirms: the drawer only refetches afterwards.
  async function runAction(input: {
    actionId: string;
    note: string;
  }): Promise<FinanceActionResult> {
    if (
      input.actionId !== "approve-payout" &&
      input.actionId !== "retry-payout" &&
      input.actionId !== "flag-settlement" &&
      input.actionId !== "unflag-settlement" &&
      input.actionId !== "reject-settlement"
    ) {
      // Defensive: the settlement drawer only ships these five actions.
      return { done: false, message: "This action has no confirmed endpoint." };
    }
    if (!source) {
      return {
        done: false,
        message: "The settlement details are still loading. Please try again.",
      };
    }
    const actionAllowed =
      (input.actionId === "approve-payout" && source.canApprove) ||
      (input.actionId === "retry-payout" && source.canRetry) ||
      (input.actionId === "flag-settlement" && source.canFlag) ||
      (input.actionId === "unflag-settlement" && source.canUnflag) ||
      (input.actionId === "reject-settlement" && source.canReject);
    if (!actionAllowed) {
      // No request when the detail's action flag is false.
      return {
        done: false,
        message: "This action is not available for this settlement anymore.",
      };
    }
    const isApprove = input.actionId === "approve-payout";
    const isRetry = input.actionId === "retry-payout";
    const movesMoney = isApprove || isRetry;
    if (movesMoney && settlementPayoutDetailsUnreadable(source)) {
      // The dialog is supposed to show the amount, the masked payout account
      // and the reference first, and the button is already disabled in this
      // state, so this guard only stops a wiring bug from moving an unknown
      // value (approve/retry move REAL money). Fail closed.
      return { done: false, message: "Details could not be read." };
    }
    if (
      input.actionId === "reject-settlement" &&
      input.note.trim().length > SETTLEMENT_REJECT_REASON_MAX
    ) {
      // Pre-checked so no request goes out on an over-long reason (the
      // backend caps it at 1000 characters).
      return {
        done: false,
        message: `Keep the reason to ${SETTLEMENT_REJECT_REASON_MAX} characters or fewer.`,
      };
    }
    if (movesMoney) {
      // The gate's first half: an unknown previous attempt blocks any second
      // attempt until the refetched details allow the action again.
      const blockReason = settlementAmbiguousBlockReason(
        ambiguousGate.current,
        input.actionId,
        source,
      );
      if (blockReason) {
        return { done: false, message: blockReason };
      }
    }

    try {
      if (isApprove) {
        // WARNING: approving may move REAL money — it locks the driver's
        // funds and starts the bank transfer to their default verified
        // payout account.
        await approveSettlement(source.id);
        toast.success({
          title: "Payout approved",
          description: `${source.reference}: the funds are locked and the bank transfer has started.`,
        });
      } else if (isRetry) {
        // WARNING: retrying may move REAL money — it starts a brand new
        // payout attempt.
        await retrySettlement(source.id);
        toast.success({
          title: "Payout retry started",
          description: `${source.reference}: a new payout attempt is underway.`,
        });
      } else if (input.actionId === "flag-settlement") {
        // The reason is internal — admin drawer only, never lists/exports.
        await flagSettlement(source.id, input.note);
        toast.success({
          title: "Settlement flagged",
          description: `${source.reference} was marked for investigation.`,
        });
      } else if (input.actionId === "unflag-settlement") {
        await unflagSettlement(source.id);
        toast.success({
          title: "Settlement unflagged",
          description: `${source.reference} is back to pending approval.`,
        });
      } else {
        // WARNING: rejecting is FINAL — it frees the driver's reserved
        // balance and sends the driver a "Withdrawal not approved" push.
        // The reason is internal and is never shown to the driver.
        await rejectSettlement(source.id, input.note);
        toast.success({
          title: "Settlement rejected",
          description: `${source.reference} was rejected. The driver is told only that the withdrawal was not approved.`,
        });
      }
      // Only the succeeded action's own gate may clear — a successful flag
      // says nothing about an earlier approve whose outcome is unknown.
      if (
        ambiguousGate.current?.actionId === input.actionId &&
        ambiguousGate.current?.settlementId === source.id
      ) {
        ambiguousGate.current = null;
      }
      onRefetch();
      return { done: true };
    } catch (cause) {
      const message =
        cause instanceof Error && cause.message
          ? cause.message
          : "Request failed. Please try again.";
      if (movesMoney && isAmbiguousSettlementFailure(cause)) {
        // AMBIGUOUS FAILURE GATE: the outcome is unknown, so no second
        // attempt may go out until the refetched detail still shows a status
        // where the action is allowed. Refresh everything now (the fresh
        // detail lifts or resolves the gate) and keep the dialog's message.
        ambiguousGate.current = {
          actionId: input.actionId,
          settlementId: source.id,
          sourceAtFailure: source,
        };
        onRefetch();
        return {
          done: false,
          message: `${message} ${SETTLEMENT_AMBIGUOUS_GATE_MESSAGE}`,
        };
      }
      if (settlementNotUpdatedFailure(cause, input.actionId)) {
        // 400 (no verified payout account, insufficient balance), 403 (the
        // role may not move payouts) and 409 (someone else acted first) are
        // definitive: the settlement was NOT updated. Show the backend's
        // message, close the dialog and reload list/stats/detail, exactly
        // like the reject 409 below.
        toast.error({
          title: "Settlement not updated",
          description: message,
        });
        onRefetch();
        return { done: false, message, closeDialog: true };
      }
      if (
        cause instanceof ApiError &&
        cause.status === 409 &&
        input.actionId === "reject-settlement"
      ) {
        // Someone else acted first: show the backend's message
        // and reload instead of retrying a stale reject.
        toast.error({
          title: "Settlement already updated",
          description: message,
        });
        onRefetch();
        return { done: false, message, closeDialog: true };
      }
      // Every other definitive failure (flag/unflag, 404, a local lock, …):
      // keep the dialog open with the backend's message.
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
      // The drawer's notes attach to the settlement itself.
      notesSubject="settlement"
      // Approve/Retry show the amount (naira), the driver's masked payout
      // account and the settlement reference before the confirm — all three
      // are guaranteed readable by the fail-closed guard in the model
      // builder (the button disables with "Details could not be read"
      // otherwise).
      renderDialogExtra={(actionId) =>
        (actionId === "approve-payout" || actionId === "retry-payout") &&
        source ? (
          <div className="rounded-xl bg-surface-muted p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink-muted">Amount</span>
              <span className="text-sm font-semibold text-ink">
                {nairaLabel(source.amount)}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <span className="text-sm text-ink-muted">Payout account</span>
              <span className="truncate text-sm font-medium text-ink">
                {source.bank && source.bank !== EM_DASH
                  ? `${source.bank} · ${source.accountMasked}`
                  : source.accountMasked}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <span className="text-sm text-ink-muted">
                Settlement reference
              </span>
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



