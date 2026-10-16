import { useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { NAV_GROUPS } from '@/constants/nav';
import { MODULE_ROOT, ROUTES, moduleFromPath } from '@/constants/routes';
import { useCurrentAccount } from '@/modules/auth/hooks/useSession';
import { consoleActions, useConsole } from '@/store/consoleStore';
import styles from './Sidebar.module.css';

/** Navy navigation rail with grouped modules, badges and the signed-in account card. */
export function Sidebar({ showBadges = true }: { showBadges?: boolean }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const active = moduleFromPath(pathname);
  const open = useConsole((s) => s.navOpen);
  const { account } = useCurrentAccount();

  // Close the mobile drawer after any route change.
  useEffect(() => {
    consoleActions.set({ navOpen: false });
  }, [pathname]);

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
                    {showBadges && it.badge && <span className={styles.badge}>{it.badge}</span>}
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
