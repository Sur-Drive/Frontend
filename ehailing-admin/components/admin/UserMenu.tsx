"use client";

import { ChevronDown } from "lucide-react";
import { AccountMenu } from "./AccountMenu";
import { useAdminUser } from "./AdminUserContext";

// Topbar account trigger; opens the shared AccountMenu panel.
export function UserMenu() {
  const { user } = useAdminUser();
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <AccountMenu
      trigger={(p) => (
        <button
          {...p}
          className="flex items-center gap-2 rounded-xl p-1 pr-2 transition-colors hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          <span
            aria-hidden="true"
            className="flex size-10 items-center justify-center rounded-xl bg-brand text-sm font-bold text-white"
          >
            {initials}
          </span>
          <span className="hidden flex-col items-start leading-tight md:flex">
            <span className="text-sm font-semibold text-ink">{user.firstName}</span>
            <span className="text-xs text-ink-muted">{user.role}</span>
          </span>
          <ChevronDown
            className="hidden size-4 text-ink-muted md:block"
            aria-hidden="true"
          />
        </button>
      )}
    />
  );
}

