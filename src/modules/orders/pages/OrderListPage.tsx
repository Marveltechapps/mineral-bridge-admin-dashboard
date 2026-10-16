import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip, ChipDivider, ChipRow } from '@/components/ui/Chip';
import { DataRow, DataTable, SortHead } from '@/components/ui/DataTable';
import { Pill } from '@/components/ui/Pill';
import { Text } from '@/components/ui/Text';
import { ROUTES } from '@/constants/routes';
import { STAGES, STAGE_TONES } from '@/constants/tones';
import { useQueryMatch, useSorted } from '@/hooks/useConsoleData';
import { consoleActions, useConsole } from '@/store/consoleStore';
import { numeric } from '@/lib/collection';
import { useLiveOrders } from '../hooks/useOrders';
import styles from '../Orders.module.css';
import layout from '@/styles/layout.module.css';

const COLS = '1.15fr 1.2fr .62fr 1.5fr .85fr 1.3fr .62fr .7fr';
const PAGE_SIZE = 6;

export default function OrderListPage() {
  const navigate = useNavigate();
  const all = useLiveOrders();
  const match = useQueryMatch();
  const side = useConsole((s) => s.filters.orderSide);
  const stage = useConsole((s) => s.filters.orderStage);
  const page = useConsole((s) => s.orderPage);

  const filtered0 = useMemo(
    () => all.filter((o) => (side === 'All sides' || o.side === side) && (!stage || STAGES[o.idx] === stage) && match([o.id, o.mineral, o.party, o.side, STAGES[o.idx]])),
    [all, side, stage, match],
  );
  const filtered = useSorted(filtered0, 'orders', {
    id: (o) => o.id,
    mineral: (o) => o.mineral,
    side: (o) => o.side,
    party: (o) => o.party,
    qty: (o) => numeric(o.qty),
    stage: (o) => o.idx,
    days: (o) => o.days,
    agent: (o) => o.agent,
  });

  const maxPage = Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1);
  const cur = Math.min(page, maxPage);
  const rows = filtered.slice(cur * PAGE_SIZE, cur * PAGE_SIZE + PAGE_SIZE);

  const setSide = (v: string) => consoleActions.set((s) => ({ filters: { ...s.filters, orderSide: v }, orderPage: 0 }));
  const setStage = (v: string) => consoleActions.set((s) => ({ filters: { ...s.filters, orderStage: v }, orderPage: 0 }));
  const clearFilters = () => {
    consoleActions.notify('Order filters cleared');
    consoleActions.set((s) => ({ filters: { ...s.filters, orderSide: 'All sides', orderStage: '' }, query: '', orderPage: 0 }));
  };

  return (
    <div className={layout.stack14}>
      <ChipRow label="Filter orders">
        {['All sides', 'Buy', 'Sell'].map((c) => (
          <Chip key={c} active={side === c} onClick={() => setSide(c)}>
            {c}
          </Chip>
        ))}
        <ChipDivider />
        <Chip active={!stage} onClick={() => setStage('')} count={all.length}>
          All stages
        </Chip>
        {STAGES.map((c, i) => (
          <Chip key={c} active={stage === c} onClick={() => setStage(stage === c ? '' : c)} count={all.filter((o) => o.idx === i).length}>
            {c}
          </Chip>
        ))}
      </ChipRow>

      <Card clip>
        <DataTable
          label="Orders"
          cols={COLS}
          minWidth={980}
          header={
            <>
              <SortHead mod="orders" k="id">ORDER ID</SortHead>
              <SortHead mod="orders" k="mineral">MINERAL</SortHead>
              <SortHead mod="orders" k="side">SIDE</SortHead>
              <SortHead mod="orders" k="party">COUNTERPARTY</SortHead>
              <SortHead mod="orders" k="qty">QUANTITY</SortHead>
              <SortHead mod="orders" k="stage">CURRENT STAGE</SortHead>
              <SortHead mod="orders" k="days">DAYS</SortHead>
              <SortHead mod="orders" k="agent" align="end">AGENT</SortHead>
            </>
          }
        >
          {rows.map((o) => (
            <DataRow key={o.id} onClick={() => navigate(ROUTES.order(o.id))} label={`Open order ${o.id}`}>
              <Text size={12.5} weight={800} tone="brand" ls={-0.1}>
                {o.id}
              </Text>
              <Text size={12.5} weight={600} tone="ink">
                {o.mineral}
              </Text>
              <Pill tone={o.side === 'Buy' ? 'navy' : 'gold'}>{o.side}</Pill>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <Text size={12.5} weight={600} tone="ink" ellipsis>
                  {o.party}
                </Text>
                <Text size={10.5} weight={700} tone="ink3">
                  Tier {o.tier}
                </Text>
              </span>
              <Text size={12.5} weight={700} tone="ink">
                {o.qty}
              </Text>
              <Pill tone={STAGE_TONES[o.idx]}>{STAGES[o.idx]}</Pill>
              <Text size={12.5} weight={700} tone={o.days >= 5 ? 'err' : o.days >= 3 ? 'warn' : 'ink2'}>
                {o.days}d
              </Text>
              <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span className={styles.agent} title={o.agent}>
                  {o.agent}
                </span>
              </span>
            </DataRow>
          ))}
        </DataTable>
        {rows.length === 0 && (
          <div style={{ padding: 34, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <Text size={12.5} weight={600} tone="ink3">
              No orders match this filter or search.
            </Text>
            <Button variant="outline" h={34} px={15} r={12} onClick={clearFilters}>
              Clear filters and search
            </Button>
          </div>
        )}
        <div style={{ padding: '13px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>
          <span>
            Showing {rows.length} of {filtered.length} matching orders · page {cur + 1} of {maxPage + 1}
          </span>
          <span style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className={styles.pager}
              style={{ color: cur > 0 ? 'var(--ink)' : 'var(--ink3)' }}
              aria-disabled={cur === 0}
              onClick={() => (cur > 0 ? consoleActions.set({ orderPage: cur - 1 }) : consoleActions.notify('Already on the first page'))}
            >
              Previous
            </button>
            <button
              type="button"
              className={styles.pager}
              style={{ color: cur < maxPage ? 'var(--ink)' : 'var(--ink3)' }}
              aria-disabled={cur >= maxPage}
              onClick={() => (cur < maxPage ? consoleActions.set({ orderPage: cur + 1 }) : consoleActions.notify('No more orders in this filter'))}
            >
              Next
            </button>
          </span>
        </div>
      </Card>
    </div>
  );
}
