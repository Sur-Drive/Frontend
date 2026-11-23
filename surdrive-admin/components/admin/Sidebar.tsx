'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  displayValue,
  formatFullName,
  useAdminUser,
} from '@/components/admin/AdminUserContext';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ChevronIcon } from '@/components/ui/icons/ChevronIcon';
import { CreditCardIcon } from '@/components/ui/icons/CreditCardIcon';
import { FleetIcon } from '@/components/ui/icons/FleetIcon';
import { GridIcon } from '@/components/ui/icons/GridIcon';
import { HeadphonesIcon } from '@/components/ui/icons/HeadphonesIcon';
import { PieChartIcon } from '@/components/ui/icons/PieChartIcon';
import { SettingsIcon } from '@/components/ui/icons/SettingsIcon';
import { SirenIcon } from '@/components/ui/icons/SirenIcon';
import { UsersIcon } from '@/components/ui/icons/UsersIcon';
import { XIcon } from '@/components/ui/icons/XIcon';
import { useIsDarkMode } from '@/lib/useIsDarkMode';
import type { ComponentType } from 'react';

type IconComponent = ComponentType<{ className?: string }>;

type NavItem = {
  id: string;
  label: string;
  icon: IconComponent;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: GridIcon, href: '/admin' },
  { id: 'user-management', label: 'User Management', icon: UsersIcon, href: '/admin/user-management' },
  { id: 'fleet-management', label: 'Fleet Management', icon: FleetIcon, href: '/admin/fleet-management' },
  // { id: 'advertisers', label: 'Advertisers', icon: MegaphoneIcon, href: '/admin/advertisers' },
  { id: 'moderation', label: 'Moderation', icon: HeadphonesIcon, href: '/admin/moderation' },
  { id: 'sos-monitor', label: 'SOS Monitor', icon: SirenIcon, href: '/admin/sos-monitor' },
  { id: 'subscription-management', label: 'Subscription Management', icon: CreditCardIcon, href: '/admin/subscription-management' },
  { id: 'analytics', label: 'Analytics', icon: PieChartIcon, href: '/admin/analytics' },
  { id: 'settings', label: 'Settings', icon: SettingsIcon, href: '/admin/settings' },
];

// TODO: avatar still comes from the design mock — the profile API returns no
// avatar field yet. The name/role mock is gone on purpose: they now come from
// GET /users/profile via AdminUserContext, so a saved update can't look reverted.
const AVATAR = '/images/headshot.png';

type SidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function Sidebar({ open, onClose }: SidebarProps) {
  const [expanded, setExpanded] = useState(true);
  // Theme-reactive logo: white mark in dark mode, navy mark in light mode.
  // (Other BrandLogo call sites — sign-in page, showcase panel — keep their
  // hardcoded tone; only the sidebar needs to follow the theme.)
  const isDark = useIsDarkMode();
  // Real profile from AdminUserContext; neutral placeholder until the GET resolves
  // (never a design mock — the sidebar used to show "Seun Tega" after a reload).
  const { user, isLoading } = useAdminUser();
  const fullName = formatFullName(user);
  // "Loading…" distinguishes an in-flight GET from a failed one ("—").
  const roleLabel = isLoading && !user.role ? 'Loading…' : displayValue(user.role);
  // Route-driven active state; "Overview" matches the /admin root exactly
  const pathname = usePathname();
  const activeId =
    NAV_ITEMS.find(
      (item) => (item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)),
    )?.id ?? 'overview';

  return (
    <aside
      className={`flex h-[100dvh] shrink-0 flex-col border-r border-line-pill bg-surface-card py-7 transition-transform duration-300 lg:transition-[width] fixed inset-y-0 left-0 z-40 w-[264px] px-5 ${open ? 'translate-x-0' : 'translate-x-[-100%]'} lg:relative lg:z-auto lg:translate-x-0 ${expanded ? 'lg:w-[264px] lg:px-5' : 'lg:w-[76px] lg:items-center lg:px-3'}`}
    >
      {/* Collapse / expand toggle — desktop only */}
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        aria-expanded={expanded}
        className="absolute -right-3 top-9 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-line-pill bg-surface-card text-ink-tertiary shadow-sm transition-colors hover:text-ink-primary lg:flex"
      >
        <ChevronIcon
          className={`h-3.5 w-3.5 transition-transform duration-300 ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Logo pinned to top — mobile header row with close button; desktop keeps centered logo */}
      <div className="flex w-full items-center justify-between lg:justify-center">
        <BrandLogo
          tone={isDark ? 'light' : 'dark'}
          showTagline={false}
          compact={!expanded}
          className={expanded ? 'lg:self-start' : ''}
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-tertiary transition-colors hover:bg-surface-hover hover:text-ink-primary lg:hidden"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation — its own scroll region: the drawer is a fixed-height column,
          so a viewport too short for all 8 items must scroll here rather than push
          the profile footer past the bottom edge. `min-h-0` drops the flex item's
          content-based minimum (which `overflow-y-auto` already zeroes on its own
          — see the same pattern on <main> in app/admin/layout.tsx). */}
      <nav
        className={`mt-12 flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto ${expanded ? 'w-full' : 'w-auto'}`}
        aria-label="Main navigation"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === activeId;
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onClose}
              aria-current={isActive ? 'page' : undefined}
              title={expanded ? undefined : item.label}
              className={`flex items-center rounded-xl py-2.5 text-sm font-medium transition-colors gap-3 px-3.5 ${
                expanded ? '' : 'lg:justify-center lg:px-0'
              } ${
                isActive
                  ? 'bg-[linear-gradient(90deg,#1F083B_0%,#5B21B6_100%)] text-white'
                  : 'text-ink-secondary hover:bg-surface-hover hover:text-ink-primary'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className={expanded ? '' : 'lg:hidden'}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User profile pinned to bottom — the full gradient card is the EXPANDED
          treatment only. When collapsed, the standalone avatar below takes its
          place. This must be a flat `hidden`, never `hidden lg:flex`: the
          collapse toggle (line ~86) is `lg:flex`-only, so `expanded === false`
          only ever happens at `lg`+, where `lg:flex` would re-show this card and
          render both avatars stacked. */}
      <div className={`flex w-full items-center gap-3 rounded-2xl bg-[linear-gradient(90deg,#1F083B_0%,#4C1D95_100%)] p-3 ${expanded ? 'flex' : 'hidden'}`}>
        <Image
          src={AVATAR}
          alt={fullName}
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold text-white">{fullName}</span>
          <span className="truncate text-xs text-white/70">{roleLabel}</span>
        </div>
      </div>
      {!expanded && (
        <Image
          src={AVATAR}
          alt={fullName}
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 rounded-xl object-cover hidden lg:block"
        />
      )}
    </aside>
  );
}