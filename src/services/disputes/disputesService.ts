import { apiRequest, isDemoMode } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import { asRecord, fetchAllPages, formatDay, moneyLabel, partyName, statusLabel, textOf } from '@/lib/wire';
import type { Tone } from '@/constants/tones';
import type { Dispute } from '@/types/disputes';
import { DISPUTES } from './disputesData';

const DISPUTE_TONE: Record<string, Tone> = {
  'Evidence review': 'blue',
  'Compliance hold': 'amber',
  'Awaiting counterparty': 'gray',
  Resolved: 'green',
};

export async function getDisputes(signal?: AbortSignal): Promise<Dispute[]> {
  if (isDemoMode()) return DISPUTES;
  const rows = await fetchAllPages<Record<string, unknown>>(ENDPOINTS.disputes.list, signal);
  return rows.map((row) => {
    const status = statusLabel(row.status);
    const linked = asRecord(row.linked);
    return {
      id: textOf(row.id),
      link: textOf(linked?.id),
      type: statusLabel(row.type),
      party: partyName(row.party),
      status,
      tone: DISPUTE_TONE[status] ?? 'gray',
      days: Number(row.daysOpen ?? 0),
      value: moneyLabel(row.valueAtRisk),
    };
  });
}

export interface DisputeView extends Dispute {
  partyId: string;
  attachments: Array<{ name: string; meta: string }>;
}

export interface DisputeMessage {
  id: string;
  from: string;
  who: string;
  text: string;
  time: string;
}

export async function getDispute(id: string, signal?: AbortSignal): Promise<DisputeView> {
  const body = await apiRequest<Record<string, unknown>>(ENDPOINTS.disputes.detail(id), { signal });
  const status = statusLabel(body.status);
  const linked = asRecord(body.linked);
  const party = asRecord(body.party);
  const files = Array.isArray(body.attachments) ? body.attachments : [];
  return {
    id: textOf(body.id),
    link: textOf(linked?.id),
    type: statusLabel(body.type),
    party: partyName(body.party),
    partyId: textOf(party?.id),
    status,
    tone: DISPUTE_TONE[status] ?? 'gray',
    days: Number(body.daysOpen ?? 0),
    value: moneyLabel(body.valueAtRisk),
    attachments: files.map((file) => {
      const row = asRecord(file) ?? {};
      return { name: textOf(row.name, textOf(row.id, 'Attachment')), meta: textOf(row.contentType, 'On file') };
    }),
  };
}

export async function getDisputeMessages(id: string, signal?: AbortSignal): Promise<DisputeMessage[]> {
  const body = await apiRequest<{ data?: unknown[] }>(ENDPOINTS.disputes.messages(id), { signal });
  return (body.data ?? []).map((item) => {
    const row = asRecord(item) ?? {};
    return { id: textOf(row.id), from: textOf(row.from), who: textOf(row.author, '—'), text: textOf(row.text), time: formatDay(row.at) || '—' };
  });
}
