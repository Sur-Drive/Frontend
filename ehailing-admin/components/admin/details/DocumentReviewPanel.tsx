"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileText, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusPill } from "@/components/ui/StatusPill";
import {
  canSubmitDocumentDecision,
  documentPreviewState,
  isPendingDocumentStatus,
} from "@/lib/drivers";
import { verificationStatusDisplay } from "@/types/verification";
import type {
  DocumentDecisionAction,
  DocumentReviewRow,
} from "@/types/entity-details";

export type DocumentDecision = DocumentDecisionAction;

interface DocumentReviewPanelProps {
  row: DocumentReviewRow;
  onClose: () => void;
  // Performs the PATCH and refetches; rejects with the backend's message on
  // failure. Without it the panel is read-only.
  onDecide?: (action: DocumentDecision, note: string) => Promise<void>;
}

const CLOSE_BUTTON =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-ink transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50";

// Second-level dialog over the entity drawer: shows one document's facts and
// file preview, and offers Approve/Reject while the document is pending. The
// panel never changes a status locally — the caller refetches after the
// backend settles, and the panel closes only on success.
export function DocumentReviewPanel({
  row,
  onClose,
  onDecide,
}: DocumentReviewPanelProps) {
  const [mounted] = useState(() => typeof window !== "undefined");
  const [imageFailed, setImageFailed] = useState(false);
  const [deciding, setDeciding] = useState<DocumentDecision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  // Synchronous double-submit guard: state alone lags a render behind a fast
  // second click, so the ref blocks it before any request is sent.
  const submittingRef = useRef(false);
  const baseId = useId();

  const inFlight = deciding !== null;
  const preview = documentPreviewState(row.url, imageFailed);
  const status = verificationStatusDisplay(row.status);
  const decisionAvailable =
    Boolean(onDecide) &&
    Boolean(row.actionTarget) &&
    isPendingDocumentStatus(row.status);
  const canDecide = canSubmitDocumentDecision(inFlight, row.status);

  useEffect(() => {
    if (!mounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // The reject confirmation owns Escape while it is open.
      if (rejectOpen || inFlight) return;
      onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [inFlight, mounted, onClose, rejectOpen]);

  function closeReject() {
    if (deciding === "reject") return;
    setRejectOpen(false);
    setError(null);
  }

  async function runDecision(action: DocumentDecision, note: string) {
    if (!onDecide || submittingRef.current) return;
    submittingRef.current = true;
    setDeciding(action);
    setError(null);
    try {
      await onDecide(action, note);
      setRejectOpen(false);
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message
          ? cause.message
          : "Request failed. Please try again.",
      );
    } finally {
      submittingRef.current = false;
      setDeciding(null);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className="dialog-anim fixed inset-0 z-60 flex items-center justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm"
      style={{ animationName: "dialog-fade-in" }}
      onMouseDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (rejectOpen || inFlight) return;
        onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${baseId}-title`}
        className="dialog-anim mx-4 max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl bg-surface p-6 shadow-xl sm:p-8"
        style={{ animationName: "dialog-pop-in" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.14em] text-ink-muted">
              Document review
            </p>
            <h2
              id={`${baseId}-title`}
              className="mt-1 truncate text-2xl font-normal text-ink"
            >
              {row.document}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label="Close document review"
            onClick={onClose}
            disabled={inFlight}
            className={CLOSE_BUTTON}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <dl className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-surface-muted p-3">
            <dt className="text-xs text-ink-muted">Type</dt>
            <dd className="mt-1 text-sm font-medium text-ink">{row.type}</dd>
          </div>
          <div className="rounded-xl bg-surface-muted p-3">
            <dt className="text-xs text-ink-muted">Status</dt>
            <dd className="mt-1">
              <StatusPill tone={status.tone} label={status.label} />
            </dd>
          </div>
          <div className="rounded-xl bg-surface-muted p-3">
            <dt className="text-xs text-ink-muted">Reference</dt>
            <dd className="mt-1 break-all text-sm font-medium text-ink">
              {row.reference}
            </dd>
          </div>
        </dl>

        <div className="mt-5 rounded-xl border border-border bg-surface-muted p-3">
          {preview.kind === "none" ? (
            <p className="py-10 text-center text-sm text-ink-muted">
              No file available
            </p>
          ) : preview.kind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element -- document files are served by the backend host, which next/image is not configured for
            <img
              src={preview.href}
              alt={`${row.document} preview`}
              referrerPolicy="no-referrer"
              className="mx-auto max-h-80 w-full object-contain"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="py-10 text-center">
              <a
                href={preview.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline"
              >
                <FileText className="size-4" aria-hidden="true" />
                Open file
              </a>
            </div>
          )}
        </div>

        {error && !rejectOpen ? (
          <p role="alert" className="mt-4 text-sm text-danger">
            {error}
          </p>
        ) : null}

        {decisionAvailable ? (
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={inFlight}
              className="h-11! px-5!"
            >
              Close
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setError(null);
                setRejectOpen(true);
              }}
              disabled={!canDecide}
              className="h-11! px-5!"
            >
              Reject
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                void runDecision("approve", "");
              }}
              disabled={!canDecide}
              loading={deciding === "approve"}
              className="h-11! px-5!"
            >
              Approve
            </Button>
          </div>
        ) : (
          <div className="mt-6 flex justify-end">
            <Button
              variant="secondary"
              onClick={onClose}
              className="h-11! px-5!"
            >
              Close
            </Button>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={rejectOpen}
        title="Confirm reject"
        description={`Reject "${row.document}"? The backend records this decision immediately.`}
        confirmLabel="Reject document"
        confirmTone="danger"
        noteLabel="Rejection note"
        noteDisabled
        loading={deciding === "reject"}
        error={rejectOpen ? error : null}
        onConfirm={(note) => {
          void runDecision("reject", note);
        }}
        onCancel={closeReject}
      />
    </div>,
    document.body,
  );
}

