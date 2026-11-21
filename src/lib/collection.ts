import type { SortState } from '@/types/console';

/** Case-insensitive "any field contains the query" match (design's match()). */
export function matchesQuery(query: string, fields: Array<string | number>): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.join(' ').toLowerCase().includes(q);
}

export type SortFns<T> = Record<string, (row: T) => string | number>;

/** Stable sort by the active column (design's srt()). */
export function sortRows<T>(rows: T[], sort: SortState | undefined, fns: SortFns<T>): T[] {
  if (!sort?.k || !fns[sort.k]) return rows;
  const f = fns[sort.k];
  const dir = sort.d;
  return rows.slice().sort((a, b) => {
    const x = f(a);
    const y = f(b);
    return (x > y ? 1 : x < y ? -1 : 0) * dir;
  });
}

/** Parses "$1,174,000" / "18.4 kg" style strings into a number. */
export function numeric(value: string): number {
  return parseFloat(String(value).replace(/[^0-9.]/g, ''));
}

export function initialsOf(name: string, max = 2): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, max)
    .toUpperCase();
}

/** Formats money like the design: $X.XXM above a million, otherwise $X,XXX. */
export function money(n: number): string {
  return n >= 1000000 ? `$${(n / 1000000).toFixed(2)}M` : `$${Math.round(n).toLocaleString('en-US')}`;
}

export function usd(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}
