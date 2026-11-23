'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/admin/dashboard/PageHeader';
import { StatCard } from '@/components/admin/dashboard/StatCard';
import { HazardMix } from '@/components/admin/dashboard/HazardMix';
import { FleetRevenueChart } from '@/components/admin/analytics/FleetRevenueChart';
import { HazardsSosByCityChart } from '@/components/admin/analytics/HazardsSosByCityChart';
import { UsersByCityChart } from '@/components/admin/analytics/UsersByCityChart';
import { ShieldIcon } from '@/components/ui/icons/ShieldIcon';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { getDashboardAnalytics } from '@/lib/analytics';
import { formatNaira } from '@/lib/formatters';
import type { DashboardAnalytics } from '@/types';

export default function AnalyticsPage() {
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
          setError(err instanceof Error ? err.message : 'Failed to load analytics data');
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
      <div className="flex items-center justify-center py-20 text-sm text-[#6B7280]">
        Loading analytics…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <AlertBanner
          icon={<ShieldIcon className="h-5 w-5" />}
          className="border-[#FEECEB] bg-[#FEECEB] text-[#B42318]"
        >
          {error ?? 'Failed to load analytics data'}
        </AlertBanner>
      </div>
    );
  }

  const {
    summary,
    hazardMix,
    revenueVsFleetChart,
    hazardSosVsCity,
    usersByCity,
  } = data;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Analytics"
        subtitle="Cross-platform performance & geography"
      />

      {/* Same stat row as the Overview dashboard */}
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
          <FleetRevenueChart
            labels={revenueVsFleetChart.labels}
            fleets={revenueVsFleetChart.fleets}
            revenue={revenueVsFleetChart.revenue}
          />
        </div>
        <div className="lg:col-span-2">
          <HazardMix
            labels={hazardMix.labels}
            data={hazardMix.data}
            colors={hazardMix.colors}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <HazardsSosByCityChart
          labels={hazardSosVsCity.labels}
          hazards={hazardSosVsCity.hazards}
          sos={hazardSosVsCity.sos}
        />
        <UsersByCityChart labels={usersByCity.labels} data={usersByCity.data} />
      </div>
    </div>
  );
}
