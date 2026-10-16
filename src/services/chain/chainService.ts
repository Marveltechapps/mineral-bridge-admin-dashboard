import { apiRequestOrDemo } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import type { ChainEvent } from '@/types/chain';
import { EVENTS } from './chainData';

export function getChainEvents(signal?: AbortSignal): Promise<ChainEvent[]> {
  return apiRequestOrDemo(ENDPOINTS.chain.events, EVENTS, { signal });
}
