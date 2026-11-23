export function formatNaira(amount: number): string {
  return `\u20A6${amount.toLocaleString('en-NG')}`;
}

/** Formats an ISO date string to 'Oct 5, 2026'. */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
