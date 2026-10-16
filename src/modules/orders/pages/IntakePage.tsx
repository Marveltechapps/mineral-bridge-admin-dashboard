import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { MoneyInput } from '@/components/ui/Input';
import { PhotoSlot } from '@/components/ui/Misc';
import { Pill } from '@/components/ui/Pill';
import { Text } from '@/components/ui/Text';
import { ROUTES } from '@/constants/routes';
import { useConsoleNav } from '@/hooks/useConsoleNav';
import { useQueryMatch } from '@/hooks/useConsoleData';
import { consoleActions } from '@/store/consoleStore';
import { INTAKE } from '@/services/orders';
import styles from '../Orders.module.css';
import layout from '@/styles/layout.module.css';

/** Tier 3 bulk consignments awaiting a desk price and firm offer. */
export default function IntakePage() {
  const go = useConsoleNav();
  const match = useQueryMatch();
  const cards = INTAKE.filter((c) => match([c.id, c.party, c.mineral]));

  return (
    <div className={layout.stack14}>
      <div className={styles.intakeBanner}>
        <Text size={12.5} weight={600} tone="ink">
          Tier 3 consignments are priced by the desk against filed licences before a firm offer is sent. Suggested prices come from the live rate table.
        </Text>
        <Button variant="outline" noHover h={34} px={13} r={11} fs={12} iconEnd="arrowRight" style={{ whiteSpace: 'nowrap' }} onClick={() => go(ROUTES.pricing, { query: '' })}>
          Open rate table
        </Button>
      </div>

      {cards.map((c) => (
        <Card key={c.id} radius={20} padding={20} className={styles.intakeCard}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <PhotoSlot label="consignment photos" height={120} radius={14} pad={10} tagFs={10} tagRadius={8} tagPad="3px 8px" />
            <Text size={10.5} weight={700} tone="ink3">
              {c.photos} · uploaded by counterparty
            </Text>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Text size={13.5} weight={800} tone="brand">
                {c.id}
              </Text>
              <Pill tone="violet">Tier 3 consignment</Pill>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Text font="display" size={16} weight={700} tone="ink">
                {c.mineral} · {c.qty}
              </Text>
              <Text size={12} weight={600} tone="ink2">
                {c.party} · {c.grade}
              </Text>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <Text size={10.5} weight={800} ls={1.1} tone="ink3">
                LINKED LICENCE DOCUMENTS
              </Text>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {c.docs.map((d) => (
                  <span key={d} className={styles.docChip}>
                    <Icon name="doc" size={14} />
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.priceBox}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
              <Text size={10.5} weight={800} ls={1} tone="ink3">
                LIVE RATE
              </Text>
              <Text size={12.5} weight={800} tone="ink">
                {c.rate}
              </Text>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
              <Text size={10.5} weight={800} ls={1} tone="ink3">
                SUGGESTED
              </Text>
              <Text size={14} weight={800} tone="ok">
                {c.suggested}
              </Text>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Text size={10.5} weight={800} ls={1} tone="ink3">
                DESK PRICE (MANUAL)
              </Text>
              <MoneyInput placeholder="Enter consignment price" label={`Desk price for ${c.id}`} />
            </label>
            <Button variant="primary" h={40} r={12} gap={8} icon="send" onClick={() => consoleActions.notify(`Firm offer sent to ${c.party} · valid 48 h`)}>
              Send firm offer
            </Button>
            <Button
              variant="secondary"
              h={36}
              r={12}
              onClick={() =>
                consoleActions.openDrawer({
                  title: 'Request documents',
                  sub: `${c.id} · ${c.party}. The seller is notified in-app.`,
                  fields: [
                    { label: 'DOCUMENTS NEEDED', value: 'Updated export permit' },
                    { label: 'DEADLINE', value: '19 Sep 2026' },
                    { label: 'NOTE TO SELLER', kind: 'area' },
                  ],
                  cta: 'Send request',
                  done: `Document request sent to ${c.party}`,
                  draft: 'Request saved as a draft',
                })
              }
            >
              Request more documents
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
