import { apiRequest, isDemoMode } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import { asRecord, textOf } from '@/lib/wire';
import type { Course } from '@/types/academy';
import { ACADEMY_STATS, CATEGORIES, COMPLETION } from './academyData';

export async function getCourseCategories(signal?: AbortSignal): Promise<Array<{ category: string; courses: Course[] }>> {
  if (isDemoMode()) return CATEGORIES;
  const body = await apiRequest<{ data?: Array<Record<string, unknown>> }>(ENDPOINTS.academy.categories, { signal });
  return (body.data ?? []).map((group) => ({
    category: textOf(group.name),
    courses: (Array.isArray(group.courses) ? group.courses : []).map((item) => {
      const course = asRecord(item) ?? {};
      return {
        id: textOf(course.id),
        title: textOf(course.title),
        lessons: Number(course.lessonCount ?? 0),
        status: textOf(course.status) === 'published' ? 'Published' : 'Draft',
        certified: Boolean(course.certified),
      } satisfies Course;
    }),
  }));
}

export async function getAcademyAnalytics(signal?: AbortSignal): Promise<{ stats: typeof ACADEMY_STATS; completion: typeof COMPLETION }> {
  if (isDemoMode()) return { stats: ACADEMY_STATS, completion: COMPLETION };
  const body = await apiRequest<{ cards?: Array<Record<string, unknown>>; completion?: Array<Record<string, unknown>> }>(ENDPOINTS.academy.analytics, { signal });
  return {
    stats: (body.cards ?? []).map((card) => ({
      label: textOf(card.label).toUpperCase(),
      value: `${textOf(card.value)}${card.unit ? textOf(card.unit) : ''}`,
      sub: textOf(card.sub),
    })),
    completion: (body.completion ?? []).map((row) => {
      const byTier = asRecord(row.byTier) ?? {};
      return {
        title: textOf(row.title),
        rate: Number(row.ratePct ?? 0),
        tiers: [Number(byTier['1'] ?? 0), Number(byTier['2'] ?? 0), Number(byTier['3'] ?? 0)] as [number, number, number],
      };
    }),
  };
}
