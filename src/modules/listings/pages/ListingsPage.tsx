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
import { numeric } from '@/lib/collection';
import { LISTINGS, LISTING_FILTERS, LISTING_STATS, accessTone, unitOf } from '@/services/listings';
import layout from '@/styles/layout.module.css';
import { CatalogHierarchyPanel } from '../CatalogHierarchyPanel';

const COLS = '1.25fr 1.5fr 1.1fr 1.1fr 1.1fr 1.05fr 1.15fr';

export default function ListingsPage() {
  const navigate = useNavigate();
  const match = useQueryMatch();
  const filter = useConsole((s) => s.filters.listFilter);
  const rows = useSorted(
    LISTINGS.filter((l) => (filter === 'All listings' || l.status === filter) && match([l.id, l.lot, l.mineral, l.grade, l.status, l.access])),
    'listings',
    { id: (l) => l.id, mineral: (l) => l.mineral, price: (l) => numeric(l.price), value: (l) => numeric(l.value), views: (l) => l.views, status: (l) => l.status },
  );

  return (
    <div className={layout.stack16}>
      <CatalogHierarchyPanel />
      <div className={layout.stats4}>
        {LISTING_STATS.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} />
        ))}
      </div>

      <div className={layout.toolbar}>
        <FilterChips filterKey="listFilter" options={LISTING_FILTERS} label="Filter listings by status" />
        <Button
          variant="primary"
          h={36}
          px={14}
          r={12}
          icon="plus"
          onClick={() =>
            consoleActions.openDrawer({
              title: 'New listing',
              sub: 'Publish a vault lot to the fixed-price Buy catalog.',
              fields: [
                { label: 'VAULT LOT', hint: 'Search unallocated lots' },
                { label: 'ASK PRICE', hint: 'Per unit — live sell rate is suggested' },
                { label: 'QUANTITY OFFERED', hint: 'Leave blank to list the full lot' },
                { label: 'MINIMUM PARCEL', value: '10% of listing' },
                { label: 'BUYER ACCESS', value: 'All verified' },
                { label: 'LISTING NOTE', hint: 'Shown to buyers under the assay summary', kind: 'area' },
              ],
              cta: 'Publish listing',
              done: 'Listing published to the Buy catalog',
              draft: 'Listing saved as a draft',
            })
          }
        >
          New listing
        </Button>
      </div>

      <Card clip>
        <DataTable
          label="Catalog listings"
          cols={COLS}
          minWidth={960}
          header={
            <>
              <SortHead mod="listings" k="id">LISTING ID</SortHead>
              <SortHead mod="listings" k="mineral">MINERAL</SortHead>
              <HeadCell>AVAILABLE</HeadCell>
              <SortHead mod="listings" k="price">ASK PRICE</SortHead>
              <SortHead mod="listings" k="value">LISTED VALUE</SortHead>
              <SortHead mod="listings" k="status">STATUS</SortHead>
              <SortHead mod="listings" k="views">DEMAND</SortHead>
            </>
          }
        >
          {rows.map((l) => (
            <DataRow key={l.id} onClick={() => navigate(ROUTES.listing(l.id))} label={`Open listing ${l.id}`}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Text size={12.5} weight={800} tone="brand">
                  {l.id}
                </Text>
                {l.featured && (
                  <Pill tone="gold" fontSize={9} padding="3px 8px">
                    FEATURED
                  </Pill>
                )}
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <Text size={12.5} weight={700} tone="ink">
                  {l.mineral}
                </Text>
                <Text size={10.5} weight={600} tone="ink3">
                  {l.grade} · lot {l.lot}
                </Text>
              </span>
              <Text size={12.5} weight={700} tone="ink">
                {l.qtyLeft} of {l.qtyTotal}
              </Text>
              <Text size={12.5} weight={800} tone="ink">
                {l.price} / {unitOf(l)}
              </Text>
              <Text size={12.5} weight={800} tone="ink">
                {l.value}
              </Text>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-start' }}>
                <Pill tone={l.tone}>{l.status}</Pill>
                <Pill tone={accessTone(l.access)}>{l.access}</Pill>
              </span>
              <Text size={11.5} weight={600} tone="ink2">
                {l.views} views · {l.enquiries} enquiries
              </Text>
            </DataRow>
          ))}
        </DataTable>
        {rows.length === 0 && <TableEmpty>No listings match this filter or search.</TableEmpty>}
        <TableFooter>
          Showing {rows.length} of {LISTINGS.length} catalog listings
        </TableFooter>
      </Card>
    </div>
  );
}
