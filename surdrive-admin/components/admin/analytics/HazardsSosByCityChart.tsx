import { LineChart } from './LineChart';
import type { LineSeries } from '@/types';

type HazardsSosByCityChartProps = {
  labels: string[];
  hazards: number[];
  sos: number[];
};

export function HazardsSosByCityChart({ labels, hazards, sos }: HazardsSosByCityChartProps) {
  const hazardsSeries: LineSeries = {
    id: 'hazards',
    label: 'Hazards',
    color: '#2E90FA',
    fillFrom: '#84CAFF',
    values: hazards,
  };
  const sosSeries: LineSeries = {
    id: 'sos',
    label: 'SOS',
    color: '#F04438',
    fillFrom: '#FDA29B',
    values: sos,
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-line-card bg-surface-card p-6">
      <h2 className="text-base font-semibold text-ink-primary">Hazards vs SOS by city</h2>

      <div className="mt-6 flex-1">
        <LineChart
          chartId="hazards-sos-city"
          xLabels={labels}
          series={[hazardsSeries, sosSeries]}
        />
      </div>

      {/* Series legend (lowercase per the design) */}
      <div className="mt-3 flex items-center justify-center gap-6">
        {[
          { ...hazardsSeries, legendLabel: 'hazards' },
          { ...sosSeries, legendLabel: 'sos' },
        ].map((s) => (
          <span key={s.id} className="flex items-center gap-1.5 text-[11px] text-ink-secondary">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.legendLabel}
          </span>
        ))}
      </div>
    </div>
  );
}
