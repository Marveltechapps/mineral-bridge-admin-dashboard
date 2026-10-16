import { apiRequestOrDemo } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import type { Negotiation } from '@/types/collab';
import { CONTRACTS, NEGOTIATIONS } from './collabData';

export function getNegotiations(signal?: AbortSignal): Promise<Negotiation[]> {
  return apiRequestOrDemo(ENDPOINTS.collab.negotiations, NEGOTIATIONS, { signal });
}

export function getContracts(signal?: AbortSignal): Promise<typeof CONTRACTS> {
  return apiRequestOrDemo(ENDPOINTS.collab.contracts, CONTRACTS, { signal });
}
