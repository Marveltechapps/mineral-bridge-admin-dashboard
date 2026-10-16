import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FilterChips } from '@/components/ui/Chip';
import { DataRow, DataTable, HeadCell, SortHead, TableEmpty } from '@/components/ui/DataTable';
import { Icon } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { Text } from '@/components/ui/Text';
import { ROUTES } from '@/constants/routes';
import { useQueryMatch, useSorted } from '@/hooks/useConsoleData';
import { consoleActions, useConsole } from '@/store/consoleStore';
import { numeric } from '@/lib/collection';
import { AUCTION_FILTERS, ENDED, LIVE, UPCOMING } from '@/services/auctions';
import layout from '@/styles/layout.module.css';

/** Live auctions table with flag filter. */
export function LiveAuctionsPage() {
  const navigate = useNavigate();
  const match = useQueryMatch();
  const flaggedNow = useConsole((s) => s.flagged);
  const filter = useConsole((s) => s.filters.aucFilter);
  const rows = useSorted(
    LIVE.filter((a) => {
      const f = a.flagged || flaggedNow[a.id];
      const pass = filter === 'All auctions' || (filter === 'Flagged' && f) || (filter === 'Unflagged' && !f) || (filter === 'Closing today' && a.left.indexOf('d') < 0);
      return pass && match([a.id, a.mineral, a.lot, a.leader]);
    }),
    'auctions',
    { id: (a) => a.id, mineral: (a) => a.mineral, bid: (a) => numeric(a.bid), bids: (a) => a.bids, left: (a) => (a.left.indexOf('d') > 0 ? 100 : 0) + parseFloat(a.left) },
  );
  const COLS = '1.2fr 1.25fr 1.1fr .85fr 1.1fr .7fr 1.3fr .5fr';
  return (
    <div className={layout.stack14}>
      <FilterChips filterKey="aucFilter" options={AUCTION_FILTERS} label="Filter live auctions" />
      <Card clip>
        <DataTable
          label="Live auctions"
          cols={COLS}
          minWidth={940}
          header={
            <>
              <SortHead mod="auctions" k="id">AUCTION ID</SortHead>
              <SortHead mod="auctions" k="mineral">MINERAL</SortHead>
              <HeadCell>LOT</HeadCell>
              <HeadCell>QUANTITY</HeadCell>
              <SortHead mod="auctions" k="bid">CURRENT BID</SortHead>
              <SortHead mod="auctions" k="bids">BIDS</SortHead>
              <SortHead mod="auctions" k="left">TIME LEFT</SortHead>
              <HeadCell align="right">FLAG</HeadCell>
            </>
          }
        >
          {rows.map((a) => {
            const flagged = a.flagged || flaggedNow[a.id];
            return (
              <DataRow key={a.id} onClick={() => navigate(ROUTES.auctionMonitor(a.id))} label={`Monitor ${a.id}`}>
                <Text size={12.5} weight={800} tone="brand">
                  {a.id}
                </Text>
                <Text size={12.5} weight={600} tone="ink">
                  {a.mineral}
                </Text>
                <Text size={12} weight={700} tone="info">
                  {a.lot}
                </Text>
                <Text size={12.5} weight={700} tone="ink">
                  {a.qty}
                </Text>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Text size={13} weight={800} tone="ink">
                    {a.bid}
                  </Text>
                  <Text size={10.5} weight={600} tone="ink3">
                    {a.leader}
                  </Text>
                </span>
                <Text size={12} weight={700} tone="ink2">
                  {a.bids} bids
                </Text>
                <Text size={12.5} weight={800} tone={a.left.indexOf('h') > 0 && a.left.indexOf('d') < 0 ? 'err' : 'ink'}>
                  {a.left}
                </Text>
                <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {flagged && (
                    <span
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 9, background: 'var(--tRed)', color: 'var(--errInk)' }}
                      title="Flagged for review"
                      role="img"
                      aria-label="Flagged for review"
                    >
                      <Icon name="flag" size={14} />
                    </span>
                  )}
                </span>
              </DataRow>
            );
          })}
        </DataTable>
        {rows.length === 0 && <TableEmpty>No live auctions match this filter or search.</TableEmpty>}
      </Card>
    </div>
  );
}

/** Scheduled auctions with edit / go-live actions. */
export function UpcomingAuctionsPage() {
  const navigate = useNavigate();
  const match = useQueryMatch();
  const rows = UPCOMING.filter((a) => match([a.id, a.mineral, a.lot]));
  const COLS = '1.15fr 1.2fr 1.05fr .8fr 1.05fr 1.05fr 1.2fr 1.5fr';
  return (
    <Card clip>
      <DataTable
        label="Upcoming auctions"
        cols={COLS}
        minWidth={1000}
        header={
          <>
            <HeadCell>AUCTION ID</HeadCell>
            <HeadCell>MINERAL</HeadCell>
            <HeadCell>LOT</HeadCell>
            <HeadCell>QUANTITY</HeadCell>
            <HeadCell>STARTING BID</HeadCell>
            <HeadCell>RESERVE</HeadCell>
            <HeadCell>OPENS</HeadCell>
            <HeadCell align="right">ACCESS / ACTIONS</HeadCell>
          </>
        }
      >
        {rows.map((a) => (
          <DataRow key={a.id}>
            <Text size={12.5} weight={800} tone="brand">
              {a.id}
            </Text>
            <Text size={12.5} weight={600} tone="ink">
              {a.mineral}
            </Text>
            <Text size={12} weight={700} tone="info">
              {a.lot}
            </Text>
            <Text size={12.5} weight={700} tone="ink">
              {a.qty}
            </Text>
            <Text size={12.5} weight={800} tone="ink">
              {a.start}
            </Text>
            <Text size={12.5} weight={700} tone="ink2">
              {a.reserve}
            </Text>
            <Text size={12} weight={700} tone="ink2">
              {a.opens}
            </Text>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
              <Pill tone={a.access === 'Tier 3 only' ? 'gold' : 'navy'}>{a.access}</Pill>
              <Button
                variant="secondary"
                h={30}
                px={11}
                r={10}
                fs={11.5}
                onClick={() => {
                  consoleActions.set({ createLot: a.lot });
                  consoleActions.notify(`Opening ${a.id} for edit`);
                  navigate(ROUTES.auctionCreate);
                }}
              >
                Edit
              </Button>
              <Button variant="primary" noHover h={30} px={11} r={10} fs={11.5} onClick={() => consoleActions.notify(`${a.id} published — now live`)}>
                Go live
              </Button>
            </span>
          </DataRow>
        ))}
      </DataTable>
    </Card>
  );
}

/** Closed auctions; rows open the resolution screen. */
export function EndedAuctionsPage() {
  const navigate = useNavigate();
  const match = useQueryMatch();
  const rows = useSorted(
    ENDED.filter((e) => match([e.id, e.mineral, e.winner])),
    'ended',
    { id: (e) => e.id, final: (e) => numeric(e.final), bids: (e) => e.bids },
  );
  const COLS = '1.2fr 1.3fr 1.1fr 1.1fr .8fr 1.2fr 1.5fr';
  return (
    <Card clip>
      <DataTable
        label="Ended auctions"
        cols={COLS}
        minWidth={900}
        header={
          <>
            <SortHead mod="ended" k="id">AUCTION ID</SortHead>
            <HeadCell>MINERAL</HeadCell>
            <SortHead mod="ended" k="final">FINAL BID</SortHead>
            <HeadCell>RESERVE</HeadCell>
            <SortHead mod="ended" k="bids">BIDS</SortHead>
            <HeadCell>OUTCOME</HeadCell>
            <HeadCell>WINNER</HeadCell>
          </>
        }
      >
        {rows.map((e) => (
          <DataRow key={e.id} onClick={() => navigate(ROUTES.auctionResolution(e.id))} label={`Open resolution for ${e.id}`}>
            <Text size={12.5} weight={800} tone="brand">
              {e.id}
            </Text>
            <Text size={12.5} weight={600} tone="ink">
              {e.mineral}
            </Text>
            <Text size={12.5} weight={800} tone="ink">
              {e.final}
            </Text>
            <Text size={12.5} weight={700} tone="ink2">
              {e.reserve}
            </Text>
            <Text size={12} weight={700} tone="ink2">
              {e.bids} bids
            </Text>
            <Pill tone={e.tone}>{e.outcome}</Pill>
            <Text size={12.5} weight={600} tone="ink">
              {e.winner}
            </Text>
          </DataRow>
        ))}
      </DataTable>
    </Card>
  );
}
