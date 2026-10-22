import { apiRequest, isDemoMode } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import { asRecord, fetchAllPages, moneyLabel, partyName, qtyLabel, textOf, unitPriceLabel } from '@/lib/wire';
import { STAGES, type Stage } from '@/constants/tones';
import type { IntakeItem, OrderRow } from '@/types/orders';
import { INTAKE, ORDERS } from './ordersData';

const STAGE_KEYS = [
  'verification',
  'pricing_confirmation',
  'agent_visit',
  'inspection_approval',
  'payment_released',
  'custody_transfer',
] as const;

const STATUS_TEXT: Record<string, string> = {
  pending_review: 'Pending review',
  active: 'Active',
  completed: 'Completed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  draft: 'Draft',
  submitted: 'Submitted',
  visit_scheduled: 'Visit scheduled',
  verified: 'Verified',
  in_transit: 'In transit',
  received: 'Received',
  paid: 'Paid',
  none: 'Not submitted',
  pending: 'Pending',
  verification: 'Verification',
  pricing_confirmation: 'Pricing confirmation',
  agent_visit: 'Agent visit',
  inspection_approval: 'Inspection approval',
  payment_released: 'Payment released',
  custody_transfer: 'Custody transfer',
  due_on_approval: 'Due on approval',
  released: 'Released',
};

function statusText(value: unknown): string {
  const raw = textOf(value);
  if (!raw) return '';
  return STATUS_TEXT[raw] ?? raw.replace(/_/g, ' ');
}

function exactMoney(value: unknown): string {
  const row = asRecord(value);
  if (!row || typeof row.amount !== 'number') return '';
  const currency = textOf(row.currency, 'USD');
  if (currency === 'USD' || currency === 'KES') {
    return row.amount.toLocaleString('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return moneyLabel(value);
}

function exactRate(value: unknown): string {
  const row = asRecord(value);
  if (!row || typeof row.amount !== 'number') return '';
  const per = textOf(row.per);
  return `${exactMoney(row)}${per ? ` / ${per}` : ''}`;
}

export function mapOrderSummary(raw: unknown): OrderRow {
  const row = asRecord(raw) ?? {};
  const party = asRecord(row.party);
  const agent = asRecord(row.agent);
  const quantity = asRecord(row.quantity);
  const stageKey = typeof row.stage === 'string' ? row.stage : 'verification';
  const stageIndex = STAGE_KEYS.indexOf(stageKey as (typeof STAGE_KEYS)[number]);
  const stage = (STAGES[stageIndex] ?? STAGES[0]) as Stage;
  const side = row.side === 'sell' || row.side === 'Sell' ? 'Sell' : 'Buy';
  return {
    id: String(row.id ?? ''),
    mineral: String(row.mineral ?? ''),
    side,
    party: String(party?.name ?? row.party ?? ''),
    qty: quantity ? `${quantity.value} ${quantity.unit}` : String(row.qty ?? ''),
    stage,
    days: Number(row.daysInStage ?? row.days ?? 0),
    agent: String(agent?.initials ?? agent?.name ?? row.agent ?? ''),
    tier: Number(party?.tier ?? row.tier ?? 1),
    value: exactMoney(row.value),
    rate: exactRate(row.lockedRate),
    settlement: textOf(row.settlementMethod),
    form: textOf(row.mineralForm),
    location: textOf(row.location),
    verification: statusText(row.verificationStatus),
    orderStatus: statusText(row.customerStatus),
    photos: Number(row.photoCount ?? 0),
  };
}

export interface LiveOrderFacts {
  facts: Array<[string, string]>;
  docs: Array<{ name: string; ref: string; status: string; tone: 'green' | 'blue'; fileId?: string }>;
  contact: string;
  phone: string;
  email: string;
  kyc: string;
  value: string;
  rate: string;
}

export async function getOrderDetail(id: string, signal?: AbortSignal): Promise<LiveOrderFacts> {
  const body = await apiRequest<unknown>(ENDPOINTS.orders.detail(encodeURIComponent(id)), { signal });
  const row = asRecord(body) ?? {};
  const facts = asRecord(row.facts) ?? {};
  const party = asRecord(row.party);
  const counterparty = asRecord(row.counterparty);
  const counterpartyParty = asRecord(counterparty?.party);
  const quantity = asRecord(row.quantity);
  const value = exactMoney(facts.value);
  const rate = exactRate(facts.lockedRate);
  const form = textOf(facts.mineralForm);
  const pairs: Array<[string, string]> = [
    ['Order ID', textOf(row.id)],
    ['Customer', textOf(counterpartyParty?.name || party?.name)],
    ['Email', textOf(counterparty?.email)],
    ['Phone', textOf(counterparty?.phone)],
    ['Product', textOf(row.mineral)],
    ['Quantity', quantity ? `${quantity.value} ${quantity.unit}` : ''],
    ['Unit price', rate],
    ['Order value', value],
    ['Settlement method', textOf(facts.settlementMethod)],
    ['Order status', statusText(facts.customerStatus || row.customerStatus || row.status)],
    ['Stage', statusText(row.stage)],
  ];
  if (form || textOf(facts.verificationStatus)) {
    pairs.push(['Form', form], ['Location', textOf(facts.origin)], ['Verification status', statusText(facts.verificationStatus)]);
  }
  const docs = (Array.isArray(row.documents) ? row.documents : []).map((item) => {
    const doc = asRecord(item) ?? {};
    const status = textOf(doc.status);
    return {
      name: textOf(doc.name, 'Document'),
      ref: textOf(doc.ref),
      status: statusText(status).toUpperCase(),
      tone: (status === 'verified' ? 'green' : 'blue') as 'green' | 'blue',
      fileId: textOf(doc.fileId) || undefined,
    };
  });
  return {
    facts: pairs.filter(([, value]) => value),
    docs,
    contact: textOf(counterparty?.contactName || counterpartyParty?.name),
    phone: textOf(counterparty?.phone),
    email: textOf(counterparty?.email),
    kyc: statusText(counterparty?.kycStatus),
    value,
    rate,
  };
}

export async function getOrders(signal?: AbortSignal): Promise<OrderRow[]> {
  if (isDemoMode()) return ORDERS;
  return (await fetchAllPages(ENDPOINTS.orders.list, signal)).map(mapOrderSummary);
}

export function advanceOrder(id: string, stageIndex: number): Promise<unknown> {
  return apiRequest(ENDPOINTS.orders.advanceStage(id), {
    method: 'POST',
    body: JSON.stringify({ expectedStage: STAGE_KEYS[stageIndex], note: 'Advanced from the operations console' }),
  });
}

export async function getIntakeQueue(signal?: AbortSignal): Promise<IntakeItem[]> {
  if (isDemoMode()) return INTAKE;
  const rows = await fetchAllPages<Record<string, unknown>>(ENDPOINTS.orders.intake, signal);
  return rows.map((row) => ({
    id: textOf(row.id),
    party: partyName(row.party),
    mineral: textOf(asRecord(row.mineral)?.name ?? row.mineral),
    qty: qtyLabel(row.quantity),
    grade: textOf(row.grade),
    rate: unitPriceLabel(row.liveRate),
    suggested: moneyLabel(row.suggested),
    docs: Array.isArray(row.documents) ? row.documents.map((doc) => textOf(asRecord(doc)?.name)) : [],
    photos: `${Number(row.photoCount ?? 0)} photos`,
  }));
}
