/**
 * Computes a "nice" y-axis maximum with headroom: rounds the per-step value up
 * to a clean 1 / 2 / 2.5 / 5 / 10 × 10^n step, then multiplies by the number
 * of steps. Shared by the Overview GrowthChart and the Analytics line/bar
 * charts so every chart scales dynamically from real data.
 */
export function niceMax(dataMax: number, stepCount = 4): number {
  const rawStep = dataMax / stepCount;
  if (rawStep <= 0) return stepCount;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const nice =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return nice * magnitude * stepCount;
}

/** Formats a y-axis step value for display, e.g. 2500 -> '2,500'. */
export function formatYStep(value: number): string {
  return value.toLocaleString('en-US');
}
