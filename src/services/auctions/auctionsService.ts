import { apiRequestOrDemo } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import type { LiveAuction } from '@/types/auctions';
import { LIVE } from './auctionsData';

export function getLiveAuctions(signal?: AbortSignal): Promise<LiveAuction[]> {
  return apiRequestOrDemo(ENDPOINTS.auctions.list, LIVE, { signal });
}
