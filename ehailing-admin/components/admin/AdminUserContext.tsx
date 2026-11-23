"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { ADMIN_USER } from "@/lib/mock/admin-user";

export interface AdminUser {
  firstName: string;
  lastName: string;
  role: string;
}

interface AdminUserContextValue {
  user: AdminUser;
  isLoading: boolean;
}

const AdminUserContext = createContext<AdminUserContextValue | null>(null);

// Single source of the signed-in admin's details for the whole shell. Any
// component that shows the name, role or initials must read it from here.
export function AdminUserProvider({ children }: { children: ReactNode }) {
  // Seeded from the mock until a profile endpoint is confirmed.
  const value: AdminUserContextValue = { user: ADMIN_USER, isLoading: false };
  return (
    <AdminUserContext.Provider value={value}>
      {children}
    </AdminUserContext.Provider>
  );
}

export function useAdminUser(): AdminUserContextValue {
  const context = useContext(AdminUserContext);
  if (!context) {
    throw new Error("useAdminUser must be used within an AdminUserProvider");
  }
  return context;
}