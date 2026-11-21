import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FilterChips } from '@/components/ui/Chip';
import { DataRow, DataTable, HeadCell, SortHead, TableEmpty, TableFooter } from '@/components/ui/DataTable';
import { Initials } from '@/components/ui/Misc';
import { Text } from '@/components/ui/Text';
import { useQueryMatch, useSorted } from '@/hooks/useConsoleData';
import { useJump } from '@/hooks/useJump';
import { useRemoteValue } from '@/hooks/useLiveList';
import { isDemoMode } from '@/lib/apiClient';
import { formatAuthError } from '@/services/auth';
import { getAuditPage, queueAuditExport } from '@/services/audit/auditService';
import { consoleActions, useConsole } from '@/store/consoleStore';
import layout from '@/styles/layout.module.css';

interface AuditEntry {
  time: string;
  who: string;
  role: string;
  action: string;
  record: string;
  before: string;
  after: string;
  group?: string;
}

const LOG: AuditEntry[] = [
  { time: '11 Sep 2026 · 10:42:18', who: 'G. Kioko', role: 'Trading Desk Manager', action: 'Approved firm offer', record: 'MB-SELL-41877', before: '$415,840', after: '$410,848' },
  { time: '11 Sep 2026 · 10:18:02', who: 'L. Achieng', role: 'Compliance Officer', action: 'Approved KYC submission', record: 'KYC-7738', before: 'In review', after: 'Verified · Tier 2' },
  { time: '11 Sep 2026 · 09:55:37', who: 'G. Kioko', role: 'Trading Desk Manager', action: 'Applied manual rate override', record: 'Cobalt Hydroxide 20.5%', before: '$30,900 / t', after: '$31,400 / t' },
  { time: '11 Sep 2026 · 09:31:11', who: 'F. Wanjiru', role: 'Support Agent', action: 'Advanced order stage', record: 'MB-SELL-41982', before: 'Agent visit', after: 'Inspection & approval' },
  { time: '11 Sep 2026 · 08:47:26', who: 'D. Kimani', role: 'Data Entry Clerk', action: 'Created vault lot', record: 'MBV-2026-0417', before: '—', after: '138 kg Platinum Sponge' },
  { time: '10 Sep 2026 · 17:20:49', who: 'G. Kioko', role: 'Trading Desk Manager', action: 'Published auction', record: 'AUC-2026-0231', before: 'Draft', after: 'Live · reserve $940,000' },
  { time: '10 Sep 2026 · 16:02:14', who: 'L. Achieng', role: 'Compliance Officer', action: 'Rejected KYC submission', record: 'KYC-7724', before: 'In review', after: 'Rejected · name mismatch' },
  { time: '10 Sep 2026 · 15:44:03', who: 'A. Mwangi', role: 'Support Agent', action: 'Reassigned ticket', record: 'TKT-5511', before: 'R. Kariuki', after: 'S. Barasa' },
  { time: '10 Sep 2026 · 14:19:55', who: 'G. Kioko', role: 'Trading Desk Manager', action: 'Changed carrier assignment', record: 'MB-SELL-41903', before: 'Sentinel Bonded Logistics', after: 'Zawadi Secure Freight' },
  { time: '10 Sep 2026 · 11:08:31', who: 'S. Njoroge', role: 'CEO / Super Admin', action: 'Changed role permissions', record: 'Role: Data Entry Clerk', before: 'Users: create/edit', after: 'Users: create only' },
  { time: '10 Sep 2026 · 09:52:07', who: 'P. Njoroge', role: 'Content Manager', action: 'Published Academy lesson', record: 'Quality & Grading', before: 'Draft', after: 'Published' },
  { time: '09 Sep 2026 · 18:31:44', who: 'D. Kimani', role: 'Data Entry Clerk', action: 'Updated lot location', record: 'MBV-2026-0402', before: 'Vault A bay 07', after: 'Vault B bay 02' },
];

/** Category used by the audit filter chips (design's cat()). */
function category(action: string): string {
  if (action.indexOf('offer') > 0 || action.indexOf('rate') > 0) return 'Pricing';
  if (action.indexOf('KYC') > 0) return 'Compliance';
  if (action.indexOf('order') > 0 || action.indexOf('ticket') > 0) return 'Orders';
  if (action.indexOf('lot') > 0) return 'Vault';
  if (action.indexOf('role') > 0) return 'Roles & access';
  if (action.indexOf('Academy') > 0) return 'Content';
  return 'Orders';
}

export default function AuditPage() {
  const match = useQueryMatch();
  const jump = useJump();
  const filter = useConsole((s) => s.filters.auditFilter);
  const remote = useRemoteValue(getAuditPage);
  const source = remote.demoMode ? LOG : (remote.data?.rows ?? []);
  const filtered = source.filter((r) => (filter === 'All actions' || (r.group ?? category(r.action)) === filter) && match([r.who, r.role, r.action, r.record, r.before, r.after]));
  const rows = useSorted(filtered, 'audit', { time: (r) => r.time, who: (r) => r.who, action: (r) => r.action, record: (r) => r.record });

  return (
    <div className={layout.stack14}>
      <div className={layout.toolbar}>
        <FilterChips filterKey="auditFilter" options={['All actions', 'Pricing', 'Compliance', 'Orders', 'Vault', 'Roles & access', 'Content']} label="Filter audit log" />
        <Button variant="secondary" h={36} px={14} r={12} icon="download" onClick={() => {
          if (isDemoMode()) {
            consoleActions.notify('Audit log export queued — you will get an email');
            return;
          }
          void queueAuditExport()
            .then((message) => consoleActions.notify(message))
            .catch((err: unknown) => consoleActions.notify(formatAuthError(err, 'The audit export was not queued.')));
        }}>
          Export log
        </Button>
      </div>
      <Card clip>
        <DataTable
          label="Audit log"
          cols="1.5fr 1.5fr 1.6fr 1.4fr 1.3fr 1.3fr"
          minWidth={1000}
          header={
            <>
              <SortHead mod="audit" k="time">TIMESTAMP</SortHead>
              <SortHead mod="audit" k="who">ADMIN</SortHead>
              <SortHead mod="audit" k="action">ACTION</SortHead>
              <SortHead mod="audit" k="record">AFFECTED RECORD</SortHead>
              <HeadCell>BEFORE</HeadCell>
              <HeadCell>AFTER</HeadCell>
            </>
          }
        >
          {rows.map((r) => (
            <DataRow key={r.time} onClick={() => jump(r.record)} label={`Open ${r.record}`}>
              <Text font="mono" size={11.5} weight={600} tone="ink2">
                {r.time}
              </Text>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <Initials
                  text={r.who
                    .split(' ')
                    .map((s) => s[0])
                    .join('')
                    .replace('.', '')}
                  size={28}
                  radius={10}
                  fs={10}
                />
                <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Text size={12.5} weight={700} tone="ink">
                    {r.who}
                  </Text>
                  <Text size={10.5} weight={600} tone="ink3" ellipsis>
                    {r.role}
                  </Text>
                </span>
              </span>
              <Text size={12.5} weight={600} tone="ink">
                {r.action}
              </Text>
              <Text size={12} weight={700} tone="info">
                {r.record}
              </Text>
              <Text size={11.5} weight={600} tone="ink3" style={{ textDecoration: 'line-through' }}>
                {r.before}
              </Text>
              <Text size={11.5} weight={700} tone="ok">
                {r.after}
              </Text>
            </DataRow>
          ))}
        </DataTable>
        <TableFooter>Showing {filtered.length} of {remote.demoMode ? '41,882' : (remote.data?.total ?? filtered.length).toLocaleString('en-US')} logged actions · retained 7 years</TableFooter>
        {rows.length === 0 && <TableEmpty>No log entries match this filter or search.</TableEmpty>}
      </Card>
    </div>
  );
}
