import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataRow, DataTable, HeadCell } from '@/components/ui/DataTable';
import { Pill } from '@/components/ui/Pill';
import { Text } from '@/components/ui/Text';
import { Toggle } from '@/components/ui/Toggle';
import { useQueryMatch } from '@/hooks/useConsoleData';
import { useLiveList } from '@/hooks/useLiveList';
import { apiRequest, isDemoMode } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import { formatAuthError } from '@/services/auth';
import { getBanners } from '@/services/marketing/marketingService';
import { consoleActions, useConsole } from '@/store/consoleStore';
import layout from '@/styles/layout.module.css';

const BANNERS = [
  { id: 'gold-season', title: 'Gold season buy rates', slot: 'Homepage hero banner', range: '01 Sep 2026 — 30 Sep 2026', active: true, kind: 'Hero', link: '/sell' },
  { title: 'Tier 3 bulk consignment push', slot: 'Homepage secondary banner', range: '15 Aug 2026 — 15 Oct 2026', active: true, kind: 'Secondary' },
  { title: 'Academy certified tracks launch', slot: 'In-app promo card', range: '20 Aug 2026 — 20 Sep 2026', active: true, kind: 'Promo card' },
  { title: 'Silver auction weekend', slot: 'Homepage hero banner', range: '12 Sep 2026 — 14 Sep 2026', active: false, kind: 'Hero' },
  { title: 'Ground safety campaign', slot: 'Category imagery — miners', range: '01 Jul 2026 — 31 Dec 2026', active: true, kind: 'Category' },
  { title: 'Q4 platinum sponge catalogue', slot: 'Email + homepage strip', range: '01 Oct 2026 — 31 Dec 2026', active: false, kind: 'Email' },
  { title: 'Referral bonus for co-ops', slot: 'In-app promo card', range: '05 Jun 2026 — 05 Aug 2026', active: false, kind: 'Promo card' },
];

const COLS = '88px minmax(0,2fr) 1.1fr 1.6fr 1fr 1.1fr';

export default function MarketingPage() {
  const match = useQueryMatch();
  const toggles = useConsole((s) => s.toggles);
  const live = useLiveList(getBanners, BANNERS.map((row) => ({ id: row.title, link: '/sell', ...row })));
  const rows = live.rows.filter((m) => match([m.title, m.slot, m.kind]));

  return (
    <div className={layout.stack16}>
      <div className={layout.introBar}>
        <Text size={12.5} weight={600} tone="ink2">
          Homepage banners, promo cards and category imagery. Academy content is managed separately.
        </Text>
        <Button
          variant="primary"
          h={36}
          px={14}
          r={12}
          icon="plus"
          onClick={() =>
            consoleActions.openDrawer({
              title: 'New banner',
              sub: 'Banners run on the consumer homepage and in-app promo slots.',
              fields: [
                { label: 'TITLE', hint: 'Internal name, not shown to users' },
                { label: 'PLACEMENT', value: 'Homepage hero banner' },
                { label: 'ACTIVE FROM', value: '15 Sep 2026' },
                { label: 'ACTIVE UNTIL', value: '15 Oct 2026' },
                { label: 'LINK TARGET', hint: 'e.g. /sell/gold-concentrate' },
              ],
              cta: 'Create banner',
              done: 'Banner created — inactive until you toggle it live',
              draft: 'Banner saved as a draft',
            })
          }
        >
          New banner
        </Button>
      </div>

      <Card clip>
        <DataTable
          label="Banners"
          cols={COLS}
          gap={14}
          minWidth={900}
          header={
            <>
              <HeadCell>PREVIEW</HeadCell>
              <HeadCell>TITLE</HeadCell>
              <HeadCell>PLACEMENT</HeadCell>
              <HeadCell>ACTIVE DATES</HeadCell>
              <HeadCell>STATUS</HeadCell>
              <HeadCell align="right">ACTIONS</HeadCell>
            </>
          }
        >
          {rows.map((m) => {
            const key = `mk|${m.title}`;
            const on = toggles[key] === undefined ? m.active : toggles[key];
            const [from, until] = m.range.split(' — ');
            return (
              <DataRow key={m.title}>
                <span
                  style={{
                    height: 50,
                    borderRadius: 11,
                    border: '1px solid var(--line2)',
                    background: 'repeating-linear-gradient(135deg,var(--surf3) 0 8px,var(--line) 8px 16px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  role="img"
                  aria-label="Banner preview placeholder"
                >
                  <Text font="mono" size={8.5} weight={600} tone="ink3">
                    banner
                  </Text>
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                  <Text size={13} weight={700} tone="ink">
                    {m.title}
                  </Text>
                  <Text size={11} weight={600} tone="ink3">
                    {m.slot}
                  </Text>
                </span>
                <Pill tone="navy">{m.kind}</Pill>
                <Text size={12} weight={600} tone="ink2">
                  {m.range}
                </Text>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Toggle
                    on={on}
                    onColor="var(--okInk2)"
                    label={`Banner live: ${m.title}`}
                    onClick={() => {
                      if (isDemoMode()) {
                        consoleActions.set((s) => ({ toggles: { ...s.toggles, [key]: !on } }));
                        consoleActions.notify(`“${m.title}” ${!on ? 'set live' : 'taken offline'}`);
                        return;
                      }
                      void apiRequest<{ message?: string }>(ENDPOINTS.marketing.banner(m.id), { method: 'PATCH', body: JSON.stringify({ active: !on }) })
                        .then((saved) => {
                          consoleActions.notify(saved.message || `“${m.title}” ${!on ? 'set live' : 'taken offline'}`);
                          live.reload();
                        })
                        .catch((err: unknown) => consoleActions.notify(formatAuthError(err, 'The banner was not updated.')));
                    }}
                  />
                  <Pill tone={on ? 'green' : 'gray'}>{on ? 'Active' : 'Scheduled'}</Pill>
                </span>
                <span style={{ display: 'flex', gap: 7, justifyContent: 'flex-end' }}>
                  <Button
                    variant="secondary"
                    h={32}
                    px={12}
                    r={11}
                    fs={11.5}
                    gap={6}
                    icon="edit"
                    onClick={() =>
                      consoleActions.openDrawer({
                        title: m.title,
                        sub: `${m.slot} · ${m.range}`,
                        fields: [
                          { label: 'TITLE', value: m.title },
                          { label: 'PLACEMENT', value: m.slot },
                          { label: 'ACTIVE FROM', value: from },
                          { label: 'ACTIVE UNTIL', value: until || '' },
                          { label: 'LINK TARGET', value: m.link },
                        ],
                        cta: 'Save banner',
                        done: `“${m.title}” updated`,
                        draft: 'Changes saved as a draft',
                      })
                    }
                  >
                    Edit
                  </Button>
                </span>
              </DataRow>
            );
          })}
        </DataTable>
      </Card>
    </div>
  );
}
