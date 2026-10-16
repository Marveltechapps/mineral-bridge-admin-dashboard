import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { STAGE_BAR } from '@/services/overview';
import styles from '../Overview.module.css';

function Kpi({ label, value, children, onClick }: { label: string; value: string; children: ReactNode; onClick: () => void }) {
  return (
    <Card lift padding={18} onClick={onClick} ariaLabel={`${label}: ${value}`} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Text size={10.5} weight={800} ls={1.1} tone="ink3">
        {label}
      </Text>
      <Text font="display" size={31} weight={700} ls={-1} tone="ink" lh={1}>
        {value}
      </Text>
      {children}
    </Card>
  );
}

function Trend({ tone, text, after }: { tone: 'warn' | 'ok'; text: string; after: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: `var(--${tone === 'warn' ? 'warnInk' : 'okInk'})` }}>
      <span style={{ display: 'flex' }}>
        <Icon name="up" size={12} />
      </span>
      {text}
      <span style={{ color: 'var(--ink3)', fontWeight: 600 }}>{after}</span>
    </span>
  );
}

const total = STAGE_BAR.reduce((a, s) => a + s.count, 0);

export interface KpiTargets {
  kyc: () => void;
  orders: () => void;
  vault: () => void;
  auctions: () => void;
  settlements: () => void;
}

/** The five headline KPI cards at the top of the overview. */
export function KpiRow({ go }: { go: KpiTargets }) {
  return (
    <div className={styles.kpis}>
      <Kpi label="PENDING KYC REVIEWS" value="27" onClick={go.kyc}>
        <Trend tone="warn" text="6 vs last week" after="· 4 overdue" />
      </Kpi>

      <Kpi label="ACTIVE ORDERS BY STAGE" value="184" onClick={go.orders}>
        <div style={{ display: 'flex', height: 8, borderRadius: 5, overflow: 'hidden', background: 'var(--surf3)' }} aria-hidden="true">
          {STAGE_BAR.map((s) => (
            <span key={s.short} style={{ width: `${((s.count / total) * 100).toFixed(1)}%`, background: s.color }} />
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px' }}>
          {STAGE_BAR.map((s) => (
            <span key={s.short} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: 'var(--ink2)' }}>
              <span style={{ width: 6, height: 6, borderRadius: 4, background: s.color }} />
              {/* The design's runtime lays label and count out as separate flex items (4px gap, no text space). */}
              <span>{s.short}</span>
              <span>{s.count}</span>
            </span>
          ))}
        </div>
      </Kpi>

      <Kpi label="VAULT VALUE · REALISABLE" value="$46.31M" onClick={go.vault}>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11.5, fontWeight: 700, color: 'var(--ink2)' }}>
          <span>Cost basis $42.84M</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--okInk)' }}>
            <span style={{ display: 'flex' }}>
              <Icon name="up" size={12} />
            </span>
            +8.1% unrealised
          </span>
        </span>
      </Kpi>

      <Kpi label="LIVE AUCTIONS" value="7" onClick={go.auctions}>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 11.5, fontWeight: 700, color: 'var(--ink2)' }}>
          <span>$3.14M in current bids</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--infoInk)' }}>142 bids in last 24h</span>
        </span>
      </Kpi>

      <Kpi label="SETTLEMENTS THIS WEEK" value="$8.92M" onClick={go.settlements}>
        <Trend tone="ok" text="12 settled" after="· 3 pending" />
      </Kpi>
    </div>
  );
}
