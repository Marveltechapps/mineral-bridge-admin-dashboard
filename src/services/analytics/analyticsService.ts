import { apiRequest } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import { asRecord, moneyLabel, statusLabel, textOf } from '@/lib/wire';

export interface AnalyticsView {
  kpis: Array<{ label: string; value: string; sub: string }>;
  gmv: Array<[string, number, string]>;
  tiers: Array<[string, number, number, string]>;
  stages: Array<[string, number, 'good' | 'warn' | 'bad']>;
  engagement: Array<[string, string, string]>;
  auction: number[];
  yoy: string;
  bottleneck: string;
}

const TIER_LABEL = ['', 'Tier 1 · Individual', 'Tier 2 · Small group / SME', 'Tier 3 · Registered company'];
const TIER_COLOR = ['', 'var(--line4)', '#6B7290', '#C8962F'];
const ENGAGE = { lessons_started: 'Lessons started', lessons_completed: 'Lessons completed', certificates_issued: 'Certificates issued' };

function signed(value: number, suffix: string): string {
  const n = Number(value.toFixed(1));
  return `${n > 0 ? '+' : ''}${n}${suffix}`;
}

function tone(status: string): 'good' | 'warn' | 'bad' {
  if (status === 'bad') return 'bad';
  if (status === 'warn') return 'warn';
  return 'good';
}

export async function loadAnalytics(signal?: AbortSignal): Promise<AnalyticsView> {
  const body = await apiRequest<Record<string, unknown>>(ENDPOINTS.analytics.summary, { signal });
  const kpis = Array.isArray(body.kpis) ? body.kpis.map((item) => asRecord(item) ?? {}) : [];
  const byKey = new Map(kpis.map((row) => [textOf(row.key), row]));
  const gmv = byKey.get('gmv');
  const accounts = byKey.get('active_accounts');
  const cycle = byKey.get('avg_order_cycle_days');
  const fill = byKey.get('auction_fill_rate');
  const minerals = Array.isArray(body.gmvByMineral) ? body.gmvByMineral.map((item) => asRecord(item) ?? {}) : [];
  const tiers = Array.isArray(body.tierDistribution) ? body.tierDistribution.map((item) => asRecord(item) ?? {}) : [];
  const stages = Array.isArray(body.stageBottlenecks) ? body.stageBottlenecks.map((item) => asRecord(item) ?? {}) : [];
  const learn = Array.isArray(body.academyEngagement) ? body.academyEngagement.map((item) => asRecord(item) ?? {}) : [];
  const auction = asRecord(body.auctionPerformance);
  const points = Array.isArray(auction?.points) ? auction.points.map((item) => Number(asRecord(item)?.value ?? 0)) : [];
  const worst = stages.filter((row) => textOf(row.status) === 'bad').sort((a, b) => Number(b.avgDays) - Number(a.avgDays))[0];
  return {
    kpis: [
      { label: 'GMV', value: moneyLabel(gmv?.value), sub: `${signed(Number(gmv?.deltaPct ?? 0), '%')} vs prior window` },
      { label: 'ACTIVE ACCOUNTS', value: textOf(accounts?.value, '0'), sub: `${signed(Number(accounts?.delta ?? 0), '')} new in window` },
      { label: 'AVG ORDER CYCLE', value: `${textOf(cycle?.value, '0')} days`, sub: `${signed(Number(cycle?.delta ?? 0), '')} days` },
      { label: 'AUCTION FILL RATE', value: `${textOf(fill?.valuePct, '0')}%`, sub: `${signed(Number(fill?.deltaPts ?? 0), '')} pts` },
    ],
    gmv: minerals.map((row) => [textOf(row.mineral, 'Unknown'), Number(asRecord(row.value)?.amount ?? 0), moneyLabel(row.value)]),
    tiers: tiers.map((row) => {
      const tier = Number(row.tier ?? 0);
      return [TIER_LABEL[tier] ?? `Tier ${tier}`, Number(row.users ?? 0), Number(row.pct ?? 0), TIER_COLOR[tier] ?? 'var(--line4)'];
    }),
    stages: stages.map((row) => [statusLabel(row.stage), Number(row.avgDays ?? 0), tone(textOf(row.status))]),
    engagement: learn.map((row) => [ENGAGE[textOf(row.key) as keyof typeof ENGAGE] ?? textOf(row.key), Number(row.value ?? 0).toLocaleString('en-US'), signed(Number(row.deltaPct ?? 0), '%')]),
    auction: points,
    yoy: `${signed(Number(auction?.yoyPct ?? 0), '%')} year on year`,
    bottleneck: worst ? `${statusLabel(worst.stage)} is ${Number(worst.avgDays ?? 0).toFixed(1)} days against a ${Number(worst.targetDays ?? 0).toFixed(1)} day target` : 'No stage is over its target',
  };
}
