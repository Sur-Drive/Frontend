"use client";

import { useState } from "react";
import { ApiError } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { entityActionMessage } from "@/lib/toast-messages";
import {
  buildTransactionDetailModel,
  createIdempotencyKey,
  initiateRefund,
  nairaLabel,
  refundAmountFieldError,
  transactionSourceFromRow,
} from "@/lib/finance";
import type {
  FinanceTransactionRow,
  TransactionModelSource,
} from "@/lib/finance";
import type { EntityDetailsModel } from "@/types/entity-details";
import { FinanceDrawerShell } from "./FinanceDrawerShell";
import type { FinanceActionResult } from "./FinanceDrawerShell";

interface TransactionDetailsDrawerProps {
  // The row behind the drawer: carries the id for the live fetches and enough
  // display fields for the provisional model shown while they run.
  row: FinanceTransactionRow | null;
  // Live detail state owned by the view (the RatingsReviewsView pattern): the
  // model is swapped in once GET detail + GET timeline both resolve. `source`
  // is the mapped live detail: its id is the paymentId the
  // initiate endpoint needs and its refundableAmount validates the dialog's
  // amount field.
  state: {
    loading: boolean;
    error: string | null;
    model: EntityDetailsModel | null;
    source: TransactionModelSource | null;
  };
  onRetry: () => void;
  onClose: () => void;
  // Refetches the transactions list, the overview cards and this drawer's
  // detail (+ timeline) after a confirmed initiate settles — on success and
  // on the 409 "a refund for this payment is already open" reload (after any
  // action, refetch the record).
  onRefetch: () => void;
}

// Transaction drawer for the Finance Overview table: detail and timeline are
// lazily fetched when a row opens, and the "Initiate refund" action (rendered
// only from the live detail's canRefund — cash payments are never refundable)
// POSTs /admin/finance/refunds with a required Idempotency-Key header.
export function TransactionDetailsDrawer({
  row,
  state,
  onRetry,
  onClose,
  onRefetch,
}: TransactionDetailsDrawerProps) {
  const toast = useToast();
  const source = state.source;
  // While the live detail loads, the drawer opens on the row's own fields;
  // the loading line above the sections makes the gap explicit.
  const model =
    state.model ??
    (row ? buildTransactionDetailModel(transactionSourceFromRow(row)) : null);

  // The optional refund amount as typed (naira — sent unchanged, never x100).
  const [amountDraft, setAmountDraft] = useState("");
  // One Idempotency-Key per user action: minted when
  // the dialog opens, kept in state so a retry of the SAME submit reuses it,
  // and dropped when the dialog closes or is cancelled — only a new user
  // action mints a new one.
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);

  function handleDialogChange(actionId: string | null) {
    if (actionId === "initiate-refund") {
      setIdempotencyKey(createIdempotencyKey());
      setAmountDraft("");
    } else {
      // Dialog closed or cancelled: the key dies with the user action.
      setIdempotencyKey(null);
    }
  }

  // Validation, enforced in the UI before any request — the rules live in
  // lib/finance.ts so the fixture harness canaries the exact lines this
  // dialog renders: a plain positive number with at most 2 decimals, at
  // most the remaining refundable balance, and NO typed amount at all when
  // that balance could not be read (blank alone means "refund everything
  // refundable", so the request omits the amount key entirely).
  function amountValidationError(): string | null {
    return refundAmountFieldError(amountDraft, source?.refundableAmount ?? null);
  }

  async function runAction(input: {
    actionId: string;
    note: string;
  }): Promise<FinanceActionResult> {
    if (input.actionId !== "initiate-refund") {
      // Defensive: the transaction drawer only ships this one action.
      return { done: false, message: "This action has no confirmed endpoint." };
    }
    if (!source) {
      return {
        done: false,
        message: "The payment details are still loading. Please try again.",
      };
    }
    const validationError = amountValidationError();
    if (validationError) {
      // No request goes out on an invalid amount, so the idempotency key
      // stays unused and the admin can correct the field in place.
      return { done: false, message: validationError };
    }
    const draft = amountDraft.trim();
    // A missing key here would mean a request without the required header —
    // mint one instead of ever sending without it.
    let key = idempotencyKey;
    if (!key) {
      key = createIdempotencyKey();
      setIdempotencyKey(key);
    }
    try {
      await initiateRefund({
        paymentId: source.id,
        // amount is undefined when blank: initiateRefund then omits the
        // field entirely so the backend refunds everything refundable.
        amount: draft === "" ? undefined : Number(draft),
        notes: input.note,
        idempotencyKey: key,
      });
      toast.success(
        entityActionMessage(
          "transaction",
          "initiate-refund",
          model?.title ?? "",
        ),
      );
      onRefetch();
      return { done: true };
    } catch (cause) {
      const message =
        cause instanceof Error && cause.message
          ? cause.message
          : "Request failed. Please try again.";
      if (cause instanceof ApiError && cause.status === 409) {
        // A refund for this payment is already open: show the
        // backend's message and reload instead of leaving a dialog that can
        // only repeat the 409.
        toast.error({ title: "Refund already open", description: message });
        onRefetch();
        return { done: false, message, closeDialog: true };
      }
      // Anything else (network error, 4xx/5xx): keep the dialog open with the
      // backend's message. A retry of this same submit reuses the key.
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
      // The drawer's notes attach to the payment.
      notesSubject="payment"
      onDialogChange={handleDialogChange}
      renderDialogExtra={(actionId) =>
        actionId === "initiate-refund" ? (
          <div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-ink">Amount (₦)</span>
              <span className="text-sm text-ink-subtle">Optional</span>
            </div>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={amountDraft}
              onChange={(event) => setAmountDraft(event.target.value)}
              placeholder="Leave blank to refund everything refundable"
              aria-invalid={amountValidationError() ? true : undefined}
              className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:text-sm"
            />
            {source?.refundableAmount != null ? (
              <p className="mt-1 text-xs text-ink-muted">
                Up to {nairaLabel(source.refundableAmount)} is still
                refundable.
              </p>
            ) : (
              <p className="mt-1 text-xs text-ink-muted">
                The refundable balance could not be read, so only a full
                refund (leave the amount blank) can be requested.
              </p>
            )}
            {amountValidationError() ? (
              <p role="alert" className="mt-2 text-xs text-danger">
                {amountValidationError()}
              </p>
            ) : null}
          </div>
        ) : undefined
      }
    />
  );
}

