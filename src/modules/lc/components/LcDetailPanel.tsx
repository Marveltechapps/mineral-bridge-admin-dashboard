import type { CSSProperties } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { KeyValue } from '@/components/ui/Misc';
import { CloseButton } from '@/components/ui/Modal';
import { Pill } from '@/components/ui/Pill';
import { Text } from '@/components/ui/Text';
import { consoleActions } from '@/store/consoleStore';
import { usd } from '@/lib/collection';
import { LC_STAGE_TONE, isExpiring, lcDocuments } from '@/services/lc';
import type { LetterOfCredit } from '@/types/lc';
import styles from '../Lc.module.css';

function Label({ children, style }: { children: string; style?: CSSProperties }) {
  return (
    <Text size={10.5} weight={800} ls={1.1} tone="ink3" style={style}>
      {children}
    </Text>
  );
}

/** Inline review panel for the selected letter of credit. */
export function LcDetailPanel({ lc, onClose, onOpenOrder }: { lc: LetterOfCredit; onClose: () => void; onOpenOrder: () => void }) {
  const expiring = isExpiring(lc);
  const canRelease = lc.status === 'Docs presented' && lc.discrepancies.length === 0;
  const expNote = expiring
    ? `Expires in ${lc.days}${lc.days === 1 ? ' day' : ' days'} — present or amend before ${lc.expiry}`
    : lc.status === 'Paid'
      ? 'Settled to beneficiary'
      : lc.days === null
        ? `Awaiting issuance by ${lc.bank}`
        : `${lc.days} days until expiry`;
  const releaseLabel = lc.status === 'Paid' ? 'Payment released' : lc.status === 'Docs presented' ? (lc.discrepancies.length ? 'Resolve discrepancies to release' : 'Release payment') : 'Release unlocks at Docs presented';
  const release = () =>
    consoleActions.notify(
      canRelease ? `Payment of ${usd(lc.amount)} released under ${lc.id}` : lc.status === 'Paid' ? `${lc.id} is already settled` : `Payment cannot be released yet on ${lc.id}`,
    );

  return (
    <Card padding="22px 24px" style={{ animation: 'mbFadeUp .3s ease' }}>
      <section aria-label={`Letter of credit ${lc.id}`}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, paddingBottom: 16, borderBottom: '1px solid var(--surf3)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Text as="h2" font="display" size={18} weight={700} tone="ink" style={{ margin: 0 }}>
                {lc.id}
              </Text>
              <Pill tone={LC_STAGE_TONE[lc.status]}>{lc.status}</Pill>
            </span>
            <Text size={12} weight={600} tone="ink2">
              {lc.applicant} → {lc.beneficiary} · {lc.goods}
            </Text>
            <Text size={11.5} weight={700} tone={expiring ? 'warn' : 'ink2'}>
              {expNote}
            </Text>
          </div>
          <CloseButton onClick={onClose} label="Close letter of credit" />
        </div>

        <div className={styles.detailGrid}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <Label>TERMS</Label>
            <KeyValue k="Amount" v={usd(lc.amount)} vWeight={800} />
            <KeyValue k="Issuing bank" v={lc.bank} />
            <KeyValue k="Expiry" v={lc.expiry} />
            <KeyValue
              k="Linked order"
              v={
                <Button variant="link" fs={12} fw={800} onClick={onOpenOrder}>
                  {lc.order}
                </Button>
              }
            />
            <Label style={{ marginTop: 10 }}>DOCUMENT CHECK</Label>
            {lcDocuments(lc).map((d) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--surf3)' }}>
                <Text size={12} weight={600} tone="ink">
                  {d.name}
                </Text>
                <Pill tone={d.tone}>{d.status}</Pill>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <Label>DISCREPANCIES</Label>
            {lc.discrepancies.length === 0 && (
              <div style={{ padding: 16, borderRadius: 14, background: 'var(--surf2)', border: '1px solid var(--line)', fontSize: 12, fontWeight: 600, color: 'var(--ink2)' }}>
                No discrepancies raised by the issuing bank on this LC.
              </div>
            )}
            {lc.discrepancies.map((t, i) => (
              <div key={t} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '12px 14px', borderRadius: 14, border: '1px solid var(--line)', background: 'rgba(220,38,38,.05)' }}>
                <span style={{ width: 22, height: 22, borderRadius: 8, flexShrink: 0, background: '#DC2626', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                <Text size={12} weight={600} tone="ink" lh={1.5} style={{ flex: 1 }}>
                  {t}
                </Text>
                <Button variant="secondary" h={30} px={11} r={10} fs={11.5} style={{ flexShrink: 0 }} onClick={() => consoleActions.notify(`Discrepancy ${i + 1} on ${lc.id} marked resolved`)}>
                  Mark resolved
                </Button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <Label>ACTIONS</Label>
            <button
              type="button"
              onClick={release}
              aria-disabled={!canRelease}
              style={{
                height: 44,
                borderRadius: 13,
                border: 'none',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background .18s ease, transform .14s ease',
                background: canRelease ? '#16A34A' : 'var(--surf3)',
                color: canRelease ? '#fff' : 'var(--ink3)',
              }}
            >
              {releaseLabel}
            </button>
            <Button
              variant="outlineLift"
              h={42}
              r={13}
              onClick={() =>
                consoleActions.openDrawer({
                  title: 'Request amendment',
                  sub: `${lc.id} · issued by ${lc.bank}. The applicant is notified to instruct their bank.`,
                  fields: [
                    { label: 'AMENDMENT TYPE', value: 'Extend expiry date' },
                    { label: 'NEW VALUE', hint: 'e.g. 28 Oct 2026' },
                    { label: 'REASON', hint: 'Shared with applicant and issuing bank', kind: 'area' },
                  ],
                  cta: 'Send amendment request',
                  done: `Amendment requested on ${lc.id}`,
                  draft: 'Amendment saved as a draft',
                })
              }
            >
              Request amendment
            </Button>
            <Button variant="secondary" h={42} r={13} onClick={onOpenOrder}>
              Open linked order
            </Button>
          </div>
        </div>
      </section>
    </Card>
  );
}
