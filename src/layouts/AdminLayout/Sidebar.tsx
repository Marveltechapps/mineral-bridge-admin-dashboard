import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { NAV_GROUPS } from '@/constants/nav';
import { MODULE_ROOT, ROUTES, moduleFromPath } from '@/constants/routes';
import { ApiError, isApiError, isDemoMode } from '@/lib/apiClient';
import { useCurrentAccount } from '@/modules/auth/hooks/useSession';
import { DEMO_BADGES, loadCounters, subscribeCounters, type NavBadges } from '@/services/shell/counters';
import { consoleActions, useConsole } from '@/store/consoleStore';
import styles from './Sidebar.module.css';

/**
 * Live badges come from `GET /dashboard/counters`.
 * A missing module means this role cannot view it, so no badge is drawn.
 * Zero is shown as 0. A failed request draws no number.
 */
function useNavBadges(pathname: string): { text: (id: string) => string | undefined; sessionError: ApiError | null } {
  const demo = isDemoMode();
  const [badges, setBadges] = useState<NavBadges | null>(null);
  const [sessionError, setSessionError] = useState<ApiError | null>(null);
  const confirmed = useRef(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => subscribeCounters(() => setRefresh((n) => n + 1)), []);

  useEffect(() => {
    if (demo) return;
    const ac = new AbortController();
    loadCounters(ac.signal)
      .then((next) => {
        if (ac.signal.aborted) return;
        confirmed.current = true;
        setBadges(next);
      })
      .catch((error: unknown) => {
        if (ac.signal.aborted) return;
        if (!confirmed.current) setBadges({});
        if (isApiError(error) && error.status === 401) setSessionError(error);
      });
    return () => ac.abort();
  }, [demo, pathname, refresh]);

  return {
    text(id: string) {
      if (demo) return DEMO_BADGES[id as keyof typeof DEMO_BADGES];
      const count = badges?.[id as keyof NavBadges];
      return typeof count === 'number' ? String(count) : undefined;
    },
    sessionError,
  };
}

/** Navy navigation rail with grouped modules, badges and the signed-in account card. */
export function Sidebar({ showBadges = true }: { showBadges?: boolean }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const active = moduleFromPath(pathname);
  const open = useConsole((s) => s.navOpen);
  const { account } = useCurrentAccount();
  const badges = useNavBadges(pathname);

  // Close the mobile drawer after any route change.
  useEffect(() => {
    consoleActions.set({ navOpen: false });
  }, [pathname]);

  if (badges.sessionError) throw badges.sessionError;

  return (
    <>
      {open && <button type="button" className={styles.scrim} aria-label="Close navigation" onClick={() => consoleActions.set({ navOpen: false })} />}
      <aside className={`${styles.aside} ${open ? styles.open : ''}`}>
        <button
          type="button"
          className={styles.brand}
          onClick={() => {
            consoleActions.closeMenus();
            navigate(ROUTES.overview);
          }}
          aria-label="Mineral Bridge Operations — go to overview"
        >
          <span className={styles.logo}>MB</span>
          <span className={styles.brandText}>
            <span className={styles.brandName}>MINERAL BRIDGE</span>
            <span className={styles.brandSub}>OPERATIONS</span>
          </span>
        </button>

        <nav className={styles.nav} aria-label="Primary">
          {NAV_GROUPS.map((g) => (
            <div key={g.label} className={styles.group}>
              <div className={styles.groupLabel}>{g.label}</div>
              {g.items.map((it) => {
                const isActive = active === it.id;
                const badge = badges.text(it.id);
                return (
                  <NavLink
                    key={it.id}
                    to={MODULE_ROOT[it.id]}
                    className={`${styles.item} ${isActive ? styles.active : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => consoleActions.resetForNav()}
                  >
                    <span className={styles.itemIcon}>
                      <Icon name={it.icon} />
                    </span>
                    <span className={styles.itemLabel}>{it.label}</span>
                    {showBadges && badge !== undefined && <span className={styles.badge}>{badge}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <button
          type="button"
          className={styles.profile}
          onClick={() => {
            consoleActions.closeMenus();
            navigate(ROUTES.profile);
          }}
          aria-label={`${account.name}, ${account.role} — open profile`}
        >
          <span className={styles.profileAvatar}>{account.initials}</span>
          <span className={styles.profileText}>
            <span className={styles.profileName}>{account.name}</span>
            <span className={styles.profileRole}>{account.role}</span>
          </span>
          <span style={{ width: 7, height: 7, borderRadius: 4, background: '#16A34A', animation: 'mbPulse 2s ease-out infinite', flexShrink: 0 }} aria-hidden="true" />
        </button>
      </aside>
    </>
  );
}
