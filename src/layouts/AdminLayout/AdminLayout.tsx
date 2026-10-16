import { Suspense } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader } from '@/components/ui/Loader';
import { PAGE_TITLES } from '@/constants/nav';
import { ROUTES, moduleFromPath } from '@/constants/routes';
import { useSessionState } from '@/modules/auth/hooks/useSession';
import styles from './AdminLayout.module.css';
import { DrawerHost } from './DrawerHost';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Toasts } from './Toasts';

/** Authenticated console shell. Redirects to the auth flow when there is no open session. */
export function AdminLayout() {
  const stage = useSessionState((s) => s.stage);
  const location = useLocation();

  if (stage === 'locked') return <Navigate to={ROUTES.locked} replace state={{ from: location.pathname }} />;
  if (stage === 'otp') return <Navigate to={ROUTES.verify} replace />;
  if (stage === 'out') return <Navigate to={ROUTES.signedOut} replace />;
  if (stage !== 'app') return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />;

  const [title, sub] = PAGE_TITLES[moduleFromPath(location.pathname)];

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.column}>
        <Header title={title} sub={sub} />
        <DrawerHost />
        <Toasts />
        <main className={styles.main} id="main">
          {/* Re-keying by path replays the design's per-screen fade-up. */}
          <div key={location.pathname} className={styles.screen}>
            <Suspense fallback={<Loader />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
