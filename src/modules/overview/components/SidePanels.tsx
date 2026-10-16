import { Bar } from '@/components/ui/Misc';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { Text } from '@/components/ui/Text';
import { QUEUES, VAULT_BY_MINERAL } from '@/services/overview';
import type { QueueTarget } from '@/types/overview';
import styles from '../Overview.module.css';

/** Navy card: realisable vault value by mineral. */
export function VaultByMineral({ onOpen }: { onOpen: () => void }) {
  return (
    <div className={styles.vaultCard}>
      <button type="button" className={styles.vaultHead} onClick={onOpen} aria-label="Vault value by mineral — open Vault & Inventory">
        <Text size={10.5} weight={800} ls={1.2} style={{ color: 'rgba(255,255,255,.6)' }}>
          VAULT VALUE BY MINERAL
        </Text>
        <Text size={10.5} weight={800} ls={0.6} tone="gold">
          REALISABLE
        </Text>
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
        {VAULT_BY_MINERAL.map((m) => (
          <div key={m.name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
              <Text size={12.5} weight={700} tone="white">
                {m.name}
              </Text>
              <Text size={12.5} weight={800} tone="white">
                {m.value}
              </Text>
            </div>
            <Bar pct={m.pct} height={6} radius={4} trackBg="rgba(255,255,255,.12)" fill="linear-gradient(90deg,#F7DD8E,#C8962F)" />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, fontSize: 10.5, fontWeight: 600, color: 'rgba(255,255,255,.55)' }}>
              <span>{m.qty}</span>
              <span>{m.lots}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Work queues that deep-link into the owning module. */
export function DeskQueues({ onOpen }: { onOpen: (target: QueueTarget) => void }) {
  return (
    <Card padding="18px 20px" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Text size={10.5} weight={800} ls={1.1} tone="ink3">
        DESK QUEUES
      </Text>
      {QUEUES.map((q) => (
        <button key={q.label} type="button" className={styles.queue} onClick={() => onOpen(q.target)}>
          <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Text size={12.5} weight={700} tone="ink">
              {q.label}
            </Text>
            <Text size={10.5} weight={600} tone="ink3">
              {q.sub}
            </Text>
          </span>
          <Pill tone={q.tone} fontSize={11.5} padding="4px 11px">
            {q.count}
          </Pill>
        </button>
      ))}
    </Card>
  );
}
