'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/admin/dashboard/PageHeader';
import { StatCard } from '@/components/admin/dashboard/StatCard';
import { GrowthChart } from '@/components/admin/dashboard/GrowthChart';
import { HazardMix } from '@/components/admin/dashboard/HazardMix';
import { RecentActivities } from '@/components/admin/dashboard/RecentActivities';
import { ShieldIcon } from '@/components/ui/icons/ShieldIcon';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { getDashboardAnalytics } from '@/lib/analytics';
import { formatNaira } from '@/lib/formatters';
import type { DashboardAnalytics } from '@/types';

export function DashboardView({
  initial,
}: {
  initial?: { search?: string; status?: string };
}) {
  const [data, setData] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const result = await getDashboardAnalytics();
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-ink-tertiary">
        Loading dashboard…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <AlertBanner
          icon={<ShieldIcon className="h-5 w-5" />}
          className="border-status-danger-bg bg-status-danger-bg text-[#B42318]"
        >
          {error ?? 'Failed to load dashboard data'}
        </AlertBanner>
      </div>
    );
  }

  const { summary, userGrowthChart, hazardMix, recentActivity } = data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Overview" subtitle="Here is the summary of overall data" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Platform Revenue"
          // [sic] — typo retained from the source copy; TODO: confirm exact label
          description="Total revenue the platform generate"
          value={formatNaira(summary.totalRevenue)}
          change={summary.revenueChange}
          variant="revenue"
        />
        <StatCard
          label="Total users"
          description="All users on the platform"
          value={summary.totalUsers.toLocaleString('en-NG')}
          change={summary.usersChange}
          variant="users"
        />
        <StatCard
          label="Total Fleets"
          // [sic] — typo retained from the source copy; TODO: confirm exact label
          description="All Fleet Manaager on the platform"
          value={summary.totalFleets.toLocaleString('en-NG')}
          change={summary.fleetsChange}
          variant="fleets"
        />
        <StatCard
          label="Daily Alerts"
          description="All alerts on the platform"
          value={summary.totalSosAlerts.toLocaleString('en-NG')}
          change={summary.sosChange}
          variant="alerts"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <GrowthChart labels={userGrowthChart.labels} data={userGrowthChart.data} />
        </div>
        <div className="lg:col-span-2">
          <HazardMix labels={hazardMix.labels} data={hazardMix.data} colors={hazardMix.colors} />
        </div>
      </div>

      <RecentActivities activities={recentActivity} initial={initial} />
    </div>
  );
}
