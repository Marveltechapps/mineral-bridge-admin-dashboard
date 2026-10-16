import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { FilterChips } from '@/components/ui/Chip';
import { DataRow, DataTable, HeadCell, SortHead, TableEmpty } from '@/components/ui/DataTable';
import { Pill } from '@/components/ui/Pill';
import { Text } from '@/components/ui/Text';
import { ROUTES } from '@/constants/routes';
import { useQueryMatch, useSorted } from '@/hooks/useConsoleData';
import { useConsole } from '@/store/consoleStore';
import { numeric } from '@/lib/collection';
import { DISPUTES, DISPUTE_FILTERS } from '@/services/disputes';
import layout from '@/styles/layout.module.css';

const COLS = '1.3fr 1.2fr 1.7fr 1.6fr 1.4fr .8fr 1fr';

export default function DisputesPage() {
  const navigate = useNavigate();
  const match = useQueryMatch();
  const filter = useConsole((s) => s.filters.dsFilter);
  const rows = useSorted(
    DISPUTES.filter((x) => (filter === 'All disputes' || x.status.indexOf(filter) === 0) && match([x.id, x.link, x.type, x.party, x.status])),
    'disputes',
    { id: (x) => x.id, type: (x) => x.type, days: (x) => x.days, value: (x) => numeric(x.value) },
  );

  return (
    <div className={layout.stack14}>
      <FilterChips filterKey="dsFilter" options={DISPUTE_FILTERS} label="Filter disputes" />
      <Card clip>
        <DataTable
          label="Disputes"
          cols={COLS}
          minWidth={980}
          header={
            <>
              <SortHead mod="disputes" k="id">DISPUTE ID</SortHead>
              <HeadCell>LINKED RECORD</HeadCell>
              <SortHead mod="disputes" k="type">TYPE</SortHead>
              <HeadCell>COUNTERPARTY</HeadCell>
              <HeadCell>STATUS</HeadCell>
              <SortHead mod="disputes" k="days">OPEN</SortHead>
              <SortHead mod="disputes" k="value" align="end">VALUE AT RISK</SortHead>
            </>
          }
        >
          {rows.map((x) => (
            <DataRow key={x.id} onClick={() => navigate(ROUTES.dispute(x.id))} label={`Open dispute ${x.id}`}>
              <Text size={12.5} weight={800} tone="brand">
                {x.id}
              </Text>
              <Text size={12} weight={700} tone="info">
                {x.link}
              </Text>
              <Text size={12.5} weight={600} tone="ink">
                {x.type}
              </Text>
              <Text size={12.5} weight={600} tone="ink">
                {x.party}
              </Text>
              <Pill tone={x.tone}>{x.status}</Pill>
              <Text size={12.5} weight={700} tone={x.days >= 7 ? 'err' : x.days >= 3 ? 'warn' : 'ink2'}>
                {x.days} days
              </Text>
              <Text size={12.5} weight={800} tone="ink" align="right">
                {x.value}
              </Text>
            </DataRow>
          ))}
        </DataTable>
        {rows.length === 0 && <TableEmpty>No disputes match this filter or search.</TableEmpty>}
      </Card>
    </div>
  );
}
