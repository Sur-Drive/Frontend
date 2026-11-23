"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import type { AdminUserRecord } from "@/types/admin-users";
import type { ProfileRequest } from "@/components/admin/access/AdminProfileDrawer";

export function AdminRowMenu({
  admin,
  guard,
  onOpen,
  onRequest,
}: {
  admin: AdminUserRecord;
  guard: string | null;
  onOpen: () => void;
  onRequest: (request: ProfileRequest) => void;
}) {
  const [open, setOpen] = useState(false);
  const entries: { label: string; request: ProfileRequest | null; disabled: boolean; reason?: string; danger?: boolean }[] =
    admin.status === "Invited"
      ? [
          // No resend-invite endpoint is documented, so
          // Resend stays visible but disabled with "Not available yet".
          { label: "Resend invitation", request: null, disabled: true, reason: "Not available yet" },
          { label: "Revoke invitation", request: { kind: "revoke" }, disabled: false, danger: true },
        ]
      : admin.status === "Active"
        ? [
            { label: "Change role", request: null, disabled: guard !== null, reason: guard ?? "Open the profile to change the role." },
            { label: "Deactivate", request: { kind: "deactivate" }, disabled: guard !== null, reason: guard ?? undefined, danger: true },
          ]
        : [
            { label: "Reactivate", request: { kind: "reactivate" }, disabled: guard !== null, reason: guard ?? undefined },
          ];

  return (
    <div className="relative inline-block text-left" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${admin.name}`}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <MoreHorizontal className="size-4" aria-hidden="true" />
      </button>
      {open ? (
        <MenuBackdrop onClose={() => setOpen(false)}>
          <MenuItem onSelect={onOpen} onClose={() => setOpen(false)}>
            View profile
          </MenuItem>
          {entries.map((entry) => (
            <span key={entry.label} role="none" className="block" title={entry.disabled ? entry.reason : undefined}>
              <MenuItem
                disabled={entry.disabled}
                tone={entry.danger ? "danger" : "default"}
                onSelect={() => {
                  if (entry.request) onRequest(entry.request);
                  else onOpen();
                }}
                onClose={() => setOpen(false)}
              >
                {entry.label}
              </MenuItem>
            </span>
          ))}
        </MenuBackdrop>
      ) : null}
    </div>
  );
}

function MenuBackdrop({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) onClose();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      className="absolute right-0 top-full z-40 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg"
    >
      {children}
    </div>
  );
}

function MenuItem({
  children,
  onSelect,
  onClose,
  disabled = false,
  tone = "default",
}: {
  children: ReactNode;
  onSelect: () => void;
  onClose: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={() => {
        onSelect();
        onClose();
      }}
      className={`block w-full px-4 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        tone === "danger" ? "text-danger hover:bg-danger-soft" : "text-ink hover:bg-surface-muted"
      }`}
    >
      {children}
    </button>
  );
}
