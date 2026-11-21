import { orderView } from '../engine/shell';
import { OrderSummary } from '../components/OrderSummary';
import { OrderInfoCards, OrderSteps } from '../components/OrderRecord';
import { CustomerCard, ManageCard, NegotiationCard, NextStepCard } from '../components/OrderPanels';
import type { ConsoleController } from '../../../types/console';
import styles from '../components/OrderDetail.module.css';

/** One buy order or sell request: phases, record cards, every step, and the next action. */
export function OrderDetailPage({ c, order }: { c: ConsoleController; order: unknown }) {
  const od = orderView(c, order);
  return (
    <>
      <OrderSummary od={od} />
      <div className={styles.body}>
        <div className={styles.main}>
          <OrderInfoCards cards={od.cards} />
          <OrderSteps steps={od.steps} />
        </div>
        <div className={styles.side}>
          <NextStepCard key={od.next.key} next={od.next} />
          {od.hasNego && od.nego && <NegotiationCard key={od.nego.key} nego={od.nego} />}
          <CustomerCard cust={od.cust} />
          {od.hasManage && od.manage && <ManageCard actions={od.manage} />}
        </div>
      </div>
    </>
  );
}
