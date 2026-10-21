import { apiRequest, isDemoMode } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import { asRecord, fetchAllPages, formatDay, moneyLabel, qtyLabel, statusLabel, textOf, unitPriceLabel } from '@/lib/wire';
import type { Tone } from '@/constants/tones';
import type { Lot, LotStatus } from '@/types/vault';
import { LOTS, VAULT_STATS } from './vaultData';

const LOT_TONE: Record<string, Tone> = { Listed: 'blue', 'In vault': 'gold', 'In auction': 'violet', Reserved: 'amber', Shipped: 'gray' };

function mapLot(raw: unknown): Lot {
  const row = asRecord(raw) ?? {};
  const status = statusLabel(row.status) as LotStatus;
  return {
    id: textOf(row.id),
    mineral: textOf(row.mineral),
    qty: qtyLabel(row.quantity),
    grade: textOf(row.grade),
    src: textOf(row.sourceOrderId),
    status: LOT_TONE[status] ? status : 'In vault',
    tone: LOT_TONE[status] ?? 'gray',
    days: Number(row.daysHeld ?? 0),
  };
}

export interface LotDetailView {
  lot: Lot;
  location: string;
  costBasis: string;
  costRate: string;
  realisable: string;
  liveSellRate: string;
  unrealised: string;
  unrealisedPct: string;
  custody: Array<{ title: string; description: string; at: string; actor: string }>;
  assay: string;
  history: Array<{ title: string; sub: string; date: string; amount: string }>;
}

export async function getLotDetail(id: string, signal?: AbortSignal): Promise<LotDetailView> {
  const body = await apiRequest<unknown>(ENDPOINTS.vault.lot(id), { signal });
  const row = asRecord(body) ?? {};
  const assay = asRecord(row.assay);
  const lab = asRecord(assay?.lab);
  const custody = Array.isArray(row.custody) ? row.custody : [];
  const history = Array.isArray(row.allocationHistory) ? row.allocationHistory : [];
  return {
    lot: mapLot(body),
    location: textOf(row.location, '—'),
    costBasis: moneyLabel(row.costBasis),
    costRate: unitPriceLabel(row.costRate) || '—',
    realisable: moneyLabel(row.realisable),
    liveSellRate: unitPriceLabel(row.liveSellRate) || '—',
    unrealised: moneyLabel(row.unrealised),
    unrealisedPct: typeof row.unrealisedPct === 'number' ? `${row.unrealisedPct}%` : '—',
    custody: custody.map((item) => {
      const step = asRecord(item) ?? {};
      return { title: textOf(step.title), description: textOf(step.description), at: formatDay(step.at) || '—', actor: textOf(step.actor, '—') };
    }),
    assay: assay ? [textOf(assay.certificateNo), textOf(lab?.name), textOf(assay.grade)].filter(Boolean).join(' · ') || '—' : '—',
    history: history.map((item) => {
      const step = asRecord(item) ?? {};
      return { title: textOf(step.title), sub: textOf(step.sub), date: textOf(step.date, '—'), amount: moneyLabel(step.amount) };
    }),
  };
}

export async function getLots(signal?: AbortSignal): Promise<Lot[]> {
  if (isDemoMode()) return LOTS;
  return (await fetchAllPages(ENDPOINTS.vault.lots, signal)).map(mapLot);
}

export async function getVaultStats(signal?: AbortSignal): Promise<typeof VAULT_STATS> {
  if (isDemoMode()) return VAULT_STATS;
  const body = await apiRequest<{ cards?: unknown[] }>(ENDPOINTS.vault.summary, { signal });
  return (body.cards ?? []).map((card) => {
    const row = asRecord(card) ?? {};
    const value = typeof row.value === 'number' ? String(row.value) : moneyLabel(row.value);
    return { label: textOf(row.label).toUpperCase(), value, sub: textOf(row.sub) || textOf(row.unit) };
  });
}
