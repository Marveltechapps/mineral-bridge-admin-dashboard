import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FilterChips } from '@/components/ui/Chip';
import { DataRow, DataTable } from '@/components/ui/DataTable';
import { Icon } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { Text } from '@/components/ui/Text';
import type { IconName } from '@/constants/icons';
import type { Tone } from '@/constants/tones';
import { useQueryMatch } from '@/hooks/useConsoleData';
import { useRemoteValue } from '@/hooks/useLiveList';
import { getPartnerGroups } from '@/services/partners/partnersService';
import { consoleActions, useConsole } from '@/store/consoleStore';
import layout from '@/styles/layout.module.css';

interface Partner {
  name: string;
  meta: string;
  contact: string;
  status: string;
  tone: Tone;
  volume: string;
  note: string;
}

const GROUPS: Array<{ label: string; icon: IconName; items: Partner[] }> = [
  {
    label: 'Bonded carriers',
    icon: 'partners',
    items: [
      { name: 'Sentinel Bonded Logistics', meta: 'Nairobi · 24 vehicles', contact: 'ops@sentinelbonded.co.ke · +254 711 220 118', status: 'Active', tone: 'green', volume: '84 orders', note: '99.1% on time' },
      { name: 'Zawadi Secure Freight', meta: 'Mombasa · 18 vehicles', contact: 'dispatch@zawadifreight.co.ke · +254 733 908 442', status: 'Active', tone: 'green', volume: '61 orders', note: '97.4% on time' },
      { name: 'Highland Armoured Transit', meta: 'Eldoret · 9 vehicles', contact: 'control@highlandtransit.co.ke · +254 722 774 019', status: 'Suspended', tone: 'red', volume: '12 orders', note: 'Insurance lapsed' },
    ],
  },
  {
    label: 'Inspection hubs',
    icon: 'box',
    items: [
      { name: 'Nairobi Zone 0', meta: 'Industrial Area · 20 bays', contact: 'zone0@mineralbridge.co.ke · +254 20 559 1180', status: 'Active', tone: 'green', volume: '142 orders', note: '14 of 20 bays in use' },
      { name: 'Mombasa Port Hub', meta: 'Kilindini · 12 bays', contact: 'porthub@mineralbridge.co.ke · +254 41 220 4471', status: 'Active', tone: 'green', volume: '78 orders', note: '7 of 12 bays in use' },
      { name: 'Kisumu Lakeside Hub', meta: 'Kisumu · 8 bays', contact: 'kisumu@mineralbridge.co.ke · +254 57 202 8890', status: 'Onboarding', tone: 'blue', volume: '0 orders', note: 'Opens 01 Oct 2026' },
    ],
  },
  {
    label: 'Lab assay partners',
    icon: 'shield',
    items: [
      { name: 'Sarova Assay Labs', meta: 'Nairobi · ISO 17025', contact: 'lab@sarovaassay.co.ke · +254 20 388 2210', status: 'Active', tone: 'green', volume: '118 assays', note: 'Median 2.8 days' },
      { name: 'Rift Analytical Services', meta: 'Nakuru · ISO 17025', contact: 'intake@riftanalytical.co.ke · +254 51 221 9004', status: 'Active', tone: 'green', volume: '46 assays', note: 'Median 3.4 days' },
      { name: 'Coastal Metals Lab', meta: 'Mombasa · ISO 9001', contact: 'assay@coastalmetalslab.co.ke · +254 41 447 2210', status: 'Under review', tone: 'amber', volume: '22 assays', note: '2 variance disputes' },
    ],
  },
];

const COLS = 'minmax(0,1.5fr) minmax(0,1.7fr) 1fr .9fr 1.2fr .7fr';

export default function PartnersPage() {
  const match = useQueryMatch();
  const filter = useConsole((s) => s.filters.partnerFilter);
  const remote = useRemoteValue(getPartnerGroups);
  const groups = (remote.demoMode ? GROUPS : (remote.data ?? [])).filter((g) => filter === 'All partners' || g.label === filter);

  return (
    <div className={layout.stack16}>
      <div className={layout.introBar}>
        <Text size={12.5} weight={600} tone="ink2">
          These are the entities that appear in the order route strip. Suspending a partner removes it from new assignments.
        </Text>
        <Button
          variant="primary"
          h={36}
          px={14}
          r={12}
          icon="plus"
          onClick={() =>
            consoleActions.openDrawer({
              title: 'Add partner',
              sub: 'Partners appear in the custody transfer route strip once active.',
              fields: [
                { label: 'PARTNER NAME' },
                { label: 'TYPE', value: 'Bonded carriers' },
                { label: 'BASE / CAPACITY', hint: 'e.g. Nairobi · 12 vehicles' },
                { label: 'CONTACT EMAIL' },
                { label: 'CONTACT PHONE' },
                { label: 'ACCREDITATION', hint: 'e.g. ISO 17025, bonded store licence' },
              ],
              cta: 'Add partner',
              done: 'Partner added in Onboarding status',
              draft: 'Partner saved as a draft',
            })
          }
        >
          Add partner
        </Button>
      </div>

      <FilterChips filterKey="partnerFilter" options={['All partners', 'Bonded carriers', 'Inspection hubs', 'Lab assay partners']} label="Filter partners" />

      {groups.map((g) => (
        <Card key={g.label} clip>
          <section aria-label={g.label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', background: 'var(--surf2)', borderBottom: '1px solid var(--line)' }}>
              <span style={{ width: 28, height: 28, borderRadius: 9, background: 'var(--surf3)', color: 'var(--brandInk)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden="true">
                <Icon name={g.icon} size={15} />
              </span>
              <Text as="h2" font="display" size={14} weight={700} tone="ink" style={{ margin: 0 }}>
                {g.label}
              </Text>
            </div>
            <DataTable label={g.label} cols={COLS} gap={14} minWidth={940} rowPad="14px 20px" header={null}>
              {g.items
                .filter((p) => match([p.name, p.meta, p.contact, p.status]))
                .map((p) => (
                  <DataRow key={p.name}>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                      <Text size={13} weight={700} tone="ink">
                        {p.name}
                      </Text>
                      <Text size={11} weight={600} tone="ink3">
                        {p.meta}
                      </Text>
                    </span>
                    <Text size={11.5} weight={600} tone="ink2">
                      {p.contact}
                    </Text>
                    <Pill tone={p.tone}>{p.status}</Pill>
                    <Text size={12.5} weight={700} tone="ink">
                      {p.volume}
                    </Text>
                    <Text size={11.5} weight={600} tone="ink2">
                      {p.note}
                    </Text>
                    <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
                            title: p.name,
                            sub: `${g.label} · ${p.meta} · ${p.volume} · ${p.note}`,
                            fields: [{ label: 'STATUS', value: p.status }, { label: 'CONTACT', value: p.contact }, { label: 'BASE / CAPACITY', value: p.meta }, { label: 'INTERNAL NOTE', kind: 'area' }],
                            cta: 'Save partner',
                            done: `${p.name} updated`,
                            draft: 'Changes saved as a draft',
                          })
                        }
                      >
                        Manage
                      </Button>
                    </span>
                  </DataRow>
                ))}
            </DataTable>
          </section>
        </Card>
      ))}
    </div>
  );
}
