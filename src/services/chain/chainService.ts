import { apiRequest, isDemoMode } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import { ago, asRecord, fetchAllPages, textOf } from '@/lib/wire';
import type { Tone } from '@/constants/tones';
import type { ChainEvent } from '@/types/chain';
import { EVENTS, NET_STATUS, PASSPORT_WEEKS } from './chainData';

const TYPE: Record<string, ChainEvent['type']> = {
  passport_mint: 'PASSPORT MINT',
  custody_transfer: 'CUSTODY TRANSFER',
  lc_event: 'LC EVENT',
  btc_settlement: 'BTC SETTLEMENT',
  bitcoin_anchor: 'BITCOIN ANCHOR',
};

const TONE: Record<ChainEvent['type'], Tone> = {
  'PASSPORT MINT': 'gold',
  'CUSTODY TRANSFER': 'blue',
  'LC EVENT': 'violet',
  'BTC SETTLEMENT': 'amber',
  'BITCOIN ANCHOR': 'green',
};

function mapEvent(raw: unknown): ChainEvent {
  const row = asRecord(raw) ?? {};
  const type = TYPE[textOf(row.type)] ?? 'PASSPORT MINT';
  const ref = asRecord(row.ref);
  const status = textOf(row.status) === 'pending' ? 'Pending' : 'Confirmed';
  return {
    type,
    ref: textOf(ref?.label) || textOf(ref?.id) || textOf(row.id),
    desc: textOf(row.description),
    hash: textOf(row.txHash),
    time: ago(row.at),
    status,
    tone: status === 'Pending' ? 'amber' : TONE[type],
  };
}

export async function getChainEvents(signal?: AbortSignal): Promise<ChainEvent[]> {
  if (isDemoMode()) return EVENTS;
  return (await fetchAllPages(ENDPOINTS.chain.events, signal)).map(mapEvent);
}

export async function getNetworkStatus(signal?: AbortSignal): Promise<typeof NET_STATUS> {
  if (isDemoMode()) return NET_STATUS;
  const body = await apiRequest<{ data?: Array<Record<string, unknown>> }>(ENDPOINTS.chain.network, { signal });
  return (body.data ?? []).map((row) => ({
    name: textOf(row.name),
    state: textOf(row.state),
    ok: Boolean(row.ok),
    meta: textOf(row.meta),
  }));
}

export async function getPassportWeeks(signal?: AbortSignal): Promise<typeof PASSPORT_WEEKS> {
  if (isDemoMode()) return PASSPORT_WEEKS;
  const body = await apiRequest<{ weekly?: Array<Record<string, unknown>> }>(ENDPOINTS.chain.passports, { signal });
  return (body.weekly ?? []).map((row) => [textOf(row.weekStart).slice(5), Number(row.count ?? 0)] as [string, number]);
}
