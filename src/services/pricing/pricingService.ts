import { apiRequest, isDemoMode } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import { asRecord, fetchAllPages, formatDay, moneyLabel, partyName, qtyLabel, statusLabel, textOf, unitPriceLabel } from '@/lib/wire';
import type { Offer, Rate } from '@/types/pricing';
import { OFFERS, RATES } from './pricingData';

export async function getRates(signal?: AbortSignal): Promise<Rate[]> {
  if (isDemoMode()) return RATES;
  const rows = await fetchAllPages<Record<string, unknown>>(ENDPOINTS.pricing.rates, signal);
  return rows.map((row) => ({
    id: textOf(row.id),
    mineral: textOf(row.mineral),
    grade: textOf(row.grade),
    buy: unitPriceLabel(row.buy),
    sell: unitPriceLabel(row.sell),
    source: statusLabel(row.source) === 'Manual override' ? 'Manual override' : 'Market feed',
    updated: formatDay(row.updatedAt),
    trend: Number(row.trend24hPct ?? 0),
  }));
}

export async function getRateHistory(rateId: string, range: string, signal?: AbortSignal): Promise<number[]> {
  const body = await apiRequest<{ points?: Array<{ value?: number }> }>(`${ENDPOINTS.pricing.history(rateId)}?range=${encodeURIComponent(range)}&side=buy`, { signal });
  return (body.points ?? []).map((point) => Number(point.value ?? 0));
}

export async function getOffers(signal?: AbortSignal): Promise<Offer[]> {
  if (isDemoMode()) return OFFERS;
  const rows = await fetchAllPages<Record<string, unknown>>(`${ENDPOINTS.pricing.offers}?status=pending`, signal);
  return rows.map((row) => {
    const assay = asRecord(row.assay);
    return {
      id: textOf(row.id),
      party: partyName(row.party),
      mineral: textOf(row.mineral),
      weights: [qtyLabel(row.declared), qtyLabel(row.assayed)].filter(Boolean).join(' · '),
      assay: textOf(assay?.grade) || textOf(assay?.certificateNo),
      rate: unitPriceLabel(row.rateApplied),
      suggested: moneyLabel(row.suggested),
      note: textOf(row.note),
    };
  });
}
