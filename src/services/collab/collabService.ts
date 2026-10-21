import { apiRequest, isDemoMode } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import { ago, asRecord, fetchAllPages, formatDay, moneyAmount, moneyLabel, partyName, textOf } from '@/lib/wire';
import type { Tone } from '@/constants/tones';
import type { Negotiation } from '@/types/collab';
import { COLLAB_STATS, CONTRACTS, NEGOTIATIONS, TOP_MINERS, TOP_TRADERS } from './collabData';

const STATUS: Record<string, Negotiation['status']> = {
  awaiting_miner: 'Awaiting miner',
  awaiting_trader: 'Awaiting trader',
  terms_agreed: 'Terms agreed',
  stalled: 'Stalled',
};

const TONE: Record<Negotiation['status'], Tone> = {
  'Awaiting miner': 'blue',
  'Awaiting trader': 'violet',
  'Terms agreed': 'green',
  Stalled: 'red',
};

function mapNegotiation(raw: unknown): Negotiation {
  const row = asRecord(raw) ?? {};
  const status = STATUS[textOf(row.status)] ?? 'Awaiting miner';
  const history = Array.isArray(row.history)
    ? row.history.map((item) => {
        const turn = asRecord(item);
        const side = textOf(turn?.side).toLowerCase() === 'miner' ? 'Miner' : 'Trader';
        return [side, moneyAmount(turn?.price) ?? 0] as ['Trader' | 'Miner', number];
      })
    : [];
  return {
    id: textOf(row.id),
    miner: partyName(row.miner),
    trader: partyName(row.trader),
    goods: textOf(row.goods),
    ask: moneyAmount(row.ask) ?? 0,
    offer: moneyAmount(row.offer) ?? 0,
    rounds: Number(row.rounds ?? 0),
    status,
    tone: TONE[status],
    last: ago(row.lastActivityAt),
    history,
  };
}

export async function getNegotiations(signal?: AbortSignal): Promise<Negotiation[]> {
  if (isDemoMode()) return NEGOTIATIONS;
  return (await fetchAllPages(ENDPOINTS.collab.negotiations, signal)).map(mapNegotiation);
}

export async function getContracts(signal?: AbortSignal): Promise<typeof CONTRACTS> {
  if (isDemoMode()) return CONTRACTS;
  const rows = await fetchAllPages<Record<string, unknown>>(ENDPOINTS.collab.contracts, signal);
  return rows.map((row) => ({
    id: textOf(row.id),
    parties: `${partyName(row.seller)} → ${partyName(row.buyer)}`,
    goods: textOf(row.goods),
    value: moneyLabel(row.value),
    date: formatDay(row.signedAt),
    lc: textOf(row.lcId, '—'),
  }));
}

export async function getCollabStats(signal?: AbortSignal): Promise<typeof COLLAB_STATS> {
  if (isDemoMode()) return COLLAB_STATS;
  const body = await apiRequest<{ cards?: Array<Record<string, unknown>> }>(ENDPOINTS.collab.summary, { signal });
  return (body.cards ?? []).map((card) => ({
    label: textOf(card.label).toUpperCase(),
    value: card.unit === '%' ? `${textOf(card.value)}%` : card.unit ? `${textOf(card.value)} ${textOf(card.unit)}` : textOf(card.value),
    sub: textOf(card.sub),
  }));
}

export function getMinerRankings(signal?: AbortSignal): Promise<typeof TOP_MINERS> {
  return getRankings('miner', signal);
}

export function getTraderRankings(signal?: AbortSignal): Promise<typeof TOP_TRADERS> {
  return getRankings('trader', signal);
}

async function getRankings(role: 'miner' | 'trader', signal?: AbortSignal): Promise<typeof TOP_MINERS> {
  if (isDemoMode()) return role === 'miner' ? TOP_MINERS : TOP_TRADERS;
  const body = await apiRequest<{ data?: Array<Record<string, unknown>> }>(ENDPOINTS.collab.rankings(role), { signal });
  return (body.data ?? []).map((row) => ({
    name: partyName(row.party),
    rating: Number(row.rating ?? 0),
    deals: Number(row.deals ?? 0),
    ontime: `${textOf(row.onTimePct, '0')}% ${role === 'miner' ? 'on time' : 'paid on time'}`,
  }));
}
