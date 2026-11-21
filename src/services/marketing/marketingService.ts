import { isDemoMode } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import { fetchAllPages, formatDay, textOf } from '@/lib/wire';

export interface BannerRow {
  id: string;
  title: string;
  slot: string;
  range: string;
  active: boolean;
  kind: string;
  link: string;
}

const SLOT: Record<string, string> = {
  homepage_hero: 'Homepage hero banner',
  homepage_secondary: 'Homepage secondary banner',
  in_app_promo: 'In-app promo card',
  category_miners: 'Category imagery — miners',
  category_buyers: 'Category imagery — buyers',
  email_strip: 'Email + homepage strip',
};

const KIND: Record<string, string> = { hero: 'Hero', secondary: 'Secondary', promo_card: 'Promo card', category: 'Category', email: 'Email' };

export async function getBanners(signal?: AbortSignal): Promise<BannerRow[]> {
  const rows = await fetchAllPages<Record<string, unknown>>(ENDPOINTS.marketing.banners, signal);
  return rows.map((row) => ({
    id: textOf(row.id),
    title: textOf(row.title),
    slot: SLOT[textOf(row.placement)] ?? textOf(row.placement),
    range: [formatDay(row.activeFrom), formatDay(row.activeUntil) || 'open'].filter(Boolean).join(' — '),
    active: Boolean(row.active),
    kind: KIND[textOf(row.kind)] ?? textOf(row.kind),
    link: textOf(row.linkTarget, '/'),
  }));
}

export { isDemoMode };
