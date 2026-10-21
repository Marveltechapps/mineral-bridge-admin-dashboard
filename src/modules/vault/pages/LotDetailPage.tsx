import { useCallback, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BackButton, Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Field, Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { KeyValue, MetricBox, PhotoSlot } from '@/components/ui/Misc';
import { Pill } from '@/components/ui/Pill';
import { Eyebrow, Text } from '@/components/ui/Text';
import { StaticToggle } from '@/components/ui/Toggle';
import { ROUTES } from '@/constants/routes';
import { consoleActions, useConsole } from '@/store/consoleStore';
import type { AllocMode } from '@/types/console';
import { useRemoteValue } from '@/hooks/useLiveList';
import { money } from '@/lib/collection';
import { isDemoMode } from '@/lib/apiClient';
import { ALLOC_HISTORY, CUSTODY, LOTS, LOT_EXTRA, getLotDetail, type LotDetailView } from '@/services/vault';
import layout from '@/styles/layout.module.css';

const STATE_COLOR = { done: 'var(--okInk2)', current: 'var(--infoInk)', upcoming: 'var(--line4)' } as const;

function AllocButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        height: 46,
        padding: '0 16px',
        borderRadius: 14,
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: active ? 800 : 700,
        border: `1px solid ${active ? 'rgba(247,221,142,.5)' : 'rgba(255,255,255,.22)'}`,
        background: active ? 'linear-gradient(135deg,#F7DD8E,#C8962F)' : 'rgba(255,255,255,.08)',
        color: active ? 'var(--ink)' : '#fff',
      }}
    >
      {children}
      <Icon name="arrowRight" size={14} />
    </button>
  );
}

function SwitchRow({ on, children }: { on: boolean; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: '1px solid var(--line)', borderRadius: 12, background: 'var(--surf2)' }}>
      <StaticToggle on={on} />
      <Text size={12} weight={700} tone="ink">
        {children}
      </Text>
    </div>
  );
}

const fieldInput = { h: 40, r: 12, px: 13, fs: 13 } as const;

function LiveLot({ lot }: { lot: LotDetailView }) {
  const navigate = useNavigate();
  return (
    <div className={layout.stack16}>
      <BackButton onClick={() => navigate(ROUTES.vault)}>Back to inventory</BackButton>
      <Card radius={20} padding="22px 24px">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
            <Text as="h2" font="display" size={18} weight={700} tone="ink" style={{ margin: 0 }}>
              {lot.lot.id} · {lot.lot.mineral}
            </Text>
            <Text size={12} weight={600} tone="ink3">
              {lot.lot.qty} · {lot.lot.grade} · {lot.location} · {lot.lot.days} days held · from {lot.lot.src || '—'}
            </Text>
          </div>
          <Pill tone={lot.lot.tone} fontSize={10}>
            {lot.lot.status.toUpperCase()}
          </Pill>
        </div>
        <div className={layout.metrics3} style={{ marginTop: 20 }}>
          <MetricBox label="COST BASIS" value={lot.costBasis} sub={lot.costRate} />
          <MetricBox label="REALISABLE" value={lot.realisable} sub={lot.liveSellRate} />
          <MetricBox label="UNREALISED" value={lot.unrealised} sub={lot.unrealisedPct} />
        </div>
      </Card>
      <Card radius={20} padding="20px 24px">
        <Eyebrow>CHAIN OF CUSTODY</Eyebrow>
        {lot.custody.length === 0 ? (
          <Text size={12.5} weight={600} tone="ink3" style={{ marginTop: 12 }}>
            No custody events are stored for this lot.
          </Text>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {lot.custody.map((step) => (
              <div key={`${step.title}-${step.at}`}>
                <Text size={13} weight={700} tone="ink">
                  {step.title}
                </Text>
                <Text size={12} weight={600} tone="ink3">
                  {step.description} · {step.actor} · {step.at}
                </Text>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card radius={20} padding="20px 24px">
        <Eyebrow>ASSAY</Eyebrow>
        <Text size={12.5} weight={600} tone="ink2" style={{ marginTop: 10 }}>
          {lot.assay}
        </Text>
      </Card>
      <Card radius={20} padding="20px 24px">
        <Eyebrow>ALLOCATION HISTORY</Eyebrow>
        {lot.history.length === 0 ? (
          <Text size={12.5} weight={600} tone="ink3" style={{ marginTop: 12 }}>
            No allocation history is stored.
          </Text>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
            {lot.history.map((step) => (
              <Text key={`${step.title}-${step.date}`} size={12.5} weight={600} tone="ink2">
                {step.title} · {step.sub} · {step.date} · {step.amount}
              </Text>
            ))}
          </div>
        )}
        <Text size={12} weight={600} tone="ink3" style={{ marginTop: 16 }}>
          Publishing a listing, holding this lot, or opening an auction is not saved from this screen. Those actions need an ask price, a hold reason, or auction terms this form does not submit.
        </Text>
      </Card>
    </div>
  );
}

export default function LotDetailPage() {
  const { lotId } = useParams();
  const navigate = useNavigate();
  const mode = useConsole((s) => s.allocMode);
  const remote = useRemoteValue(useCallback((signal?: AbortSignal) => getLotDetail(lotId ?? '', signal), [lotId]));
  if (!isDemoMode()) {
    if (remote.loading) return <Loader label="Loading lot" />;
    if (remote.error || !remote.data) {
      return (
        <div className={layout.stack16}>
          <BackButton onClick={() => navigate(ROUTES.vault)}>Back to inventory</BackButton>
          <p role="alert">{remote.error || 'This lot was not found.'}</p>
        </div>
      );
    }
    return <LiveLot lot={remote.data} />;
  }
  const sel = LOTS.find((l) => l.id === lotId) ?? LOTS[0];
  const [costRate, liveRate, unit, bay, cert, lab, assayDate, net] = LOT_EXTRA[sel.id] ?? LOT_EXTRA['MBV-2026-0417'];
  const cost = costRate * net;
  const real = liveRate * net;
  const ask = `$${Math.round(real).toLocaleString('en-US')}`;
  const askFloor = `$${Math.round(real * 0.94).toLocaleString('en-US')}`;
  const pick = (m: AllocMode) => consoleActions.set({ allocMode: m });

  const allocNote =
    mode === 'catalog'
      ? 'Listing this lot at a fixed ask makes it available to verified buyers immediately.'
      : mode === 'auction'
        ? 'Sending this lot to auction sets a starting bid, reserve and duration on the next screen.'
        : 'Holding keeps the lot off-market and out of the unallocated queue until you release it.';

  return (
    <div className={layout.stack16}>
      <BackButton onClick={() => navigate(ROUTES.vault)}>Back to inventory</BackButton>

      <div className={layout.detail}>
        <div className={layout.stack16}>
          <Card radius={20} padding="22px 24px">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
                <Text as="h2" font="display" size={18} weight={700} tone="ink" style={{ margin: 0 }}>
                  {sel.id} · {sel.mineral}
                </Text>
                <Text size={12} weight={600} tone="ink3">
                  {sel.qty} · {sel.grade} · {bay} · {sel.days} days held · from {sel.src}
                </Text>
              </div>
              <Pill tone={sel.tone} fontSize={10}>
                {sel.status.toUpperCase()}
              </Pill>
            </div>
            <div className={layout.metrics3} style={{ marginTop: 20 }}>
              <MetricBox label="COST BASIS" value={money(cost)} sub={`$${costRate.toLocaleString('en-US')} / ${unit}`} />
              <MetricBox label="REALISABLE" value={money(real)} sub={`$${liveRate.toLocaleString('en-US')} / ${unit} live sell`} />
              <MetricBox label="UNREALISED" value={`+${money(real - cost)}`} valueTone="ok" sub={`+${(((real - cost) / cost) * 100).toFixed(1)}% since intake`} />
            </div>
          </Card>

          <Card radius={20} padding="20px 24px">
            <Eyebrow>CHAIN OF CUSTODY</Eyebrow>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 16 }}>
              {CUSTODY.map((c, ci) => (
                <div key={c.title} style={{ display: 'flex', gap: 14 }}>
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }} aria-hidden="true">
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 14,
                        animation: `mbFadeUp .4s ${(ci * 0.07).toFixed(2)}s backwards ease`,
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        background: STATE_COLOR[c.state],
                      }}
                    >
                      <Icon name={c.state === 'upcoming' ? 'box' : 'check'} size={13} />
                    </span>
                    <span style={{ flex: 1, width: 2, background: 'var(--line)', margin: '3px 0' }} />
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingBottom: 18 }}>
                    <Text size={12.5} weight={700} tone={c.state === 'upcoming' ? 'ink3' : 'ink'}>
                      {c.title}
                    </Text>
                    <Text size={11.5} weight={600} tone="ink2">
                      {c.desc}
                    </Text>
                    <Text size={10.5} weight={700} tone="ink3">
                      {c.time} · {c.agent}
                    </Text>
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <div className={layout.half}>
            <Card radius={20} padding="18px 20px">
              <Eyebrow>LOT PHOTOS</Eyebrow>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
                {['intake photo', 'seal photo', 'bay 12 shot', 'weigh-in'].map((p) => (
                  <PhotoSlot key={p} label={p} height={92} />
                ))}
              </div>
            </Card>
            <Card radius={20} padding="18px 20px" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Eyebrow>ASSAY CERTIFICATE</Eyebrow>
              <div style={{ border: '1px solid var(--line2)', borderRadius: 14, padding: 14, background: 'var(--surf2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--goldGrad)', color: '#1A1F36', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden="true">
                    <Icon name="doc" size={14} />
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Text size={12.5} weight={700} tone="ink">
                      {cert}.pdf
                    </Text>
                    <Text size={10.5} weight={600} tone="ink3">
                      {lab} · {assayDate}
                    </Text>
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                  <KeyValue k="Assay grade" v={sel.grade} fs={11.5} />
                  <KeyValue k="Net weight" v={sel.qty} fs={11.5} />
                  <KeyValue k="Location" v={bay} fs={11.5} />
                  <KeyValue k="Method" v="ICP-OES" fs={11.5} />
                </div>
              </div>
              <Button variant="secondaryInk" h={38} r={12} icon="eye" onClick={() => consoleActions.notify(`Opening ${cert}.pdf`)}>
                Open certificate
              </Button>
            </Card>
          </div>

          <Card radius={20} padding="18px 22px">
            <Eyebrow>ALLOCATION HISTORY</Eyebrow>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 12 }}>
              {ALLOC_HISTORY.map((a) => (
                <div key={a.title} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 0', borderBottom: '1px solid var(--surf3)' }}>
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Text size={12.5} weight={700} tone="ink">
                      {a.title}
                    </Text>
                    <Text size={11} weight={600} tone="ink3">
                      {a.sub}
                    </Text>
                  </span>
                  <Text size={11.5} weight={700} tone="ink2">
                    {a.date}
                  </Text>
                  <Text size={12.5} weight={800} tone="ink" align="right" style={{ minWidth: 78 }}>
                    {a.amt}
                  </Text>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className={layout.rail}>
          <Card variant="dark" radius={20} padding={22}>
            <Eyebrow tone="white58">ALLOCATION</Eyebrow>
            <Text as="div" font="display" size={16} weight={700} style={{ marginTop: 10 }}>
              Where does this lot go?
            </Text>
            <Text as="div" size={11.5} weight={600} tone="white62" lh={1.55} style={{ marginTop: 6 }}>
              {allocNote}
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 18 }} role="group" aria-label="Allocation">
              <AllocButton active={mode === 'catalog'} onClick={() => pick('catalog')}>
                List in Buy catalog
              </AllocButton>
              <AllocButton active={mode === 'auction'} onClick={() => pick('auction')}>
                Create auction
              </AllocButton>
              <AllocButton active={mode === 'reserve'} onClick={() => pick('reserve')}>
                Hold in reserve
              </AllocButton>
            </div>
          </Card>

          {mode === 'catalog' && (
            <Card radius={20} padding="18px 20px" key={`catalog-${sel.id}`}>
              <Eyebrow>LIST IN BUY CATALOG</Eyebrow>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 14 }}>
                <Field label="Ask price" caps={false} gap={5}>
                  <Input {...fieldInput} defaultValue={ask} />
                </Field>
                <Field label="Minimum parcel size" caps={false} gap={5}>
                  <Input {...fieldInput} defaultValue="10% of lot" />
                </Field>
                <SwitchRow on>Show assay certificate to buyers</SwitchRow>
                <Button
                  variant="primary"
                  h={42}
                  r={13}
                  fs={13}
                  onClick={() => {
                    consoleActions.notify(`Lot ${sel.id} listed in the Buy catalog`);
                    navigate(ROUTES.listings);
                  }}
                >
                  Publish listing
                </Button>
              </div>
            </Card>
          )}

          {mode === 'auction' && (
            <Card radius={20} padding="18px 20px" key={`auction-${sel.id}`}>
              <Eyebrow>SEND TO AUCTION</Eyebrow>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 14 }}>
                <Field label="Suggested starting bid" caps={false} gap={5}>
                  <Input {...fieldInput} defaultValue={askFloor} />
                </Field>
                <Field label="Suggested reserve" caps={false} gap={5}>
                  <Input {...fieldInput} defaultValue={ask} />
                </Field>
                <Text size={11} weight={600} tone="ink3" lh={1.5}>
                  Duration, increment and bidder restrictions are set on the auction form.
                </Text>
                <Button
                  variant="primary"
                  h={42}
                  r={13}
                  fs={13}
                  gap={8}
                  iconEnd="arrowRight"
                  onClick={() => {
                    consoleActions.set({ createLot: sel.id });
                    consoleActions.notify(`Lot ${sel.id} loaded into a new auction`);
                    navigate(ROUTES.auctionCreate);
                  }}
                >
                  Continue to auction form
                </Button>
              </div>
            </Card>
          )}

          {mode === 'reserve' && (
            <Card radius={20} padding="18px 20px" key={`reserve-${sel.id}`}>
              <Eyebrow>HOLD IN RESERVE</Eyebrow>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 14 }}>
                <Field label="Hold reason" caps={false} gap={5}>
                  <Input {...fieldInput} defaultValue="Awaiting rate recovery" />
                </Field>
                <Field label="Review on" caps={false} gap={5}>
                  <Input {...fieldInput} defaultValue="01 Oct 2026" />
                </Field>
                <SwitchRow on={false}>Keep visible in unallocated queue</SwitchRow>
                <Button variant="primary" h={42} r={13} fs={13} onClick={() => consoleActions.notify(`Lot ${sel.id} held in vault reserve`)}>
                  Hold lot
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
