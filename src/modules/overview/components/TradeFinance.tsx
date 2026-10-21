import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Bar } from '@/components/ui/Misc';
import { Text } from '@/components/ui/Text';
import { Loader } from '@/components/ui/Loader';
import { useRemoteValue } from '@/hooks/useLiveList';
import { INK_VAR, LC_FUNNEL, TRADE_KPIS, loadTradeFinance } from '@/services/overview';
import styles from '../Overview.module.css';

/** Six trade-finance KPI tiles. */
export function TradeKpis({ onOpen }: { onOpen: (target: 'collab' | 'lc' | 'chain') => void }) {
  const remote = useRemoteValue(loadTradeFinance);
  if (!remote.demoMode && remote.loading) return <Loader label="Loading trade finance" />;
  if (!remote.demoMode && remote.error) return <p role="alert">{remote.error}</p>;
  const tiles = remote.demoMode ? TRADE_KPIS : (remote.data?.tiles ?? []);
  return (
    <div className={styles.trade}>
      {tiles.map((k) => {
        const inkKey = 'ink' in k ? (k as { ink: keyof typeof INK_VAR }).ink : undefined;
        const ink = inkKey ? INK_VAR[inkKey] : 'var(--ink2)';
        return (
        <Card key={k.label} lift padding={16} onClick={() => onOpen(k.target)} ariaLabel={`${k.label}: ${k.value}`} style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <Text size={10} weight={800} ls={1} tone="ink3" lh={1.35} style={{ minHeight: 27 }}>
            {k.label}
          </Text>
          <Text font="display" size={24} weight={700} ls={-0.7} tone="ink" lh={1}>
            {k.value}
          </Text>
          {k.bar !== undefined && <Bar pct={k.bar} height={6} radius={4} fill="linear-gradient(90deg,#16A34A,#15803D)" />}
          <span style={{ fontSize: 11.5, fontWeight: 700, color: ink }}>{k.sub}</span>
        </Card>
        );
      })}
    </div>
  );
}

/** Letters-of-credit funnel; each stage opens LC & Payments filtered to it. */
export function LcPipeline({ onOpenLc, onStage }: { onOpenLc: () => void; onStage: (stage: string) => void }) {
  const remote = useRemoteValue(loadTradeFinance);
  const funnel = remote.demoMode ? LC_FUNNEL : (remote.data?.funnel ?? []);
  const widthBase = Math.max(...funnel.map((stage) => stage.count), 1);
  return (
    <Card padding="20px 24px">
      <div className={styles.funnelHead}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Text font="display" size={14.5} weight={700} tone="ink">
            LC pipeline
          </Text>
          <Text size={11.5} weight={600} tone="ink3">
            Letters of credit by stage · last 90 days · click a stage to filter
          </Text>
        </div>
        <Button variant="secondary" h={36} px={14} r={12} fs={12.5} iconEnd="arrowRight" onClick={onOpenLc}>
          Open LC &amp; Payments
        </Button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {remote.loading && <Loader label="Loading letters of credit" />}
        {funnel.map((s, i) => {
          const previous = funnel[i - 1];
          const conv = i === 0 || !previous?.count ? 'Entry stage' : `${Math.round((s.count / previous.count) * 100)}% of ${previous.label.toLowerCase()}`;
          return (
            <button key={s.label} type="button" className={styles.funnelRow} onClick={() => onStage(s.label)} aria-label={`${s.label}: ${s.count} LCs, ${s.value}. Filter LC list`}>
              <Text size={12.5} weight={700} tone="ink" style={{ paddingLeft: 6 }}>
                {s.label}
              </Text>
              <span style={{ display: 'block', height: 34 }}>
                <span className={styles.funnelBar} style={{ width: `${((s.count / widthBase) * 100).toFixed(1)}%`, background: s.color, animationDelay: `${(i * 0.08).toFixed(2)}s` }}>
                  {s.count} LCs
                </span>
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'right', paddingRight: 6 }}>
                <Text size={13} weight={800} tone="ink">
                  {s.value}
                </Text>
                <Text size={10.5} weight={600} tone="ink3">
                  {conv}
                </Text>
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
