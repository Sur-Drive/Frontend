import { Button } from "@/components/ui/Button";

export type TicketComposerTab = "reply" | "note";

// Pinned composer: Reply / Internal note tabs, textarea, muted email+push
// helper on the Reply tab, primary Send button. Cmd/Ctrl+Enter sends;
// sending needs no confirm. Disabled when empty or resolved.
export function TicketComposer({
  composerTab,
  onTabChange,
  draft,
  onDraftChange,
  resolved,
  onSend,
}: {
  composerTab: TicketComposerTab;
  onTabChange: (tab: TicketComposerTab) => void;
  draft: string;
  onDraftChange: (value: string) => void;
  resolved: boolean;
  onSend: () => void;
}) {
  return (
    <div className="shrink-0 border-t border-border px-4 py-4 sm:px-5">
      <div role="tablist" aria-label="Composer mode" className="flex gap-1">
        {(["reply", "note"] as TicketComposerTab[]).map((mode) => (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={composerTab === mode}
            onClick={() => onTabChange(mode)}
            className={`relative shrink-0 px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              composerTab === mode
                ? "font-semibold text-brand"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            {mode === "reply" ? "Reply" : "Internal note"}
            {composerTab === mode ? (
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand"
              />
            ) : null}
          </button>
        ))}
      </div>
      <label htmlFor="ticket-composer" className="sr-only">
        {composerTab === "reply" ? "Type your reply" : "Add an internal note"}
      </label>
      <textarea
        id="ticket-composer"
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={(event) => {
          if (
            (event.metaKey || event.ctrlKey) &&
            event.key === "Enter" &&
            draft.trim() !== ""
          ) {
            event.preventDefault();
            onSend();
          }
        }}
        placeholder={
          composerTab === "reply"
            ? "Type your reply..."
            : "Add an internal note..."
        }
        disabled={resolved}
        className="mt-2 min-h-24 w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-base text-ink placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-70 sm:text-sm"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-ink-muted">
          {composerTab === "reply" && !resolved
            ? "Response will be sent by email and push"
            : resolved
              ? "This ticket is resolved."
              : ""}
        </p>
        <Button
          variant="primary"
          onClick={onSend}
          disabled={draft.trim() === "" || resolved}
          title={
            resolved ? "Resolved tickets can't receive replies." : undefined
          }
          className="h-11! px-5!"
        >
          {composerTab === "reply" ? "Send reply" : "Add note"}
        </Button>
      </div>
    </div>
  );
}
