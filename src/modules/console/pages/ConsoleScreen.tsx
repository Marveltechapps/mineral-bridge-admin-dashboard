import { Navigate, useParams } from 'react-router-dom';
import { useConsole } from '../hooks/useConsole';
import { currentOrder } from '../engine/shell';
import { ConsolePage } from './ConsolePage';
import { OrderDetailPage } from './OrderDetailPage';
import { CONSOLE_HOME, consolePath, isConsoleScreen } from '../../../constants/nav';

/**
 * Route element for /<screen> and /<screen>/<order id>. Like the design, it shows the open order
 * when there is one and the screen's list otherwise.
 */
export function ConsoleScreen() {
  const c = useConsole();
  const { nav } = useParams();
  if (!isConsoleScreen(nav)) return <Navigate to={CONSOLE_HOME} replace />;
  const order = currentOrder(c);
  if (order) return <OrderDetailPage c={c} order={order} />;
  // An order id that no longer exists (or was mistyped) shows the list and drops the id from the URL.
  return (
    <>
      {c.state.orderId && <Navigate to={consolePath(c.state.nav, null)} replace />}
      <ConsolePage c={c} />
    </>
  );
}
