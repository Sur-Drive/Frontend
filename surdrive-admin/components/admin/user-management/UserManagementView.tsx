'use client';

import { useCallback, useEffect, useState } from 'react';
import { UserStatTiles } from './UserStatTiles';
import { UsersPanel } from './UsersPanel';
import { getDrivers } from '@/lib/drivers';
import { useTableFilters } from '@/lib/useTableFilters';
import type {
  Driver,
  DriverStats,
  DriversPagination,
  UserStatusFilter,
} from '@/types';

const USERS_PER_PAGE = 10;
const EMPTY_STATS: DriverStats = {
  total: 0,
  active: 0,
  pending: 0,
  inactive: 0,
  suspended: 0,
};
const EMPTY_PAGINATION: DriversPagination = {
  page: 1,
  limit: USERS_PER_PAGE,
  total: 0,
  totalPages: 1,
};

/**
 * Client wrapper owning the server-driven state for the User Management screen.
 * Status tab, search, and pagination all refetch from the backend via getDrivers().
 * Filter state lives in useTableFilters and is synced to the URL so filters
 * survive a refresh and can be shared.
 */
export function UserManagementView({
  initial,
}: {
  initial?: { status?: string; search?: string; page?: string };
}) {
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
        options: ['all', 'pending', 'inactive', 'active'],
      },
    ],
    search: { param: 'search', debounceMs: 300 },
    page: { param: 'page', default: 1 },
    initial,
  });

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [stats, setStats] = useState<DriverStats>(EMPTY_STATS);
  const [pagination, setPagination] = useState<DriversPagination>(EMPTY_PAGINATION);
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
        const data = await getDrivers({
          page,
          limit: USERS_PER_PAGE,
          status: filterValues.status === 'all' ? undefined : filterValues.status,
          search: debouncedSearch || undefined,
        });
        if (cancelled) return;
        setDrivers(data.drivers);
        setStats(data.stats);
        setPagination(data.pagination);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load drivers.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [filterValues.status, debouncedSearch, page, refreshKey]);

  const handleUsersChange = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <div className="flex flex-col gap-6">
      <UserStatTiles stats={stats} />
      <UsersPanel
        drivers={drivers}
        pagination={pagination}
        loading={loading}
        error={error}
        status={filterValues.status as UserStatusFilter}
        query={filterValues.search ?? ''}
        activeCount={activeCount}
        onClearAll={clearAll}
        onFilterChange={setFilter}
        onPageChange={setPage}
        onUsersChange={handleUsersChange}
      />
    </div>
  );
}