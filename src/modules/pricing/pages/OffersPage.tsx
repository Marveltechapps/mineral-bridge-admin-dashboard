import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { MoneyInput } from '@/components/ui/Input';
import { EmptyCard } from '@/components/ui/Misc';
import { Text } from '@/components/ui/Text';
import { useQueryMatch } from '@/hooks/useConsoleData';
import { consoleActions, useConsole } from '@/store/consoleStore';
import { useLiveList } from '@/hooks/useLiveList';
import { apiRequest, isDemoMode } from '@/lib/apiClient';
import { ENDPOINTS } from '@/lib/endpoints';
import { formatAuthError } from '@/services/auth';
import { OFFERS, getOffers } from '@/services/pricing';
import { refreshCounters } from '@/services/shell/counters';
import styles from '../Pricing.module.css';
import layout from '@/styles/layout.module.css';

/** Assay results awaiting a firm-offer decision. Decided offers leave the queue. */
export default function OffersPage() {
  const match = useQueryMatch();
  const done = useConsole((s) => s.offerDone);
  const live = useLiveList(getOffers, OFFERS);
  const cards = live.rows.filter((o) => !done[o.id] && match([o.id, o.party, o.mineral]));
  const decide = (id: string, outcome: string, text: string) => {
    if (isDemoMode()) {
      consoleActions.notify(text);
      consoleActions.set((s) => ({ offerDone: { ...s.offerDone, [id]: outcome } }));
      return;
    }
    if (outcome === 'adjusted') {
      consoleActions.notify('An adjusted offer needs an amount the server can store. Nothing was sent.');
      return;
    }
    const decision = outcome === 'held' ? 'hold' : 'approve';
    void apiRequest<{ message?: string }>(ENDPOINTS.pricing.offerDecision(id), {
      method: 'POST',
      headers: { 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify(decision === 'approve' ? { decision } : { decision, reason: text }),
    })
      .then((saved) => {
        consoleActions.notify(saved.message || text);
        consoleActions.set((s) => ({ offerDone: { ...s.offerDone, [id]: outcome } }));
        live.reload();
        refreshCounters();
      })
      .catch((err: unknown) => consoleActions.notify(formatAuthError(err, 'The offer decision was not saved.')));
  };

  return (
    <div className={layout.stack14}>
      {cards.map((c) => {
        const clean = c.note.indexOf('Clean') === 0;
        return (
          <Card key={c.id} radius={20} padding="20px 22px" className={styles.offer}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <Text size={13} weight={800} tone="brand">
                  {c.id}
                </Text>
                <Text size={12} weight={600} tone="ink2">
                  {c.party}
                </Text>
              </div>
              <Text font="display" size={15.5} weight={700} tone="ink">
                {c.mineral}
              </Text>
              <Text size={12} weight={600} tone="ink2">
                {c.weights}
              </Text>
              <span className={styles.assay}>
                <Icon name="doc" size={14} />
                {c.assay}
              </span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '9px 12px',
                  borderRadius: 12,
                  fontSize: 11.5,
                  fontWeight: 700,
                  background: clean ? 'var(--tGreen)' : 'var(--tAmber)',
                  color: clean ? 'var(--okInk)' : 'var(--warnInk)',
                }}
              >
                {c.note}
              </span>
            </div>

            <div className={styles.offerBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <Text size={11} weight={700} tone="ink2">
                  Rate applied
                </Text>
                <Text size={12.5} weight={800} tone="ink">
                  {c.rate}
                </Text>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
                <Text size={10.5} weight={800} ls={1} tone="ink3">
                  SYSTEM-SUGGESTED OFFER
                </Text>
                <Text font="display" size={23} weight={700} ls={-0.6} tone="ink">
                  {c.suggested}
                </Text>
                <Text size={11} weight={600} tone="ink3">
                  Valid 48 h once sent to seller
                </Text>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <Button variant="success" h={44} r={13} fs={13} gap={8} icon="check" onClick={() => decide(c.id, 'approved', `Firm offer ${c.suggested} sent to ${c.party}`)}>
                Approve offer
              </Button>
              <Button variant="outline" h={42} r={13} fs={13} gap={8} icon="edit" onClick={() => decide(c.id, 'adjusted', `Adjusted offer sent to ${c.party} for ${c.id}`)}>
                Adjust &amp; approve
              </Button>
              <MoneyInput placeholder="Adjusted amount" label={`Adjusted amount for ${c.id}`} h={40} px={12} r={12} bg="var(--surf3)" border="var(--line2)" fs={13} prefixFs={12.5} />
              <Button variant="dangerSoft" h={38} r={12} onClick={() => decide(c.id, 'held', `${c.id} held for desk review`)}>
                Hold for review
              </Button>
            </div>
          </Card>
        );
      })}
      {cards.length === 0 && <EmptyCard title="Approval queue clear" body="Every assay result that has come in has an offer decision against it." />}
    </div>
  );
}
