import type { KeyboardEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FilterChips } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/Icon';
import { Initials } from '@/components/ui/Misc';
import { Pill } from '@/components/ui/Pill';
import { Text } from '@/components/ui/Text';
import type { Tone } from '@/constants/tones';
import { useQueryMatch } from '@/hooks/useConsoleData';
import { consoleActions, useConsole } from '@/store/consoleStore';
import { KYC, KYC_FILTERS } from '@/services/verification';
import type { KycSubmission } from '@/types/verification';
import styles from '../Verification.module.css';
import layout from '@/styles/layout.module.css';

const TIER_NOTE = { 1: 'ID only', 2: 'ID + group registration', 3: 'ID + permits + KYB' } as const;
const TIER_TONE: Record<number, Tone> = { 1: 'gray', 2: 'navy', 3: 'gold' };

function KycCard({ k, open, decided }: { k: KycSubmission; open: boolean; decided?: string }) {
  const toggle = () => consoleActions.set({ kycOpen: open ? null : k.id });
  const statusTone: Tone = decided === 'Verified' ? 'green' : decided === 'Rejected' ? 'red' : decided ? 'amber' : k.tone;
  const decide = (outcome: string, text: string) => {
    consoleActions.notify(text);
    consoleActions.set((s) => ({ kycDone: { ...s.kycDone, [k.id]: outcome }, kycOpen: null }));
  };
  const bodyId = `kyc-body-${k.id}`;

  return (
    <Card clip>
      <div
        className={styles.kycHead}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={toggle}
        onKeyDown={(e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        }}
      >
        <Text size={12.5} weight={800} tone="brand">
          {k.id}
        </Text>
        <span style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
          <Initials
            text={k.person
              .split(' ')
              .map((s) => s[0])
              .join('')}
            size={32}
            radius={11}
            fs={11}
          />
          <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Text size={12.5} weight={700} tone="ink">
              {k.person}
            </Text>
            <Text size={11} weight={600} tone="ink3" ellipsis>
              {k.org}
            </Text>
          </span>
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Pill tone={TIER_TONE[k.tier]}>Tier {k.tier}</Pill>
          <Text size={10.5} weight={600} tone="ink3">
            {TIER_NOTE[k.tier]}
          </Text>
        </span>
        <Text size={12} weight={600} tone="ink2">
          {k.submitted}
        </Text>
        <Pill tone={statusTone}>{decided || k.status}</Pill>
        <span style={{ display: 'flex', justifyContent: 'flex-end', color: 'var(--ink3)' }}>
          <Icon name={open ? 'up' : 'down'} size={14} />
        </span>
      </div>
      {open && (
        <div id={bodyId} style={{ padding: '0 20px 18px' }}>
          <div className={styles.kycBody}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <Text size={10.5} weight={800} ls={1.1} tone="ink3">
                REQUIRED DOCUMENTS FOR THIS TIER
              </Text>
              {k.docs.map((d) => (
                <div key={d.name} className={styles.kycDoc}>
                  <span className={styles.thumb} aria-hidden="true" />
                  <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Text size={12.5} weight={700} tone="ink">
                      {d.name}
                    </Text>
                    <Text size={10.5} weight={600} tone="ink3">
                      {d.ref}
                    </Text>
                  </span>
                  <Button variant="secondary" h={32} px={12} r={11} fs={11.5} gap={6} icon="eye" onClick={() => consoleActions.notify(`Opening ${d.name} · ${d.ref}`)}>
                    View
                  </Button>
                  <Pill tone={d.tone}>{d.status}</Pill>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: 16, borderRadius: 16, background: 'var(--surf4)', border: '1px solid var(--line2)' }}>
              <Text size={10.5} weight={800} ls={1.1} tone="ink2">
                REVIEW DECISION
              </Text>
              <Button variant="success" h={42} r={13} gap={8} icon="check" onClick={() => decide('Verified', `Tier ${k.tier} approved for ${k.person}`)}>
                Approve tier
              </Button>
              <Button variant="outline" h={38} r={12} onClick={() => decide('Awaiting resubmission', `Resubmission requested from ${k.person}`)}>
                Request resubmission
              </Button>
              <Button variant="dangerSoft" h={38} r={12} onClick={() => decide('Rejected', `${k.id} rejected — reason sent to ${k.person}`)}>
                Reject with reason
              </Button>
              <Text size={10.5} weight={600} tone="ink3" lh={1.5} style={{ marginTop: 2 }}>
                Decision is logged to the audit trail against your admin account.
              </Text>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function KycQueuePage() {
  const match = useQueryMatch();
  const tierFilter = useConsole((s) => s.filters.verTier);
  const openId = useConsole((s) => s.kycOpen);
  const done = useConsole((s) => s.kycDone);
  const rows = KYC.filter(
    (k) => (tierFilter === 'All tiers' || tierFilter.indexOf(`Tier ${k.tier}`) === 0 || (tierFilter === 'Overdue SLA' && k.submitted.indexOf('day') > 0)) && match([k.id, k.org, k.person, `tier ${k.tier}`]),
  );

  return (
    <div className={layout.stack14}>
      <FilterChips filterKey="verTier" options={KYC_FILTERS} label="Filter KYC submissions" />
      {rows.map((k) => (
        <KycCard key={k.id} k={k} open={openId === k.id} decided={done[k.id]} />
      ))}
    </div>
  );
}
