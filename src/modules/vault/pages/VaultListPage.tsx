import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { FilterChips } from '@/components/ui/Chip';
import { DataRow, DataTable, HeadCell, SortHead, TableEmpty, TableFooter } from '@/components/ui/DataTable';
import { Pill } from '@/components/ui/Pill';
import { StatCard } from '@/components/ui/StatCard';
import { Text } from '@/components/ui/Text';
import { ROUTES } from '@/constants/routes';
import { useQueryMatch, useSorted } from '@/hooks/useConsoleData';
import { useLiveList } from '@/hooks/useLiveList';
import { Loader } from '@/components/ui/Loader';
import { consoleActions, useConsole } from '@/store/consoleStore';
import { LOTS, VAULT_FILTERS, VAULT_STATS, defaultAllocMode, getLots, getVaultStats } from '@/services/vault';
import layout from '@/styles/layout.module.css';

const COLS = '1.25fr 1.3fr .95fr 1fr 1.2fr 1fr .8fr';

export default function VaultListPage() {
  const navigate = useNavigate();
  const match = useQueryMatch();
  const status = useConsole((s) => s.filters.vaultStatus);
  const live = useLiveList(getLots, LOTS);
  const stats = useLiveList(getVaultStats, VAULT_STATS);
  const rows = useSorted(
    live.rows.filter((l) => (status === 'All lots' || l.status === status) && match([l.id, l.mineral, l.grade, l.src, l.status])),
    'vault',
    { id: (l) => l.id, mineral: (l) => l.mineral, status: (l) => l.status, days: (l) => l.days },
  );

  return (
    <div className={layout.stack16}>
      <div className={layout.stats4}>
        {(live.loading || stats.loading) && <Loader label="Loading vault" />}
        {(live.error || stats.error) && <p role="alert">{live.error || stats.error}</p>}
        {stats.rows.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} />
        ))}
      </div>

      <FilterChips filterKey="vaultStatus" options={VAULT_FILTERS} label="Filter lots by status" />

      <Card clip>
        <DataTable
          label="Vault lots"
          cols={COLS}
          minWidth={900}
          header={
            <>
              <SortHead mod="vault" k="id">LOT ID</SortHead>
              <SortHead mod="vault" k="mineral">MINERAL</SortHead>
              <HeadCell>QUANTITY</HeadCell>
              <HeadCell>ASSAY GRADE</HeadCell>
              <HeadCell>SOURCE ORDER</HeadCell>
              <SortHead mod="vault" k="status">STATUS</SortHead>
              <SortHead mod="vault" k="days">DAYS HELD</SortHead>
            </>
          }
        >
          {rows.map((l) => (
            <DataRow
              key={l.id}
              label={`Open lot ${l.id}`}
              onClick={() => {
                consoleActions.set({ allocMode: defaultAllocMode(l.status) });
                navigate(ROUTES.lot(l.id));
              }}
            >
              <Text size={12.5} weight={800} tone="brand">
                {l.id}
              </Text>
              <Text size={12.5} weight={600} tone="ink">
                {l.mineral}
              </Text>
              <Text size={12.5} weight={700} tone="ink">
                {l.qty}
              </Text>
              <Text size={12} weight={600} tone="ink2">
                {l.grade}
              </Text>
              <Text size={12} weight={700} tone="info">
                {l.src}
              </Text>
              <Pill tone={l.tone}>{l.status}</Pill>
              <Text size={12.5} weight={700} tone={l.days > 60 ? 'warn' : 'ink2'}>
                {l.days} days
              </Text>
            </DataRow>
          ))}
        </DataTable>
        <TableFooter>
          Showing {rows.length} of {live.rows.length} lots in custody
        </TableFooter>
        {rows.length === 0 && <TableEmpty>No lots match this filter or search.</TableEmpty>}
      </Card>
    </div>
  );
}
