import { apiRequestOrDemo } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import type { Listing } from '@/types/listings';
import { LISTINGS } from './listingsData';

export function getListings(signal?: AbortSignal): Promise<Listing[]> {
  return apiRequestOrDemo(ENDPOINTS.listings.list, LISTINGS, { signal });
}
