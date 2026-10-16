import { useMemo, type CSSProperties } from 'react';
import { Card } from '@/components/ui/Card';
import { Chip, FilterChips } from '@/components/ui/Chip';
import { DataRow, DataTable, HeadCell, SortHead, TableEmpty } from '@/components/ui/DataTable';
import { Icon } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { Eyebrow, Text } from '@/components/ui/Text';
import { Toggle } from '@/components/ui/Toggle';
import { useQueryMatch, useSorted } from '@/hooks/useConsoleData';
import { consoleActions, useConsole } from '@/store/consoleStore';
import type { RateRange } from '@/types/console';
import { numeric } from '@/lib/collection';
import { RateChart } from '../components/RateChart';
import { RANGE_AXIS, RANGE_LABEL, RATES, rateHistory, rateKey } from '@/services/pricing';
import type { Rate } from '@/types/pricing';
import layout from '@/styles/layout.module.css';
import pricing from '../Pricing.module.css';

const COLS = '1.3fr 1.35fr 1fr 1fr .75fr 1.35fr .9fr';

export default function RatesPage() {
  const match = useQueryMatch();
  const overrides = useConsole((s) => s.overrides);
  const source = useConsole((s) => s.filters.rateSource);
  const focus = useConsole((s) => s.rateFocus);
  const range = useConsole((s) => s.rateRange);

  const effective = (r: Rate): Rate => {
    const flipped = overrides[rateKey(r)];
    if (flipped === undefined) return r;
    return { ...r, source: flipped ? 'Manual override' : 'Market feed', updated: 'just now' };
  };

  const rows = useSorted(
    RATES.map(effective).filter((r) => (source === 'All sources' || r.source === source) && match([r.mineral, r.grade, r.source])),
    'pricing',
    { mineral: (r) => r.mineral, buy: (r) => numeric(r.buy), sell: (r) => numeric(r.sell), trend: (r) => r.trend },
  );

  const toggle = (r: Rate) => {
    const key = rateKey(r);
    const base = RATES.find((x) => rateKey(x) === key);
    consoleActions.set((s) => {
      const cur = s.overrides[key];
      return { overrides: { ...s.overrides, [key]: !(cur === undefined ? base?.source === 'Manual override' : cur) } };
    });
    consoleActions.notify(`${r.mineral} ${r.grade} switched to ${r.source === 'Manual override' ? 'market feed' : 'manual desk rate'}`);
  };

  const focusRow = RATES.find((r) => r.mineral === focus) ?? RATES[0];
  const hist = useMemo(() => rateHistory(numeric(focusRow.buy), focus.length), [focusRow, focus]);
  const change = ((hist[11] - hist[0]) / hist[0]) * 100;
  const meta = [
    { k: 'Start', v: hist[0].toLocaleString('en-US') },
    { k: 'High', v: Math.max(...hist).toLocaleString('en-US') },
    { k: 'Low', v: Math.min(...hist).toLocaleString('en-US') },
    { k: '12-week change', v: `${change > 0 ? '+' : ''}${change.toFixed(1)}%` },
  ];

  return (
    <div className={layout.page}>
      <FilterChips filterKey="rateSource" options={['All sources', 'Market feed', 'Manual override']} label="Filter rates by source" />

      <Card clip>
        <DataTable
          label="Live rate table"
          cols={COLS}
          minWidth={960}
          header={
            <>
              <SortHead mod="pricing" k="mineral">MINERAL</SortHead>
              <HeadCell>GRADE / FORM</HeadCell>
              <SortHead mod="pricing" k="buy">BUY RATE</SortHead>
              <SortHead mod="pricing" k="sell">SELL RATE</SortHead>
              <SortHead mod="pricing" k="trend">24H</SortHead>
              <HeadCell>SOURCE</HeadCell>
              <HeadCell align="right">LAST UPDATED</HeadCell>
            </>
          }
        >
          {rows.map((r) => (
            <DataRow
              key={rateKey(r)}
              onClick={() => consoleActions.set({ rateFocus: r.mineral })}
              label={`Show rate history for ${r.mineral} ${r.grade}`}
              style={{ '--row-bg': focus === r.mineral ? 'var(--surf4)' : 'var(--surf)' } as CSSProperties}
            >
              <Text size={12.5} weight={700} tone="ink">
                {r.mineral}
              </Text>
              <Text size={12} weight={600} tone="ink2">
                {r.grade}
              </Text>
              <Text size={12.5} weight={800} tone="ink">
                {r.buy}
              </Text>
              <Text size={12.5} weight={800} tone="ink">
                {r.sell}
              </Text>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 800, color: r.trend > 0 ? 'var(--okInk)' : 'var(--errInk)' }}>
                <Icon name={r.trend > 0 ? 'up' : 'down'} size={12} />
                {(r.trend > 0 ? '+' : '') + r.trend.toFixed(1)}%
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <Toggle on={r.source === 'Manual override'} label={`Manual desk rate for ${r.mineral} ${r.grade}`} onClick={() => toggle(r)} />
                <Pill tone={r.source === 'Market feed' ? 'blue' : 'gold'}>{r.source}</Pill>
              </span>
              <Text size={11.5} weight={600} tone="ink3" align="right">
                {r.updated}
              </Text>
            </DataRow>
          ))}
        </DataTable>
        {rows.length === 0 && <TableEmpty>No rates match this filter or search.</TableEmpty>}
      </Card>

      <div className={layout.detail}>
        <Card radius={20} padding="20px 24px 14px">
          <div className={pricing.chartHead}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Text as="h2" font="display" size={15} weight={700} tone="ink" style={{ margin: 0 }}>
                Rate history · {focus}
              </Text>
              <Text size={11.5} weight={600} tone="ink3">
                Buy rate per {focusRow.buy.split(' / ')[1]} · {focusRow.grade} · {RANGE_LABEL[range]} to 12 Sep 2026
              </Text>
            </div>
            <div style={{ display: 'flex', gap: 6 }} role="group" aria-label="Chart range">
              {(['12W', '6M', '1Y'] as RateRange[]).map((r) => (
                <Chip key={r} variant="range" active={range === r} onClick={() => consoleActions.set({ rateRange: r })}>
                  {r}
                </Chip>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <RateChart hist={hist} label={`Buy rate history for ${focus}`} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 4px 8px', fontSize: 10.5, fontWeight: 700, color: 'var(--ink3)' }}>
            {RANGE_AXIS[range].map((a) => (
              <span key={a}>{a}</span>
            ))}
          </div>
        </Card>

        <Card radius={20} padding={20} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Eyebrow>PERIOD SUMMARY</Eyebrow>
          {meta.map((m) => (
            <div key={m.k} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, paddingBottom: 11, borderBottom: '1px solid var(--surf3)' }}>
              <Text size={12} weight={600} tone="ink2">
                {m.k}
              </Text>
              <Text font="display" size={15} weight={700} tone="ink">
                {m.v}
              </Text>
            </div>
          ))}
          <div style={{ padding: 14, borderRadius: 14, background: 'var(--tAmber2)', border: '1px solid var(--tAmber)' }}>
            <Text as="div" size={11} weight={800} ls={0.8} tone="warn">
              OVERRIDE IN FORCE
            </Text>
            <Text as="div" size={11.5} weight={600} tone="goldInk" lh={1.5} style={{ marginTop: 5 }}>
              Cobalt Hydroxide and Rhodium Sponge are on manual desk rates. Feed prices resume when toggled off.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}
