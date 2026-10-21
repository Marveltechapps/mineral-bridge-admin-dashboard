import { useNavigate, useParams } from 'react-router-dom';
import { BackButton, Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { DocRow, KeyValue } from '@/components/ui/Misc';
import { Pill } from '@/components/ui/Pill';
import { Eyebrow, Text } from '@/components/ui/Text';
import { ROUTES } from '@/constants/routes';
import { STAGES, STAGE_TONES } from '@/constants/tones';
import { consoleActions } from '@/store/consoleStore';
import { isDemoMode } from '@/lib/apiClient';
import { advanceOrder } from '@/services/orders';
import { refreshCounters } from '@/services/shell/counters';
import { Loader } from '@/components/ui/Loader';
import { orderDetail, useOrderFeed } from '../hooks/useOrders';
import styles from '../Orders.module.css';
import layout from '@/styles/layout.module.css';

const STATE_COLOR = { done: 'var(--okInk2)', current: 'var(--infoInk)', upcoming: 'var(--line4)' } as const;

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { orders, loading } = useOrderFeed();
  const found = orders.find((o) => o.id === orderId);
  const sel = isDemoMode() ? (found ?? orders[0]) : found;
  if (loading) return <Loader label="Loading orders" />;
  if (!sel) {
    return (
      <div className={layout.stack16}>
        <BackButton onClick={() => navigate(ROUTES.orders)}>Back to order list</BackButton>
        <Text size={12.5} weight={600} tone="ink3">
          {isDemoMode() ? 'No orders match this filter or search.' : 'This order was not found.'}
        </Text>
      </div>
    );
  }
  const d = orderDetail(sel);
  const ex = d.ex;

  const advance = () => {
    if (!sel || sel.idx >= 5) return consoleActions.notify(`Order ${sel?.id ?? ''} has completed custody transfer`);
    const applyLocal = () => {
      consoleActions.set((s) => ({ stageAdv: { ...s.stageAdv, [sel.id]: (s.stageAdv[sel.id] || 0) + 1 } }));
      consoleActions.notify(`${sel.id} advanced to ${STAGES[sel.idx + 1]}`);
    };
    if (isDemoMode()) return applyLocal();
    void advanceOrder(sel.id, sel.idx)
      .then(() => {
        applyLocal();
        refreshCounters();
      })
      .catch((error: unknown) => consoleActions.notify(error instanceof Error ? error.message : 'Could not advance the order'));
  };

  return (
    <div className={layout.stack16}>
      <BackButton onClick={() => navigate(ROUTES.orders)}>Back to order list</BackButton>

      <div className={layout.detail}>
        <div className={layout.stack16}>
          <Card radius={20} padding="22px 24px 20px">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 22 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Text as="h2" font="display" size={17} weight={700} tone="ink" style={{ margin: 0 }}>
                  Order pipeline
                </Text>
                <Text size={11.5} weight={600} tone="ink3">
                  {d.stageLine}
                </Text>
              </div>
              <Pill tone={STAGE_TONES[sel.idx]} fontSize={10}>
                {STAGES[sel.idx].toUpperCase()}
              </Pill>
            </div>
            <div className={styles.trackScroll}>
              <div className={styles.tracker} role="list" aria-label="Order stages">
                <div style={{ position: 'absolute', left: '8.33%', right: '8.33%', top: 13, height: 2, background: 'var(--line)' }} aria-hidden="true" />
                <div
                  className={styles.progress}
                  style={{ left: '8.33%', width: `${((sel.idx / 5) * 83.34).toFixed(2)}%`, top: 13, background: 'linear-gradient(90deg,#16A34A 78%,#2563EB)' }}
                  aria-hidden="true"
                />
                {d.tracker.map((s, i) => (
                  <div key={s.title} role="listitem" className={styles.step} aria-current={s.state === 'current' ? 'step' : undefined}>
                    <span
                      style={{
                        position: 'relative',
                        zIndex: 2,
                        animation: `mbFadeUp .4s ${(i * 0.07).toFixed(2)}s backwards ease`,
                        width: 28,
                        height: 28,
                        borderRadius: 15,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        background: STATE_COLOR[s.state],
                        boxShadow: `0 0 0 4px ${s.state === 'current' ? 'rgba(37,99,235,.14)' : 'var(--surf)'}`,
                      }}
                    >
                      <Icon name={s.state === 'done' ? 'check' : s.state === 'current' ? 'clock' : 'box'} size={14} />
                    </span>
                    <Text size={12.5} weight={s.state === 'upcoming' ? 600 : 700} tone={s.state === 'upcoming' ? 'ink3' : 'ink'}>
                      {s.title}
                    </Text>
                    <Text size={10.5} weight={600} tone="ink3" lh={1.45}>
                      {s.desc}
                    </Text>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                      <Text size={10} weight={800} ls={0.4} tone="ink2">
                        {s.time}
                      </Text>
                      <Text size={10} weight={700} tone="ink3">
                        {s.agent}
                      </Text>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card radius={20} padding="20px 24px">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <Eyebrow>{d.routeLabel}</Eyebrow>
              <Text size={11.5} weight={700} tone="info">
                {d.routeEta}
              </Text>
            </div>
            <div className={styles.trackScroll}>
              <div className={styles.route}>
                <div style={{ position: 'absolute', left: '12.5%', right: '12.5%', top: 6, height: 2, background: 'var(--line)' }} aria-hidden="true" />
                <div
                  className={styles.progress}
                  style={{
                    left: '12.5%',
                    width: `${((Math.max(0, d.routeStep) / 3) * 75).toFixed(2)}%`,
                    top: 6,
                    background: 'linear-gradient(90deg,#16A34A,#2563EB)',
                    animation: 'mbGrowX .7s .1s backwards cubic-bezier(.2,.8,.2,1)',
                  }}
                  aria-hidden="true"
                />
                {d.routeStops.map((s, si) => (
                  <div key={s.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textAlign: 'center' }}>
                    <span
                      style={{
                        position: 'relative',
                        zIndex: 2,
                        animation: `mbFadeUp .4s ${(si * 0.09).toFixed(2)}s backwards ease`,
                        width: 14,
                        height: 14,
                        borderRadius: 8,
                        background: STATE_COLOR[s.state],
                        boxShadow: `0 0 0 4px #fff, 0 0 0 6px ${s.state === 'current' ? 'rgba(37,99,235,.16)' : 'transparent'}`,
                      }}
                      aria-hidden="true"
                    />
                    <Text size={12.5} weight={700} tone={s.state === 'upcoming' ? 'ink3' : 'ink'}>
                      {s.name}
                    </Text>
                    <Text size={10.5} weight={600} tone="ink3" lh={1.4}>
                      {s.place}
                    </Text>
                    <Text size={10} weight={700} tone="ink2">
                      {s.time}
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <div className={layout.half}>
            <Card radius={20} padding="18px 22px">
              <Eyebrow>ORDER FACTS</Eyebrow>
              <dl style={{ display: 'flex', flexDirection: 'column', marginTop: 14, marginBottom: 0 }}>
                {d.facts.map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14, padding: '8px 0', borderBottom: '1px solid var(--surf3)' }}>
                    <Text as="dt" size={12} weight={600} tone="ink3">
                      {k}
                    </Text>
                    <Text as="dd" size={12.5} weight={700} tone="ink" align="right" style={{ margin: 0 }}>
                      {v}
                    </Text>
                  </div>
                ))}
              </dl>
            </Card>
            <Card radius={20} padding="18px 22px">
              <Eyebrow>LINKED DOCUMENTS</Eyebrow>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
                {d.docs.map((doc) => (
                  <DocRow key={doc.name} name={doc.name} sub={doc.ref} ellipsis trailing={<Pill tone={doc.tone}>{doc.status}</Pill>} />
                ))}
              </div>
            </Card>
          </div>

          <Card radius={20} padding="18px 22px 8px">
            <Eyebrow>ACTION HISTORY</Eyebrow>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 14 }}>
              {d.timeline.map((t) => (
                <div key={t.text} style={{ display: 'flex', gap: 12, padding: '0 0 14px' }}>
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }} aria-hidden="true">
                    <span style={{ width: 9, height: 9, borderRadius: 5, background: 'var(--line4)', marginTop: 5 }} />
                    <span style={{ flex: 1, width: 1, background: 'var(--line)' }} />
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Text size={12.5} weight={600} tone="ink">
                      {t.text}
                    </Text>
                    <Text size={10.5} weight={700} tone="ink3">
                      {t.meta}
                    </Text>
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className={layout.rail}>
          <Card variant="dark" radius={20} padding={22}>
            <Eyebrow tone="white58">COUNTERPARTY</Eyebrow>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
              <span
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  background: 'rgba(247,221,142,.16)',
                  border: '1px solid rgba(247,221,142,.35)',
                  color: '#F3D27A',
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
                {d.initials}
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Text font="display" size={14.5} weight={700}>
                  {sel.party}
                </Text>
                <Text size={11} weight={700} tone="gold" ls={0.5}>
                  {d.tierLine}
                </Text>
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 18, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.12)' }}>
              <KeyValue k="Contact" v={ex?.contact || '—'} kColor="rgba(255,255,255,.6)" vTone="inherit" />
              <KeyValue k="Phone" v={ex?.phone || '—'} kColor="rgba(255,255,255,.6)" vTone="inherit" />
              <KeyValue k="Completed orders" v={isDemoMode() ? `${ex?.done || 0} · no disputes` : '—'} kColor="rgba(255,255,255,.6)" vTone="inherit" />
              <KeyValue
                k="KYC"
                kColor="rgba(255,255,255,.6)"
                vTone="inherit"
                v={
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999, background: 'rgba(22,163,74,.18)', color: '#7FE3A1', fontSize: 10, fontWeight: 800, letterSpacing: '.6px' }}>
                    VERIFIED
                  </span>
                }
              />
            </div>
            <div style={{ marginTop: 18, padding: 14, borderRadius: 16, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
              <Text as="div" size={11} weight={800} ls={0.8} style={{ color: 'rgba(255,255,255,.6)' }}>
                {d.qtyLine}
              </Text>
              <Text as="div" font="display" size={24} weight={700} ls={-0.6} style={{ marginTop: 6 }}>
                {ex?.value || '—'}
              </Text>
              <Text as="div" size={11} weight={600} tone="white58" style={{ marginTop: 3 }}>
                {d.rateLine}
              </Text>
            </div>
          </Card>

          <Card radius={20} padding={18} style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <Eyebrow style={{ marginBottom: 3 }}>DESK ACTIONS</Eyebrow>
            <Button variant="primary" h={44} r={13} fs={13} gap={8} icon="arrowRight" onClick={advance}>
              {sel.idx >= 5 ? 'Order complete' : `Advance to ${STAGES[sel.idx + 1]}`}
            </Button>
            <Button
              variant="warnSoft"
              h={42}
              r={13}
              fs={13}
              gap={8}
              icon="flag"
              onClick={() =>
                consoleActions.openDrawer({
                  title: 'Flag exception',
                  sub: `${sel.id} at ${STAGES[sel.idx]}. Flagging pauses the stage clock and notifies compliance.`,
                  fields: [
                    { label: 'EXCEPTION TYPE', value: 'Quantity variance' },
                    { label: 'SEVERITY', value: 'Hold order' },
                    { label: 'WHAT HAPPENED', hint: 'Visible to compliance and the audit log', kind: 'area' },
                  ],
                  cta: 'Flag exception',
                  done: `Exception flagged on ${sel.id} — compliance notified`,
                  draft: 'Exception note saved',
                })
              }
            >
              Flag exception
            </Button>
            <Button
              variant="secondaryInk"
              h={42}
              r={13}
              fs={13}
              gap={8}
              icon="edit"
              onClick={() =>
                consoleActions.openDrawer({
                  title: `Reassign ${sel.id}`,
                  sub: `Currently with ${d.agentName} at ${STAGES[sel.idx]}.`,
                  fields: [{ label: 'NEW AGENT', hint: 'Search desk and field agents' }, { label: 'REASON', value: 'Workload rebalance' }, { label: 'HANDOVER NOTE', kind: 'area' }],
                  cta: 'Reassign order',
                  done: `${sel.id} reassigned`,
                  draft: 'Reassignment saved as a draft',
                })
              }
            >
              Reassign agent
            </Button>
            <Button
              variant="secondaryInk"
              h={42}
              r={13}
              fs={13}
              gap={8}
              icon="send"
              onClick={() =>
                consoleActions.openDrawer({
                  title: `Message ${ex?.contact || sel.party}`,
                  sub: `${sel.id} · ${ex?.phone || ''} · sends by SMS and in-app.`,
                  fields: [
                    { label: 'SUBJECT', value: `Update on ${sel.id}` },
                    { label: 'MESSAGE', hint: 'Counterparty sees this in their app', kind: 'area' },
                  ],
                  cta: 'Send message',
                  done: `Message sent to ${ex?.contact || sel.party}`,
                  draft: 'Message saved as a draft',
                })
              }
            >
              Message counterparty
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
