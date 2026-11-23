'use client';

import { useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminUser, formatFullName } from '@/components/admin/AdminUserContext';
import { setCookie } from '@/lib/cookies';
import { useIsDarkMode } from '@/lib/useIsDarkMode';
import { LogoutModal } from '@/components/admin/LogoutModal';
import { RECENT_ACTIVITIES_ANCHOR } from '@/components/admin/dashboard/RecentActivities';
import { ProfileDropdown } from '@/components/admin/ProfileDropdown';
import { BellIcon } from '@/components/ui/icons/BellIcon';
import { ChevronDownIcon } from '@/components/ui/icons/ChevronDownIcon';
import { MenuIcon } from '@/components/ui/icons/MenuIcon';
import { MoonIcon } from '@/components/ui/icons/MoonIcon';
import { SunIcon } from '@/components/ui/icons/SunIcon';

// TODO: avatar still comes from the design mock — the profile API returns no
// avatar field yet.
const AVATAR = '/images/headshot.png';

// The bell no longer opens an overlay — it navigates to the Recent Activity
// section on the Overview page — so 'profile' is the only overlay left.
type OpenOverlay = 'profile' | null;

type TopbarProps = {
  onMenuToggle: () => void;
};

export function Topbar({ onMenuToggle }: TopbarProps) {
  const { user, isLoading } = useAdminUser();
  // Placeholder, never a design mock, until the profile GET resolves.
  const fullName = formatFullName(user);
  // The server layout sets the .dark class on <html> from the theme cookie
  // before first paint; the hook mirrors that state (and stays in sync with
  // the toggle below via its MutationObserver — the DOM class is the truth).
  const isDark = useIsDarkMode();
  const router = useRouter();
  const pathname = usePathname();
  const [openOverlay, setOpenOverlay] = useState<OpenOverlay>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const toggleTheme = (dark: boolean) => {
    document.documentElement.classList.toggle('dark', dark);
    // Same cookie convention as lib/cookies.ts (path=/, SameSite=Lax); 1 year
    setCookie('theme', dark ? 'dark' : 'light', 60 * 60 * 24 * 365);
  };

  /**
   * Bell behaviour: jump to the Recent Activity section on the Overview page.
   * Already on /admin with the section mounted -> smooth-scroll straight to it.
   * Anywhere else -> route to /admin with the anchor; RecentActivities scrolls
   * itself on mount, because the dashboard renders behind a loading state and
   * the element does not exist yet when the route changes.
   */
  const goToRecentActivity = () => {
    const section = document.getElementById(RECENT_ACTIVITIES_ANCHOR);
    if (pathname === '/admin' && section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    router.push(`/admin#${RECENT_ACTIVITIES_ANCHOR}`);
  };

  const toggleOverlay = (overlay: Exclude<OpenOverlay, null>) => {
    setOpenOverlay((current) => (current === overlay ? null : overlay));
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line-card bg-surface-card px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-secondary transition-colors hover:bg-surface-hover hover:text-ink-primary lg:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium text-ink-secondary">Dashboard</span>
      </div>

      <div className="flex items-center gap-4">
        {/* Light/dark mode stub toggle */}
        <div className="flex items-center gap-1 rounded-full border border-line-card p-1">
          <button
            type="button"
            onClick={() => toggleTheme(false)}
            aria-label="Light mode"
            aria-pressed={!isDark}
            className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
              !isDark ? 'bg-toggle-active text-white' : 'text-ink-placeholder hover:text-ink-secondary'
            }`}
          >
            <SunIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => toggleTheme(true)}
            aria-label="Dark mode"
            aria-pressed={isDark}
            className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
              isDark ? 'bg-toggle-active text-white' : 'text-ink-placeholder hover:text-ink-secondary'
            }`}
          >
            <MoonIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Bell — shortcut to the Recent Activity section on the Overview page.
            Icon size, position and hover styling are unchanged from when it
            opened the notification panel; only the click behaviour differs. */}
        <button
          type="button"
          onClick={goToRecentActivity}
          aria-label="Recent activity"
          className="text-ink-secondary transition-colors hover:text-ink-primary"
        >
          <BellIcon className="h-5 w-5" />
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            type="button"
            data-overlay-trigger
            onClick={() => toggleOverlay('profile')}
            aria-label="Account menu"
            aria-expanded={openOverlay === 'profile'}
            aria-busy={isLoading}
            className="flex items-center gap-1.5"
          >
            <Image
              src={AVATAR}
              alt={fullName}
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover"
            />
            <ChevronDownIcon className="h-4 w-4 text-ink-tertiary" />
          </button>
          <ProfileDropdown
            open={openOverlay === 'profile'}
            onClose={() => setOpenOverlay(null)}
            onLogout={() => setLogoutOpen(true)}
          />
        </div>
      </div>

      <LogoutModal open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </header>
  );
}