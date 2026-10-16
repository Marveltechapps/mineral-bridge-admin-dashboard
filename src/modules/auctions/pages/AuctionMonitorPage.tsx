import { useNavigate, useParams } from 'react-router-dom';
import { BackButton, Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Pill } from '@/components/ui/Pill';
import { Eyebrow, Text } from '@/components/ui/Text';
import { ROUTES } from '@/constants/routes';
import { FILTER_DEFAULTS, consoleActions, useConsole } from '@/store/consoleStore';
import { LIVE, bidFeed } from '@/services/auctions';
import styles from '../Auctions.module.css';
import layout from '@/styles/layout.module.css';

export default function AuctionMonitorPage() {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const paused = useConsole((s) => s.paused);
  const flagged = useConsole((s) => s.flagged);
  const mon = LIVE.find((a) => a.id === auctionId) ?? LIVE[0];
  const { bids, reserve } = bidFeed(mon);
  const isPaused = !!paused[mon.id];
  const isFlagged = !!flagged[mon.id];
  const leaderInitials = mon.leader
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);

  return (
    <div className={layout.stack16}>
      <BackButton onClick={() => navigate(ROUTES.auctions)}>Back to live auctions</BackButton>
      <div className={layout.detail}>
        <Card radius={20} padding="22px 24px">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingBottom: 18, borderBottom: '1px solid var(--surf3)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Text as="h2" font="display" size={17} weight={700} tone="ink" style={{ margin: 0 }}>
                {mon.id} · live bid feed
              </Text>
              <Text size={11.5} weight={600} tone="ink3">
                {mon.mineral} · {mon.qty} · lot {mon.lot} · {mon.bids} bids from 9 bidders
              </Text>
            </div>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 800, letterSpacing: '.6px', color: isPaused ? 'var(--warnInk)' : 'var(--errInk)' }}>
              <span style={{ width: 7, height: 7, borderRadius: 4, background: 'currentColor' }} aria-hidden="true" />
              {isPaused ? 'PAUSED BY DESK' : `${mon.left.toUpperCase()} LEFT`}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }} role="list" aria-label="Bids, newest first">
            {bids.map((b, bi) => (
              <div
                key={bi}
                role="listitem"
                className={styles.bid}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 14,
                  animation: `mbFadeUp .45s ${(bi * 0.05).toFixed(2)}s backwards ease`,
                  transition: 'border-color .18s ease, background .18s ease',
                  border: `1px solid ${b.leading ? 'var(--okInk2)' : b.linked ? 'var(--tAmber)' : 'var(--line)'}`,
                  background: b.leading ? 'var(--tGreen2)' : b.linked ? 'var(--tAmber3)' : 'var(--surf)',
                }}
              >
                <Text font="display" size={15} weight={700} tone="ink" className={styles.bidAmount}>
                  {b.amount}
                </Text>
                <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Text size={12.5} weight={700} tone="ink">
                    {b.bidder}
                  </Text>
                  <Text size={10.5} weight={600} tone="ink3">
                    {b.meta}
                  </Text>
                </span>
                {b.leading && <Pill tone="green">Leading</Pill>}
                {!b.leading && b.linked && <Pill tone="amber">Linked account</Pill>}
                <Text size={11} weight={700} tone="ink3" align="right" style={{ minWidth: 58 }}>
                  {b.time}
                </Text>
              </div>
            ))}
          </div>
        </Card>

        <div className={layout.rail}>
          <Card variant="dark" radius={20} padding={22}>
            <Eyebrow tone="white58">CURRENT LEADER</Eyebrow>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <span
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  background: 'rgba(22,163,74,.2)',
                  border: '1px solid rgba(127,227,161,.4)',
                  color: '#7FE3A1',
                  fontFamily: "'Poppins'",
                  fontSize: 13,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                aria-hidden="true"
              >
                {leaderInitials}
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Text font="display" size={14.5} weight={700}>
                  {mon.leader}
                </Text>
                <Text size={11} weight={700} ls={0.5} style={{ color: '#7FE3A1' }}>
                  TIER 3 · 38 COMPLETED ORDERS
                </Text>
              </span>
            </div>
            <Text as="div" font="display" size={28} weight={700} ls={-0.8} style={{ marginTop: 16 }}>
              {mon.bid}
            </Text>
            <Text as="div" size={11.5} weight={600} tone="white60" style={{ marginTop: 3 }}>
              Reserve {reserve} met · +7.8% over cost basis
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 20 }}>
              <Button
                variant="glass"
                h={44}
                r={13}
                fs={13}
                gap={8}
                icon="pause"
                onClick={() => {
                  consoleActions.set((s) => ({ paused: { ...s.paused, [mon.id]: !isPaused } }));
                  consoleActions.notify(mon.id + (!isPaused ? ' paused — bidding suspended' : ' resumed'));
                }}
              >
                {isPaused ? 'Resume auction' : 'Pause auction'}
              </Button>
              <Button variant="glassDanger" h={42} r={13} fs={13} gap={8} icon="x" onClick={() => consoleActions.notify(`${mon.id} cancelled — lot returned to vault`)}>
                Cancel auction
              </Button>
            </div>
          </Card>

          <Card radius={20} padding="18px 20px" style={{ borderColor: 'var(--tAmber)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 30, height: 30, borderRadius: 10, background: 'var(--tAmber)', color: 'var(--warnInk)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden="true">
                <Icon name="flag" size={14} />
              </span>
              <Text size={13} weight={800} tone="warn">
                {isFlagged ? 'Flagged for review' : 'Pattern detected'}
              </Text>
            </div>
            <Text as="div" size={11.5} weight={600} tone="ink2" lh={1.6} style={{ marginTop: 10 }}>
              {isFlagged
                ? 'Flagged by you — compliance has been notified and the bids remain live pending review.'
                : 'Njoro Metals Ltd placed 3 sequential bids within 47 seconds from two accounts sharing a payout method. Bids remain live until reviewed.'}
            </Text>
            <Button
              variant="warnSolid"
              block
              h={40}
              r={12}
              style={{ marginTop: 14 }}
              onClick={() => {
                consoleActions.set((s) => ({ flagged: { ...s.flagged, [mon.id]: true } }));
                consoleActions.notify(`${mon.id} flagged for suspicious activity`);
              }}
            >
              Flag suspicious activity
            </Button>
            <Button
              variant="secondary"
              noHover
              block
              h={36}
              r={12}
              fs={12}
              style={{ marginTop: 8 }}
              onClick={() => {
                consoleActions.set((s) => ({ query: '', filters: { ...s.filters, dsFilter: FILTER_DEFAULTS.dsFilter } }));
                navigate(ROUTES.disputes);
              }}
            >
              Escalate to compliance
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
