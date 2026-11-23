import { BarChart } from './BarChart';

type UsersByCityChartProps = {
  labels: string[];
  data: number[];
};

export function UsersByCityChart({ labels, data }: UsersByCityChartProps) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-line-card bg-surface-card p-6">
      <h2 className="text-base font-semibold text-ink-primary">Users by city</h2>

      <div className="mt-6 flex-1">
        <BarChart
          xLabels={labels}
          values={data}
        />
      </div>
    </div>
  );
}
