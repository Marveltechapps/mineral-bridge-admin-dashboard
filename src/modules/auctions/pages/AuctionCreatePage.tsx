import type { KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackButton, Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field, Input } from '@/components/ui/Input';
import { KeyValue } from '@/components/ui/Misc';
import { Eyebrow, Text } from '@/components/ui/Text';
import { StaticToggle } from '@/components/ui/Toggle';
import { ROUTES } from '@/constants/routes';
import { consoleActions, useConsole } from '@/store/consoleStore';
import { CREATE_LOTS, LOT_OPTIONS } from '@/services/auctions';
import layout from '@/styles/layout.module.css';

const termInput = { h: 44, r: 12, px: 14, fs: 13.5 } as const;

export default function AuctionCreatePage() {
  const navigate = useNavigate();
  const createLot = useConsole((s) => s.createLot);
  const [title, sub, cost, real, start, reserve, increment] = CREATE_LOTS[createLot] ?? CREATE_LOTS['MBV-2026-0412'];

  return (
    <div className={layout.stack16}>
      <BackButton onClick={() => navigate(ROUTES.auctions)}>Back to auctions</BackButton>
      <div className={layout.detail}>
        <Card radius={20} padding={24} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} role="radiogroup" aria-label="Select a vault lot">
            <Eyebrow>1 · SELECT A VAULT LOT</Eyebrow>
            {LOT_OPTIONS.map((l) => {
              const on = createLot === l.id;
              const pick = () => consoleActions.set({ createLot: l.id });
              return (
                <div
                  key={l.id}
                  role="radio"
                  aria-checked={on}
                  tabIndex={0}
                  onClick={pick}
                  onKeyDown={(e: KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      pick();
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '13px 15px',
                    borderRadius: 14,
                    cursor: 'pointer',
                    border: `1px solid ${on ? '#1E2A5A' : 'var(--line)'}`,
                    background: on ? 'var(--surf4)' : 'var(--surf)',
                  }}
                >
                  <span
                    style={{
                      width: 17,
                      height: 17,
                      borderRadius: 10,
                      flexShrink: 0,
                      border: `2px solid ${on ? '#1E2A5A' : 'var(--line4)'}`,
                      background: on ? 'radial-gradient(circle, #1E2A5A 0 42%, #fff 46%)' : 'var(--surf)',
                    }}
                    aria-hidden="true"
                  />
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Text size={12.5} weight={800} tone="brand">
                      {l.id}
                    </Text>
                    <Text size={11.5} weight={600} tone="ink2">
                      {l.desc}
                    </Text>
                  </span>
                  <Text size={12} weight={700} tone="ink">
                    {l.cost}
                  </Text>
                </div>
              );
            })}
            <Button
              variant="link"
              fs={12}
              gap={6}
              iconEnd="arrowRight"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => {
                consoleActions.set((s) => ({ query: '', filters: { ...s.filters, vaultStatus: 'All lots' } }));
                navigate(ROUTES.vault);
              }}
            >
              Browse all unallocated lots
            </Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 20, borderTop: '1px solid var(--surf3)' }} key={createLot}>
            <Eyebrow>2 · AUCTION TERMS</Eyebrow>
            <div className={layout.metrics2} style={{ gap: 14 }}>
              <Field label="Starting bid" caps={false}>
                <Input {...termInput} defaultValue={start} />
              </Field>
              <Field label="Reserve price (optional)" caps={false}>
                <Input {...termInput} defaultValue={reserve} />
              </Field>
              <Field label="Bid increment" caps={false}>
                <Input {...termInput} defaultValue={increment} />
              </Field>
              <Field label="Duration" caps={false}>
                <span style={{ display: 'flex', alignItems: 'center', height: 44, border: '1px solid var(--line2)', borderRadius: 12, background: 'var(--surf3)', padding: '0 14px', fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>
                  5 days · closes 16 Sep 2026 17:00 EAT
                </span>
              </Field>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 14, background: 'var(--surf2)' }}>
              <StaticToggle on />
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Text size={12.5} weight={700} tone="ink">
                  Tier 3 bidders only
                </Text>
                <Text size={11} weight={600} tone="ink3">
                  Restricts bidding to registered companies with filed permits
                </Text>
              </span>
            </div>
          </div>
        </Card>

        <div className={layout.rail}>
          <Card variant="dark" radius={20} padding={22}>
            <Eyebrow tone="white58">AUCTION SUMMARY</Eyebrow>
            <Text as="div" font="display" size={16} weight={700} style={{ marginTop: 12 }}>
              {title}
            </Text>
            <Text as="div" size={11.5} weight={600} tone="white60" style={{ marginTop: 4 }}>
              {createLot} · {sub}
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.12)' }}>
              <KeyValue k="Cost basis" v={cost} kColor="rgba(255,255,255,.6)" vTone="inherit" />
              <KeyValue k="Live realisable" v={real} kColor="rgba(255,255,255,.6)" vTone="inherit" />
              <KeyValue k="Reserve vs cost" v={<span style={{ color: '#7FE3A1' }}>+7.0%</span>} kColor="rgba(255,255,255,.6)" vTone="inherit" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 20 }}>
              <Button
                variant="goldNoBorder"
                h={46}
                r={14}
                fs={13.5}
                onClick={() => {
                  consoleActions.notify(`Auction published for ${createLot}`);
                  navigate(ROUTES.auctions);
                }}
              >
                Publish auction
              </Button>
              <Button
                variant="glass"
                noHover
                h={42}
                r={13}
                fs={13}
                onClick={() => {
                  consoleActions.notify('Saved as upcoming auction');
                  navigate(ROUTES.auctionsUpcoming);
                }}
              >
                Save as upcoming
              </Button>
            </div>
          </Card>
          <Card radius={20} padding="16px 18px">
            <Text as="div" size={11} weight={800} ls={0.8} tone="ink3">
              ON CLOSE
            </Text>
            <Text as="div" size={11.5} weight={600} tone="ink2" lh={1.6} style={{ marginTop: 7 }}>
              If the reserve is met the winner is created as a Buy order at Verification. If not, the lot returns to Vault &amp; Inventory for relisting.
            </Text>
          </Card>
        </div>
      </div>
    </div>
  );
}
