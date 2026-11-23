'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { AdminUserProvider } from '@/components/admin/AdminUserContext';
import { Sidebar } from '@/components/admin/Sidebar';
import { Topbar } from '@/components/admin/Topbar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    // Provides the logged-in user's display info to Topbar, ProfileDropdown and
    // Settings so a profile update reflects everywhere immediately.
    <AdminUserProvider>
      <div className="flex h-[100dvh] overflow-hidden bg-surface-page">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenuToggle={() => setSidebarOpen(true)} />
          <main className="flex-1 overflow-y-auto bg-surface-subtle p-6">{children}</main>
        </div>
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
      </div>
    </AdminUserProvider>
  );
}
