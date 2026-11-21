import { ENDPOINTS } from '@/lib/endpoints';
import { asRecord, fetchAllPages, statusLabel, textOf } from '@/lib/wire';
import type { IconName } from '@/constants/icons';
import type { Tone } from '@/constants/tones';

export interface PartnerRow {
  id: string;
  name: string;
  meta: string;
  contact: string;
  status: string;
  tone: Tone;
  volume: string;
  note: string;
}

export interface PartnerGroup {
  label: string;
  icon: IconName;
  items: PartnerRow[];
}

const GROUP: Record<string, { label: string; icon: IconName }> = {
  bonded_carrier: { label: 'Bonded carriers', icon: 'partners' },
  inspection_hub: { label: 'Inspection hubs', icon: 'box' },
  lab_assay: { label: 'Lab assay partners', icon: 'shield' },
};

const TONE: Record<string, Tone> = { Active: 'green', Suspended: 'red', Onboarding: 'blue', 'Under review': 'amber' };

export async function getPartnerGroups(signal?: AbortSignal): Promise<PartnerGroup[]> {
  const rows = await fetchAllPages<Record<string, unknown>>(ENDPOINTS.partners.list, signal);
  const buckets = new Map<string, PartnerRow[]>();
  for (const row of rows) {
    const type = textOf(row.type);
    const status = statusLabel(row.status);
    const volume = asRecord(row.volume);
    const item: PartnerRow = {
      id: textOf(row.id),
      name: textOf(row.name),
      meta: [textOf(row.base), textOf(row.capacity)].filter(Boolean).join(' · '),
      contact: [textOf(row.email), textOf(row.phone)].filter(Boolean).join(' · '),
      status,
      tone: TONE[status] ?? 'gray',
      volume: `${textOf(volume?.count, '0')} ${textOf(volume?.unit, 'orders')}`,
      note: textOf(row.note),
    };
    buckets.set(type, [...(buckets.get(type) ?? []), item]);
  }
  return [...buckets.entries()].map(([type, items]) => ({
    label: GROUP[type]?.label ?? statusLabel(type),
    icon: GROUP[type]?.icon ?? 'partners',
    items,
  }));
}
