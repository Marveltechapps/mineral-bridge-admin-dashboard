import { useEffect } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router-dom';
import { ConsoleContext, useConsoleControllerInstance } from '../../modules/console/hooks/useConsole';
import { useConsoleDb } from '../../modules/console/hooks/useConsoleDb';
import { readStoredTheme } from '../../modules/console/engine/controller';
import { LoadingScreen } from '../../modules/console/components/LoadingScreen';
import { Toasts } from '../../modules/console/components/Toasts';
import { useConsoleStore } from '../../store/consoleStore';
import { parseConsolePath } from '../../constants/nav';

/**
 * Parent of every console route (sign-in and screens): loads the data set, applies the console's
 * base styles and theme, tracks the sidebar breakpoint, refreshes relative times and shows toasts.
 */
export function ConsoleRoot() {
  const controller = useConsoleControllerInstance();
  const db = useConsoleDb();
  const toasts = useConsoleStore(s => s.toasts);
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    const data = db.data as { live?: boolean; staff?: unknown } | undefined;
    if (data?.live && data.staff && useConsoleStore.getState().auth !== 'app') {
      useConsoleStore.setState({ auth: 'app' });
    }
  }, [db.data]);

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('data-app', 'console');
    controller.applyTheme(readStoredTheme());
    return () => { html.removeAttribute('data-app'); html.removeAttribute('data-theme'); };
  }, [controller]);

  useEffect(() => {
    const onResize = () => useConsoleStore.setState({ narrow: window.innerWidth < 1280 });
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => useConsoleStore.setState(s => ({ rev: s.rev + 1 })), 15000);
    return () => clearInterval(timer);
  }, []);

  // The store holds the current screen and the URL mirrors it. Console navigation updates the store
  // first (PUSH); browser back/forward (POP) and redirects (REPLACE) bring the URL's screen back
  // into the store, closing the drawer and clearing the search the way the sidebar does.
  useEffect(() => {
    if (navigationType === 'PUSH') return;
    const at = parseConsolePath(location.pathname), s = useConsoleStore.getState();
    if (!at || (at.nav === s.nav && at.orderId === s.orderId)) return;
    controller.form = {};
    useConsoleStore.setState({ nav: at.nav, orderId: at.orderId, drawer: null, menu: false, q: s.nav === at.nav ? s.q : '' });
  }, [location.key, location.pathname, navigationType, controller]);

  return (
    <ConsoleContext.Provider value={controller}>
      {db.isSuccess ? <Outlet /> : <LoadingScreen failed={db.isError} onRetry={() => void db.refetch()} />}
      <Toasts toasts={toasts} />
    </ConsoleContext.Provider>
  );
}
