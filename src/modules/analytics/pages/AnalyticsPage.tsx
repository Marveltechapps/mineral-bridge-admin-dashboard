import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Bar } from '@/components/ui/Misc';
import { StatCard } from '@/components/ui/StatCard';
import { Text } from '@/components/ui/Text';
import styles from '../Analytics.module.css';
import layout from '@/styles/layout.module.css';

const KPIS = [
  { label: 'GMV · 90 DAYS', value: '$110.0M', sub: '+14.2% vs prior 90' },
  { label: 'ACTIVE ACCOUNTS', value: '8,412', sub: '+312 this month' },
  { label: 'AVG ORDER CYCLE', value: '15.0 days', sub: '−1.8 days' },
  { label: 'AUCTION FILL RATE', value: '82%', sub: '+6 pts' },
];

const GMV: Array<[string, number, string]> = [
  ['Gold Concentrate', 42.8, '$42.8M'],
  ['Silver Bullion', 21.4, '$21.4M'],
  ['Platinum Sponge', 16.2, '$16.2M'],
  ['Copper Cathode', 11.9, '$11.9M'],
  ['Cobalt Hydroxide', 7.4, '$7.4M'],
  ['Tantalite (Coltan)', 6.1, '$6.1M'],
  ['Other minerals', 4.2, '$4.2M'],
];

const TIERS: Array<[string, number, number, string]> = [
  ['Tier 1 · Individual', 5124, 61, 'var(--line4)'],
  ['Tier 2 · Small group / SME', 2488, 30, '#6B7290'],
  ['Tier 3 · Registered company', 800, 9, '#C8962F'],
];

const STAGES_B: Array<[string, number, 'good' | 'warn' | 'bad']> = [
  ['Verification', 1.8, 'good'],
  ['Pricing confirmation', 2.4, 'good'],
  ['Agent visit', 4.9, 'bad'],
  ['Inspection & approval', 1.6, 'good'],
  ['Payment released', 1.2, 'good'],
  ['Custody transfer', 3.1, 'warn'],
];

const ENGAGEMENT = [
  ['Lessons started', '7,412', '+9.2%'],
  ['Lessons completed', '4,966', '+11.4%'],
  ['Certificates issued', '1,108', '+18.1%'],
  ['Avg lessons per user', '3.4', '+0.4'],
];

const AUCTION_SERIES = [62, 71, 68, 79, 74, 86, 91, 84, 96, 102, 98, 108];

function AuctionChart() {
  const pts = AUCTION_SERIES.map((v, i) => [(i / (AUCTION_SERIES.length - 1)) * 620 + 30, 160 - ((v - 55) / 60) * 120]);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  return (
    <svg viewBox="0 0 680 180" width="100%" height={180} preserveAspectRatio="none" role="img" aria-label="Average bids per auction rose from 62 to 108 over 12 months">
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={30} x2={650} y1={30 + i * 43} y2={30 + i * 43} style={{ stroke: 'var(--chGrid)' }} strokeWidth={1} />
      ))}
      <path d={line} fill="none" style={{ stroke: 'var(--chGold)' }} strokeWidth={2.5} strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={3.2} style={{ fill: 'var(--chDot)', stroke: 'var(--chGold)' }} strokeWidth={2} />
      ))}
    </svg>
  );
}

/** Inline card title (the design places these spans directly in the card block). */
function CardTitle({ children }: { children: string }) {
  return (
    <Text as="h2" font="display" size={15} weight={700} tone="ink" style={{ margin: 0, display: 'inline' }}>
      {children}
    </Text>
  );
}

export default function AnalyticsPage() {
  return (
    <div className={layout.page}>
      <div className={layout.stats4}>
        {KPIS.map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} sub={k.sub} subTone="ok" />
        ))}
      </div>

      <div className={styles.pair}>
        <Card radius={20} padding="22px 24px">
          <CardTitle>GMV by mineral · last 90 days</CardTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginTop: 18 }}>
            {GMV.map(([label, v, value]) => (
              <div key={label} className={styles.gmvRow}>
                <Text size={12.5} weight={600} tone="ink">
                  {label}
                </Text>
                <Bar pct={((v / 42.8) * 100).toFixed(1) + '%'} height={13} radius={7} fillRadius={6} fill="linear-gradient(90deg,#1E2A5A,#3B4A87)" />
                <Text size={12.5} weight={800} tone="ink" align="right">
                  {value}
                </Text>
              </div>
            ))}
          </div>
        </Card>

        <Card radius={20} padding="22px 24px">
          <CardTitle>Tier distribution of active users</CardTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 18 }}>
            {TIERS.map(([label, count, pct, color]) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
                  <Text size={12.5} weight={700} tone="ink">
                    {label}
                  </Text>
                  <Text size={12.5} weight={800} tone="ink">
                    {pct}%
                  </Text>
                </div>
                <Bar pct={pct} height={11} radius={6} fill={color} />
                <Text size={11} weight={600} tone="ink3">
                  {count.toLocaleString('en-US')} users
                </Text>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className={styles.pair}>
        <Card radius={20} padding="22px 24px 14px">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Text as="h2" font="display" size={15} weight={700} tone="ink" style={{ margin: 0 }}>
                Auction performance over time
              </Text>
              <Text size={11.5} weight={600} tone="ink3">
                Average bids per auction · 12 months to Sep 2026
              </Text>
            </div>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 800, color: 'var(--okInk)' }}>
              <Icon name="up" size={12} />
              +74% year on year
            </span>
          </div>
          <div style={{ marginTop: 12 }}>
            <AuctionChart />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 6px 6px', fontSize: 10.5, fontWeight: 700, color: 'var(--ink3)' }}>
            {['Oct 25', 'Jan 26', 'Apr 26', 'Jul 26', 'Sep 26'].map((a) => (
              <span key={a}>{a}</span>
            ))}
          </div>
        </Card>

        <Card radius={20} padding="22px 24px">
          <CardTitle>Academy engagement</CardTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {ENGAGEMENT.map(([label, value, delta]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: 11, borderBottom: '1px solid var(--surf3)' }}>
                <Text size={12.5} weight={600} tone="ink">
                  {label}
                </Text>
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <Text font="display" size={17} weight={700} tone="ink">
                    {value}
                  </Text>
                  <Text size={11.5} weight={800} tone="ok">
                    {delta}
                  </Text>
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card radius={20} padding="22px 24px">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <Text as="h2" font="display" size={15} weight={700} tone="ink" style={{ margin: 0 }}>
            Order pipeline bottlenecks · average days per stage
          </Text>
          <Text size={11.5} weight={700} tone="err">
            Agent visit scheduling is 2.0 days over target
          </Text>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginTop: 18 }}>
          {STAGES_B.map(([label, v, s]) => (
            <div key={label} className={styles.stageRow}>
              <Text size={12.5} weight={600} tone="ink">
                {label}
              </Text>
              <Bar
                pct={((v / 5.2) * 100).toFixed(1) + '%'}
                height={13}
                radius={7}
                fillRadius={6}
                fill={s === 'bad' ? 'var(--errInk)' : s === 'warn' ? 'var(--warnInk)' : 'var(--okInk2)'}
              />
              <Text size={12.5} weight={800} tone="ink" align="right">
                {v.toFixed(1)} days
              </Text>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
