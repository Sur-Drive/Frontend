import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { AdminUserProvider } from "@/components/admin/AdminUserContext";
import { AdminShell } from "@/components/admin/AdminShell";

// The sidebar-collapsed cookie read below is request data, so the shell is a
// blocking (non-instant) route rather than a prerendered one.
export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const store = await cookies();
  const initialCollapsed = store.get("sd_sidebar")?.value === "collapsed";

  return (
    <AdminUserProvider>
      <AdminShell initialCollapsed={initialCollapsed}>{children}</AdminShell>
    </AdminUserProvider>
  );
}
