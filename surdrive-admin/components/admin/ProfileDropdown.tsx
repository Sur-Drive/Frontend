'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  useAdminUser,
  displayValue,
  formatFullName,
} from '@/components/admin/AdminUserContext';
import { LogOutIcon } from '@/components/ui/icons/LogOutIcon';
import { UserIcon } from '@/components/ui/icons/UserIcon';

type ProfileDropdownProps = {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
};

// TODO: avatar still comes from the design mock — no avatar field in the API yet.
const AVATAR = '/images/headshot.png';

export function ProfileDropdown({ open, onClose, onLogout }: ProfileDropdownProps) {
  const { user, isLoading, error, refreshUser } = useAdminUser();
  // Neutral placeholder while loading / after a failed load — never mock data.
  const fullName = formatFullName(user);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      // Ignore clicks on the trigger button — its own onClick handles the toggle
      if ((event.target as Element).closest('[data-overlay-trigger]')) return;
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full z-30 mt-3 w-[220px] rounded-2xl border border-line-card bg-surface-card p-3 shadow-xl"
      role="menu"
      aria-label="Account menu"
    >
      <div className="flex items-center gap-3 px-2 py-2">
        <Image
          src={AVATAR}
          alt={fullName}
          width={40}
          height={40}
          className="h-10 w-10 rounded-full object-cover"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-primary">{fullName}</p>
          <p className="truncate text-xs text-ink-placeholder">
            {/* "Loading…" distinguishes an in-flight GET from a failed one ("—"). */}
            {isLoading && !user.role ? 'Loading…' : displayValue(user.role)}
          </p>
        </div>
      </div>

      {/* The GET failed (expired token, network). Show why and offer a recovery
          path instead of leaving the placeholder unexplained. */}
      {error && (
        <div className="mx-2 mb-1 rounded-lg bg-status-danger-bg px-3 py-2">
          <p className="text-xs text-status-danger-text">{error}</p>
          <button
            type="button"
            onClick={() => void refreshUser()}
            disabled={isLoading}
            className="mt-1.5 text-xs font-semibold text-brand-primary disabled:opacity-60"
          >
            {isLoading ? 'Retrying…' : 'Try again'}
          </button>
        </div>
      )}

      <a
        href="#"
        role="menuitem"
        onClick={onClose}
        className="flex items-center gap-3 rounded-xl px-2 py-2.5 text-sm text-ink-primary transition-colors hover:bg-surface-hover"
      >
        <UserIcon className="h-[18px] w-[18px] text-ink-secondary" />
        Profile
      </a>

      <div className="my-1 border-t border-line-divider" />

      {/* TODO: wire to real logout logic — currently opens the confirmation modal */}
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onClose();
          onLogout();
        }}
        className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-sm font-medium text-status-danger-text transition-colors hover:bg-status-danger-bg"
      >
        <LogOutIcon className="h-[18px] w-[18px]" />
        Log out
      </button>
    </div>
  );
}