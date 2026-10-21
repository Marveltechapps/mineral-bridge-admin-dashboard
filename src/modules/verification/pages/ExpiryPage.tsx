import { Card } from '@/components/ui/Card';
import { FilterChips } from '@/components/ui/Chip';
import { DataRow, DataTable, HeadCell, SortHead, TableEmpty } from '@/components/ui/DataTable';
import { Pill } from '@/components/ui/Pill';
import { Text } from '@/components/ui/Text';
import { useQueryMatch, useSorted } from '@/hooks/useConsoleData';
import { useLiveList } from '@/hooks/useLiveList';
import { isDemoMode } from '@/lib/apiClient';
import { useConsole } from '@/store/consoleStore';
import { EXPIRY_FILTERS, TRACKED_DOCS, getTrackedDocuments } from '@/services/verification';
import styles from '../Verification.module.css';
import layout from '@/styles/layout.module.css';

const COLS = '1.3fr 1.1fr 1.6fr .7fr 1.2fr 1.4fr 1fr';

export default function ExpiryPage() {
  const match = useQueryMatch();
  const filter = useConsole((s) => s.filters.expiryFilter);
  const live = useLiveList(getTrackedDocuments, TRACKED_DOCS);
  const rows = useSorted(
    live.rows.filter((d) => {
      const pass =
        filter === 'All documents' ||
        (filter === 'Expired' && d.days < 0) ||
        (filter === 'Under 30 days' && d.days >= 0 && d.days <= 30) ||
        (filter === 'Under 90 days' && d.days >= 0 && d.days <= 90) ||
        (filter === 'In review' && d.status.toUpperCase() === 'IN REVIEW');
      return pass && match([d.type, d.ref, d.holder, d.tier, d.status]);
    }),
    'expiry',
    { type: (d) => d.type, holder: (d) => d.holder, tier: (d) => d.tier, days: (d) => d.days, status: (d) => d.status },
  );

  return (
    <div className={layout.stack14}>
      <FilterChips filterKey="expiryFilter" options={EXPIRY_FILTERS} label="Filter tracked documents" />
      <Card clip>
        <div className={styles.expiryHead}>
          <Text as="h2" font="display" size={14.5} weight={700} tone="ink" style={{ margin: 0 }}>
            Tracked documents · soonest expiry first
          </Text>
          <Text size={11} weight={700} ls={0.8} tone="warn">
            {isDemoMode() ? '3 EXPIRING WITHIN 35 DAYS · 1 EXPIRED' : `${live.rows.filter((d) => d.days >= 0 && d.days <= 35).length} EXPIRING WITHIN 35 DAYS · ${live.rows.filter((d) => d.days < 0).length} EXPIRED`}
          </Text>
        </div>
        <DataTable
          label="Tracked documents"
          cols={COLS}
          minWidth={960}
          header={
            <>
              <SortHead mod="expiry" k="type">DOCUMENT TYPE</SortHead>
              <HeadCell>REFERENCE</HeadCell>
              <SortHead mod="expiry" k="holder">HOLDER</SortHead>
              <SortHead mod="expiry" k="tier">TIER</SortHead>
              <HeadCell>EXPIRES</HeadCell>
              <SortHead mod="expiry" k="days">COUNTDOWN</SortHead>
              <SortHead mod="expiry" k="status">STATUS</SortHead>
            </>
          }
        >
          {rows.map((d) => {
            const days = d.days;
            const tone = days < 0 ? 'err' : days <= 30 ? 'warn' : days <= 90 ? 'ink2' : 'ink3';
            const width = Math.max(3, Math.min(100, days < 0 ? 100 : 100 - Math.min(days, 365) / 3.65));
            const barColor = days < 0 ? 'var(--errInk)' : days <= 30 ? 'var(--warnInk)' : 'var(--ink3)';
            return (
              <DataRow key={d.ref}>
                <Text size={12.5} weight={700} tone="ink">
                  {d.type}
                </Text>
                <Text size={12} weight={600} tone="ink2">
                  {d.ref}
                </Text>
                <Text size={12.5} weight={600} tone="ink">
                  {d.holder}
                </Text>
                <Text size={12} weight={700} tone="ink2">
                  {d.tier}
                </Text>
                <Text size={12} weight={600} tone="ink2">
                  {d.expires}
                </Text>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ flex: 1, maxWidth: 90, height: 6, borderRadius: 4, background: 'var(--surf3)', overflow: 'hidden' }} aria-hidden="true">
                    <span style={{ display: 'block', transformOrigin: 'left', animation: 'mbGrowX .6s cubic-bezier(.2,.8,.2,1)', height: '100%', width: `${width}%`, borderRadius: 3, background: barColor }} />
                  </span>
                  <Text size={12.5} weight={800} tone={tone}>
                    {days < 0 ? 'Expired' : `${days} days`}
                  </Text>
                </span>
                <Pill tone={d.tone}>{d.status}</Pill>
              </DataRow>
            );
          })}
        </DataTable>
        {rows.length === 0 && <TableEmpty>No documents match this filter or search.</TableEmpty>}
      </Card>
    </div>
  );
}
