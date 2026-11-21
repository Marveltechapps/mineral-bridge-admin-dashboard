import { apiRequest } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import { asRecord, fetchAllPages, formatDay, moneyLabel, partyName, statusLabel, textOf } from '@/lib/wire';
import type { Tone } from '@/constants/tones';

export interface SettlementRow {
  id: string;
  date: string;
  ref: string;
  party: string;
  kind: string;
  amount: string;
  status: string;
  tone: Tone;
}

export interface StatTile {
  label: string;
  value: string;
  sub: string;
}

const TONE: Record<string, Tone> = { Released: 'green', 'On hold': 'amber', Disputed: 'red', Pending: 'gray' };

export async function getSettlementSummary(signal?: AbortSignal): Promise<StatTile[]> {
  const body = await apiRequest<{ cards?: Array<Record<string, unknown>> }>(ENDPOINTS.financial.summary, { signal });
  return (body.cards ?? []).map((card) => ({
    label: textOf(card.label).toUpperCase(),
    value: moneyLabel(card.value),
    sub: textOf(card.sub),
  }));
}

export async function getSettlements(signal?: AbortSignal): Promise<SettlementRow[]> {
  const rows = await fetchAllPages<Record<string, unknown>>(ENDPOINTS.financial.ledger, signal);
  return rows.map((row) => {
    const status = statusLabel(row.status);
    return {
      id: textOf(row.id),
      date: formatDay(row.date),
      ref: textOf(asRecord(row.ref)?.id, '—'),
      party: partyName(row.party),
      kind: statusLabel(row.kind),
      amount: moneyLabel(row.amount),
      status,
      tone: TONE[status] ?? 'gray',
    };
  });
}
