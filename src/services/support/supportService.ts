import { apiRequestOrDemo } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import { CALLS, TICKETS } from './supportData';

export function getTickets(signal?: AbortSignal): Promise<typeof TICKETS> {
  return apiRequestOrDemo(ENDPOINTS.support.tickets, TICKETS, { signal });
}

export function getCalls(signal?: AbortSignal): Promise<typeof CALLS> {
  return apiRequestOrDemo(ENDPOINTS.support.calls, CALLS, { signal });
}
