import { Navigate, Outlet } from 'react-router-dom';
import { useConsole } from '../../modules/console/hooks/useConsole';
import { drawerView, shellView } from '../../modules/console/engine/shell';
import { Sidebar } from '../../modules/console/components/Sidebar';
import { Header } from '../../modules/console/components/Header';
import { Drawer } from '../../modules/console/components/Drawer';
import { CONSOLE_SIGN_IN } from '../../constants/nav';
import styles from './ConsoleLayout.module.css';

/** Rendered after the screen so the drawer sees what the screen set up, as in the design. */
function ConsoleDrawer() {
  const dw = drawerView(useConsole());
  return dw.open ? <Drawer dw={dw} /> : null;
}

/** Signed-in console shell: sidebar, sticky header, the current screen and the record drawer. */
export function ConsoleLayout() {
  const c = useConsole();
  if (c.state.auth !== 'app') return <Navigate to={CONSOLE_SIGN_IN} replace />;
  const shell = shellView(c);
  return (
    <>
      <div className={styles.frame}>
        <Sidebar sd={shell.sd} me={shell.me} />
        <div className={styles.column}>
          <Header hd={shell.hd} me={shell.me} />
          <main className={styles.main}>
            <div key={shell.screenKey} className={styles.screen}><Outlet /></div>
          </main>
        </div>
      </div>
      <ConsoleDrawer />
    </>
  );
}
