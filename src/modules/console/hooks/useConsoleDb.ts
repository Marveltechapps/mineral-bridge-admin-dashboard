import { useQuery } from '@tanstack/react-query';
import { getConsoleDb } from '../../../services/console';

export const CONSOLE_DB_KEY = ['console', 'db'] as const;

/**
 * Console working set. Live mode polls so sell-request / order changes from customers
 * appear without a manual refresh (BUG-015). Demo/offline mode stays static.
 */
export function useConsoleDb() {
  return useQuery({
    queryKey: CONSOLE_DB_KEY,
    queryFn: getConsoleDb,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const db = query.state.data as { live?: boolean } | undefined;
      return db?.live ? 15_000 : false;
    },
    refetchIntervalInBackground: false,
    structuralSharing: false,
  });
}
