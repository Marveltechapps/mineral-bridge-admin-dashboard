import { apiRequest } from '../../lib/apiClient';
import type { SampleItem } from '../../types/sample';

export function getSamples(signal?: AbortSignal): Promise<SampleItem[]> {
  return apiRequest<SampleItem[]>('/samples', { signal });
}
