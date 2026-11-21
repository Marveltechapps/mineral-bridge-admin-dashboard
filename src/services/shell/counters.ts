import { apiRequest } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import { asRecord } from '@/lib/wire';
import type { ModuleId } from '@/constants/nav';

/** Sidebar modules that show a count. The number is the operational queue, not a lifetime total. */
export type BadgeId = 'orders' | 'listings' | 'pricing' | 'auctions' | 'lc' | 'collab' | 'verification' | 'disputes' | 'support';

/**
 * Design-prototype badges for screens that are not loaded from the live console.
 * Live mode must never read these.
 */
export const DEMO_BADGES: Partial<Record<ModuleId, string>> = {
  orders: '184',
  listings: '9',
  pricing: '6',
  auctions: '7',
  lc: '4',
  collab: '23',
  verification: '27',
  disputes: '5',
  support: '12',
};

export type NavBadges = Partial<Record<BadgeId, number>>;

function countOf(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/**
 * Maps `GET /dashboard/counters`.
 *
 * A missing object means the staff role cannot view that module, so the badge
 * is omitted. A present numeric field is shown even when it is zero. A missing
 * or non-numeric field is omitted rather than treated as zero.
 *
 * Auction badge is `auctions.live` (live and paused). Upcoming and ended counts
 * stay on the auction tabs.
 * Verification badge is `verification.kycQueue`. Expiring documents are a
 * separate field and are not added in.
 */
export function badgesFromCounters(body: unknown): NavBadges {
  const row = asRecord(body) ?? {};
  const badges: NavBadges = {};
  const take = (id: BadgeId, value: unknown) => {
    const count = countOf(value);
    if (count !== undefined) badges[id] = count;
  };
  take('orders', asRecord(row.orders)?.active);
  take('listings', asRecord(row.listings)?.live);
  take('pricing', asRecord(row.pricing)?.offersPending);
  take('auctions', asRecord(row.auctions)?.live);
  take('lc', asRecord(row.lc)?.attention);
  take('collab', asRecord(row.collab)?.active);
  take('verification', asRecord(row.verification)?.kycQueue);
  take('disputes', asRecord(row.disputes)?.open);
  take('support', asRecord(row.support)?.openTickets);
  return badges;
}

export function loadCounters(signal?: AbortSignal): Promise<NavBadges> {
  return apiRequest<unknown>(ENDPOINTS.shell.counters, { signal }).then(badgesFromCounters);
}

const listeners = new Set<() => void>();

/** Asks every mounted sidebar to reload counters after a write. */
export function refreshCounters(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeCounters(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
