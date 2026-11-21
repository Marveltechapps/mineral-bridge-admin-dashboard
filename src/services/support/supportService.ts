import { isDemoMode } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import { asRecord, fetchAllPages, formatDay, partyName, statusLabel, textOf } from '@/lib/wire';
import type { Tone } from '@/constants/tones';
import { CALLS, TICKETS } from './supportData';

const TONE: Record<string, Tone> = { Open: 'blue', Escalated: 'amber', 'Waiting on user': 'gray', Resolved: 'green' };

function duration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${mins} m ${String(rest).padStart(2, '0')} s`;
}

export async function getTickets(signal?: AbortSignal): Promise<typeof TICKETS> {
  if (isDemoMode()) return TICKETS;
  const rows = await fetchAllPages<Record<string, unknown>>(ENDPOINTS.support.tickets, signal);
  return rows.map((row) => {
    const status = statusLabel(row.status);
    const owner = asRecord(row.owner);
    const hours = Number(row.ageHours ?? 0);
    return {
      id: textOf(row.id),
      subject: textOf(row.subject),
      user: partyName(row.user),
      link: textOf(asRecord(row.linked)?.id, '—'),
      status,
      tone: TONE[status] ?? 'gray',
      owner: textOf(owner?.name) || textOf(owner?.team, 'Support'),
      age: hours >= 24 ? `${Math.round(hours / 24)} d` : `${hours} h`,
    };
  });
}

export async function getCalls(signal?: AbortSignal): Promise<typeof CALLS> {
  if (isDemoMode()) return CALLS;
  const rows = await fetchAllPages<Record<string, unknown>>(ENDPOINTS.support.calls, signal);
  return rows.map((row) => ({
    time: formatDay(row.at),
    who: partyName(row.who),
    phone: textOf(row.phone),
    dir: textOf(row.direction) === 'outbound' ? 'Outbound' : 'Inbound',
    dur: duration(Number(row.durationSec ?? 0)),
    topic: textOf(row.topic),
    agent: partyName(row.agent) || textOf(asRecord(row.agent)?.name),
  }));
}
