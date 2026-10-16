import { Card } from '@/components/ui/Card';
import { Bar } from '@/components/ui/Misc';
import { StatCard } from '@/components/ui/StatCard';
import { Text } from '@/components/ui/Text';
import { ACADEMY_STATS, COMPLETION, TIER_COLORS } from '@/services/academy';
import styles from '../Academy.module.css';
import layout from '@/styles/layout.module.css';

export default function CompletionPage() {
  return (
    <div className={layout.page}>
      <div className={layout.stats4}>
        {ACADEMY_STATS.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} />
        ))}
      </div>
      <Card radius={20} padding="22px 24px">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <Text as="h2" font="display" size={15} weight={700} tone="ink" style={{ margin: 0 }}>
            Completion rate per course, split by account tier
          </Text>
          <span style={{ display: 'flex', gap: 14 }}>
            {['Tier 1', 'Tier 2', 'Tier 3'].map((t, i) => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--ink2)' }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: TIER_COLORS[i] }} aria-hidden="true" />
                {t}
              </span>
            ))}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 20 }}>
          {COMPLETION.map((c) => (
            <div key={c.title} className={styles.completionRow}>
              <Text size={12.5} weight={700} tone="ink">
                {c.title}
              </Text>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Bar pct={c.rate} height={11} radius={6} fillRadius={5} fill="linear-gradient(90deg,#1E2A5A,#3B4A87)" />
                {c.tiers.map((v, i) => (
                  <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <Text size={10} weight={800} tone="ink3" style={{ width: 16 }}>
                      T{i + 1}
                    </Text>
                    <Bar pct={v} height={5} radius={3} fill={TIER_COLORS[i]} style={{ flex: 1 }} />
                    <Text size={10} weight={700} tone="ink2" align="right" style={{ width: 30 }}>
                      {v}%
                    </Text>
                  </span>
                ))}
              </span>
              <Text font="display" size={17} weight={700} tone="ink" align="right">
                {c.rate}%
              </Text>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
