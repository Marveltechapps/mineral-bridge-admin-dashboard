import { apiRequestOrDemo } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import type { Lot } from '@/types/vault';
import { LOTS } from './vaultData';

export function getLots(signal?: AbortSignal): Promise<Lot[]> {
  return apiRequestOrDemo(ENDPOINTS.vault.lots, LOTS, { signal });
}
