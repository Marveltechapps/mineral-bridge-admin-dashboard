import { Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FilterChips } from '@/components/ui/Chip';
import { DataRow, DataTable, HeadCell, SortHead, TableEmpty } from '@/components/ui/DataTable';
import { Pill } from '@/components/ui/Pill';
import { TabBar } from '@/components/ui/Tabs';
import { Text } from '@/components/ui/Text';
import { ROUTES } from '@/constants/routes';
import { useQueryMatch, useSorted } from '@/hooks/useConsoleData';
import { consoleActions, useConsole } from '@/store/consoleStore';
import { CALLS, TICKETS } from '@/services/support';
import layout from '@/styles/layout.module.css';

export function SupportShell() {
  return (
    <div className={layout.page}>
      <TabBar
        label="Support views"
        tabs={[
          { label: 'Ticket queue · 12', to: ROUTES.support },
          { label: 'Call history', to: ROUTES.supportCalls },
        ]}
        actions={
          <Button
            variant="primary"
            h={36}
            px={14}
            r={12}
            icon="plus"
            onClick={() =>
              consoleActions.openDrawer({
                title: 'New ticket',
                sub: 'Log an enquiry that came in by phone or WhatsApp.',
                fields: [
                  { label: 'USER', hint: 'Search by name, phone or email' },
                  { label: 'LINKED RECORD', hint: 'Order, lot or auction ID (optional)' },
                  { label: 'SUBJECT' },
                  { label: 'OWNER', value: 'S. Barasa' },
                  { label: 'FIRST NOTE', kind: 'area' },
                ],
                cta: 'Open ticket',
                done: 'Ticket opened and assigned',
                draft: 'Ticket saved as a draft',
              })
            }
          >
            New ticket
          </Button>
        }
      />
      <Outlet />
    </div>
  );
}

export function TicketsPage() {
  const match = useQueryMatch();
  const filter = useConsole((s) => s.filters.ticketFilter);
  const rows = useSorted(
    TICKETS.filter((t) => (filter === 'All tickets' || t.status === filter) && match([t.id, t.subject, t.user, t.link, t.status, t.owner])),
    'tickets',
    { id: (t) => t.id, status: (t) => t.status, owner: (t) => t.owner, age: (t) => (t.age.indexOf('d') > 0 ? 100 : 0) + parseFloat(t.age) },
  );
  return (
    <div className={layout.stack14}>
      <FilterChips filterKey="ticketFilter" options={['All tickets', 'Open', 'Escalated', 'Waiting on user', 'Resolved']} label="Filter tickets" />
      <Card clip>
        <DataTable
          label="Ticket queue"
          cols="1fr 2.4fr 1.4fr 1.2fr 1.2fr 1fr .6fr"
          minWidth={980}
          header={
            <>
              <SortHead mod="tickets" k="id">TICKET</SortHead>
              <HeadCell>SUBJECT</HeadCell>
              <HeadCell>USER</HeadCell>
              <HeadCell>LINKED RECORD</HeadCell>
              <SortHead mod="tickets" k="status">STATUS</SortHead>
              <SortHead mod="tickets" k="owner">OWNER</SortHead>
              <SortHead mod="tickets" k="age" align="end">AGE</SortHead>
            </>
          }
        >
          {rows.map((t) => (
            <DataRow key={t.id} onClick={() => consoleActions.notify(`Opening ${t.id}`)} label={`Open ticket ${t.id}`}>
              <Text size={12.5} weight={800} tone="brand">
                {t.id}
              </Text>
              <Text size={12.5} weight={600} tone="ink">
                {t.subject}
              </Text>
              <Text size={12.5} weight={600} tone="ink">
                {t.user}
              </Text>
              <Text size={12} weight={700} tone="info">
                {t.link}
              </Text>
              <Pill tone={t.tone}>{t.status}</Pill>
              <Text size={12} weight={700} tone="ink2">
                {t.owner}
              </Text>
              <Text size={12} weight={700} tone="ink2" align="right">
                {t.age}
              </Text>
            </DataRow>
          ))}
        </DataTable>
        {rows.length === 0 && <TableEmpty>No tickets match this filter or search.</TableEmpty>}
      </Card>
    </div>
  );
}

export function CallsPage() {
  const match = useQueryMatch();
  const rows = useSorted(
    CALLS.filter((c) => match([c.who, c.phone, c.topic, c.agent])),
    'calls',
    { time: (c) => c.time, who: (c) => c.who, dur: (c) => parseFloat(c.dur), agent: (c) => c.agent },
  );
  return (
    <Card clip>
      <DataTable
        label="Call history"
        cols="1.5fr 1.4fr 1.3fr .9fr .9fr 1.8fr 1fr"
        minWidth={1000}
        header={
          <>
            <SortHead mod="calls" k="time">TIMESTAMP</SortHead>
            <SortHead mod="calls" k="who">CALLER</SortHead>
            <HeadCell>NUMBER</HeadCell>
            <HeadCell>DIRECTION</HeadCell>
            <SortHead mod="calls" k="dur">DURATION</SortHead>
            <HeadCell>TOPIC</HeadCell>
            <SortHead mod="calls" k="agent">AGENT</SortHead>
          </>
        }
      >
        {rows.map((c) => (
          <DataRow key={c.time}>
            <Text size={12} weight={700} tone="ink">
              {c.time}
            </Text>
            <Text size={12.5} weight={600} tone="ink">
              {c.who}
            </Text>
            <Text size={12} weight={600} tone="ink2">
              {c.phone}
            </Text>
            <Pill tone={c.dir === 'Inbound' ? 'blue' : 'navy'}>{c.dir}</Pill>
            <Text size={12} weight={700} tone="ink">
              {c.dur}
            </Text>
            <Text size={12.5} weight={600} tone="ink">
              {c.topic}
            </Text>
            <Text size={12} weight={700} tone="ink2">
              {c.agent}
            </Text>
          </DataRow>
        ))}
      </DataTable>
    </Card>
  );
}
