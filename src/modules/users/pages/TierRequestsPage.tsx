import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { EmptyCard, Initials } from '@/components/ui/Misc';
import { Pill } from '@/components/ui/Pill';
import { Text } from '@/components/ui/Text';
import { consoleActions, useConsole } from '@/store/consoleStore';
import { TIER_REQUESTS, initialsOfName } from '@/services/users';
import styles from '../Users.module.css';
import layout from '@/styles/layout.module.css';

export default function TierRequestsPage() {
  const done = useConsole((s) => s.tierDone);
  const open = TIER_REQUESTS.filter((t) => !done[t.name]);
  const decide = (name: string, outcome: string, text: string) => {
    consoleActions.notify(text);
    consoleActions.set((s) => ({ tierDone: { ...s.tierDone, [name]: outcome } }));
  };

  return (
    <div className={layout.stack14} style={{ gap: 12 }}>
      {open.map((t) => (
        <Card key={t.name} padding="18px 20px" className={styles.request}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
            <Initials text={initialsOfName(t.name)} size={36} radius={12} fs={12} />
            <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Text size={13} weight={700} tone="ink">
                {t.name}
              </Text>
              <Text size={11} weight={600} tone="ink3">
                {t.org}
              </Text>
            </span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 9 }} aria-label={`${t.from} to ${t.to}`}>
            <Pill tone="gray">{t.from}</Pill>
            <span style={{ color: 'var(--line4)', display: 'flex' }}>
              <Icon name="arrowRight" size={14} />
            </span>
            <Pill tone="gold">{t.to}</Pill>
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
            <Text size={10} weight={800} ls={1} tone="ink3">
              REASON GIVEN
            </Text>
            <Text size={12} weight={600} tone="ink" lh={1.45}>
              {t.reason}
            </Text>
            <Text size={10.5} weight={700} tone="warn">
              {t.age} open
            </Text>
          </span>
          <span style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="success" h={38} px={15} r={12} gap={6} icon="check" onClick={() => decide(t.name, 'approved', `${t.name} moved to ${t.to}`)}>
              Approve
            </Button>
            <Button variant="dangerSoft" h={38} px={15} r={12} onClick={() => decide(t.name, 'denied', `${t.name}’s tier request denied`)}>
              Deny
            </Button>
          </span>
        </Card>
      ))}
      {open.length === 0 && <EmptyCard title="No tier changes waiting" body="Every request has a decision logged against it." />}
    </div>
  );
}
