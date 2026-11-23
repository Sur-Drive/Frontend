"use client";

import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { EM_DASH } from "@/lib/format";
import {
  FINANCE_NOTE_MAX,
  createFinanceNote,
  fetchFinanceNotes,
  financeNoteDraftError,
} from "@/lib/finance";
import type { FinanceNoteItem, FinanceNoteSubjectType } from "@/lib/finance";

interface FinanceNotesTabProps {
  // payment | settlement | refund — which record family the notes attach to.
  subjectType: FinanceNoteSubjectType;
  // The record id: the same id the drawer's detail/timeline fetches use.
  subjectId: string;
}

// The finance drawers' live Notes tab. The FinanceDrawerShell
// keys this panel by subject, so a record change remounts it and the fetch
// below runs once per record; state resets with the remount. Note text lives
// ONLY here and in the POST body — it never reaches rows, CSVs, toasts or
// logs, and toasts stay title-only for the same reason.
export function FinanceNotesTab({
  subjectType,
  subjectId,
}: FinanceNotesTabProps) {
  const toast = useToast();
  const textareaId = useId();

  // null = not loaded yet (loading line); [] = loaded and genuinely empty.
  const [list, setList] = useState<FinanceNoteItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // The draft and its posting state reset with the remount too. The draft
  // clears only after the backend has confirmed the POST.
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  // The POST response is documented to be "the refreshed list" but its shape
  // was never observed and is never trusted: after a successful POST the list
  // is refetched with GET here (the reload token bumps, the effect re-runs).
  // State changes only happen in the async callbacks — never synchronously
  // inside this effect body.
  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    fetchFinanceNotes({ subjectType, subjectId }, controller.signal)
      .then((page) => {
        if (cancelled) return;
        setList(page.items);
        setError(null);
        setLoading(false);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        if (cause instanceof Error && cause.name === "AbortError") return;
        setError(
          cause instanceof Error && cause.message
            ? cause.message
            : "Request failed. Please try again.",
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [subjectType, subjectId, reloadToken]);

  function retry() {
    setError(null);
    // A failed first load shows the loading line again; a failed refresh
    // keeps the last good list visible.
    if (list === null) setLoading(true);
    setReloadToken((token) => token + 1);
  }

  // Double-submit block: the button is disabled while posting and this guard
  // makes the invariant hold even for programmatic clicks. The lib mutator
  // re-validates before any request (blank and over-2000 notes send nothing).
  async function handleAdd() {
    if (posting) return;
    const draftError = financeNoteDraftError(draft);
    if (draftError) {
      setPostError(draftError);
      return;
    }
    setPosting(true);
    setPostError(null);
    try {
      await createFinanceNote({ subjectType, subjectId, body: draft });
      // The backend confirmed the note — only now does the draft clear.
      setDraft("");
      toast.success({ title: "Note added" });
      setReloadToken((token) => token + 1);
    } catch (cause) {
      setPostError(
        cause instanceof Error && cause.message
          ? cause.message
          : "Request failed. Please try again.",
      );
    } finally {
      setPosting(false);
    }
  }

  const draftError = financeNoteDraftError(draft);

  return (
    <section aria-label="Notes">
      <h3 className="text-base font-normal text-ink">Notes</h3>

      {loading && list === null ? (
        <div
          role="status"
          aria-busy="true"
          className="mt-3 flex items-center gap-2 text-sm text-ink-muted"
        >
          <span
            className="size-3.5 animate-spin rounded-full border-2 border-border border-t-brand"
            aria-hidden="true"
          />
          Loading notes…
        </div>
      ) : error ? (
        <div
          role="alert"
          className="mt-3 flex flex-col gap-3 rounded-xl border border-border bg-danger-soft px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="min-w-0 text-sm font-medium text-danger">{error}</p>
          <Button
            variant="secondary"
            onClick={retry}
            className="shrink-0 self-start sm:self-auto"
          >
            Retry
          </Button>
        </div>
      ) : list !== null ? (
        list.length ? (
          <ul className="mt-3 flex flex-col gap-2">
            {list.map((note, index) => (
              <li
                key={note.id || index}
                className="rounded-xl bg-surface-muted p-4"
              >
                <p className="whitespace-pre-wrap wrap-break-word text-sm text-ink">
                  {note.body}
                </p>
                {note.createdAtLabel !== EM_DASH ? (
                  <p className="mt-1 text-xs text-ink-muted">
                    Added {note.createdAtLabel}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          // Loaded and genuinely empty: a true zero, not a placeholder.
          <p className="mt-3 rounded-xl bg-surface-muted p-4 text-sm text-ink-muted">
            No notes yet.
          </p>
        )
      ) : null}

      <div className="mt-4 border-t border-border pt-3">
        <label htmlFor={textareaId} className="sr-only">
          Add a note
        </label>
        <textarea
          id={textareaId}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={FINANCE_NOTE_MAX}
          placeholder="Add an internal note…"
          className="min-h-30 w-full resize-none rounded-xl border border-border bg-surface p-3 text-base text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs text-ink-muted">
            {draft.length}/{FINANCE_NOTE_MAX}
          </span>
          <Button
            variant="secondary"
            onClick={handleAdd}
            disabled={posting || draftError !== null}
            className="h-10! px-4!"
          >
            {posting ? "Adding…" : "Add note"}
          </Button>
        </div>
        {postError ? (
          <p role="alert" className="mt-2 text-xs text-danger">
            {postError}
          </p>
        ) : null}
      </div>
    </section>
  );
}
