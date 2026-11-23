"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, MoreHorizontal } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { AccountMenu } from "./AccountMenu";
import { useAdminUser } from "./AdminUserContext";
import { NAV_GROUPS } from "@/lib/nav";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({
  open,
  onClose,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  const { user } = useAdminUser();
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  // While the drawer is open: lock body scroll, close on Escape / at the lg
  // breakpoint, and move focus into the panel.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    const media = window.matchMedia("(min-width: 1024px)");
    const onMedia = () => {
      if (media.matches) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    media.addEventListener("change", onMedia);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      media.removeEventListener("change", onMedia);
    };
  }, [open, onClose]);

  // On load / route change, scroll the active nav item into view so it is never
  // hidden below the fold on short screens. "nearest" avoids a jump when the
  // item is already visible.
  useEffect(() => {
    const active = navRef.current?.querySelector<HTMLElement>(
      '[aria-current="page"]',
    );
    active?.scrollIntoView({ block: "nearest" });
  }, [pathname]);

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(
    0,
  )}`.toUpperCase();

  // `isCollapsed` only applies to the fixed lg+ sidebar; the drawer always
  // renders the expanded layout.
  function renderContent(isCollapsed: boolean) {
    const itemClass = (active: boolean) =>
      `flex h-10 items-center rounded-xl text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
        active
          ? "bg-brand text-white shadow-md shadow-brand/25"
          : "text-ink hover:bg-brand-soft"
      } ${isCollapsed ? "w-10 justify-center" : "gap-3 px-3"}`;

    return (
      <div className="flex h-full min-h-0 flex-col">
        <div
          className={`relative flex min-h-19 shrink-0 items-center border-b border-border bg-surface px-5 pb-4 pt-6 ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          {isCollapsed ? (
            <BrandLogo variant="onLight" size="sm" iconOnly />
          ) : (
            <BrandLogo variant="onLight" size="sm" />
          )}
          {/* Collapse toggle, lg+ only, straddling the sidebar's right edge. */}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
            aria-controls="admin-sidebar"
            className="absolute right-0 top-1/2 z-50 hidden size-8 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-border bg-surface text-ink-muted shadow-md transition-colors hover:bg-brand-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-bg motion-reduce:transition-none lg:flex"
          >
            <ChevronLeft
              className={`size-4 transition-transform duration-200 motion-reduce:transition-none ${
                isCollapsed ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            />
          </button>
        </div>

        <nav
          ref={navRef}
          aria-label="Admin navigation"
          className="nav-scroll-fade no-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-6 pt-4"
        >
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-5 last:mb-0">
              {isCollapsed ? (
                <div aria-hidden="true" className="mx-3 mb-3 h-px bg-border" />
              ) : (
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-ink-subtle">
                  {group.label}
                </p>
              )}
              <ul className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
                        title={isCollapsed ? item.label : undefined}
                        aria-label={isCollapsed ? item.label : undefined}
                        className={itemClass(active)}
                      >
                        <Icon className="size-4.5 shrink-0" aria-hidden="true" />
                        {isCollapsed ? null : (
                          <span className="truncate">{item.label}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {isCollapsed ? (
          <div className="shrink-0 border-t border-border p-3">
            <div className="flex justify-center">
              <AccountMenu
                side="up"
                align="center"
                trigger={(p) => (
                  <button
                    {...p}
                    aria-label="User menu"
                    className="flex size-9 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    {initials}
                  </button>
                )}
              />
            </div>
          </div>
        ) : (
          <div className="shrink-0 border-t border-border p-3">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-muted p-2.5">
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand text-sm font-semibold text-white"
              >
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-xs text-ink-muted">{user.role}</p>
              </div>
              <AccountMenu
                side="up"
                align="end"
                trigger={(p) => (
                  <button
                    {...p}
                    aria-label="User menu"
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-brand-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    <MoreHorizontal className="size-4" aria-hidden="true" />
                  </button>
                )}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Sidebar on lg+ (in flow, so content can never slide under it). */}
      <aside
        id="admin-sidebar"
        className={`hidden shrink-0 self-start border-r border-border bg-surface transition-[width] duration-200 lg:sticky lg:top-0 lg:z-40 lg:flex lg:h-dvh lg:flex-col ${
          collapsed ? "lg:w-20" : "lg:w-64"
        }`}
      >
        {renderContent(collapsed)}
      </aside>

      {/* Off-canvas drawer below lg (always expanded). */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            aria-hidden="true"
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            tabIndex={-1}
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
          >
            {renderContent(false)}
          </div>
        </div>
      ) : null}
    </>
  );
}
