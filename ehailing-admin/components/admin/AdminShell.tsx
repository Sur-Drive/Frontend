"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

function setSidebarCookie(collapsed: boolean) {
  document.cookie = `sd_sidebar=${
    collapsed ? "collapsed" : "expanded"
  }; path=/; max-age=31536000; samesite=lax`;
}

export function AdminShell({
  children,
  initialCollapsed = false,
}: {
  children: ReactNode;
  initialCollapsed?: boolean;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [prevPath, setPrevPath] = useState(pathname);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleCollapsed = useCallback(
    () => setCollapsed((value) => !value),
    [],
  );

  // Persist the sidebar state so a reload restores it with no flash.
  useEffect(() => {
    setSidebarCookie(collapsed);
  }, [collapsed]);

  // Close the drawer whenever the route changes (state adjusted during render).
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setDrawerOpen(false);
  }

  // Return focus to the hamburger once the drawer closes.
  useEffect(() => {
    if (!drawerOpen && wasOpenRef.current) {
      menuButtonRef.current?.focus();
    }
    wasOpenRef.current = drawerOpen;
  }, [drawerOpen]);

  return (
    <div className="min-h-dvh bg-page lg:flex">
      <Sidebar
        open={drawerOpen}
        onClose={closeDrawer}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
      />
      <div className="min-w-0 flex-1">
        <Topbar
          onToggleMenu={() => setDrawerOpen((open) => !open)}
          menuOpen={drawerOpen}
          menuButtonRef={menuButtonRef}
        />
        <main className="admin-main min-w-0 px-4 py-6 sm:px-6 lg:px-7">
          <div className="mx-auto min-w-0 max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
