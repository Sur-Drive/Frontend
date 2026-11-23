import { DollarIcon } from '@/components/ui/icons/DollarIcon';
import { CreditCardIcon } from '@/components/ui/icons/CreditCardIcon';
import { UserIcon } from '@/components/ui/icons/UserIcon';
import { XCircleIcon } from '@/components/ui/icons/XCircleIcon';
import { formatNaira } from '@/lib/formatters';
import type { SubscriptionStats } from '@/types';

type StatVariant = 'revenue' | 'active' | 'free' | 'expired';

const VARIANT_STYLES: Record<StatVariant, { iconWrap: string }> = {
  revenue: { iconWrap: 'bg-status-info-bg text-status-info-text' },
  active: { iconWrap: 'bg-chip-teal-bg text-chip-teal-text' },
  free: { iconWrap: 'bg-status-warning-bg text-chip-amber-text' },
  expired: { iconWrap: 'bg-status-danger-bg text-status-danger-text' },
};

const ICONS: Record<StatVariant, typeof DollarIcon> = {
  revenue: DollarIcon,
  active: CreditCardIcon,
  free: UserIcon,
  expired: XCircleIcon,
};

type SubscriptionStatTilesProps = {
  stats: SubscriptionStats | null;
};

export function SubscriptionStatTiles({ stats }: SubscriptionStatTilesProps) {
  const statsList: { id: StatVariant; label: string; value: string }[] = [
    { id: 'revenue', label: 'Total Revenue', value: stats ? formatNaira(stats.totalRevenue) : '—' },
    { id: 'active', label: 'Total Active Subscriptions', value: stats ? String(stats.activeSubscriptions) : '—' },
    { id: 'free', label: 'Free Users', value: stats ? String(stats.freeUsers) : '—' },
    { id: 'expired', label: 'Expired/Cancelled', value: stats ? String(stats.expiredOrCancelled) : '—' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statsList.map((stat) => {
        const styles = VARIANT_STYLES[stat.id];
        const Icon = ICONS[stat.id];
        return (
          <div
            key={stat.id}
            className="flex items-center gap-3 rounded-2xl border border-line-card bg-surface-card p-5"
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.iconWrap}`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xl font-bold text-ink-primary">{stat.value}</p>
              <p className="text-xs text-ink-tertiary">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
