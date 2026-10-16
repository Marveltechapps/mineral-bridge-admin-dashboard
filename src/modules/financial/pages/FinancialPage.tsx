import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FilterChips } from '@/components/ui/Chip';
import { DataRow, DataTable, HeadCell, SortHead } from '@/components/ui/DataTable';
import { Pill } from '@/components/ui/Pill';
import { StatCard } from '@/components/ui/StatCard';
import { Text } from '@/components/ui/Text';
import type { Tone } from '@/constants/tones';
import { useQueryMatch, useSorted } from '@/hooks/useConsoleData';
import { consoleActions, useConsole } from '@/store/consoleStore';
import { numeric } from '@/lib/collection';
import styles from '../Financial.module.css';
import layout from '@/styles/layout.module.css';

const LEDGER: Array<{ id: string; date: string; ref: string; party: string; kind: string; amount: string; status: string; tone: Tone }> = [
  { id: 'STL-2026-4412', date: '11 Sep 2026', ref: 'MB-BUY-38217', party: 'Coast Bullion Partners', kind: 'Buy settlement', amount: '$2,380,000', status: 'Released', tone: 'green' },
  { id: 'STL-2026-4409', date: '10 Sep 2026', ref: 'MB-SELL-41889', party: 'Machakos Mining SME', kind: 'Seller payout', amount: '$343,200', status: 'Released', tone: 'green' },
  { id: 'STL-2026-4405', date: '10 Sep 2026', ref: 'MB-SELL-41688', party: 'Rift Valley Minerals Ltd', kind: 'Seller payout', amount: '$3,988,200', status: 'Released', tone: 'green' },
  { id: 'STL-2026-4401', date: '09 Sep 2026', ref: 'AUC-2026-0214', party: 'Coast Bullion Partners', kind: 'Auction settlement', amount: '$1,420,000', status: 'Released', tone: 'green' },
  { id: 'STL-2026-4398', date: '09 Sep 2026', ref: 'MB-SELL-41640', party: 'Rift Valley Minerals Ltd', kind: 'Seller payout', amount: '$412,000', status: 'On hold', tone: 'amber' },
  { id: 'STL-2026-4394', date: '08 Sep 2026', ref: 'MB-BUY-38702', party: 'Baringo Trading Co', kind: 'Buy settlement', amount: '$188,400', status: 'Disputed', tone: 'red' },
  { id: 'STL-2026-4390', date: '08 Sep 2026', ref: 'MB-SELL-41601', party: 'Nyanza Smelting Ltd', kind: 'Seller payout', amount: '$5,731,200', status: 'Released', tone: 'green' },
  { id: 'STL-2026-4386', date: '07 Sep 2026', ref: 'MB-BUY-38511', party: 'Coast Bullion Partners', kind: 'Buy settlement', amount: '$742,000', status: 'Released', tone: 'green' },
];

const ESCROW = [
  { label: 'HELD IN ESCROW', value: '$14.62M', sub: '38 open settlements' },
  { label: 'RELEASED THIS WEEK', value: '$8.92M', sub: '12 settlements' },
  { label: 'ON HOLD', value: '$600,400', sub: '2 under dispute' },
  { label: 'FEE REVENUE (SEP)', value: '$412,800', sub: '2.1% blended take' },
];

export default function FinancialPage() {
  const match = useQueryMatch();
  const filter = useConsole((s) => s.filters.ledgerFilter);
  const filtered = LEDGER.filter((l) => (filter === 'All settlements' || l.status === filter) && match([l.id, l.ref, l.party, l.kind, l.status]));
  const rows = useSorted(filtered, 'ledger', { id: (l) => l.id, date: (l) => l.date, amount: (l) => numeric(l.amount), status: (l) => l.status });

  return (
    <div className={layout.page}>
      <div className={layout.stats4}>
        {ESCROW.map((e) => (
          <StatCard key={e.label} label={e.label} value={e.value} sub={e.sub} />
        ))}
      </div>

      <Card clip>
        <div className={styles.ledgerHead}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Text as="h2" font="display" size={14.5} weight={700} tone="ink" style={{ margin: 0 }}>
              Settlement ledger
            </Text>
            <FilterChips filterKey="ledgerFilter" options={['All settlements', 'Released', 'On hold', 'Disputed']} label="Filter settlements" gap={7} />
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Button variant="secondary" h={34} px={13} r={12} fs={12} icon="filter" onClick={() => consoleActions.notify('Period switched to August 2026')}>
              September 2026
            </Button>
            <Button variant="primary" h={34} px={13} r={12} fs={12} icon="download" onClick={() => consoleActions.notify('September 2026 statement exported as CSV')}>
              Export statement
            </Button>
          </div>
        </div>
        <DataTable
          label="Settlement ledger"
          cols="1.3fr 1.1fr 1.2fr 1.7fr 1.3fr 1.2fr 1fr"
          minWidth={980}
          header={
            <>
              <SortHead mod="ledger" k="id">SETTLEMENT ID</SortHead>
              <SortHead mod="ledger" k="date">DATE</SortHead>
              <HeadCell>ORDER / AUCTION</HeadCell>
              <HeadCell>COUNTERPARTY</HeadCell>
              <HeadCell>TYPE</HeadCell>
              <SortHead mod="ledger" k="amount" align="end">AMOUNT</SortHead>
              <SortHead mod="ledger" k="status" align="end">STATUS</SortHead>
            </>
          }
        >
          {rows.map((l) => (
            <DataRow key={l.id}>
              <Text size={12.5} weight={800} tone="brand">
                {l.id}
              </Text>
              <Text size={12} weight={600} tone="ink2">
                {l.date}
              </Text>
              <Text size={12} weight={700} tone="info">
                {l.ref}
              </Text>
              <Text size={12.5} weight={600} tone="ink">
                {l.party}
              </Text>
              <Text size={12} weight={600} tone="ink2">
                {l.kind}
              </Text>
              <Text size={13} weight={800} tone="ink" align="right">
                {l.amount}
              </Text>
              <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Pill tone={l.tone}>{l.status}</Pill>
              </span>
            </DataRow>
          ))}
        </DataTable>
        <div style={{ padding: '13px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', fontSize: 12, fontWeight: 600, color: 'var(--ink3)' }}>
          <span>Showing {filtered.length} of 412 settlements this quarter</span>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--ink)' }}>Period total · $15,205,200</span>
        </div>
      </Card>
    </div>
  );
}
