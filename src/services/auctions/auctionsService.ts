import { apiRequest, isDemoMode } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import { asRecord, fetchAllPages, formatDay, moneyLabel, partyName, qtyLabel, textOf, timeLeft } from '@/lib/wire';
import type { EndedAuction, LiveAuction } from '@/types/auctions';
import { ENDED, LIVE, UPCOMING } from './auctionsData';

export async function getLiveAuctions(signal?: AbortSignal): Promise<LiveAuction[]> {
  if (isDemoMode()) return LIVE;
  const rows = await fetchAllPages<Record<string, unknown>>(`${ENDPOINTS.auctions.list}?status=live`, signal);
  return rows.map((row) => ({
    id: textOf(row.id),
    mineral: textOf(row.mineral),
    lot: textOf(row.lotId),
    qty: qtyLabel(row.quantity),
    bid: moneyLabel(row.currentBid),
    bids: Number(row.bidCount ?? 0),
    left: timeLeft(row.endsAt),
    flagged: Boolean(row.flagged),
    leader: partyName(row.leader) || '—',
  }));
}

export async function getUpcomingAuctions(signal?: AbortSignal): Promise<typeof UPCOMING> {
  if (isDemoMode()) return UPCOMING;
  const rows = await fetchAllPages<Record<string, unknown>>(`${ENDPOINTS.auctions.list}?status=upcoming`, signal);
  return rows.map((row) => ({
    id: textOf(row.id),
    mineral: textOf(row.mineral),
    lot: textOf(row.lotId),
    qty: qtyLabel(row.quantity),
    start: moneyLabel(row.startingBid),
    reserve: moneyLabel(row.reserve),
    opens: formatDay(row.opensAt) ? `Opens ${formatDay(row.opensAt)}` : 'Opening time not set',
    access: textOf(row.access),
  }));
}

export async function getEndedAuctions(signal?: AbortSignal): Promise<EndedAuction[]> {
  if (isDemoMode()) return ENDED;
  const rows = await fetchAllPages<Record<string, unknown>>(`${ENDPOINTS.auctions.list}?status=ended`, signal);
  return rows.map((row) => {
    const met = textOf(row.outcome).includes('met') && !textOf(row.outcome).includes('not');
    return {
      id: textOf(row.id),
      mineral: textOf(row.mineral),
      final: moneyLabel(row.finalBid),
      reserve: moneyLabel(row.reserve),
      bids: Number(row.bidCount ?? 0),
      outcome: met ? 'Reserve met' : 'Reserve not met',
      tone: met ? 'green' : 'red',
      winner: partyName(row.winner) || '—',
    };
  });
}

export interface AuctionView {
  id: string;
  status: string;
  mineral: string;
  lotId: string;
  quantity: string;
  currentBid: string;
  bidCount: number;
  bidderCount: number;
  leader: string;
  endsAt: string;
  reserve: string;
  outcome: string;
  winner: string;
  finalBid: string;
}

export interface AuctionBid {
  id: string;
  bidder: string;
  amount: string;
  at: string;
}

export async function getAuction(id: string, signal?: AbortSignal): Promise<AuctionView> {
  const body = await apiRequest<Record<string, unknown>>(ENDPOINTS.auctions.detail(id), { signal });
  return {
    id: textOf(body.id),
    status: textOf(body.status),
    mineral: textOf(body.mineral),
    lotId: textOf(body.lotId),
    quantity: qtyLabel(body.quantity),
    currentBid: moneyLabel(body.currentBid),
    bidCount: Number(body.bidCount ?? 0),
    bidderCount: Number(body.bidderCount ?? 0),
    leader: partyName(body.leader) || '—',
    endsAt: formatDay(body.endsAt) || '—',
    reserve: moneyLabel(body.reserve),
    outcome: textOf(body.outcome, '—'),
    winner: partyName(body.winner) || '—',
    finalBid: moneyLabel(body.finalBid),
  };
}

export async function getAuctionBids(id: string, signal?: AbortSignal): Promise<AuctionBid[]> {
  const body = await apiRequest<{ data?: unknown[] }>(`${ENDPOINTS.auctions.bids(id)}?limit=50`, { signal });
  return (body.data ?? []).map((item) => {
    const row = asRecord(item) ?? {};
    return { id: textOf(row.id), bidder: partyName(row.bidder) || '—', amount: moneyLabel(row.amount), at: formatDay(row.at) || '—' };
  });
}

export interface EligibleLot {
  id: string;
  mineral: string;
  qty: string;
  cost: string;
  realisable: string;
}

export async function getEligibleLots(signal?: AbortSignal): Promise<EligibleLot[]> {
  const body = await apiRequest<{ data?: unknown[] }>(ENDPOINTS.auctions.eligible, { signal });
  return (body.data ?? []).map((item) => {
    const row = asRecord(item) ?? {};
    const lot = asRecord(row.lot) ?? {};
    return {
      id: textOf(lot.id),
      mineral: textOf(lot.mineral),
      qty: qtyLabel(lot.quantity),
      cost: moneyLabel(row.costBasis),
      realisable: moneyLabel(row.realisable),
    };
  });
}

export async function getAuctionCounts(signal?: AbortSignal): Promise<{ live: number; upcoming: number; ended: number } | null> {
  if (isDemoMode()) return null;
  const body = await apiRequest<{ meta?: { counts?: { live?: number; upcoming?: number; ended?: number } } }>(`${ENDPOINTS.auctions.list}?status=live&pageSize=1`, { signal });
  return {
    live: Number(body.meta?.counts?.live ?? 0),
    upcoming: Number(body.meta?.counts?.upcoming ?? 0),
    ended: Number(body.meta?.counts?.ended ?? 0),
  };
}
