"use client";

import { useState } from "react";
import { Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { runEntityAction } from "@/lib/actions";

interface ExportHeaderActionsProps {
  entity: "transaction" | "settlement";
  primaryLabel: string;
  // Confirm-dialog title for the secondary plain Export button.
  exportDialogTitle: string;
  // Confirm-dialog title for the primary button.
  dialogTitle: string;
  onExport: () => void;
}

const CONFIRM_DESCRIPTION =
  "Please confirm you want to continue.";

// Paired header actions for finance lists: a plain Export button plus a primary
// button that confirms (logged via runEntityAction) before exporting. BOTH
// buttons now confirm first, so no export downloads without confirmation.
export function ExportHeaderActions({
  entity,
  primaryLabel,
  exportDialogTitle,
  dialogTitle,
  onExport,
}: ExportHeaderActionsProps) {
  // Which confirm is open: "export" for the secondary, "primary" for the main.
  const [openKind, setOpenKind] = useState<"export" | "primary" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (loading) return;
    setOpenKind(null);
    setError(null);
  }

  async function handleConfirm(note: string) {
    const kind = openKind;
    setLoading(true);
    setError(null);
    try {
      // The primary's bulk action goes through runEntityAction (no confirmed
      // bulk endpoint yet, so it resolves locally); the plain export just
      // runs the download.
      if (kind === "primary") {
        await runEntityAction({ entity, id: "bulk", action: "export", note });
      }
      onExport();
      setLoading(false);
      setOpenKind(null);
      setError(null);
    } catch {
      setLoading(false);
      setError("Something went wrong. Please try again.");
    }
  }

  const title =
    openKind === "primary" ? dialogTitle : (exportDialogTitle ?? "Confirm export");

  return (
    <>
      <Button variant="secondary" onClick={() => setOpenKind("export")}>
        <Download className="size-4" aria-hidden="true" />
        Export
      </Button>
      <Button variant="primary" onClick={() => setOpenKind("primary")}>
        <Plus className="size-4" aria-hidden="true" />
        {primaryLabel}
      </Button>
      <ConfirmDialog
        open={openKind !== null}
        title={title}
        description={CONFIRM_DESCRIPTION}
        noteLabel="Internal note"
        confirmLabel="Confirm export"
        confirmTone="brand"
        loading={loading}
        error={error}
        onConfirm={handleConfirm}
        onCancel={close}
      />
    </>
  );
}
