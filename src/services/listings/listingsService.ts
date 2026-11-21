import { apiRequest, isDemoMode } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import { asRecord, fetchAllPages, formatDay, moneyLabel, qtyLabel, statusLabel, textOf, unitPriceLabel } from '@/lib/wire';
import type { Tone } from '@/constants/tones';
import type { Listing } from '@/types/listings';
import { LISTINGS, LISTING_STATS } from './listingsData';

const LISTING_TONE: Record<string, Tone> = { Live: 'green', Paused: 'amber', Scheduled: 'blue', 'Sold out': 'gray', Draft: 'navy', Ended: 'gray' };

function mapListing(raw: unknown): Listing {
  const row = asRecord(raw) ?? {};
  const status = statusLabel(row.status);
  return {
    id: textOf(row.id),
    lot: textOf(row.lotId),
    mineral: textOf(row.mineral),
    grade: textOf(row.grade),
    qtyTotal: qtyLabel(row.quantityTotal),
    qtyLeft: qtyLabel(row.quantityLeft),
    price: unitPriceLabel(row.askPrice),
    value: moneyLabel(row.listedValue),
    status: (LISTING_TONE[status] ? status : 'Draft') as Listing['status'],
    tone: LISTING_TONE[status] ?? 'gray',
    access: statusLabel(row.access),
    views: Number(row.views ?? 0),
    enquiries: Number(row.enquiries ?? 0),
    listed: formatDay(row.listedAt),
    featured: Boolean(row.featured),
  };
}

export async function getListing(id: string, signal?: AbortSignal): Promise<Listing & { priceFloor: string; minParcelLabel: string; description: string }> {
  const body = await apiRequest<unknown>(ENDPOINTS.listings.detail(id), { signal });
  const row = asRecord(body) ?? {};
  const parcel = asRecord(row.minParcel);
  const kind = textOf(parcel?.kind);
  return {
    ...mapListing(body),
    priceFloor: unitPriceLabel(row.priceFloor) || '—',
    minParcelLabel: parcel ? `${textOf(parcel.value)}${kind === 'percent' ? '% of listing' : ''}` : '—',
    description: textOf(row.description),
  };
}

export async function getListings(signal?: AbortSignal): Promise<Listing[]> {
  if (isDemoMode()) return LISTINGS;
  return (await fetchAllPages(ENDPOINTS.listings.list, signal)).map(mapListing);
}

export async function getListingStats(signal?: AbortSignal): Promise<typeof LISTING_STATS> {
  if (isDemoMode()) return LISTING_STATS;
  const body = await apiRequest<{ cards?: unknown[] }>(ENDPOINTS.listings.summary, { signal });
  return (body.cards ?? []).map((card) => {
    const row = asRecord(card) ?? {};
    const value = typeof row.value === 'number' ? String(row.value) : moneyLabel(row.value);
    return { label: textOf(row.label).toUpperCase(), value, sub: textOf(row.sub) || textOf(row.unit) };
  });
}
