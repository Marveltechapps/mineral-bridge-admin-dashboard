import type { KeyboardEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { TONE_BG, TONE_INK_FIXED } from '@/constants/tones';
import { Loader } from '@/components/ui/Loader';
import { useRemoteValue } from '@/hooks/useLiveList';
import { ACTIVITY, loadActivity } from '@/services/overview';
import styles from '../Overview.module.css';

/** "Recent activity" — last 20 events; each row opens the record it mentions. */
export function ActivityFeed({ onOpen, onFullLog }: { onOpen: (text: string) => void; onFullLog: () => void }) {
  const remote = useRemoteValue(loadActivity);
  const items = remote.demoMode ? ACTIVITY : (remote.data ?? []);
  return (
    <Card clip>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--surf3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Text as="h2" font="display" size={14.5} weight={700} tone="ink" style={{ margin: 0 }}>
          Recent activity
        </Text>
        <Button variant="quiet" fs={11} style={{ letterSpacing: '.8px' }} onClick={onFullLog}>
          LAST 20 EVENTS · FULL LOG
        </Button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {remote.loading && <Loader label="Loading activity" />}
        {!remote.demoMode && remote.error && <p role="alert" style={{ padding: 16 }}>{remote.error}</p>}
        {!remote.loading && items.length === 0 && <p style={{ padding: 16 }}>No activity has been recorded.</p>}
        {items.map((a, index) => {
          const open = () => onOpen(`${a.text} ${a.meta}`);
          return (
            <div
              key={`${a.text}-${index}`}
              className={styles.activity}
              role="button"
              tabIndex={0}
              onClick={open}
              onKeyDown={(e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  open();
                }
              }}
            >
              <span
                style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: TONE_BG[a.tone], color: TONE_INK_FIXED[a.tone] }}
                aria-hidden="true"
              >
                <Icon name={a.icon} size={15} />
              </span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Text size={13} weight={600} tone="ink" lh={1.45}>
                  {a.text}
                </Text>
                <Text size={11} weight={600} tone="ink3">
                  {a.meta}
                </Text>
              </span>
              <Text size={11} weight={700} tone="ink3" nowrap style={{ paddingTop: 1 }}>
                {a.time}
              </Text>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
