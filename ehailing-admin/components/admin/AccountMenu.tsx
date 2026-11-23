"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Settings2, User } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { clearSession } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";

const MENU_ITEM_CLASS =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink transition-colors hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";

const PANEL_BASE =
  "absolute z-50 w-56 rounded-xl border border-border bg-surface p-1 shadow-lg";

function panelPlacement(side: "up" | "down", align: "start" | "end" | "center"): string {
  const vertical = side === "up" ? "bottom-full mb-2" : "top-full mt-2";
  const horizontal =
    align === "start" ? "left-0" : align === "end" ? "right-0" : "left-1/2 -translate-x-1/2";
  return `${vertical} ${horizontal}`;
}

// Props the shared menu injects into the caller's trigger button.
interface TriggerProps {
  ref: React.Ref<HTMLButtonElement>;
  onClick: () => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  "aria-haspopup": "menu";
  "aria-expanded": boolean;
}

export interface AccountMenuProps {
  side?: "up" | "down";
  align?: "start" | "end" | "center";
  trigger: (props: TriggerProps) => ReactNode;
}

// Shared account dropdown (My profile / Account settings / Sign out) with full
// open/close, focus and keyboard behaviour. Used by the topbar trigger and the
// sidebar user card so both open identical content.
export function AccountMenu({
  side = "down",
  align = "end",
  trigger,
}: AccountMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [prevPath, setPrevPath] = useState(pathname);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<null | "first" | "last">(null);
  // Sign-out confirmation lives here (not in the panel) so it survives the
  // panel unmounting when the menu closes.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  // Close on route change (state adjusted during render).
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setOpen(false);
  }

  // Close on outside click and Escape (focus returns to the trigger).
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !menuRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Move focus into the menu when opened via the keyboard.
  useEffect(() => {
    if (!open || !pendingFocus.current) return;
    const items = menuRef.current?.querySelectorAll<HTMLElement>(
      '[role="menuitem"]',
    );
    if (items && items.length > 0) {
      const target =
        pendingFocus.current === "first" ? items[0] : items[items.length - 1];
      target?.focus();
    }
    pendingFocus.current = null;
  }, [open]);

  function moveFocus(direction: 1 | -1) {
    const items = menuRef.current?.querySelectorAll<HTMLElement>(
      '[role="menuitem"]',
    );
    if (!items || items.length === 0) return;
    const current = Array.from(items).indexOf(
      document.activeElement as HTMLElement,
    );
    let next: number;
    if (direction === 1) next = current < 0 ? 0 : (current + 1) % items.length;
    else next = current <= 0 ? items.length - 1 : current - 1;
    items[next]?.focus();
  }

  function handleTriggerKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        pendingFocus.current = "first";
        setOpen(true);
      } else {
        moveFocus(1);
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        pendingFocus.current = "last";
        setOpen(true);
      } else {
        moveFocus(-1);
      }
    }
  }

  function openSignOutDialog() {
    setOpen(false);
    setSignOutError(null);
    setDialogOpen(true);
  }

  function handleConfirmSignOut(note: string) {
    void note;
    setSigningOut(true);
    setSignOutError(null);
    // Client-side sign-out only: there is no logout endpoint, so clear the
    // cookies and leave. The ToastProvider lives in the root layout, so the
    // success toast survives the redirect.
    clearSession();
    toast.success({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    router.push("/signin");
    router.refresh();
  }

  function handleCancelSignOut() {
    if (signingOut) return;
    setDialogOpen(false);
    setSignOutError(null);
  }

  return (
    <>
    <div className="relative">
      {trigger({
        ref: triggerRef,
        onClick: () => setOpen((value) => !value),
        onKeyDown: handleTriggerKeyDown,
        "aria-haspopup": "menu",
        "aria-expanded": open,
      })}
      {open ? (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          className={`${PANEL_BASE} ${panelPlacement(side, align)}`}
        >
          <Link
            role="menuitem"
            href="/admin/profile"
            onClick={() => setOpen(false)}
            className={MENU_ITEM_CLASS}
          >
            <User className="size-4" aria-hidden="true" />
            My profile
          </Link>
          <Link
            role="menuitem"
            href="/admin/account-settings"
            onClick={() => setOpen(false)}
            className={MENU_ITEM_CLASS}
          >
            <Settings2 className="size-4" aria-hidden="true" />
            Account settings
          </Link>
          <div role="separator" className="my-1 h-px bg-border" />
          <button
            type="button"
            role="menuitem"
            onClick={openSignOutDialog}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-danger transition-colors hover:bg-danger-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      ) : null}
      </div>

      <ConfirmDialog
        open={dialogOpen}
        title="Confirm sign out"
        description="Please confirm you want to continue."
        noteLabel="Internal note"
        confirmLabel="Confirm action"
        loading={signingOut}
        error={signOutError}
        onConfirm={handleConfirmSignOut}
        onCancel={handleCancelSignOut}
      />
    </>
  );
}
