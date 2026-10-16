import { apiRequestOrDemo } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import type { LetterOfCredit } from '@/types/lc';
import { LCS } from './lcData';

export function getLettersOfCredit(signal?: AbortSignal): Promise<LetterOfCredit[]> {
  return apiRequestOrDemo(ENDPOINTS.lc.list, LCS, { signal });
}
