import type { NotificationChannel } from "@/types/notifications";

export const PREVIEW_TITLE_FALLBACK = "Your weekend ride offer";
export const PREVIEW_MESSAGE_FALLBACK =
  "Save 20% on your next ride across Lagos.";

interface NotificationPreviewProps {
  channel: NotificationChannel;
  title: string;
  message: string;
}

// Live preview of the notification body, shared by the composer's grey PREVIEW
// panel and the details drawer's Overview tab. Adapts per channel: the push
// card from the design, an SMS bubble, or an email subject + body. Empty copy
// falls back to the design's placeholders.
export function NotificationPreview({
  channel,
  title,
  message,
}: NotificationPreviewProps) {
  const subject = title.trim() === "" ? PREVIEW_TITLE_FALLBACK : title;
  const body = message.trim() === "" ? PREVIEW_MESSAGE_FALLBACK : message;

  if (channel === "SMS") {
    return (
      <div className="rounded-2xl bg-surface-muted p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">
          SUR-DRIVEHT
        </p>
        <p className="mt-2 max-w-prose text-sm text-ink">{body}</p>
      </div>
    );
  }

  if (channel === "Email") {
    return (
      <div className="rounded-2xl bg-surface-muted p-4">
        <p className="text-xs text-ink-subtle">Subject</p>
        <p className="mt-0.5 text-sm font-semibold text-ink">{subject}</p>
        <p className="mt-3 border-t border-border pt-3 text-sm text-ink-muted">
          {body}
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl bg-surface-muted p-4">
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white"
      >
        S
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink">
            SUR-DRIVEHT
          </p>
          <p className="shrink-0 text-xs text-ink-subtle">now</p>
        </div>
        <p className="mt-1 text-sm font-semibold text-ink">{subject}</p>
        <p className="mt-0.5 text-sm text-ink-muted">{body}</p>
      </div>
    </div>
  );
}
