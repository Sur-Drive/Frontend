import Link from 'next/link';
import { ArrowRightIcon } from '@/components/ui/icons/ArrowRightIcon';
import { FleetIcon } from '@/components/ui/icons/FleetIcon';
import { SirenIcon } from '@/components/ui/icons/SirenIcon';
import { UsersIcon } from '@/components/ui/icons/UsersIcon';
import { WalletIcon } from '@/components/ui/icons/WalletIcon';

export type StatCardVariant = 'revenue' | 'users' | 'fleets' | 'alerts';

// Destination route for each card's details link (matches Sidebar NAV_ITEMS hrefs).
const VARIANT_HREFS: Record<StatCardVariant, string> = {
  revenue: '/admin/analytics',
  users: '/admin/user-management',
  fleets: '/admin/fleet-management',
  alerts: '/admin/sos-monitor',
};

const VARIANT_STYLES: Record<
  StatCardVariant,
  { card: string; iconWrap: string; Icon: typeof UsersIcon; iconClass: string }
> = {
  revenue: {
    card: 'bg-[linear-gradient(135deg,#1F083B_0%,#3B0A63_55%,#5B21B6_100%)] border-transparent',
    iconWrap: 'bg-white/15 text-white',
    Icon: WalletIcon,
    iconClass: 'h-5 w-5',
  },
  users: {
    card: 'bg-surface-card border-line-card',
    iconWrap: 'bg-status-info-bg text-status-info-text',
    Icon: UsersIcon,
    iconClass: 'h-5 w-5',
  },
  fleets: {
    card: 'bg-surface-card border-line-card',
    iconWrap: 'bg-[#E6F7F4] text-[#14B8A6]',
    Icon: FleetIcon,
    iconClass: 'h-5 w-5',
  },
  alerts: {
    card: 'bg-surface-card border-line-card',
    iconWrap: 'bg-status-warning-bg text-[#F0B429]',
    Icon: SirenIcon,
    iconClass: 'h-5 w-5',
  },
};

type StatCardProps = {
  label: string;
  description: string;
  value: string;
  change: number;
  variant: StatCardVariant;
};

export function StatCard({ label, description, value, change, variant }: StatCardProps) {
  const styles = VARIANT_STYLES[variant];
  const { Icon } = styles;
  const isRevenue = variant === 'revenue';
  const changeSign = change >= 0 ? '+' : '';

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border ${styles.card} ${
        isRevenue ? 'text-white' : 'text-ink-primary'
      }`}
    >
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.iconWrap}`}
          >
            <Icon className={styles.iconClass} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">{label}</p>
            <p className={`text-xs ${isRevenue ? 'text-white/70' : 'text-ink-tertiary'}`}>
              {description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold tracking-tight">{value}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              isRevenue ? 'bg-white/15 text-white' : 'bg-status-success-bg text-status-success-text'
            }`}
          >
            {changeSign}
            {change}%
          </span>
        </div>
      </div>
      <Link
        href={VARIANT_HREFS[variant]}
        className={`flex items-center justify-between border-t px-5 py-3 text-sm font-medium transition-colors ${
          isRevenue
            ? 'border-white/15 text-white hover:bg-white/5'
            : 'border-line-card text-ink-secondary hover:bg-surface-hover'
        }`}
      >
        {isRevenue ? 'See details' : 'View Details'}
        <ArrowRightIcon className="h-4 w-4" />
      </Link>
    </div>
  );
}
