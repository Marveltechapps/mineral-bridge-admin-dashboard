import { QueryClient } from '@tanstack/react-query';
import { ApiError, CLIENT_ERROR_CODES } from '@/lib/apiClient';

/** Transport failures: nothing reached the server, so trying again can work. */
const RETRYABLE_CLIENT_CODES: readonly string[] = [
  CLIENT_ERROR_CODES.network,
  CLIENT_ERROR_CODES.timeout,
];

/**
 * One cache policy for the whole console, set here rather than per hook.
 *
 * Left at the defaults, every query would retry three times and each hook author
 * would have to remember which failures are worth retrying. For an operations
 * console that is actively wrong: a desk whose session has expired would fire
 * four requests before the sign-in screen appeared, and a rejected action would
 * be replayed against a backend that had already refused it.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /** Desk data is read repeatedly while navigating; 30s keeps it stable. */
      staleTime: 30_000,
      retry: (failureCount, error) => {
        if (failureCount >= 2) return false;
        // Only a server-side fault or a transport failure is worth repeating.
        // 401 (session over), 403 (role not permitted), 404, 409 (already
        // advanced) and 422 (invalid input) answer the same way every time, and
        // demo mode and a malformed body are not transient either.
        if (error instanceof ApiError) {
          return error.status >= 500 || RETRYABLE_CLIENT_CODES.includes(error.code);
        }
        return true;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      // A desk action that failed is never replayed automatically: advancing an
      // order or releasing a payment twice is worse than reporting the failure.
      retry: false,
    },
  },
});
