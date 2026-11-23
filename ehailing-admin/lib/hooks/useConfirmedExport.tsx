"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const CONFIRM_DESCRIPTION =
  "Please confirm you want to continue.";

interface PendingExport {
  title: string;
  run: () => void;
}

interface ConfirmedExport {
  // Open the shared confirm dialog for a download. `run` should perform the
  // download (e.g. downloadCsv) — it fires the single "Export ready" toast.
  requestExport: (title: string, run: () => void) => void;
  // Render this wherever the page's other dialogs live.
  dialog: ReactNode;
}

// One shared confirm-before-download flow so every Export button behaves the
// same: click -> ConfirmDialog -> on confirm run the download (which toasts
// once). Returns the dialog to render; nothing is downloaded until confirmed.
export function useConfirmedExport(): ConfirmedExport {
  const [pending, setPending] = useState<PendingExport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function requestExport(title: string, run: () => void) {
    setError(null);
    setPending({ title, run });
  }

  function close() {
    if (loading) return;
    setPending(null);
    setError(null);
  }

  function handleConfirm() {
    if (!pending) return;
    setLoading(true);
    setError(null);
    try {
      pending.run();
      setLoading(false);
      setPending(null);
      setError(null);
    } catch {
      setLoading(false);
      setError("Something went wrong. Please try again.");
    }
  }

  const dialog = (
    <ConfirmDialog
      open={pending !== null}
      title={pending?.title ?? ""}
      description={CONFIRM_DESCRIPTION}
      confirmLabel="Confirm export"
      confirmTone="brand"
      loading={loading}
      error={error}
      onConfirm={handleConfirm}
      onCancel={close}
    />
  );

  return { requestExport, dialog };
}
