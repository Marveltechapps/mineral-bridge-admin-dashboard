import { useNavigate, useParams } from 'react-router-dom';
import { BackButton, Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EditGateActions } from '@/components/ui/EditGateActions';
import { EditingBadge } from '@/components/ui/EditingBadge';
import { Icon } from '@/components/ui/Icon';
import { Field } from '@/components/ui/Input';
import { Bar, KeyValue, ListButton, MetricBox } from '@/components/ui/Misc';
import { Pill } from '@/components/ui/Pill';
import { Eyebrow, Text } from '@/components/ui/Text';
import { ROUTES } from '@/constants/routes';
import { useEditGate } from '@/hooks/useEditGate';
import { consoleActions } from '@/store/consoleStore';
import { numeric } from '@/lib/collection';
import { LISTINGS, unitOf } from '@/services/listings';
import layout from '@/styles/layout.module.css';

export default function ListingDetailPage() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const gate = useEditGate('listingCfg', 'Listing configuration saved');
  const sel = LISTINGS.find((l) => l.id === listingId) ?? LISTINGS[0];
  const unit = unitOf(sel);
  const soldPct = (1 - numeric(sel.qtyLeft) / numeric(sel.qtyTotal)) * 100;
  const price = `${sel.price} / ${unit}`;
  const floor = `$${Math.round(numeric(sel.price) * 0.94).toLocaleString('en-US')}`;
  const featured = sel.featured ? 'Yes' : 'No';

  const configFields: Array<[string, string]> = [
    [`ASK PRICE PER ${unit}`, price],
    ['PRICE FLOOR (AUTO-PAUSE BELOW)', floor],
    ['QUANTITY OFFERED', sel.qtyLeft],
    ['MINIMUM PARCEL SIZE', '10% of listing'],
    ['BUYER ACCESS', sel.access],
    ['FEATURED IN CATALOG', featured],
  ];

  return (
    <div className={layout.stack16}>
      <BackButton onClick={() => navigate(ROUTES.listings)}>Back to catalog listings</BackButton>

      <div className={layout.detail}>
        <div className={layout.stack16}>
          <Card radius={20} padding="22px 24px">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
                <Text as="h2" font="display" size={18} weight={700} tone="ink" style={{ margin: 0 }}>
                  {sel.mineral} · {sel.qtyLeft} available
                </Text>
                <Text size={12} weight={600} tone="ink3">
                  {sel.id} · lot {sel.lot} · {sel.grade} · listed {sel.listed}
                </Text>
              </div>
              <Pill tone={sel.tone} fontSize={10}>
                {sel.status.toUpperCase()}
              </Pill>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                <Text size={11} weight={800} ls={1} tone="ink3">
                  SOLD FROM THIS LISTING
                </Text>
                <Text size={12.5} weight={800} tone="ink">
                  {soldPct.toFixed(0)}% sold
                </Text>
              </div>
              <Bar pct={Math.max(2, soldPct).toFixed(1) + '%'} height={11} radius={6} fillRadius={5} fill="linear-gradient(90deg,#F7DD8E,#C8962F)" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 11, fontWeight: 600, color: 'var(--ink3)' }}>
                <span>{sel.qtyLeft} still available</span>
                <span>{sel.qtyTotal} originally listed</span>
              </div>
            </div>
            <div className={layout.metrics4} style={{ marginTop: 20 }}>
              <MetricBox label="ASK PRICE" value={price} valueSize={19} />
              <MetricBox label="LISTED VALUE" value={sel.value} valueSize={19} />
              <MetricBox label="CATALOG VIEWS" value={sel.views} valueSize={19} />
              <MetricBox label="ENQUIRIES" value={sel.enquiries} valueSize={19} />
            </div>
          </Card>

          <Card radius={20} padding="20px 24px">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingBottom: 16, borderBottom: '1px solid var(--surf3)', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Text as="h2" font="display" size={15} weight={700} tone="ink" style={{ margin: 0 }}>
                  Listing configuration
                </Text>
                <EditingBadge show={gate.on} />
              </span>
              <span style={{ display: 'flex', gap: 8 }}>
                <EditGateActions on={gate.on} onEdit={gate.edit} onCancel={gate.cancel} onSave={gate.save} editLabel="Edit configuration" />
              </span>
            </div>

            <div className={layout.metrics2} style={{ gap: 14, marginTop: 18 }} key={sel.id}>
              {configFields.map(([label, value]) => (
                <Field key={label} label={label}>
                  <input className="mb-field" defaultValue={value} readOnly={gate.readOnly} style={{ ...gate.field, outline: 'none' }} />
                </Field>
              ))}
            </div>

            <Field label="BUYER-FACING DESCRIPTION" style={{ marginTop: 14 }}>
              <textarea
                key={sel.id}
                className="mb-field"
                rows={3}
                readOnly={gate.readOnly}
                defaultValue="Vault-held parcel, assayed on intake and stored under bonded custody. Certificate available to verified buyers on request."
                style={{ ...gate.field, height: 'auto', padding: '11px 13px', fontWeight: 500, lineHeight: 1.55, resize: 'vertical', outline: 'none' }}
              />
            </Field>
          </Card>

          <Card radius={20} padding="18px 22px">
            <Eyebrow>SOURCE LOT</Eyebrow>
            <ListButton
              onClick={() => {
                consoleActions.notify(`Opening lot ${sel.lot}`);
                consoleActions.set({ allocMode: 'catalog' });
                navigate(ROUTES.lot(sel.lot));
              }}
              style={{ justifyContent: 'space-between', gap: 14, width: '100%', marginTop: 12, padding: '14px 16px', borderRadius: 16 }}
            >
              <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Text size={13} weight={800} tone="brand">
                  {sel.lot}
                </Text>
                <Text size={11.5} weight={600} tone="ink3">
                  {sel.mineral} · {sel.grade} · assay certificate on file
                </Text>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, color: 'var(--infoInk)' }}>
                Open lot <Icon name="arrowRight" size={14} />
              </span>
            </ListButton>
          </Card>
        </div>

        <div className={layout.rail}>
          <Card variant="dark" radius={20} padding={22}>
            <Eyebrow tone="white58">LISTING CONTROLS</Eyebrow>
            <Text as="div" font="display" size={16} weight={700} style={{ marginTop: 10 }}>
              {sel.mineral}
            </Text>
            <Text as="div" size={11.5} weight={600} tone="white60" style={{ marginTop: 4 }}>
              {sel.qtyLeft} available at {price}
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 20 }}>
              <Button
                variant="gold"
                h={46}
                r={14}
                fs={13.5}
                onClick={() => consoleActions.notify(sel.id + (sel.status === 'Paused' ? ' resumed — visible in the catalog' : ' paused — hidden from buyers'))}
              >
                {sel.status === 'Paused' ? 'Resume listing' : 'Pause listing'}
              </Button>
              <Button
                variant="glass"
                h={42}
                r={13}
                fs={13}
                onClick={() => {
                  consoleActions.set({ createLot: sel.lot });
                  consoleActions.notify(`Lot ${sel.lot} moved from catalog to a new auction`);
                  navigate(ROUTES.auctionCreate);
                }}
              >
                Move to auction
              </Button>
              <Button
                variant="glassDanger"
                h={42}
                r={13}
                fs={13}
                onClick={() => {
                  consoleActions.notify(`${sel.id} ended — lot returned to vault reserve`);
                  navigate(ROUTES.listings);
                }}
              >
                End listing
              </Button>
            </div>
          </Card>

          <Card radius={20} padding="18px 20px">
            <Eyebrow>PRICING AGAINST LIVE RATE</Eyebrow>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 13 }}>
              <KeyValue k="Live sell rate" v={price} vWeight={800} />
              <KeyValue k="Your floor" v={floor} vWeight={800} />
              <KeyValue k="Access" v={sel.access} vWeight={800} />
            </div>
            <Button
              variant="secondaryBrand"
              block
              h={38}
              r={12}
              fs={12}
              iconEnd="arrowRight"
              style={{ marginTop: 14 }}
              onClick={() => {
                consoleActions.set({ query: '' });
                navigate(ROUTES.pricing);
              }}
            >
              Open rate table
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
