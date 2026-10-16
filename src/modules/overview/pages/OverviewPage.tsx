import { Text } from '@/components/ui/Text';
import { ROUTES } from '@/constants/routes';
import { useConsoleNav } from '@/hooks/useConsoleNav';
import { useJump } from '@/hooks/useJump';
import { FILTER_DEFAULTS, useConsole } from '@/store/consoleStore';
import { ActivityFeed } from '../components/ActivityFeed';
import { KpiRow } from '../components/KpiRow';
import { DeskQueues, VaultByMineral } from '../components/SidePanels';
import { LcPipeline, TradeKpis } from '../components/TradeFinance';
import type { QueueTarget } from '@/types/overview';
import styles from '../Overview.module.css';

const QUEUE_ROUTE: Record<QueueTarget, string> = {
  verification: ROUTES.verification,
  pricing: ROUTES.pricingOffers,
  orders: ROUTES.ordersIntake,
  vault: ROUTES.vault,
  disputes: ROUTES.disputes,
};

export default function OverviewPage() {
  const go = useConsoleNav();
  const jump = useJump();
  const filters = useConsole((s) => s.filters);

  return (
    <div className={styles.page}>
      <KpiRow
        go={{
          kyc: () => go(ROUTES.verification),
          orders: () => go(ROUTES.orders),
          vault: () => go(ROUTES.vault),
          auctions: () => go(ROUTES.auctions),
          settlements: () => go(ROUTES.financial),
        }}
      />

      <div className={styles.sectionHead}>
        <Text size={10.5} weight={800} ls={1.1} tone="ink3">
          TRADE FINANCE &amp; NETWORK
        </Text>
        <Text size={11.5} weight={600} tone="ink3">
          Letters of credit, negotiations and on-chain activity
        </Text>
      </div>
      <TradeKpis onOpen={(t) => go(t === 'lc' ? ROUTES.lc : t === 'collab' ? ROUTES.collab : ROUTES.chain, { lcSel: null, negSel: null })} />

      <LcPipeline
        onOpenLc={() => go(ROUTES.lc, { lcSel: null, filters: { ...filters, lcFilter: FILTER_DEFAULTS.lcFilter } })}
        onStage={(stage) => go(ROUTES.lc, { lcSel: null, filters: { ...filters, lcFilter: stage } })}
      />

      <div className={styles.bottom}>
        <ActivityFeed onOpen={jump} onFullLog={() => go(ROUTES.audit)} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <VaultByMineral onOpen={() => go(ROUTES.vault)} />
          <DeskQueues
            onOpen={(t) =>
              go(QUEUE_ROUTE[t], {
                filters: {
                  ...filters,
                  ...(t === 'vault' ? { vaultStatus: 'In vault' } : {}),
                  ...(t === 'disputes' ? { dsFilter: FILTER_DEFAULTS.dsFilter } : {}),
                },
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
