import { apiRequest } from '@/lib/apiClient';

export function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

export function textOf(value: unknown, fallback = ''): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return fallback;
}

export function partyName(value: unknown): string {
  if (typeof value === 'string') return value;
  const row = asRecord(value);
  return textOf(row?.org) || textOf(row?.name);
}

export function qtyLabel(value: unknown): string {
  const row = asRecord(value);
  if (!row || row.value === undefined || row.value === null) return '';
  return `${row.value} ${textOf(row.unit)}`.trim();
}

export function moneyAmount(value: unknown): number | null {
  const row = asRecord(value);
  return row && typeof row.amount === 'number' ? row.amount : null;
}

/** Compact USD for dashboard tiles. Other currencies keep their code. */
export function moneyLabel(value: unknown): string {
  const row = asRecord(value);
  if (!row || typeof row.amount !== 'number') return '—';
  const amount = row.amount;
  const currency = textOf(row.currency, 'USD');
  if (currency === 'USD') {
    const abs = Math.abs(amount);
    if (abs >= 1_000_000) return `${amount < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(2)}M`;
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: abs >= 1000 ? 0 : 2 });
  }
  return `${amount.toLocaleString('en-US', { maximumFractionDigits: 4 })} ${currency}`;
}

export function unitPriceLabel(value: unknown): string {
  const row = asRecord(value);
  if (!row || typeof row.amount !== 'number') return '—';
  const per = textOf(row.per);
  return `${moneyLabel(row)}${per ? ` / ${per}` : ''}`;
}

export function formatDay(value: unknown): string {
  const time = Date.parse(textOf(value));
  if (Number.isNaN(time)) return '';
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Africa/Nairobi' }).format(new Date(time));
}

export function ago(value: unknown): string {
  const time = Date.parse(textOf(value));
  if (Number.isNaN(time)) return '';
  const minutes = Math.round((Date.now() - time) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

export function timeLeft(value: unknown): string {
  const time = Date.parse(textOf(value));
  if (Number.isNaN(time)) return '—';
  const ms = time - Date.now();
  if (ms <= 0) return '0m';
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return `${hours}h ${minutes}m`;
}

const STATUS_LABEL: Record<string, string> = {
  verified: 'Verified',
  in_review: 'In review',
  expiring: 'Expiring',
  expiring_docs: 'Expiring docs',
  rejected: 'Rejected',
  suspended: 'Suspended',
  awaiting_resubmission: 'Awaiting resubmission',
  listed: 'Listed',
  in_vault: 'In vault',
  in_auction: 'In auction',
  reserved: 'Reserved',
  shipped: 'Shipped',
  live: 'Live',
  paused: 'Paused',
  scheduled: 'Scheduled',
  sold_out: 'Sold out',
  draft: 'Draft',
  ended: 'Ended',
  evidence_review: 'Evidence review',
  compliance_hold: 'Compliance hold',
  awaiting_counterparty: 'Awaiting counterparty',
  resolved: 'Resolved',
  market_feed: 'Market feed',
  manual_override: 'Manual override',
  requested: 'Requested',
  issued: 'Issued',
  docs_presented: 'Docs presented',
  paid: 'Paid',
  awaiting_miner: 'Awaiting miner',
  awaiting_trader: 'Awaiting trader',
  terms_agreed: 'Terms agreed',
  stalled: 'Stalled',
  contracted: 'Contracted',
  open: 'Open',
  escalated: 'Escalated',
  waiting_on_user: 'Waiting on user',
  released: 'Released',
  on_hold: 'On hold',
  disputed: 'Disputed',
  pending: 'Pending',
  active: 'Active',
  onboarding: 'Onboarding',
  under_review: 'Under review',
  published: 'Published',
  confirmed: 'Confirmed',
};

export function statusLabel(value: unknown): string {
  const raw = textOf(value);
  return STATUS_LABEL[raw] ?? raw.replace(/_/g, ' ');
}

/** Reads every page the admin list endpoints return, up to a fixed cap. */
export async function fetchAllPages<T>(path: string, signal?: AbortSignal, pageSize = 100): Promise<T[]> {
  const rows: T[] = [];
  let page = 1;
  let total = Number.POSITIVE_INFINITY;
  while (rows.length < total && page <= 20) {
    const sep = path.includes('?') ? '&' : '?';
    const body = await apiRequest<{ data?: T[]; meta?: { total?: number } }>(`${path}${sep}page=${page}&pageSize=${pageSize}`, { signal });
    const data = body.data ?? [];
    rows.push(...data);
    total = typeof body.meta?.total === 'number' ? body.meta.total : rows.length;
    if (data.length === 0) break;
    page += 1;
  }
  return rows;
}
