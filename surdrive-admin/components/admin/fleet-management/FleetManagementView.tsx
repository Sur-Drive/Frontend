'use client';

import { useCallback, useEffect, useState } from 'react';
import { FleetStatTiles } from './FleetStatTiles';
import { FleetsPanel } from './FleetsPanel';
import { getFleets } from '@/lib/fleets';
import { useFleetStore } from './FleetStoreProvider';
import { useTableFilters } from '@/lib/useTableFilters';
import type { FleetRecord } from './mockData';
import type {
  Fleet,
  FleetStats,
  FleetsPagination,
  FleetStatusFilter,
} from '@/types';

const FLEETS_PER_PAGE = 10;
const EMPTY_STATS: FleetStats = {
  total: 0,
  active: 0,
  pending: 0,
  suspended: 0,
  expired: 0,
};
const EMPTY_PAGINATION: FleetsPagination = {
  page: 1,
  limit: FLEETS_PER_PAGE,
  total: 0,
  totalPages: 1,
};

/**
 * Client wrapper owning the server-driven state for the Fleet Management list.
 * Status tab, search, and pagination all refetch from the backend via getFleets().
 * Filter state lives in useTableFilters and is synced to the URL so filters
 * survive a refresh and can be shared.
 */
export function FleetManagementView({
  initial,
}: {
  initial?: { status?: string; search?: string; page?: string };
}) {
  const { setFleets } = useFleetStore();
  const {
    filters: filterValues,
    page,
    debouncedSearch,
    activeCount,
    setFilter,
    setPage,
    clearAll,
  } = useTableFilters({
    presets: [
      {
        param: 'status',
        label: 'Status',
        defaultValue: 'all',
        options: ['all', 'pending', 'suspended', 'active', 'expired'],
      },
    ],
    search: { param: 'search', debounceMs: 300 },
    page: { param: 'page', default: 1 },
    initial,
  });

  const [fleets, setLocalFleets] = useState<Fleet[]>([]);
  const [stats, setStats] = useState<FleetStats>(EMPTY_STATS);
  const [pagination, setPagination] = useState<FleetsPagination>(EMPTY_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch the page whenever the active tab, search, or page changes.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getFleets({
          page,
          limit: FLEETS_PER_PAGE,
          status: filterValues.status === 'all' ? undefined : filterValues.status,
          search: debouncedSearch || undefined,
        });
        if (cancelled) return;
        setLocalFleets(data.fleets);
        setStats(data.stats);
        setPagination(data.pagination);
        // Feed the fetched (current page) array into the shared store so the
        // Fleet Details page can resolve fleets present in the list.
        // NOTE: the store is still typed to the legacy mock `FleetRecord` until
        // FleetDetailsView is migrated — hence the shape cast.
        setFleets(() => data.fleets as unknown as FleetRecord[]);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load fleets.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [filterValues.status, debouncedSearch, page, refreshKey, setFleets]);

  const handleFleetsChange = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <div className="flex flex-col gap-6">
      <FleetStatTiles stats={stats} />
      <FleetsPanel
        fleets={fleets}
        pagination={pagination}
        loading={loading}
        error={error}
        status={filterValues.status as FleetStatusFilter}
        query={filterValues.search ?? ''}
        activeCount={activeCount}
        onClearAll={clearAll}
        onFilterChange={setFilter}
        onPageChange={setPage}
        onFleetsChange={handleFleetsChange}
      />
    </div>
  );
}