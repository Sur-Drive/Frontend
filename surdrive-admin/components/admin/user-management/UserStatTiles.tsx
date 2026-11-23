import { UsersIcon } from '@/components/ui/icons/UsersIcon';
import { SirenIcon } from '@/components/ui/icons/SirenIcon';
import { UserIcon } from '@/components/ui/icons/UserIcon';
import { ShieldIcon } from '@/components/ui/icons/ShieldIcon';
import type { DriverStats } from '@/types';

type UserStatVariant = 'total' | 'active' | 'pending' | 'inactive';

const VARIANT_STYLES: Record<
  UserStatVariant,
  { iconWrap: string; Icon: typeof UsersIcon }
> = {
  total: { iconWrap: 'bg-status-info-bg text-status-info-text', Icon: UsersIcon },
  active: { iconWrap: 'bg-chip-teal-bg text-chip-teal-text', Icon: UserIcon },
  pending: { iconWrap: 'bg-status-warning-bg text-chip-amber-text', Icon: SirenIcon },
  inactive: { iconWrap: 'bg-status-danger-bg text-status-danger-text', Icon: ShieldIcon },
};

const STAT_VARIANTS: { id: UserStatVariant; label: string }[] = [
  { id: 'total', label: 'Total users' },
  { id: 'active', label: 'Active' },
  { id: 'pending', label: 'Pending' },
  { id: 'inactive', label: 'Suspended' },
];

type UserStatTilesProps = {
  /** Aggregated counts straight from the /admin/drivers API response. */
  stats: DriverStats;
};

/**
 * Stat tiles. Counts come from the server's `stats` object rather than being
 * computed from the client-side list.
 */
export function UserStatTiles({ stats }: UserStatTilesProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {STAT_VARIANTS.map((stat) => {
        const styles = VARIANT_STYLES[stat.id];
        const { Icon } = styles;
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
              <p className="text-xl font-bold text-ink-primary">{stats[stat.id]}</p>
              <p className="text-xs text-ink-tertiary">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}