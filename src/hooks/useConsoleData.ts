import { useMemo } from 'react';
import { useConsole } from '@/store/consoleStore';
import { matchesQuery, sortRows, type SortFns } from '@/lib/collection';

/** Returns a matcher bound to the header search query. */
export function useQueryMatch() {
  const query = useConsole((s) => s.query);
  return useMemo(() => (fields: Array<string | number>) => matchesQuery(query, fields), [query]);
}

/** Applies the table's current sort column to rows. */
export function useSorted<T>(rows: T[], mod: string, fns: SortFns<T>): T[] {
  const sort = useConsole((s) => s.sorts[mod]);
  // fns are defined inline by callers; sorting is cheap at these sizes.
  return useMemo(() => sortRows(rows, sort, fns), [rows, sort]); // eslint-disable-line react-hooks/exhaustive-deps
}
