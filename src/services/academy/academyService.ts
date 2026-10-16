import { apiRequestOrDemo } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import { CATEGORIES } from './academyData';

export function getCourseCategories(signal?: AbortSignal): Promise<typeof CATEGORIES> {
  return apiRequestOrDemo(ENDPOINTS.academy.courses, CATEGORIES, { signal });
}
