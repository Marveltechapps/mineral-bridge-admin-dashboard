import type { KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FilterChips } from '@/components/ui/Chip';
import { DataRow, DataTable, HeadCell, TableEmpty } from '@/components/ui/DataTable';
import { Bar } from '@/components/ui/Misc';
import { CloseButton } from '@/components/ui/Modal';
import { Pill } from '@/components/ui/Pill';
import { StatCard } from '@/components/ui/StatCard';
import { Text } from '@/components/ui/Text';
import { ROUTES } from '@/constants/routes';
import { useQueryMatch } from '@/hooks/useConsoleData';
import { FILTER_DEFAULTS, consoleActions, useConsole } from '@/store/consoleStore';
import { useLiveList, useRemoteValue } from '@/hooks/useLiveList';
import { COLLAB_STATS, CONTRACTS, NEGOTIATIONS, NEG_FILTERS, TOP_MINERS, TOP_TRADERS, getCollabStats, getContracts, getMinerRankings, getNegotiations, getTraderRankings } from '@/services/collab';
import type { Negotiation } from '@/types/collab';
import styles from '../Collab.module.css';
import layout from '@/styles/layout.module.css';

const COLS = '1.05fr 2.1fr 1.6fr 1.15fr .85fr 1.15fr .9fr';

function NegotiationPanel({ n }: { n: Negotiation }) {
  const agreed = n.status === 'Terms agreed';
  return (
    <Card padding="22px 24px" style={{ animation: 'mbFadeUp .3s ease' }}>
      <section aria-label={`Negotiation ${n.id}`}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, paddingBottom: 16, borderBottom: '1px solid var(--surf3)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Text as="h2" font="display" size={17} weight={700} tone="ink" style={{ margin: 0 }}>
                {n.miner} ↔ {n.trader}
              </Text>
              <Pill tone={n.tone}>{n.status}</Pill>
            </span>
            <Text size={12} weight={600} tone="ink2">
              {n.id} · {n.goods}
            </Text>
          </div>
          <CloseButton onClick={() => consoleActions.set({ negSel: null })} label="Close negotiation" />
        </div>
        <div className={styles.negGrid}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, borderRadius: 16, background: 'var(--surf2)', border: '1px solid var(--line)' }}>
            <Text size={10.5} weight={800} ls={1.1} tone="ink3">
              OFFER HISTORY · MINER LEFT, TRADER RIGHT
            </Text>
            {n.history.map(([side, price], i) => {
              const miner = side === 'Miner';
              return (
                <span key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: '70%', alignSelf: miner ? 'flex-start' : 'flex-end' }}>
                  <span
                    style={{
                      padding: '10px 14px',
                      borderRadius: 14,
                      fontSize: 13,
                      fontWeight: 800,
                      background: miner ? 'var(--surf3)' : '#1E2A5A',
                      color: miner ? 'var(--ink)' : '#fff',
                    }}
                  >
                    ${price.toLocaleString('en-US')} / unit
                  </span>
                  <Text size={10.5} weight={700} tone="ink3" align={miner ? 'left' : 'right'}>
                    Round {i + 1} · {miner ? n.miner : n.trader}
                  </Text>
                </span>
              );
            })}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <Text size={10.5} weight={800} ls={1.1} tone="ink3">
              DESK ACTIONS
            </Text>
            {agreed ? (
              <Button
                variant="success"
                h={44}
                r={13}
                fs={13}
                onClick={() => {
                  consoleActions.notify(`Contract drafted for ${n.id} — sent to both parties for e-signature`);
                  consoleActions.set({ negSel: null });
                }}
              >
                Convert to contract
              </Button>
            ) : (
              <Button
                variant="primary"
                h={44}
                r={13}
                fs={13}
                onClick={() =>
                  consoleActions.openDrawer({
                    title: `Mediate ${n.id}`,
                    sub: `${n.miner} and ${n.trader} · ${n.goods}`,
                    fields: [
                      { label: 'SUGGESTED PRICE', value: `$${Math.round((n.ask + n.offer) / 2).toLocaleString('en-US')}`, hint: 'Midpoint of current ask and offer' },
                      { label: 'VALID FOR', value: '48 hours' },
                      { label: 'NOTE TO BOTH PARTIES', kind: 'area' },
                    ],
                    cta: 'Send mediated offer',
                    done: `Mediated offer sent on ${n.id}`,
                    draft: 'Mediation saved as a draft',
                  })
                }
              >
                Mediate with suggested price
              </Button>
            )}
            <Button variant="secondary" h={42} r={13} onClick={() => consoleActions.notify(`Reminder sent to ${n.status === 'Awaiting trader' ? n.trader : n.miner}`)}>
              Send reminder
            </Button>
          </div>
        </div>
      </section>
    </Card>
  );
}

function RankList({ title, rows }: { title: string; rows: typeof TOP_MINERS }) {
  return (
    <Card padding="16px 20px">
      <Text as="h2" font="display" size={14.5} weight={700} tone="ink" style={{ margin: 0, display: 'inline' }}>
        {title}
      </Text>
      <ol style={{ display: 'flex', flexDirection: 'column', gap: 13, marginTop: 14, marginBottom: 0, padding: 0, listStyle: 'none' }}>
        {rows.map((m, i) => (
          <li key={m.name} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <Text size={11} weight={800} tone="ink3" style={{ width: 20 }}>
                {i + 1}
              </Text>
              <Text size={12.5} weight={700} tone="ink" ellipsis style={{ flex: 1, minWidth: 0 }}>
                {m.name}
              </Text>
              <Text font="display" size={13} weight={700} tone="ink">
                {m.rating.toFixed(1)}
              </Text>
            </span>
            <Bar pct={((m.rating / 5) * 100).toFixed(0) + '%'} height={5} radius={3} fillRadius={4} fill="linear-gradient(90deg,#F7DD8E,#C8962F)" style={{ marginLeft: 29 }} />
            <Text size={10.5} weight={600} tone="ink3" style={{ marginLeft: 29 }}>
              {m.deals} deals · {m.ontime}
            </Text>
          </li>
        ))}
      </ol>
    </Card>
  );
}

export default function CollabPage() {
  const navigate = useNavigate();
  const match = useQueryMatch();
  const filter = useConsole((s) => s.filters.negFilter);
  const selId = useConsole((s) => s.negSel);
  const live = useLiveList(getNegotiations, NEGOTIATIONS);
  const contracts = useLiveList(getContracts, CONTRACTS);
  const stats = useRemoteValue(getCollabStats);
  const miners = useRemoteValue(getMinerRankings);
  const traders = useRemoteValue(getTraderRankings);
  const sel = live.rows.find((n) => n.id === selId);
  const rows = live.rows.filter((n) => (filter === 'All negotiations' || n.status === filter) && match([n.id, n.miner, n.trader, n.goods, n.status]));

  return (
    <div className={layout.stack16}>
      <div className={layout.stats4}>
        {(stats.demoMode ? COLLAB_STATS : (stats.data ?? [])).map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} />
        ))}
      </div>

      {sel && <NegotiationPanel key={sel.id} n={sel} />}

      <FilterChips filterKey="negFilter" options={NEG_FILTERS} label="Filter negotiations" />

      <Card clip>
        <DataTable
          label="Negotiations"
          cols={COLS}
          minWidth={960}
          header={
            <>
              <HeadCell>NEGOTIATION</HeadCell>
              <HeadCell>MINER ↔ TRADER</HeadCell>
              <HeadCell>MINERAL · QUANTITY</HeadCell>
              <HeadCell>ASK / OFFER</HeadCell>
              <HeadCell>ROUNDS</HeadCell>
              <HeadCell>STATUS</HeadCell>
              <HeadCell>LAST ACTIVITY</HeadCell>
            </>
          }
        >
          {rows.map((n) => {
            const gap = ((n.ask - n.offer) / n.ask) * 100;
            return (
              <DataRow key={n.id} onClick={() => consoleActions.set({ negSel: n.id })} label={`Open negotiation ${n.id}`}>
                <Text size={12.5} weight={800} tone="brand">
                  {n.id}
                </Text>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <Text size={12.5} weight={700} tone="ink" ellipsis>
                    {n.miner}
                  </Text>
                  <Text size={11} weight={600} tone="ink3" ellipsis>
                    ↔ {n.trader}
                  </Text>
                </span>
                <Text size={12} weight={600} tone="ink">
                  {n.goods}
                </Text>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Text size={12} weight={800} tone="ink">
                    ${n.ask.toLocaleString('en-US')} / ${n.offer.toLocaleString('en-US')}
                  </Text>
                  <Text size={11.5} weight={800} tone={gap < 1 ? 'ok' : gap < 4 ? 'warn' : 'err'}>
                    {gap.toFixed(1)}% gap
                  </Text>
                </span>
                <Text size={12} weight={700} tone="ink2">
                  {n.rounds} rounds
                </Text>
                <Pill tone={n.tone}>{n.status}</Pill>
                <Text size={11.5} weight={600} tone="ink2">
                  {n.last}
                </Text>
              </DataRow>
            );
          })}
        </DataTable>
        {rows.length === 0 && <TableEmpty>No negotiations match this filter or search.</TableEmpty>}
      </Card>

      <div className={styles.bottom}>
        <Card clip>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--surf3)' }}>
            <Text as="h2" font="display" size={14.5} weight={700} tone="ink" style={{ margin: 0, display: 'inline' }}>
              Contracts signed
            </Text>
          </div>
          {contracts.rows.map((c) => {
            const open = () => {
              consoleActions.set((s) => ({ lcSel: c.lc, negSel: null, filters: { ...s.filters, lcFilter: FILTER_DEFAULTS.lcFilter } }));
              navigate(ROUTES.lc);
            };
            return (
              <div
                key={c.id}
                className={styles.contract}
                role="button"
                tabIndex={0}
                onClick={open}
                onKeyDown={(e: KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    open();
                  }
                }}
              >
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Text size={12} weight={800} tone="brand">
                    {c.id} <span style={{ fontWeight: 600, color: 'var(--ink3)' }}>· {c.date}</span>
                  </Text>
                  <Text size={12} weight={600} tone="ink" ellipsis>
                    {c.parties}
                  </Text>
                  <Text size={11} weight={600} tone="ink3">
                    {c.goods} · {c.lc}
                  </Text>
                </span>
                <Text size={12.5} weight={800} tone="ink">
                  {c.value}
                </Text>
              </div>
            );
          })}
        </Card>
        <RankList title="Top-rated miners" rows={miners.demoMode ? TOP_MINERS : (miners.data ?? [])} />
        <RankList title="Top-rated traders" rows={traders.demoMode ? TOP_TRADERS : (traders.data ?? [])} />
      </div>
    </div>
  );
}
