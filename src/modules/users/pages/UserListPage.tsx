import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { FilterChips } from '@/components/ui/Chip';
import { DataRow, DataTable, HeadCell, SortHead, TableEmpty, TableFooter } from '@/components/ui/DataTable';
import { Icon } from '@/components/ui/Icon';
import { Initials } from '@/components/ui/Misc';
import { Pill } from '@/components/ui/Pill';
import { Text } from '@/components/ui/Text';
import { ROUTES } from '@/constants/routes';
import { useQueryMatch, useSorted } from '@/hooks/useConsoleData';
import { useLiveList } from '@/hooks/useLiveList';
import { Loader } from '@/components/ui/Loader';
import { useConsole } from '@/store/consoleStore';
import { ACCOUNTS, TIER_TONE, USER_FILTERS, getAccounts, initialsOfName } from '@/services/users';
import layout from '@/styles/layout.module.css';

const COLS = '2fr .8fr 1.1fr .7fr 1fr .5fr';

export default function UserListPage() {
  const navigate = useNavigate();
  const match = useQueryMatch();
  const filter = useConsole((s) => s.filters.userFilter);
  const live = useLiveList(getAccounts, ACCOUNTS);
  const rows = useSorted(
    live.rows.filter((u) => (filter === 'All tiers' || filter === `Tier ${u.tier}` || filter === u.status) && match([u.name, u.org, u.email, `tier ${u.tier}`, u.status])),
    'users',
    { name: (u) => u.name, tier: (u) => u.tier, status: (u) => u.status, orders: (u) => u.orders, joined: (u) => u.joined.split(' ').reverse().join('') },
  );

  if (live.loading) return <Loader label="Loading accounts" />;

  return (
    <div className={layout.stack14}>
      {live.error && <p role="alert">{live.error}</p>}
      <FilterChips filterKey="userFilter" options={USER_FILTERS} label="Filter accounts" />
      <Card clip>
        <DataTable
          label="User accounts"
          cols={COLS}
          minWidth={820}
          rowPad="12px 20px"
          header={
            <>
              <SortHead mod="users" k="name">NAME</SortHead>
              <SortHead mod="users" k="tier">TIER</SortHead>
              <SortHead mod="users" k="status">VERIFICATION</SortHead>
              <SortHead mod="users" k="orders">ORDERS</SortHead>
              <SortHead mod="users" k="joined">JOINED</SortHead>
              <HeadCell />
            </>
          }
        >
          {rows.map((u) => (
            <DataRow key={u.id || u.name} onClick={() => navigate(ROUTES.user(u.id || u.name))} label={`Open account ${u.name}`}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                <Initials text={initialsOfName(u.name)} size={34} radius={12} fs={11.5} />
                <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Text size={12.5} weight={700} tone="ink">
                    {u.name}
                  </Text>
                  <Text size={11} weight={600} tone="ink3" ellipsis>
                    {u.org}
                  </Text>
                </span>
              </span>
              <Pill tone={TIER_TONE[u.tier] ?? 'gray'}>Tier {u.tier}</Pill>
              <Pill tone={u.tone}>{u.status}</Pill>
              <Text size={12.5} weight={700} tone="ink">
                {u.orders}
              </Text>
              <Text size={12} weight={600} tone="ink2">
                {u.joined}
              </Text>
              <span style={{ display: 'flex', justifyContent: 'flex-end', color: 'var(--line4)' }}>
                <Icon name="arrowRight" size={14} />
              </span>
            </DataRow>
          ))}
        </DataTable>
        <TableFooter>
          Showing {rows.length} of {live.rows.length} accounts
        </TableFooter>
        {rows.length === 0 && <TableEmpty>No accounts match this filter or search.</TableEmpty>}
      </Card>
    </div>
  );
}
