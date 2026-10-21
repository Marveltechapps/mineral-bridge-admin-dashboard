import { Suspense } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader } from '@/components/ui/Loader';
import { PAGE_TITLES } from '@/constants/nav';
import { isDemoMode } from '@/lib/apiClient';
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

  const moduleId = moduleFromPath(location.pathname);
  const [title, designSub] = PAGE_TITLES[moduleId];
  const liveSub: Partial<Record<typeof moduleId, string>> = {
    overview: 'Trading desk snapshot',
    orders: 'One pipeline, both sides',
    vault: 'Lots in custody',
    listings: 'Minerals on sale at a fixed price',
    auctions: 'Live, upcoming and ended auctions',
    users: 'Accounts and tier changes',
    verification: 'KYC queue and document expiry',
    disputes: 'Open and resolved disputes',
    academy: 'Courses and completion',
    partners: 'Carriers, hubs and assay labs',
    support: 'Tickets and logged calls',
    lc: 'Letters of credit',
  };
  const sub = isDemoMode() ? designSub : (liveSub[moduleId] ?? designSub);

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
