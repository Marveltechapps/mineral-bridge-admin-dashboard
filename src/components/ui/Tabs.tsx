import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Tabs.module.css';

export interface TabDef {
  label: string;
  /** Route path for router-backed tabs. */
  to?: string;
  /** Explicit active flag (overrides router matching). */
  active?: boolean;
  onClick?: () => void;
}

/** Underlined tab bar with an optional actions slot on the right. */
export function TabBar({ tabs, actions, label }: { tabs: TabDef[]; actions?: ReactNode; label: string }) {
  return (
    <div className={styles.bar}>
      <nav className={styles.tabs} aria-label={label}>
        {tabs.map((t) =>
          t.to ? (
            <NavLink
              key={t.label}
              to={t.to}
              end
              onClick={t.onClick}
              className={({ isActive }) => `${styles.tab} ${(t.active ?? isActive) ? styles.active : ''}`}
              style={{ textDecoration: 'none' }}
            >
              {t.label}
            </NavLink>
          ) : (
            <button
              key={t.label}
              type="button"
              className={`${styles.tab} ${t.active ? styles.active : ''}`}
              onClick={t.onClick}
              aria-pressed={t.active}
            >
              {t.label}
            </button>
          ),
        )}
      </nav>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
}
