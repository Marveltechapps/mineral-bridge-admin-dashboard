import { apiRequest, isDemoMode } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import { asRecord, fetchAllPages, formatDay, moneyAmount, moneyLabel, partyName, textOf } from '@/lib/wire';
import type { LcStage, LetterOfCredit } from '@/types/lc';
import { LC_STATS, LCS } from './lcData';

const STAGE: Record<string, LcStage> = {
  requested: 'Requested',
  issued: 'Issued',
  shipped: 'Shipped',
  docs_presented: 'Docs presented',
  paid: 'Paid',
};

function mapLc(raw: unknown): LetterOfCredit {
  const row = asRecord(raw) ?? {};
  const status = STAGE[textOf(row.status)] ?? 'Requested';
  const count = Number(row.discrepancyCount ?? 0);
  const texts = Array.isArray(row.discrepancies) ? row.discrepancies.map((item) => textOf(asRecord(item)?.text ?? item)).filter(Boolean) : [];
  return {
    id: textOf(row.id),
    applicant: partyName(row.applicant),
    beneficiary: partyName(row.beneficiary),
    goods: textOf(row.goods),
    amount: moneyAmount(row.amount) ?? 0,
    bank: partyName(row.bank) || textOf(asRecord(row.bank)?.name),
    status,
    expiry: formatDay(row.expiry) || '—',
    days: typeof row.daysToExpiry === 'number' ? row.daysToExpiry : null,
    discrepancies: texts.length ? texts : Array.from({ length: Math.max(0, count) }, () => ''),
    order: textOf(row.orderId),
  };
}

export async function getLettersOfCredit(signal?: AbortSignal): Promise<LetterOfCredit[]> {
  if (isDemoMode()) return LCS;
  return (await fetchAllPages(ENDPOINTS.lc.list, signal)).map(mapLc);
}

export async function getLcStats(signal?: AbortSignal): Promise<typeof LC_STATS> {
  if (isDemoMode()) return LC_STATS;
  const body = await apiRequest<{ cards?: Array<Record<string, unknown>> }>(ENDPOINTS.lc.summary, { signal });
  return (body.cards ?? []).map((card) => ({
    label: textOf(card.label).toUpperCase(),
    value: typeof card.value === 'number' ? String(card.value) : moneyLabel(card.value),
    sub: textOf(card.sub),
  }));
}
