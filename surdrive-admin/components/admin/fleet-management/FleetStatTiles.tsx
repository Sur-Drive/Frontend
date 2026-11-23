import { FleetIcon } from '@/components/ui/icons/FleetIcon';
import type { FleetStats } from '@/types';

type FleetStatVariant = 'total' | 'active' | 'pending' | 'suspended';

const VARIANT_STYLES: Record<
  FleetStatVariant,
  { iconWrap: string }
> = {
  total: { iconWrap: 'bg-status-info-bg text-status-info-text' },
  active: { iconWrap: 'bg-chip-teal-bg text-chip-teal-text' },
  pending: { iconWrap: 'bg-status-warning-bg text-[#F0B429]' },
  suspended: { iconWrap: 'bg-status-danger-bg text-status-danger-text' },
};

const STAT_VARIANTS: { id: FleetStatVariant; label: string }[] = [
  { id: 'total', label: 'Total Fleet' },
  { id: 'active', label: 'Active' },
  { id: 'pending', label: 'Pending' },
  { id: 'suspended', label: 'Suspended' },
];

type FleetStatTilesProps = {
  /** Aggregated counts straight from the /admin/fleets API response. */
  stats: FleetStats;
};

/**
 * Stat tiles. Counts come from the server's `stats` object rather than being
 * computed from the client-side list.
 */
export function FleetStatTiles({ stats }: FleetStatTilesProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {STAT_VARIANTS.map((stat) => {
        const styles = VARIANT_STYLES[stat.id];
        return (
          <div
            key={stat.id}
            className="flex items-center gap-3 rounded-2xl border border-line-card bg-surface-card p-5"
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.iconWrap}`}
            >
              <FleetIcon className="h-5 w-5" />
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