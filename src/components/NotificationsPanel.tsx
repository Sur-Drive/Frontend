import type { NotificationItem } from "../hooks/useNotifications";

// ─── Icon badge ─────────────────────────────────────────
// Notification `type` strings come from the backend (e.g. "hazard_confirmed",
// "hazard_reported", "fleet_assigned", "vehicle_assigned", "vehicle_removed",
// "trip_complete", "maintenance", "safety", "sos"). We match on substrings so
// new/related type values still get a sensible icon without a code change.
function iconFor(type: string) {
  const t = type.toLowerCase();

  if (t.includes("sos")) {
    return (
      <div className="flex items-center justify-center flex-shrink-0 bg-red-100 w-14 h-14 rounded-2xl">
        <svg
          viewBox="0 0 24 24"
          className="w-6 h-6 text-red-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 9v4M12 17h.01M10.29 3.86l-8.18 14.18A2 2 0 0 0 3.82 21h16.36a2 2 0 0 0 1.71-2.96L13.71 3.86a2 2 0 0 0-3.42 0z" />
        </svg>
      </div>
    );
  }

  if (t.includes("hazard") || t.includes("maintenance")) {
    return (
      <div className="flex items-center justify-center flex-shrink-0 w-14 h-14 bg-amber-100 rounded-2xl">
        <svg
          viewBox="0 0 24 24"
          className="w-6 h-6 text-amber-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 9v4M12 17h.01M10.29 3.86l-8.18 14.18A2 2 0 0 0 3.82 21h16.36a2 2 0 0 0 1.71-2.96L13.71 3.86a2 2 0 0 0-3.42 0z" />
        </svg>
      </div>
    );
  }

  if (t.includes("trip")) {
    return (
      <div className="flex items-center justify-center flex-shrink-0 w-14 h-14 bg-emerald-100 rounded-2xl">
        <svg
          viewBox="0 0 24 24"
          className="w-6 h-6 text-emerald-600"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 12h4l2 6 4-12 2 6h6" />
        </svg>
      </div>
    );
  }

  if (t.includes("vehicle")) {
    return (
      <div className="flex items-center justify-center flex-shrink-0 bg-purple-100 w-14 h-14 rounded-2xl">
        <svg
          viewBox="0 0 24 24"
          className="w-6 h-6 text-purple-700"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 17h14M6 17a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm12 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
          <path d="M3 17V11l2-5h10l4 5v6" />
        </svg>
      </div>
    );
  }

  if (t.includes("fleet")) {
    return (
      <div className="flex items-center justify-center flex-shrink-0 bg-purple-100 w-14 h-14 rounded-2xl">
        <svg
          viewBox="0 0 24 24"
          className="w-6 h-6 text-purple-700"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M3 12h18" />
        </svg>
      </div>
    );
  }

  if (t.includes("safety")) {
    return (
      <div className="flex items-center justify-center flex-shrink-0 bg-purple-100 w-14 h-14 rounded-2xl">
        <svg
          viewBox="0 0 24 24"
          className="w-6 h-6 text-purple-700"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 11l18-5v12L3 14v-3z" />
          <path d="M11.6 16.8a2 2 0 0 1-3.4-1.4" />
        </svg>
      </div>
    );
  }

  // Generic fallback bell
  return (
    <div className="flex items-center justify-center flex-shrink-0 bg-gray-100 w-14 h-14 rounded-2xl">
      <svg
        viewBox="0 0 24 24"
        className="w-6 h-6 text-gray-500"
        fill="currentColor"
      >
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
      </svg>
    </div>
  );
}

// ─── Timestamp formatting ───────────────────────────────
function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Panel ──────────────────────────────────────────────
interface NotificationsPanelProps {
  onClose: () => void;
  /** Notifications fetched from GET /notifications (or /notifications/recent). */
  notifications: NotificationItem[];
  /** True while the initial page of notifications is loading. */
  isLoading?: boolean;
  /** True while "Mark all as read" is in flight. */
  isMarkingAllRead?: boolean;
  /** Called when the user taps "Mark all as read". */
  onMarkAllRead?: () => void;
  /** Called when the user taps an individual (unread) notification. */
  onNotificationClick?: (notification: NotificationItem) => void;
}

export default function NotificationsPanel({
  onClose,
  notifications,
  isLoading = false,
  isMarkingAllRead = false,
  onMarkAllRead,
  onNotificationClick,
}: NotificationsPanelProps) {
  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/0 sm:bg-black/40">
      <div className="flex flex-col w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-md bg-white animate-in slide-in-from-bottom sm:rounded-3xl rounded-t-[28px] sm:shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 px-6 pt-8 pb-4">
          <div className="flex items-start justify-between">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Notifications
            </h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex items-center justify-center flex-shrink-0 text-gray-500 transition bg-gray-100 rounded-full w-9 h-9 hover:bg-gray-200"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
          {hasUnread && (
            <button
              onClick={onMarkAllRead}
              disabled={isMarkingAllRead}
              className="flex items-center gap-1.5 mt-3 text-sm font-medium text-purple-600 ml-auto disabled:opacity-50"
            >
              {isMarkingAllRead ? "Marking as read…" : "Mark all as read"}
              <svg
                viewBox="0 0 24 24"
                className="w-4.5 h-4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12l3 3 5-6" />
              </svg>
            </button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {isLoading ? (
            <div className="space-y-5 py-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-start gap-4 animate-pulse">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 bg-gray-100 rounded w-4/5" />
                    <div className="h-3 bg-gray-100 rounded w-2/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-gray-400">
                You&apos;re all caught up — no notifications yet.
              </p>
            </div>
          ) : (
            notifications.map((n, i) => (
              <div key={n.id}>
                <button
                  type="button"
                  onClick={() => !n.isRead && onNotificationClick?.(n)}
                  className="flex items-start w-full gap-4 py-5 text-left"
                >
                  {iconFor(n.type)}
                  <div className="relative flex-1 min-w-0">
                    <p className="text-[15px] leading-snug text-gray-900 pr-4">
                      {n.title && (
                        <strong className="font-bold">{n.title}</strong>
                      )}
                      {n.title && n.message ? " " : ""}
                      {n.message}
                    </p>
                    <p className="mt-2 text-sm text-gray-400">
                      {formatTimestamp(n.createdAt)}
                    </p>
                    {!n.isRead && (
                      <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-purple-600 rounded-full" />
                    )}
                  </div>
                </button>
                {i < notifications.length - 1 && (
                  <div className="border-t border-gray-100" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
