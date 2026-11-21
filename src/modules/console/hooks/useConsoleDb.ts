import { useQuery } from '@tanstack/react-query';
import { getConsoleDb } from '../../../services/console';

export const CONSOLE_DB_KEY = ['console', 'db'] as const;

/**
 * The console's working data set. Operators edit it in place (as the design does), so it never
 * goes stale, is never refetched behind their back, and is not structurally shared.
 */
export function useConsoleDb() {
  return useQuery({
    queryKey: CONSOLE_DB_KEY,
    queryFn: getConsoleDb,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
    structuralSharing: false,
  });
}
