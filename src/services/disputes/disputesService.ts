import { apiRequestOrDemo } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import type { Dispute } from '@/types/disputes';
import { DISPUTES } from './disputesData';

export function getDisputes(signal?: AbortSignal): Promise<Dispute[]> {
  return apiRequestOrDemo(ENDPOINTS.disputes.list, DISPUTES, { signal });
}
