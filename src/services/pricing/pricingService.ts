import { apiRequestOrDemo } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import type { Offer, Rate } from '@/types/pricing';
import { OFFERS, RATES } from './pricingData';

export function getRates(signal?: AbortSignal): Promise<Rate[]> {
  return apiRequestOrDemo(ENDPOINTS.pricing.rates, RATES, { signal });
}

export function getOffers(signal?: AbortSignal): Promise<Offer[]> {
  return apiRequestOrDemo(ENDPOINTS.pricing.offers, OFFERS, { signal });
}
