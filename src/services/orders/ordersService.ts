import { apiRequest, apiRequestOrDemo, isDemoMode } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
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
  };
}

export async function getOrders(signal?: AbortSignal): Promise<OrderRow[]> {
  if (isDemoMode()) return ORDERS;
  const body = await apiRequest<{ data?: unknown[] }>(ENDPOINTS.orders.list, { signal });
  return (body.data ?? []).map(mapOrderSummary);
}

export function advanceOrder(id: string, stageIndex: number): Promise<unknown> {
  return apiRequest(ENDPOINTS.orders.advanceStage(id), {
    method: 'POST',
    body: JSON.stringify({ expectedStage: STAGE_KEYS[stageIndex], note: 'Advanced from the operations console' }),
  });
}

export function getIntakeQueue(signal?: AbortSignal): Promise<IntakeItem[]> {
  return apiRequestOrDemo(ENDPOINTS.orders.intake, INTAKE, { signal });
}
