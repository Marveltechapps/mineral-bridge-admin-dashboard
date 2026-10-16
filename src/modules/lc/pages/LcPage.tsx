import type { CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FilterChips } from '@/components/ui/Chip';
import { DataRow, DataTable, HeadCell, SortHead, TableEmpty, TableFooter } from '@/components/ui/DataTable';
import { Pill } from '@/components/ui/Pill';
import { StatCard } from '@/components/ui/StatCard';
import { Text } from '@/components/ui/Text';
import { ROUTES } from '@/constants/routes';
import { useQueryMatch, useSorted } from '@/hooks/useConsoleData';
import { consoleActions, useConsole } from '@/store/consoleStore';
import { usd } from '@/lib/collection';
import { LcDetailPanel } from '../components/LcDetailPanel';
import { LCS, LC_FILTERS, LC_STAGES, LC_STAGE_TONE, LC_STATS, isExpiring } from '@/services/lc';
import layout from '@/styles/layout.module.css';

const COLS = '1.05fr 1.9fr 1.55fr .95fr 1.05fr 1.15fr 1.1fr';

export default function LcPage() {
  const navigate = useNavigate();
  const match = useQueryMatch();
  const filter = useConsole((s) => s.filters.lcFilter);
  const selId = useConsole((s) => s.lcSel);
  const sel = LCS.find((l) => l.id === selId);

  const rows = useSorted(
    LCS.filter((l) => {
      const pass = filter === 'All LCs' || l.status === filter || (filter === 'Expiring ≤ 7 days' && isExpiring(l)) || (filter === 'With discrepancies' && l.discrepancies.length > 0);
      return pass && match([l.id, l.applicant, l.beneficiary, l.goods, l.bank, l.status, l.order]);
    }),
    'lc',
    {
      id: (l) => l.id,
      amount: (l) => l.amount,
      status: (l) => LC_STAGES.indexOf(l.status),
      expiry: (l) => (l.days === null ? 999 : l.status === 'Paid' ? 900 + l.days : l.days),
      disc: (l) => l.discrepancies.length,
    },
  );

  return (
    <div className={layout.stack16}>
      <div className={layout.stats4}>
        {LC_STATS.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} />
        ))}
      </div>

      {sel && (
        <LcDetailPanel
          key={sel.id}
          lc={sel}
          onClose={() => consoleActions.set({ lcSel: null })}
          onOpenOrder={() => {
            consoleActions.set({ lcSel: null, avatarOpen: false, bellOpen: false });
            navigate(ROUTES.order(sel.order));
          }}
        />
      )}

      <div className={layout.toolbar}>
        <FilterChips filterKey="lcFilter" options={LC_FILTERS} label="Filter letters of credit" />
        <Button
          variant="primary"
          h={36}
          px={14}
          r={12}
          icon="plus"
          onClick={() =>
            consoleActions.openDrawer({
              title: 'Request new LC',
              sub: 'Creates an LC request against an agreed contract. The applicant instructs their bank.',
              fields: [{ label: 'CONTRACT', hint: 'Search signed contracts' }, { label: 'ISSUING BANK', value: 'KCB Bank Kenya' }, { label: 'AMOUNT' }, { label: 'LATEST SHIPMENT DATE' }, { label: 'EXPIRY DATE' }],
              cta: 'Send LC request',
              done: 'LC request sent to applicant',
              draft: 'LC request saved as a draft',
            })
          }
        >
          Request LC
        </Button>
      </div>

      <Card clip>
        <DataTable
          label="Letters of credit"
          cols={COLS}
          minWidth={1000}
          header={
            <>
              <SortHead mod="lc" k="id">LC NUMBER</SortHead>
              <HeadCell>APPLICANT → BENEFICIARY</HeadCell>
              <HeadCell>GOODS · ISSUING BANK</HeadCell>
              <SortHead mod="lc" k="amount">AMOUNT</SortHead>
              <SortHead mod="lc" k="status">STATUS</SortHead>
              <SortHead mod="lc" k="expiry">EXPIRY</SortHead>
              <SortHead mod="lc" k="disc">DISCREPANCIES</SortHead>
            </>
          }
        >
          {rows.map((l) => {
            const exp = isExpiring(l);
            const n = l.discrepancies.length;
            return (
              <DataRow
                key={l.id}
                onClick={() => consoleActions.set({ lcSel: l.id })}
                label={`Review ${l.id}`}
                style={{ '--row-bg': exp ? 'rgba(180,83,9,.07)' : 'transparent' } as CSSProperties}
              >
                <Text size={12.5} weight={800} tone="brand">
                  {l.id}
                </Text>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <Text size={12.5} weight={700} tone="ink" ellipsis>
                    {l.applicant}
                  </Text>
                  <Text size={11} weight={600} tone="ink3" ellipsis>
                    → {l.beneficiary}
                  </Text>
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                  <Text size={12} weight={600} tone="ink" ellipsis>
                    {l.goods}
                  </Text>
                  <Text size={11} weight={600} tone="ink3">
                    {l.bank}
                  </Text>
                </span>
                <Text size={12.5} weight={800} tone="ink">
                  {usd(l.amount)}
                </Text>
                <Pill tone={LC_STAGE_TONE[l.status]}>{l.status}</Pill>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                  <Text size={12} weight={700} tone="ink">
                    {l.expiry}
                  </Text>
                  {exp ? (
                    <Pill tone={(l.days ?? 0) <= 2 ? 'red' : 'amber'}>{(l.days ?? 0) <= 2 ? `EXPIRES IN ${l.days}D` : `${l.days} DAYS LEFT`}</Pill>
                  ) : (
                    <Text size={11} weight={700} tone="ink3">
                      {l.status === 'Paid' ? 'SETTLED' : l.days === null ? 'NOT ISSUED' : `${l.days} days left`}
                    </Text>
                  )}
                </span>
                {n ? (
                  <Pill tone="red">{n + (n === 1 ? ' discrepancy' : ' discrepancies')}</Pill>
                ) : (
                  <Text size={11.5} weight={700} tone="ink3">
                    None
                  </Text>
                )}
              </DataRow>
            );
          })}
        </DataTable>
        {rows.length === 0 && <TableEmpty>No letters of credit match this filter or search.</TableEmpty>}
        <TableFooter>
          Showing {rows.length} of {LCS.length} letters of credit · rows highlighted amber expire within 7 days
        </TableFooter>
      </Card>
    </div>
  );
}
