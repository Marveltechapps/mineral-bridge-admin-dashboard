import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BackButton, Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { KeyValue, MetricBox } from '@/components/ui/Misc';
import { Pill } from '@/components/ui/Pill';
import { Eyebrow, Text } from '@/components/ui/Text';
import { ROUTES } from '@/constants/routes';
import { useRemoteValue } from '@/hooks/useLiveList';
import { consoleActions } from '@/store/consoleStore';
import { isDemoMode } from '@/lib/apiClient';
import { ENDED, getAuction, type AuctionView } from '@/services/auctions';
import layout from '@/styles/layout.module.css';

function LiveResolution({ auction }: { auction: AuctionView }) {
  const navigate = useNavigate();
  return (
    <div className={layout.stack16}>
      <BackButton onClick={() => navigate(ROUTES.auctionsEnded)}>Back to ended auctions</BackButton>
      <Card radius={20} padding="22px 24px">
        <Text as="h2" font="display" size={17} weight={700} tone="ink" style={{ margin: 0 }}>
          {auction.id} · {auction.outcome.replace(/_/g, ' ')}
        </Text>
        <Text size={12} weight={600} tone="ink3" style={{ marginTop: 6 }}>
          {auction.mineral} · {auction.quantity} · lot {auction.lotId} · winner {auction.winner}
        </Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
          <KeyValue k="Final bid" v={auction.finalBid} />
          <KeyValue k="Reserve" v={auction.reserve} />
          <KeyValue k="Current bid" v={auction.currentBid} />
          <KeyValue k="Closed" v={auction.endsAt} />
        </div>
        <Text size={12} weight={600} tone="ink3" style={{ marginTop: 16 }}>
          Relisting and escalation are not submitted from this screen. The stored outcome is shown above.
        </Text>
      </Card>
    </div>
  );
}

export default function AuctionResolutionPage() {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const remote = useRemoteValue(useCallback((signal?: AbortSignal) => getAuction(auctionId ?? '', signal), [auctionId]));
  if (!isDemoMode()) {
    if (remote.loading) return <Loader label="Loading auction" />;
    if (remote.error || !remote.data) {
      return (
        <div className={layout.stack16}>
          <BackButton onClick={() => navigate(ROUTES.auctionsEnded)}>Back to ended auctions</BackButton>
          <p role="alert">{remote.error || 'This auction was not found.'}</p>
        </div>
      );
    }
    return <LiveResolution auction={remote.data} />;
  }
  const res = ENDED.find((e) => e.id === auctionId) ?? ENDED[0];
  if (!res) return <p role="alert">This auction was not found.</p>;
  const met = res.tone === 'green';
  const winnerInitials =
    res.winner === '—'
      ? '—'
      : res.winner
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 2);

  const toVault = () => {
    consoleActions.set((s) => ({ query: '', filters: { ...s.filters, vaultStatus: 'All lots' } }));
    navigate(ROUTES.vault);
  };

  return (
    <div className={layout.stack16}>
      <BackButton onClick={() => navigate(ROUTES.auctionsEnded)}>Back to ended auctions</BackButton>
      <div className={layout.half} style={{ gap: 20 }}>
        <Card radius={20} padding={24}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Pill tone={res.tone} fontSize={10.5} padding="5px 11px">
              {res.outcome.toUpperCase()}
            </Pill>
            <Text size={12.5} weight={700} tone="ink3">
              Closed 08 Sep 2026 · 17:00 EAT
            </Text>
          </div>
          <Text as="h2" font="display" size={20} weight={700} tone="ink" style={{ margin: '14px 0 0' }}>
            {res.id} · {res.mineral}
          </Text>
          <Text as="div" size={12.5} weight={600} tone="ink2" style={{ marginTop: 4 }}>
            Auction closed from vault stock · winner drops into the Orders pipeline at Verification
          </Text>
          <div className={layout.metrics2} style={{ marginTop: 20 }}>
            <MetricBox label="FINAL BID" value={res.final} valueSize={21} />
            <MetricBox label="RESERVE" value={res.reserve} valueSize={21} valueTone="ok" />
            <MetricBox label="BIDS / BIDDERS" value={`${res.bids} / 11`} valueSize={21} />
            <MetricBox label="MARGIN OVER COST" value={met ? '+11.4%' : '−4.3%'} valueSize={21} valueTone={met ? 'ok' : 'err'} />
          </div>
        </Card>

        <div className={layout.stack16}>
          {met ? (
            <Card radius={20} padding={22}>
              <Eyebrow>WINNER</Eyebrow>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                <span style={{ width: 42, height: 42, borderRadius: 14, background: 'var(--surf3)', color: 'var(--brandInk)', fontFamily: "'Poppins'", fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden="true">
                  {winnerInitials}
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Text size={14} weight={700} tone="ink">
                    {res.winner}
                  </Text>
                  <Text size={11.5} weight={600} tone="ink3">
                    Tier 3 · verified · escrow funded
                  </Text>
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--surf3)' }}>
                <KeyValue k="Buy order created" v="MB-BUY-38217" vTone="info" vWeight={800} />
                <KeyValue k="Pipeline entry" v="Verification" />
                <KeyValue k="Escrow reference" v="ESC-2026-118804" />
              </div>
              <Button
                variant="primary"
                block
                h={44}
                r={13}
                fs={13}
                gap={8}
                iconEnd="arrowRight"
                style={{ marginTop: 18 }}
                onClick={() => {
                  consoleActions.notify('Opening the winner’s buy order');
                  navigate(ROUTES.order('MB-BUY-38217'));
                }}
              >
                Open buy order
              </Button>
            </Card>
          ) : (
            <Card radius={20} padding={22} style={{ borderColor: 'var(--tRed)' }}>
              <Eyebrow tone="err">RESERVE NOT MET · NO WINNER</Eyebrow>
              <Text as="div" size={12.5} weight={600} tone="ink2" lh={1.6} style={{ marginTop: 10 }}>
                Highest bid closed below reserve, so no order was created. The lot has returned to Vault &amp; Inventory and needs a fresh allocation decision.
              </Text>
              <Button variant="primary" block h={44} r={13} fs={13} gap={8} iconEnd="arrowRight" style={{ marginTop: 16 }} onClick={toVault}>
                Open lot in vault
              </Button>
            </Card>
          )}

          <Card radius={20} padding="20px 22px">
            <Eyebrow>RELIST OPTIONS</Eyebrow>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 13 }}>
              <Button variant="secondaryInk" h={42} r={13} onClick={() => consoleActions.notify(`${res.id} relisted at a lower reserve`)}>
                Relist at lower reserve
              </Button>
              <Button variant="secondaryInk" h={42} r={13} onClick={() => consoleActions.notify('Lot moved to the fixed-price catalog')}>
                Move to fixed-price catalog
              </Button>
              <Button variant="secondaryInk" h={42} r={13} onClick={() => consoleActions.notify('Lot returned to vault reserve')}>
                Return to vault reserve
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
