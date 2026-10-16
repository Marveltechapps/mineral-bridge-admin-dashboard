import { apiRequestOrDemo } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import type { Account } from '@/types/users';
import { ACCOUNTS, TIER_REQUESTS } from './usersData';

export function getAccounts(signal?: AbortSignal): Promise<Account[]> {
  return apiRequestOrDemo(ENDPOINTS.users.list, ACCOUNTS, { signal });
}

export function getTierRequests(signal?: AbortSignal): Promise<typeof TIER_REQUESTS> {
  return apiRequestOrDemo(ENDPOINTS.users.tierRequests, TIER_REQUESTS, { signal });
}
