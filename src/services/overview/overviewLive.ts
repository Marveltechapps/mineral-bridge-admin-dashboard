import { apiRequest } from '@/lib/apiClient';
import type { IconName } from '@/constants/icons';
import type { Tone } from '@/constants/tones';
import type { QueueTarget } from '@/types/overview';
import { ago, asRecord, moneyLabel, qtyLabel, textOf } from '@/lib/wire';

const STAGE_META: Record<string, { label: string; short: string; color: string }> = {
  verification: { label: 'Verification', short: 'VER', color: '#2563EB' },
  pricing_confirmation: { label: 'Pricing', short: 'PRC', color: '#3B82F6' },
  agent_visit: { label: 'Agent visit', short: 'VIS', color: '#8B5CF6' },
  inspection_approval: { label: 'Approval', short: 'APR', color: '#B45309' },
  payment_released: { label: 'Payment', short: 'PAY', color: '#16A34A' },
  custody_transfer: { label: 'Transfer', short: 'CUS', color: '#1E2A5A' },
};

const FUNNEL_COLOR = ['#2563EB', '#4F46E5', '#8B5CF6', '#B45309', '#16A34A'];
const FUNNEL_LABEL: Record<string, string> = {
  requested: 'Requested',
  issued: 'Issued',
  shipped: 'Shipped',
  docs_presented: 'Docs presented',
  paid: 'Paid',
};

const QUEUE_TARGET: Record<string, QueueTarget> = {
  verification: 'verification',
  pricing_offers: 'pricing',
  orders_intake: 'orders',
  vault: 'vault',
  disputes: 'disputes',
};

const KIND_ICON: Record<string, IconName> = {
  order: 'box',
  kyc: 'shield',
  auction: 'flag',
  listing: 'vault',
  payment: 'financial',
  dispute: 'dispute',
  offer: 'pricing',
  user: 'users',
};

export interface LiveKpis {
  pendingKyc: number;
  kycDelta: number;
  overdue: number;
  activeOrders: number;
  stages: Array<{ short: string; count: number; color: string }>;
  vault: string;
  unrealisedPct: number;
  liveAuctions: number;
  closingToday: number;
  settlements: string;
  settled: number;
  pendingSettlements: number;
  minerals: Array<{ name: string; value: string; qty: string; lots: string; pct: number }>;
  queues: Array<{ label: string; sub: string; count: string; tone: Tone; target: QueueTarget }>;
}

export interface LiveTrade {
  tiles: Array<{ label: string; value: string; sub: string; target: 'collab' | 'lc' | 'chain'; bar?: number }>;
  funnel: Array<{ label: string; count: number; value: string; color: string }>;
}

export interface LiveActivity {
  text: string;
  meta: string;
  time: string;
  icon: IconName;
  tone: Tone;
  ref: string;
}

function queueTone(severity: unknown, count: number): Tone {
  if (severity === 'warn' || severity === 'error') return count ? 'amber' : 'gray';
  return 'blue';
}

export async function loadOverviewKpis(signal?: AbortSignal): Promise<LiveKpis> {
  const body = await apiRequest<Record<string, unknown>>('/overview/summary', { signal });
  const kpis = asRecord(body.kpis) ?? {};
  const pending = asRecord(kpis.pendingKyc) ?? {};
  const orders = asRecord(kpis.activeOrders) ?? {};
  const vault = asRecord(kpis.vaultRealisable) ?? {};
  const auctions = asRecord(kpis.liveAuctions) ?? {};
  const settlements = asRecord(kpis.settlementsThisWeek) ?? {};
  const stages = Array.isArray(orders.byStage) ? orders.byStage : [];
  const minerals = Array.isArray(body.vaultByMineral) ? body.vaultByMineral : [];
  const top = minerals.reduce((max, row) => {
    const amount = asRecord(asRecord(row)?.realisable)?.amount;
    return typeof amount === 'number' ? Math.max(max, amount) : max;
  }, 0);
  const queues = Array.isArray(body.deskQueues) ? body.deskQueues : [];
  return {
    pendingKyc: Number(pending.value ?? 0),
    kycDelta: Number(pending.deltaVsLastWeek ?? 0),
    overdue: Number(pending.overdue ?? 0),
    activeOrders: Number(orders.value ?? 0),
    stages: stages.map((row) => {
      const item = asRecord(row) ?? {};
      const meta = STAGE_META[textOf(item.stage)] ?? { short: textOf(item.stage, '—'), color: '#64748B', label: textOf(item.stage) };
      return { short: meta.short, count: Number(item.count ?? 0), color: meta.color };
    }),
    vault: moneyLabel(vault.value),
    unrealisedPct: Number(vault.unrealisedPct ?? 0),
    liveAuctions: Number(auctions.value ?? 0),
    closingToday: Number(auctions.closingToday ?? 0),
    settlements: moneyLabel(settlements.value),
    settled: Number(settlements.settled ?? 0),
    pendingSettlements: Number(settlements.pending ?? 0),
    minerals: minerals.map((row) => {
      const item = asRecord(row) ?? {};
      const amount = asRecord(item.realisable)?.amount;
      return {
        name: textOf(item.mineral, 'Unknown'),
        value: moneyLabel(item.realisable),
        qty: qtyLabel(item.quantity),
        lots: `${Number(item.lots ?? 0)} lots`,
        pct: top > 0 && typeof amount === 'number' ? Math.max(4, Math.round((amount / top) * 100)) : 0,
      };
    }),
    queues: queues.map((row) => {
      const item = asRecord(row) ?? {};
      const count = Number(item.count ?? 0);
      return {
        label: textOf(item.label, 'Queue'),
        sub: textOf(item.sub),
        count: String(count),
        tone: queueTone(item.severity, count),
        target: QUEUE_TARGET[textOf(item.target)] ?? 'orders',
      };
    }),
  };
}

export async function loadTradeFinance(signal?: AbortSignal): Promise<LiveTrade> {
  const body = await apiRequest<Record<string, unknown>>('/overview/trade-finance?window=90d', { signal });
  const tiles = Array.isArray(body.tiles) ? body.tiles : [];
  const funnel = Array.isArray(body.lcFunnel) ? body.lcFunnel : [];
  return {
    tiles: tiles.map((row) => {
      const item = asRecord(row) ?? {};
      const key = textOf(item.key);
      const target = item.target === 'collab' || item.target === 'chain' ? item.target : 'lc';
      if (key === 'lc_issued_vs_paid') {
        return { label: 'LC VALUE ISSUED VS PAID', value: moneyLabel(item.issued), sub: `${moneyLabel(item.paid)} paid`, target, bar: Number(item.paidPct ?? 0) };
      }
      if (key === 'avg_lc_cycle_days') {
        return { label: 'AVG LC CYCLE TIME', value: `${Number(item.value ?? 0)} days`, sub: `${Number(item.deltaDays ?? 0)} days vs the previous window`, target };
      }
      if (key === 'discrepancy_rate') {
        return { label: 'DISCREPANCY RATE', value: `${Number(item.valuePct ?? 0)}%`, sub: textOf(item.sub, 'No presentations in this window'), target };
      }
      if (key === 'passports_on_chain') {
        return { label: 'PASSPORTS ON BLOCKCHAIN', value: Number(item.value ?? 0).toLocaleString('en-US'), sub: `${Number(item.thisWeek ?? 0)} minted this week`, target: 'chain' };
      }
      if (key === 'btc_settled_volume') {
        return { label: 'BTC-SETTLED VOLUME', value: moneyLabel(item.value), sub: `${Number(item.btc ?? 0)} BTC · ${Number(item.sharePct ?? 0)}% of settlements`, target: 'chain' };
      }
      return { label: 'ACTIVE NEGOTIATIONS', value: String(Number(item.value ?? 0)), sub: textOf(item.sub), target: 'collab' };
    }),
    funnel: funnel.map((row, index) => {
      const item = asRecord(row) ?? {};
      const stage = textOf(item.stage);
      return {
        label: FUNNEL_LABEL[stage] ?? stage,
        count: Number(item.count ?? 0),
        value: moneyLabel(item.value),
        color: FUNNEL_COLOR[index] ?? '#64748B',
      };
    }),
  };
}

export async function loadActivity(signal?: AbortSignal): Promise<LiveActivity[]> {
  const body = await apiRequest<{ data?: unknown[] }>('/overview/activity?limit=20', { signal });
  return (body.data ?? []).map((row) => {
    const item = asRecord(row) ?? {};
    const kind = textOf(item.kind);
    const severity = textOf(item.severity);
    const ref = asRecord(item.ref);
    return {
      text: textOf(item.text, 'Activity'),
      meta: textOf(item.meta),
      time: ago(item.at),
      icon: KIND_ICON[kind] ?? 'doc',
      tone: severity === 'high' || severity === 'critical' ? 'red' : severity === 'medium' ? 'amber' : 'navy',
      ref: textOf(ref?.id),
    };
  });
}
