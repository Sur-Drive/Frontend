import { LineChart } from './LineChart';
import type { LineSeries } from '@/types';

type FleetRevenueChartProps = {
  labels: string[];
  fleets: number[];
  revenue: number[];
};

export function FleetRevenueChart({ labels, fleets, revenue }: FleetRevenueChartProps) {
  // TODO: series colors are design constants; move to a shared palette if reused
  const fleetSeries: LineSeries = {
    id: 'fleet',
    label: 'Fleet',
    color: '#7C3AED',
    fillFrom: '#A78BFA',
    values: fleets,
  };
  const revenueSeries: LineSeries = {
    id: 'revenue',
    label: 'Revenue',
    color: '#22C55E',
    fillFrom: '#4ADE80',
    values: revenue,
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-line-card bg-surface-card p-6">
      <div className="flex items-start justify-between">
        <h2 className="text-base font-semibold text-ink-primary">Fleet vs revenue</h2>
      </div>

      <div className="mt-6 flex-1">
        <LineChart
          chartId="fleet-revenue"
          xLabels={labels}
          series={[fleetSeries, revenueSeries]}
          showDots={false}
        />
      </div>
    </div>
  );
}
