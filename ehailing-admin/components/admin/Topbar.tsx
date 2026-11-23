"use client";

import { useSyncExternalStore } from "react";
import type { RefObject } from "react";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, Menu, Search } from "lucide-react";
import { UserMenu } from "./UserMenu";
import { getPageTitle } from "@/lib/nav";

// Long placeholder on lg+, short "Search..." below it so it never truncates in
// the fixed-width field. useSyncExternalStore keeps SSR and the first client
// render identical (server snapshot = long), then swaps with no mismatch.
const LG_QUERY = "(min-width: 1024px)";
const subscribeLg = (onChange: () => void) => {
  const media = window.matchMedia(LG_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};
const getLgSnapshot = () => window.matchMedia(LG_QUERY).matches;
const getLgServerSnapshot = () => true;

interface TopbarProps {
  onToggleMenu: () => void;
  menuOpen: boolean;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
}

export function Topbar({
  onToggleMenu,
  menuOpen,
  menuButtonRef,
}: TopbarProps) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);
  const isLg = useSyncExternalStore(
    subscribeLg,
    getLgSnapshot,
    getLgServerSnapshot,
  );

  return (
    <header className="sticky top-0 z-30 flex h-19 min-w-0 items-center gap-3 overflow-x-clip border-b border-border bg-surface px-4 sm:px-6">
      <button
        ref={menuButtonRef}
        type="button"
        onClick={onToggleMenu}
        aria-label="Open menu"
        aria-expanded={menuOpen}
        className="flex size-11 items-center justify-center rounded-lg text-ink transition-colors hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand lg:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      <div className="min-w-0 flex-1">
        <nav
          aria-label="Breadcrumb"
          className="hidden items-center gap-1.5 text-sm md:flex"
        >
          <span className="text-ink-muted">Admin Portal</span>
          <ChevronRight
            className="size-4 shrink-0 text-ink-subtle"
            aria-hidden="true"
          />
          <span className="truncate font-medium text-ink">{pageTitle}</span>
        </nav>
        <span className="block truncate text-sm font-medium text-ink md:hidden">
          {pageTitle}
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative hidden md:block">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Search"
            placeholder={isLg ? "Search rides, drivers, passengers..." : "Search..."}
            className="h-10 w-72 rounded-xl border border-border bg-page pl-9 pr-14 text-sm text-ink placeholder:text-ink-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 focus-visible:ring-offset-surface"
          />
          <kbd
            aria-hidden="true"
            className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-border bg-surface px-1.5 py-0.5 text-[11px] font-medium text-ink-subtle lg:inline-block"
          >
            ⌘K
          </kbd>
        </div>

        <button
          type="button"
          aria-label="Notifications"
          disabled
          title="Coming soon"
          className="relative flex size-10 items-center justify-center rounded-xl border border-border bg-surface text-ink transition-colors hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Bell className="size-5" aria-hidden="true" />
          <span
            aria-hidden="true"
            className="absolute right-2 top-2 size-2 rounded-full bg-danger"
          />
        </button>

        <UserMenu />
      </div>
    </header>
  );
}

