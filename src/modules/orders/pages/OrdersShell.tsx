import { Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { TabBar } from '@/components/ui/Tabs';
import { ROUTES } from '@/constants/routes';
import { STAGES } from '@/constants/tones';
import { useQueryMatch } from '@/hooks/useConsoleData';
import { consoleActions, useConsole } from '@/store/consoleStore';
import { useLiveOrders } from '../hooks/useOrders';
import layout from '@/styles/layout.module.css';

/** Orders module frame: tab bar (list / bulk intake) + export and new-order actions. */
export default function OrdersShell() {
  const orders = useLiveOrders();
  const match = useQueryMatch();
  const side = useConsole((s) => s.filters.orderSide);
  const stage = useConsole((s) => s.filters.orderStage);
  const filteredCount = orders.filter(
    (o) => (side === 'All sides' || o.side === side) && (!stage || STAGES[o.idx] === stage) && match([o.id, o.mineral, o.party, o.side, STAGES[o.idx]]),
  ).length;

  return (
    <div className={layout.page}>
      <TabBar
        label="Orders views"
        tabs={[
          { label: 'Order list', to: ROUTES.orders },
          { label: 'Bulk intake queue', to: ROUTES.ordersIntake },
        ]}
        actions={
          <>
            <Button variant="secondary" h={36} px={14} r={12} icon="download" onClick={() => consoleActions.notify(`Order list exported as CSV (${filteredCount} rows)`)}>
              Export CSV
            </Button>
            <Button
              variant="primary"
              h={36}
              px={14}
              r={12}
              icon="plus"
              onClick={() =>
                consoleActions.openDrawer({
                  title: 'New order',
                  sub: 'Desk-entered order. Sell orders start at Verification and follow the agent-visit flow.',
                  fields: [
                    { label: 'SIDE', value: 'Sell — MB buys into vault' },
                    { label: 'COUNTERPARTY', hint: 'Search a verified account' },
                    { label: 'MINERAL', value: 'Gold Concentrate' },
                    { label: 'DECLARED QUANTITY', hint: 'e.g. 18.4 kg' },
                    { label: 'ASSIGNED AGENT', value: 'F. Wanjiru' },
                    { label: 'DESK NOTE', kind: 'area' },
                  ],
                  cta: 'Create order',
                  done: 'Order created at Verification',
                  draft: 'Order saved as a draft',
                })
              }
            >
              New order
            </Button>
          </>
        }
      />
      <Outlet />
    </div>
  );
}
